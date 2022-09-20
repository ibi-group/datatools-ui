const path = require('path')

const archiver = require('archiver')
const extractZip = require('extract-zip')
const fs = require('fs-extra')
const fetch = require('isomorphic-fetch')
const createPushToS3 = require('mastarm/lib/push-to-s3')
const Slack = require('slack')

const {
  collectingCoverage,
  downloadFile,
  getTestFolderFilename,
  isCi,
  isUiRepo,
  killDetachedProcess
} = require('./utils')

const slackConfigured = process.env.SLACK_TOKEN && process.env.SLACK_CHANNEL
const msTeamsConfigured = process.env.MS_TEAMS_WEBHOOK_URL
const logsZipfile = 'logs.zip'
const repo = process.env.GITHUB_WORKSPACE
  ? process.env.GITHUB_WORKSPACE.split(path.sep).pop()
  : ''
const buildNum = process.env.GITHUB_RUN_ID || 'localhost'
const uploadedLogsFilename = `${repo}-build-${buildNum}-e2e-logs.zip`
const {LOGS_S3_BUCKET} = process.env

/**
 * Function to kill the coverage server
 */
async function stopCoverageServer () {
  console.log('Killing coverage collector server')
  try {
    await killDetachedProcess('e2e-coverage-collector-server')
  } catch (e) {
    console.error(`An error occurred while trying to stop the coverage server: ${e}`)
    throw e
  }
  console.log('Coverage collector server killed successfully')
}

/**
 * download e2e coverage results and then shut down e2e coverage server
 */
async function collectCoverageAndStopSever () {
  if (!collectingCoverage) return

  // download and save coverage report
  console.log('Downloading coverage report')
  const coverageReportFilename = getTestFolderFilename('e2e-coverage.zip')
  try {
    await downloadFile(
      'http://localhost:9999/coverage/download',
      coverageReportFilename
    )
  } catch (e) {
    console.error(`Error downloading coverage: ${e}`)
    return stopCoverageServer()
  }

  // unzip the coverage report once it's done downloading
  console.log('Extracting coverage report')
  try {
    await promisifiedExtractZip(
      coverageReportFilename,
      {dir: path.join(process.cwd(), 'coverage-e2e')}
    )
  } catch (e) {
    console.error(`error unzipping coverage report: ${e}`)
    return stopCoverageServer()
  }

  await fs.unlink(coverageReportFilename)

  return stopCoverageServer()
}

/**
 * Wrapper to promisify the extractZip module.
 */
function promisifiedExtractZip (filename, options) {
  return new Promise((resolve, reject) => {
    extractZip(filename, options, err => {
      if (err) return reject(err)
      resolve()
    })
  })
}

/**
 * Stub for shutting down a datatools-server instance if needed
 */
function shutdownDatatoolsServer () {
  if (!isCi || !isUiRepo) return Promise.resolve()

  return killDetachedProcess('datatools-server')
}

/**
 * Stub for shutting down a client if needed
 */
function shutdownClient () {
  if (!isCi) return Promise.resolve()

  return killDetachedProcess('client-dev-server')
}

/**
 * Stub for shutting down the OTP server if needed
 */
function shutdownOtp () {
  if (!isCi) return Promise.resolve()

  return killDetachedProcess('otp')
}

