const path = require('path')

const AggregateError = require('aggregate-error')
const execa = require('execa')
const fs = require('fs-extra')
const fetch = require('isomorphic-fetch')
const {merge, pick} = require('lodash')
const auto = require('auto-promised')

const {
  collectingCoverage,
  downloadFile,
  getTestFolderFilename,
  isCi,
  isUiRepo,
  loadYamlFile,
  requireEnvVars,
  spawnDetachedProcess,
  writeYamlFile
} = require('./utils')

const serverJarFilename = 'dt-latest-dev.jar'
const ENV_YML_VARIABLES = [
  'AUTH0_CLIENT_ID',
  'AUTH0_DOMAIN',
  'AUTH0_SECRET',
  'AUTH0_API_CLIENT',
  'AUTH0_API_SECRET',
  'GTFS_DATABASE_PASSWORD',
  'GTFS_DATABASE_USER',
  'GTFS_DATABASE_URL',
  'OSM_VEX',
  'SPARKPOST_KEY',
  'SPARKPOST_EMAIL'
]
/**
 * download, configure and start an instance of datatools-server
 */
async function startBackendServer () {
  // if running this from the datatools-server repo, skip this step as there
  // are special steps taken in the datatools-server repo in order to collect
  // back-end code coverage
  if (!isUiRepo) return

  console.log('prepare to start backend server')

  // make sure required environment variables are set
  try {
    requireEnvVars([
      ...ENV_YML_VARIABLES,
      'S3_BUCKET',
      'TRANSITFEEDS_KEY'
    ])
  } catch (e) {
    console.error(`At least one required env var is missing: ${e}`)
    throw e
  }

  const serverFolder = path.join(
    process.env.GITHUB_WORKSPACE,
    '..',
    'datatools-server'
  )
  const serverJarFile = path.join(serverFolder, serverJarFilename)
  const envFile = path.join(serverFolder, 'env.yml')
  const serverFile = path.join(serverFolder, 'server.yml')
  const baseDtServerGithubConfigUrl = 'https://raw.githubusercontent.com/ibi-group/datatools-server/dev/configurations/default/'

  try {
    await auto({
      async makeGtfsPlusFolder () {
        console.log('creating directory for gtfs plus files')
        await fs.mkdirp('/tmp/gtfsplus')
      },
      async makeServerFolder () {
        console.log('creating directory for server files')
        await fs.mkdirp(serverFolder)
      },
      downloadJar: ['makeServerFolder', (results) => {
        console.log('downloading server jar')
        return downloadFile(
          `https://s3.amazonaws.com/datatools-builds/${serverJarFilename}`,
          serverJarFile
        )
      }],
      downloadEnvTemplate: ['makeServerFolder', (results) => {
        console.log('downloading backend env.yml template')
        return downloadFile(
          `${baseDtServerGithubConfigUrl}env.yml.tmp`,
          envFile
        )
      }],
      downloadServerTemplate: ['makeServerFolder', (results) => {
        console.log('downloading backend server.yml template')
        return downloadFile(
          `${baseDtServerGithubConfigUrl}server.yml.tmp`,
          serverFile
        )
      }],
      readEnvTemplate: ['downloadEnvTemplate', (results) => {
        console.log('loading backend env template')
        return loadYamlFile(envFile)
      }],
      readServerTemplate: ['downloadServerTemplate', (results) => {
        console.log('loading backend server template')
        return loadYamlFile(serverFile)
      }],
      writeEnvFile: ['readEnvTemplate', (results) => {
        console.log('writing backend env.yml')

        return writeYamlFile(
          envFile,
          merge(
            results.readEnvTemplate,
            pick(
              process.env,
              ENV_YML_VARIABLES
            )
          )
        )
      }],
      writeServerFile: ['readServerTemplate', (results) => {
        console.log('writing backend server.yml')

        const {
          S3_BUCKET,
          TRANSITFEEDS_KEY
        } = process.env

        const serverEnv = results.readServerTemplate
        serverEnv.application.client_assets_url = 'http://localhost:4000'
        serverEnv.application.data.gtfs_s3_bucket = S3_BUCKET
        serverEnv.application.data.use_s3_storage = true
        serverEnv.extensions.transitfeeds.key = TRANSITFEEDS_KEY
        return writeYamlFile(
          serverFile,
          serverEnv
        )
      }],
      startServer: [
        'makeGtfsPlusFolder',
        'downloadJar',
        'writeEnvFile',
        'writeServerFile',
        async (results) => {
          console.log('starting backend server')

          try {
            await spawnDetachedProcess(
              'java',
              [
                '-Xmx6G',
                '-jar',
                serverJarFile,
                envFile,
                serverFile
              ],
              'datatools-server'
            )
          } catch (e) {
            console.error(`error starting datatools-server: ${e}`)
          }
        }
      ]
    })
  } catch (err) {
    console.error(`failed to start backed server due to error: ${err}`)
    throw err
  }

  console.log('backend server started successfully')
}

