const {spawn} = require('child_process')
const path = require('path')

const execa = require('execa')
const fs = require('fs-extra')
const {safeDump, safeLoad} = require('js-yaml')
const request = require('request')

const collectingCoverage = process.env.COLLECT_COVERAGE
const isCi = !!process.env.CI
const isDocker = !!process.env.IS_DOCKER
const isUiRepo = process.env.GITHUB_REPOSITORY === 'ibi-group/datatools-ui'
const testFolderPath = process.env.TEST_FOLDER_PATH || 'e2e-test-results'

/**
 * Download a file using a stream
 */
function downloadFile (url, filename) {
  return new Promise((resolve, reject) => {
    console.log(`downloading file: ${url}`)
    const dlStream = request(url).pipe(fs.createWriteStream(filename))

    let callbackCalled = false

    // handle any error occurred while downloading file
    dlStream.on('error', (err) => {
      console.error(`Error downloading from: ${url}.  Error: ${err}`)
      callbackCalled = true
      if (!callbackCalled) reject(err)
    })

    dlStream.on('finish', () => {
      if (!callbackCalled) {
        callbackCalled = true
        console.log(`successfully downloaded file: ${filename}`)
        resolve()
      }
    })
  })
}

/**
 * Get the path of a filename that is in the test folder.
 */
function getTestFolderFilename (filename) {
  return filename ? path.join(testFolderPath, filename) : testFolderPath
}

/**
 * Find and kill a process
 */
async function killDetachedProcess (processName, callback) {
  const pidFilename = path.resolve(getTestFolderFilename(`${processName}.pid`))

  // open pid file to get pid
  console.log(`Begin killing detached process... reading pid file ${pidFilename}`)
  let pid
  try {
    pid = await fs.readFile(pidFilename)
  } catch (e) {
    console.error(`pid file ${pidFilename} could not be read!`)
    throw e
  }

  // make absolutely sure that the pid file contains a numeric string.  This
  // is to make sure that the file we're reading didn't somehow change and now
  // includes a harmful command that could be executed
  pid = pid.toString()
  if (!pid.match(/^\d*$/)) {
    console.error(`pid file ${pidFilename} has unexpected data!`)
    throw new Error(`pid file ${pidFilename} has unexpected data!`)
  }

  // attempt to kill process running with pid
  const cmd = `kill ${pid}`
  console.log(cmd)
  try {
    await execa('kill', [pid])
  } catch (err) {
    console.error(`pid ${pid} (${processName}) could not be killed!`)
    throw err
  }

  console.log('Kill command successful')

  // delete pid file
  try {
    await fs.unlink(pidFilename)
  } catch (e) {
    console.error(`pid file ${pidFilename} could not be deleted!`)
    throw e
  }
}

/**
 * Load yaml from a file into a js object
 */
async function loadYamlFile (filename) {
  return safeLoad(await fs.readFile(filename))
}

/**
 * Make sure certain environment variables are definted
 */
function requireEnvVars (varnames) {
  const undefinedVars = []
  varnames.forEach(varname => {
    if (!process.env[varname]) {
      undefinedVars.push(varname)
    }
  })
  if (undefinedVars.length > 0) {
    throw new Error(`Required environment variables missing: ${undefinedVars.join(', ')}`)
  }
}

/**
 * Start a process that will continue to run after this script ends
 */
async function spawnDetachedProcess (cmd, args, name) {
  const stdOutFile = path.resolve(getTestFolderFilename(`${name}-out.log`))
  const processOut = fs.openSync(stdOutFile, 'w')
  const stdErrFile = path.resolve(getTestFolderFilename(`${name}-err.log`))
  const processErr = fs.openSync(stdErrFile, 'w')
  const child = spawn(
    cmd,
    args,
    { detached: true, stdio: [ 'ignore', processOut, processErr ] }
  )
  console.log(`${cmd} ${args.join(' ')} running as pid ${child.pid}`)
  const pidFilename = path.resolve(getTestFolderFilename(`${name}.pid`))
  await fs.writeFile(pidFilename, child.pid)
  console.log(`wrote pid file ${pidFilename}`)
  console.log(`writing ${name} stdout to ${stdOutFile}`)
  console.log(`writing ${name} stderr to ${stdErrFile}`)
  child.unref()
}

/**
 * Write a js object into a yaml formatted file.
 * Returns a promise for the write file async operation.
 */
function writeYamlFile (filename, obj) {
  return fs.writeFile(filename, safeDump(obj))
}

module.exports = {
  collectingCoverage,
  downloadFile,
  getTestFolderFilename,
  isCi,
  isDocker,
  isUiRepo,
  killDetachedProcess,
  loadYamlFile,
  requireEnvVars,
  spawnDetachedProcess,
  writeYamlFile
}
