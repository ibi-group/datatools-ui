const fs = require('fs')
const path = require('path')

const archiver = require('archiver')
const extractZip = require('extract-zip')
const Slack = require('slack')

const {
  collectingCoverage,
  downloadFile,
  isCi,
  isUiRepo,
  killDetachedProcess,
  promisifiedKillDetachedProcess
} = require('./utils')

/**
 * Function to kill the coverage server
 */
function stopCoverageServer (callback) {
  console.log('Killing coverage collector server')
  killDetachedProcess('e2e-coverage-collector-server', callback)
}

/**
 * download e2e coverage results and then shut down e2e coverage server
 */
function collectCoverageAndStopSever () {
  if (!collectingCoverage) return Promise.resolve()

  return new Promise((resolve, reject) => {
    /**
     * Helper to perform a promise fulfillment after stopping the coverage server
     */
    function handleCoverageServerStop (actionAfterSuccessfulStop) {
      return (err) => {
        if (err) {
          console.error(`An error occurred while trying to stop the coverage server: ${err}`)
          return reject(err)
        }
        console.log('Coverage collector server killed successfully')
        actionAfterSuccessfulStop()
      }
    }

    // download and save coverage report
    console.log('Downloading coverage report')
    downloadFile(
      'http://localhost:9999/coverage/download',
      'e2e-coverage.zip',
      (err) => {
        if (err) {
          console.error(`Error downloading coverage: ${err}`)
          return stopCoverageServer(handleCoverageServerStop(reject))
        }

        // unzip the coverage report once it's done downloading
        console.log('Extracting coverage report')
        extractZip(
          'e2e-coverage.zip',
          {dir: path.join(process.cwd(), 'coverage-e2e')},
          (err) => {
            if (err) {
              console.error(`error unzipping coverage report: ${err}`)
              return stopCoverageServer(handleCoverageServerStop(reject))
            }
            fs.unlink('e2e-coverage.zip', err => {
              if (err) console.error(`Error deleting coverage zip file: ${err}`)
            })
            stopCoverageServer(handleCoverageServerStop(resolve))
          }
        )
      }
    )
  })
}

/**
 * Stub for shutting down a datatools-server instance if needed
 */
function shutdownDatatoolsServer () {
  if (!isCi || !isUiRepo) return Promise.resolve()

  return promisifiedKillDetachedProcess('datatools-server')
}

/**
 * Stub for shutting down a client if needed
 */
function shutdownClient () {
  if (!isCi) return Promise.resolve()

  return promisifiedKillDetachedProcess('client-dev-server')
}

/**
 * Stub for shutting down a client if needed
 */
function shutdownOtp () {
  if (!isCi) return Promise.resolve()

  return promisifiedKillDetachedProcess('otp')
}

/**
 * Search for all *.log files, zip them up and then upload them to a defined
 * slack channel (if defined)
 */
function uploadLogsToSlack () {
  if (!process.env.SLACK_TOKEN || !process.env.SLACK_CHANNEL) {
    console.warn('SLACK_TOKEN and/or SLACK_CHANNEL env vars undefined, not sending logs to slack!')
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    let calledResolveOrReject = false
    const logsZipfile = 'logs.zip'

    const output = fs.createWriteStream(logsZipfile)
    const archive = archiver('zip')

    function makeUploadFailureHandler (handlerErrorMsg) {
      return (err) => {
        console.error(handlerErrorMsg)
        console.error(`failed to upload logs due to error: ${err}`)
        if (!calledResolveOrReject) {
          calledResolveOrReject = true
          reject(err)
        }
      }
    }

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
      if (!calledResolveOrReject) {
        const slack = new Slack({ token: process.env.SLACK_TOKEN })
        const repo = process.env.TRAVIS_BUILD_DIR.split(path.sep).pop()

        console.log('uploading log zipfiles to slack')
        slack.files.upload(
          {
            channels: process.env.SLACK_CHANNEL,
            file: fs.createReadStream(logsZipfile),
            filename: `${repo}-build-${process.env.TRAVIS_BUILD_NUMBER}-e2e-logs.zip`,
            filetype: 'zip',
            initial_comment: `View build logs here: ${process.env.TRAVIS_BUILD_WEB_URL}`
          },
          err => {
            if (err) {
              return makeUploadFailureHandler(
                'An error occurred while uploading the zipfile to slack'
              )(err)
            }

            console.log('successfully uploaded logs to slack')
            calledResolveOrReject = true
            resolve()
          }
        )
      }
    })

    archive.pipe(output)

    // glob all log files in cwd into zip
    archive.glob('./*.log')
    // glob all png files (e2e error screenshots) into zip
    archive.glob('./e2e-error-*.png')
    archive.finalize()
  })
}

module.exports = function () {
  return Promise.all([
    collectCoverageAndStopSever(),
    shutdownDatatoolsServer(),
    shutdownClient(),
    shutdownOtp(),
    uploadLogsToSlack()
  ])
}