/**
 * Perform all necessary actions to start the datatools-ui dev server
 */
async function startClientServer () {
  console.log('prepare to start client dev server')

  // make sure required environment variables are set
  try {
    requireEnvVars([
      'AUTH0_CLIENT_ID',
      'AUTH0_DOMAIN',
      'E2E_AUTH0_PASSWORD',
      'E2E_AUTH0_USERNAME',
      'GRAPH_HOPPER_KEY',
      'MAPBOX_ACCESS_TOKEN',
      'S3_BUCKET',
      'TRANSITFEEDS_KEY'
    ])
  } catch (e) {
    console.error(`At least one required env var is missing: ${e}`)
    throw e
  }

  // set the working directories for datatools-ui
  const datatoolsUiDir = path.join(
    process.env.GITHUB_WORKSPACE,
    '..',
    'datatools-ui'
  )
  const defaultConfigFolder = path.join(
    datatoolsUiDir,
    'configurations',
    'default'
  )

  // asynchronously complete the remaining tasks as they involve a lot of file
  // writing that can be performed asynchronously.
  try {
    await auto({
      async startClientDevServer () {
        console.log('starting client dev server')

        try {
          await spawnDetachedProcess(
            'node', ['__tests__/test-utils/travis-client-dev-server.js'],
            'client-dev-server'
          )
        } catch (e) {
          console.error(`error starting dev server: ${e}`)
          throw e
        }
      },
      writeE2eEnvYml: () => {
        console.log('writing e2e env.yml')

        // create e2e config file with valid auth0 login
        // > configurations/end-to-end/env.yml
        return writeYamlFile(
          path.join(datatoolsUiDir, 'configurations', 'end-to-end', 'env.yml'),
          {
            password: process.env.E2E_AUTH0_PASSWORD,
            username: process.env.E2E_AUTH0_USERNAME
          }
        )
      },
      loadDefaultEnvYml: () => {
        console.log('loading client env.yml template')

        return loadYamlFile(path.join(defaultConfigFolder, 'env.yml.tmp'))
      },
      loadDefaultSettingsYml: () => {
        console.log('loading client settings.yml template')

        return loadYamlFile(path.join(defaultConfigFolder, 'settings.yml'))
      },
      writeDefaultEnvYml: ['loadDefaultEnvYml', (results) => {
        console.log('writing client env.yml template')

        return writeYamlFile(
          path.join(defaultConfigFolder, 'env.yml'),
          merge(
            results.loadDefaultEnvYml,
            pick(
              process.env,
              [
                'AUTH0_CLIENT_ID',
                'AUTH0_DOMAIN',
                'GRAPH_HOPPER_KEY',
                'MAPBOX_ACCESS_TOKEN'
              ]
            )
          )
        )
      }],
      writeDefaultSettingsYml: ['loadDefaultSettingsYml', (results) => {
        console.log('writing client settings.yml template')

        const {
          S3_BUCKET
        } = process.env

        const clientSettings = results.loadDefaultSettingsYml
        clientSettings.S3_BUCKET = S3_BUCKET
        return writeYamlFile(
          path.join(defaultConfigFolder, 'settings.yml'),
          clientSettings
        )
      }],
      buildClientDistFiles: [
        'writeE2eEnvYml',
        'writeDefaultEnvYml',
        'writeDefaultSettingsYml',
        async (results) => {
          console.log('building client dist files')

          const args = ['run', 'build-dev', '--prefix', datatoolsUiDir]

          // if running in the ui environment, build with instrumented code
          if (isUiRepo) {
            args.push('--')
            args.push('--instrument')
          }

          let stdout, stderr
          try {
            ({stdout, stderr} = await execa('npm', args))
          } catch (e) {
            console.error(`An error occurred while building client dist files: ${e}`)
            throw e
          }

          function writeOutputs (data, logType) {
            return fs.writeFile(
              getTestFolderFilename(`mastarm-build-${logType}.log`),
              data
            )
          }

          return Promise.all([
            writeOutputs(stdout, 'out'),
            writeOutputs(stderr, 'err')
          ])
        }
      ]
    })
  } catch (err) {
    console.error(`failed to start frontend server due to error: ${err}`)
    throw err
  }

  console.log('successfully started client dev server')
}

