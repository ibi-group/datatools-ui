const {execFile, spawn} = require('child_process')
const fs = require('fs')
const path = require('path')

const {safeDump, safeLoad} = require('js-yaml')
const request = require('request')

const collectingCoverage = process.env.COLLECT_COVERAGE
const isCi = !!process.env.CI
const isUiRepo = process.env.TRAVIS_REPO_SLUG === 'conveyal/datatools-ui'

/**
 * Download a file using a stream
 */
function downloadFile (url, filename, callback) {
  console.log(`downloading file: ${url}`)
  const dlStream = request(url).pipe(fs.createWriteStream(filename))

  let callbackCalled = false

  // handle any error occurred while downloading file
  dlStream.on('error', (err) => {
    console.error(`Error downloading from: ${url}.  Error: ${err}`)
    callbackCalled = true
    if (!callbackCalled) callback(err)
  })

  dlStream.on('finish', () => {
    if (!callbackCalled) {
      callbackCalled = true
      console.log(`successfully downloaded file: ${filename}`)
      callback()
    }
  })
}

/**
 * Find and kill a process
 */
function killDetachedProcess (processName, callback) {
  const pidFilename = path.resolve(`${processName}.pid`)

  // open pid file to get pid
  console.log(`Begin killing detached process... reading pid file ${pidFilename}`)
  fs.readFile(pidFilename, (err, pid) => {
    if (err) {
      console.error(`pid file ${pidFilename} could not be read!`)
      return callback(err)
    }

    // make absolutely sure that the pid file contains a numeric string.  This
    // is to make sure that the file we're reading didn't somehow change and now
    // includes a harmful command that could be executed
    pid = pid.toString()
    if (!pid.match(/^\d*$/)) {
      console.error(`pid file ${pidFilename} has unexpected data!`)
      return callback(new Error(`pid file ${pidFilename} has unexpected data!`))
    }

    // attempt to kill process running with pid
    const cmd = `kill ${pid}`
    console.log(cmd)
    execFile('kill', [pid], err => {
      if (err) {
        console.error(`pid ${pid} (${processName}) could not be killed!`)
        return callback(err)
      }

      console.log('Kill command successful')

      // delete pid file
      fs.unlink(pidFilename, err => {
        if (err) {
          console.error(`pid file ${pidFilename} could not be deleted!`)
          return callback(err)
        }
        callback()
      })
    })
  })
}

/**
 * Load yaml from a file into a js object
 */
function loadYamlFile (filename, callback) {
  fs.readFile(filename, (err, data) => {
    if (err) return callback(err)
    try {
      callback(null, safeLoad(data))
    } catch (e) {
      callback(e)
    }
  })
}

function promisifiedKillDetachedProcess (processName) {
  return new Promise((resolve, reject) => {
    console.log(`stopping ${processName}`)
    killDetachedProcess(`${processName}`, err => {
      if (err) return reject(err)
      resolve()
    })
  })
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
function spawnDetachedProcess (cmd, args, name) {
  const stdOutFile = path.resolve(`./${name}-out.log`)
  const processOut = fs.openSync(stdOutFile, 'w')
  const stdErrFile = path.resolve(`./${name}-err.log`)
  const processErr = fs.openSync(stdErrFile, 'w')
  const child = spawn(
    cmd,
    args,
    { detached: true, stdio: [ 'ignore', processOut, processErr ] }
  )
  console.log(`${cmd} ${args.join(' ')} running as pid ${child.pid}`)
  const pidFilename = path.resolve(`${name}.pid`)
  fs.writeFileSync(pidFilename, child.pid)
  console.log(`wrote pid file ${pidFilename}`)
  console.log(`writing ${name} stdout to ${stdOutFile}`)
  console.log(`writing ${name} stderr to ${stdErrFile}`)
  child.unref()
}

/**
 * Write a js object into a yaml formatted file
 */
function writeYamlFile (filename, obj, callback) {
  fs.writeFile(filename, safeDump(obj), callback)
}

module.exports = {
  collectingCoverage,
  downloadFile,
  isCi,
  isUiRepo,
  killDetachedProcess,
  loadYamlFile,
  promisifiedKillDetachedProcess,
  requireEnvVars,
  spawnDetachedProcess,
  writeYamlFile
}