function getBuildUrl () {
  return `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
}

function makeUploadFailureHandler (handlerErrorMsg) {
  return (err) => {
    console.error(handlerErrorMsg)
    console.error(`failed to upload logs due to error: ${err}`)
  }
}

/**
 * Upload the logs to s3 if needed and then send a card to MS Teams.
 */
async function uploadToMicrosoftTeams () {
  if (!msTeamsConfigured) return

  // upload logs to s3 because it was easier to do this than wade through
  // crappy MS Teams documentation about how to link to an office 365 using
  // teams
  let uploadedLogsToS3 = false
  if (LOGS_S3_BUCKET) {
    try {
      await createPushToS3({ s3bucket: LOGS_S3_BUCKET })(
        {
          body: await fs.readFile(logsZipfile),
          outfile: uploadedLogsFilename
        }
      )
      console.log('successfully uploaded to s3')
      uploadedLogsToS3 = true
    } catch (e) {
      console.error('Failed to upload logs to s3: ', e)
    }
  } else {
    console.warn('No S3 bucket defined for the log messages. Logs will not be uploaded anywhere!')
  }

  console.log('posting message to MS Teams')

  let testResults = {success: false, numPassedTests: 0, numTotalTests: 0}
  try {
    testResults = require(
      path.resolve('/datatools-ui/e2e-test-results/results.json')
    )
  } catch {
    console.warn("Couldn't read results.json!")
  }
  const actions = [{
    '@type': 'OpenUri',
    name: `View GitHub Action Build #${buildNum}`,
    targets: [
      {
        os: 'default',
        uri: getBuildUrl()
      }
    ]
  }]

  if (uploadedLogsToS3) {
    actions.push({
      '@type': 'OpenUri',
      name: 'Download Logs',
      targets: [
        {
          os: 'default',
          uri: `https://${LOGS_S3_BUCKET}.s3.amazonaws.com/${uploadedLogsFilename}`
        }
      ]
    })
  }

  let fetchResponse
  const commit = process.env.GITHUB_SHA || 'localhost'
  const baseRepoUrl = `https://github.com/ibi-group/datatools-${isUiRepo ? 'ui' : 'server'}`
  const commitUrl = `${baseRepoUrl}/commit/${commit}`
  try {
    fetchResponse = await fetch(
      process.env.MS_TEAMS_WEBHOOK_URL,
      {
        method: 'POST',
        body: JSON.stringify({
          '@context': 'https://schema.org/extensions',
          '@type': 'MessageCard',
          themeColor: '0072C6',
          title: `${repo} e2e test ${testResults.success ? 'passed. ✅' : 'failed. ❌'}`,
          text: `📁 **branch:** ${process.env.GITHUB_REF_SLUG || 'branch not detected'}\n
📄 **commit:** [${commit.slice(0, 6)}](${commitUrl})\n
📊 **result:** ${testResults.numPassedTests} / ${testResults.numTotalTests} tests passed\n
`,
          potentialAction: actions
        })
      }
    )
  } catch (e) {
    console.error('Failed to post to MS Teams: ', e)
    throw e
  }

  if (fetchResponse.status >= 400) {
    console.error('Received an error code for MS Teams post!')
    throw new Error('Post to MS Teams failed!')
  }

  console.log('successfully posted to MS Teams')
}

/**
 * Upload the zip file containing the lgos to a slack channel.
 */
async function uploadToSlack () {
  if (!slackConfigured) return

  const slack = new Slack({ token: process.env.SLACK_TOKEN })

  console.log('uploading log zipfiles to slack')
  try {
    await slack.files.upload({
      channels: process.env.SLACK_CHANNEL,
      file: fs.createReadStream(logsZipfile),
      filename: uploadedLogsFilename,
      filetype: 'zip',
      initial_comment: `View build logs here: ${getBuildUrl()}`
    })
  } catch (e) {
    console.error('failed to upload logs to slack!')
    throw e
  }

  console.log('successfully uploaded logs to slack')
}

/**
 * Find all outputted log files, zip them up and then upload them to a defined
 * slack or MS Teams channel (if defined)
 */
function uploadLogs () {
  // if (!(slackConfigured || msTeamsConfigured)) {
  //   console.warn('Log upload environment variables undefined, not uploading logs anywhere!')
  //   return
  // }

  const output = fs.createWriteStream(logsZipfile)
  const archive = archiver('zip')

  // handle errors if they happen
  archive.on(
    'error',
    makeUploadFailureHandler('An error occurred while archiving')
  )
  output.on(
    'error',
    makeUploadFailureHandler('An error occurred while writing the zip file')
  )

  output.on('close', () => {
    console.log(`Successfully zipped ${archive.pointer()} total bytes`)
    Promise.all([uploadToSlack(), uploadToMicrosoftTeams()])
      .then(() => {
        console.log('successfully uploaded logs')
      })
      .catch(err => {
        if (err) {
          console.log(err)
          return makeUploadFailureHandler(
            'An error occurred while uploading the logs'
          )(err)
        }
      })
  })

  archive.pipe(output)

  // glob all files in test folder and put them in root folder of zip file
  archive.directory(getTestFolderFilename(), false)
  archive.finalize()
}

/**
 * Perform all needed teardown actions after performing the e2e tests. This is
 * called from the e2e-environment.js.
 */
module.exports = function () {
  // upload the logs after teardown completes because the json results are not
  // written by Jest until after teardown 'completes'
  process.nextTick(() => {
    setTimeout(() => {
      uploadLogs()
    }, 3333)
  })
  return Promise.all([
    collectCoverageAndStopSever(),
    shutdownDatatoolsServer(),
    shutdownClient(),
    shutdownOtp()
  ])
}