/**
 * Perform all necessary actions to start the datatools-ui dev server
 */
async function startOtp () {
  const otpJarFilename = 'otp-1.4.0-shaded.jar'

  console.log('downloading otp jar')

  // download otp
  await downloadFile(
    'https://repo1.maven.org/maven2/org/opentripplanner/otp/1.4.0/otp-1.4.0-shaded.jar',
    otpJarFilename
  )

  console.log('starting otp')
  // Ensure default folder for graphs exists.
  // (OTP 1.4.0 autoscan() does a directory listing without checking directory existence.)
  const otpBasePath = '/tmp/otp'
  await fs.mkdirp(`${otpBasePath}/graphs`)

  // start otp
  try {
    await spawnDetachedProcess(
      'java',
      [
        '-Xmx6G',
        '-jar',
        otpJarFilename,
        '--server',
        '--autoScan',
        '--basePath',
        otpBasePath,
        '--insecure',
        '--router',
        'default'
      ],
      'otp'
    )
  } catch (e) {
    console.error(`error starting dev server: ${e}`)
    throw e
  }

  console.log('successfully started otp')
}

/**
 * delete and recreate test results folder
 */
function recreateEndToEndTestResultDirectory () {
  const testFolderFilename = getTestFolderFilename()
  fs.removeSync(testFolderFilename)
  fs.ensureDirSync(testFolderFilename)
}

/**
 * Verifies that the needed items in order to run the e2e tests locally have
 * been setup properly.
 */
async function verifySetupForLocalEnvironment () {
  const errors = []

  // make sure e2e.yml exists
  try {
    await fs.stat('configurations/end-to-end/env.yml')
  } catch (e) {
    errors.push(new Error('Failed to detect file `configurations/end-to-end/env.yml`'))
  }

  // make sure services are running
  const endpointChecks = [
    {
      name: 'Front-end server',
      url: 'http://localhost:9966'
    }, {
      name: 'Back-end server',
      url: 'http://localhost:4000'
    }, {
      name: 'OTP server',
      url: 'http://localhost:8080'
    }
  ]

  await Promise.all(
    endpointChecks.map(
      endpoint => (
        // return an executed promise
        async () => {
          try {
            const fetchResult = await fetch(endpoint.url)
            if (fetchResult.status >= 400) {
              throw new Error('Bad response')
            }
          } catch (e) {
            errors.push(
              new Error(
                `Unable to fetch from ${endpoint.name} (${endpoint.url})`
              )
            )
          }
        }
      )()
    )
  )

  // TODO: verify that aws credentials have been setup properly

  if (errors.length > 0) {
    throw new AggregateError(errors)
  }
}

/**
 * Sets up the needed items in order to be ran in a continuous integration
 * environment. For now, Travis CI is the only CI environment that this code is
 * built for.
 */
function setupForContinuousIntegrationEnvironment () {
  return Promise.all([
    startBackendServer(),
    startClientServer(),
    startOtp()
  ])
    .catch(e => {
      console.error(`CI environment setup failed! ${e}`)
      throw e
    })
}

/**
 * Start a server to collect coverage from the e2e tests.
 */
function startCoverageServer () {
  return new Promise((resolve, reject) => {
    console.log('starting coverage server')

    try {
      spawnDetachedProcess(
        'node',
        ['__tests__/test-utils/e2e-coverage-collector-server.js'],
        'e2e-coverage-collector-server'
      )
    } catch (e) {
      console.error(`error starting coverage server: ${e}`)
      return reject(e)
    }

    console.log('successfully started coverage server')
    resolve()
  })
}

/**
 * Perform all needed actions to get the current environment ready for
 * performing the e2e tests. This is called from the e2e-environment.js.
 */
module.exports = async function () {
  // syncrhonously recreate the test results directory in to avoid race
  // conditions
  recreateEndToEndTestResultDirectory()

  // do different setup depending on runtime environment
  const setupItems = []
  if (isCi) {
    setupItems.push(setupForContinuousIntegrationEnvironment())
  } else {
    setupItems.push(verifySetupForLocalEnvironment())
  }
  if (collectingCoverage) setupItems.push(startCoverageServer())

  return Promise.all(setupItems)
    .catch(e => {
      console.error(`e2e setup failed! ${e}`)
      throw e
    })
}
