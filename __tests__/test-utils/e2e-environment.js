const NodeEnvironment = require('jest-environment-node')

/**
 * This class does 2 major things.
 *
 * 1) It runs the setup scripts before the end-to-end test script is ran.
 * 2) It runs the teardown scripts after the end-to-end test script is ran.
 *
 * It is much cleaner to do these steps in here because the setup and teardown
 * scripts take a while to complete and are setting up the overall environment
 * for the e2e tests which when ran in a CI environment require the starting
 * of various servers.  Also, even if ran locally, collecting coverage requires
 * starting a server as well.
 */
class EndToEndEnvironment extends NodeEnvironment {
  async setup () {
    await require('./setup-e2e')()
    await super.setup()
    console.log('finished setting up EndToEndEnvironment')
  }

  async teardown () {
    await require('./teardown-e2e')()
    await super.teardown()
  }

  runScript (script) {
    return super.runScript(script)
  }
}

module.exports = EndToEndEnvironment
