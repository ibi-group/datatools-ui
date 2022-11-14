// @flow

import path from 'path'

import fs from 'fs-extra'
import fetch from 'isomorphic-fetch'
import md5File from 'md5-file/promise'
import moment from 'moment'
import SimpleNodeLogger from 'simple-node-logger'
import uuidv4 from 'uuid/v4'
// $FlowFixMe we rely on puppeteer being imported externally, as the latest version conflicts with mastarm
import puppeteer from 'puppeteer'
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder'

import {collectingCoverage, getTestFolderFilename, isCi, isDocker} from './test-utils/utils'

// if the ISOLATED_TEST is defined, only the specifed test (and any dependet
// tests) will be ran and all others will be skipped.
// const ISOLATED_TEST = 'should update a project by adding an otp server'
const ISOLATED_TEST = null // null means run all tests

// TODO: Allow the below options (puppeteer and test) to be enabled via command
// line options parsed by mastarm.
const puppeteerOptions = {
  // dumpio: true, // dumps all browser console to docker logs
  headless: isCi || isDocker,
  // The following options can be enabled manually to help with debugging.
  // dumpio: true, // Logs all of browser console to stdout
  // slowMo: 50, // puts xx milliseconds between events (for easier watching in non-headless)
  // NOTE: In order to run on Travis CI, use args --no-sandbox option
  args: isCi || isDocker ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--ignore-certificate-errors'] : []
}
const testOptions = {
  // If enabled, failFast will break out of the test script immediately.
  failFast: false
}
let failingFast = false
let successfullyCreatedTestProject = false
let browser
let page
let recorder
let cdpSession
const gtfsUploadFile = './configurations/end-to-end/test-gtfs-to-upload.zip'
const OTP_ROOT = 'http://datatools-server:8080/otp/routers/'
const testTime = moment().format()
const fileSafeTestTime = moment().format('YYYY-MM-DDTHH-mm-ss')
const testProjectName = `test-project-${testTime}`
const testFeedSourceName = `test-feed-source-${testTime}`
const dummyStop1 = {
  code: '1',
  description: 'test 1',
  id: 'test-stop-1',
  lat: '37.04671717',
  lon: '-122.07529759',
  name: 'Laurel Dr and Valley Dr',
  url: 'example.stop/1'
}
const dummyStop2 = {
  code: '2',
  description: 'test 2',
  id: 'test-stop-2',
  lat: '37.04783038',
  lon: '-122.07521176',
  name: 'Russell Ave and Valley Dr',
  url: 'example.stop/2'
}
let testProjectId
let feedSourceId
let scratchFeedSourceId
let routerId
const log = SimpleNodeLogger.createSimpleFileLogger(
  getTestFolderFilename(`e2e-run-${fileSafeTestTime}.log`)
)
const browserEventLogs = SimpleNodeLogger.createSimpleFileLogger(
  getTestFolderFilename(`e2e-run-${fileSafeTestTime}-browser-events.log`)
)
const testResults = {}
const defaultTestTimeout = 100000
const defaultJobTimeout = 100000

// this variable gets modified as tests are defined. Each testname becomes a key
// with a value of an array of strings of dependent test names
const testDependencies = {}

/**
 * Recursively calculates all dependent tests and sets them in the
 * testDependencies global.
 */
function addRecursiveDependencies (testName, dependentTests) {
  const existingAndNew = dependentTests.concat(testDependencies[testName] || [])
  testDependencies[testName] = [...(new Set(existingAndNew))]
  // add additional dependencies that the dependentTests depend on
  dependentTests.forEach(dependentTest => {
    if (testDependencies[dependentTest]) {
      addRecursiveDependencies(testName, testDependencies[dependentTest])
    }
  })
}

/**
 * Creates and returns a helper function that is able to define a test case
 * that will be ran with an awareness of other test dependencies, logging of
 * test case beginning and ending, creation of screenshots upon failed tests and
 * updating of coverage reports of lines covered as observed in the browser.
 *
 * @param  {Mixed} [defaultDependentTests=[]] either a string or array of
 *  strings of which tests to always include as dependent tests.
 */
function makeMakeTest (defaultDependentTests: Array<string> | string = []) {
  if (!(defaultDependentTests instanceof Array)) {
    defaultDependentTests = [defaultDependentTests]
  }
  /**
   * A function that is returned that can be used to create actual test cases.
   *
   * @param  {String} name The name of the test case
   * @param  {Function} fn The function to execute to run the test case
   * @param  {Number} [timeout] The time in milliseconds to allow the †est to
   *    complete before failing it due to a timeout
   * @param  {Mixed} [dependentTests=[]] A string or an array of strings in
   *    addition to the default dependent tests that this test case depends on.
   */
  return (
    name: string,
    fn: Function,
    timeout?: number,
    dependentTests: Array<string> | string = []
  ) => {
    // merge dependent tests
    if (!(dependentTests instanceof Array)) {
      dependentTests = [dependentTests]
    }
    dependentTests = [...defaultDependentTests, ...dependentTests]

    // add to dependencies list
    addRecursiveDependencies(name, dependentTests)

    // actual test
    test(name, async () => {
      log.info(`Begin test: "${name}"`)
      if (failingFast) {
        log.error('Failing fast due to previous failed test')
        throw new Error('Failing fast due to previous failed test')
      }

      // first make sure all dependent tests have passed
      // $FlowFixMe, should be an array by now
      dependentTests.forEach(test => {
        if (!testResults[test]) {
          log.error(`Dependent test "${test}" has not completed yet`)
          throw new Error(`Dependent test "${test}" has not completed yet`)
        }
      })

      // if the ISOLATED_TEST is set, skip this test if it is not the named
      // isolated test and the isolated test is not dependent on this test.
      if (ISOLATED_TEST) {
        if (!testDependencies[ISOLATED_TEST]) {
          throw new Error(`Isolated test not defined: "${ISOLATED_TEST}"`)
        }

        if (
          name !== ISOLATED_TEST &&
            testDependencies[ISOLATED_TEST].indexOf(name) === -1
        ) {
          testResults[name] = true
          log.warn(`Skipping test ${name}`)
          return
        }
      }

      // do actual test
      try {
        await fn()
      } catch (e) {
        log.error(`test "${name}" failed due to error: ${e}`)
        // Take screenshot of page to help debugging.
        await page.screenshot({
          path: getTestFolderFilename(
            `e2e-error-${name.replace(' ', '_')}-${fileSafeTestTime}.jpeg`
          ),
          fullPage: true,
          // save with non-perfect quality to cut down on picture file size
          quality: 50,
          type: 'jpeg'
        })

        // report coverage thus far
        await sendCoverageToServer()

        // fail fast if needed
        if (testOptions.failFast) {
          log.info('Fail fast option enabled. Failing remaining tests.')
          // Delay by a second so that log statement is processed.
          failingFast = true
        }
        throw e
      }

      // report coverage thus far
      await sendCoverageToServer()

      // note successful completion
      testResults[name] = true
      log.info(`successful test: "${name}"`)
    }, timeout)
  }
}

// create helper functions that can be used to create dependent tests with
// varying dependencies
const makeTest = makeMakeTest()
const makeTestPostLogin = makeMakeTest('should login')
const makeTestPostFeedSource = makeMakeTest(['should login', 'should create feed source'])
const makeEditorEntityTest = makeMakeTest([
  'should login',
  'should create feed source',
  'should edit a feed from scratch'
])

// this can be turned off in development mode to skip some tests that do not
// need to be run in order for other tests to work properly
const doNonEssentialSteps = true

/**
 * Collect current coverage and send it to coverage collector server
 */
async function sendCoverageToServer () {
  if (collectingCoverage) {
    const coverage = await page.evaluate(() => window.__coverage__)

    await fetch('http://localhost:9999/coverage/client', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(coverage)
    })
  }
}

/**
 * Expect the innerHTML obtained from the given selector to contain the
 * given string.
 */
async function expectSelectorToContainHtml (selector: string, html: string, retry: ?boolean) {
  try {
    const innerHTML = await getInnerHTMLFromSelector(selector)
    expect(innerHTML).toContain(html)
  } catch {
    // Some parts of datatools can sometimes get stuck and need a refresh
    if (!retry) {
      log.warn('failed to find selector on problematic page, attempting page reload before retrying')
      await page.reload({ waitUntil: 'networkidle0' })
      await expectSelectorToContainHtml(selector, html, true)
    }
  }
}

/**
 * Expect the innerHTML obtained from the given selector to NOT contain the
 * given string.
 */
async function expectSelectorToNotContainHtml (selector: string, html: string) {
  const innerHTML = await getInnerHTMLFromSelector(selector)
  expect(innerHTML).not.toContain(html)
}

/**
 * Checks that the expected feed version validity dates are displayed.
 */
async function expectFeedVersionValidityDates (startDate: string, endDate: string) {
  await expectSelectorToContainHtml(
    '[data-test-id="active-feed-version-validity-start"]',
    startDate
  )
  await expectSelectorToContainHtml(
    '[data-test-id="active-feed-version-validity-end"]',
    endDate
  )
}

/**
 * Create a new project.  Assumes that this is called while the browser is on
 * the home page.
 */
async function createProject (projectName: string) {
  log.info(`creating project with name: ${projectName}`)
  await wait(3000)
  await click('#context-dropdown')
  await wait(5000)
  await waitForAndClick('a[href="/project/new"]')
  await wait(3000)
  await waitForSelector('[data-test-id="project-name-input-container"]')
  await type('[data-test-id="project-name-input-container"] input', projectName)
  await click('[data-test-id="project-settings-form-save-button"]')
  log.info('saving new project')
  await wait(3500, 'for project to get saved')

  // verify that the project was created with the proper name
  await expectSelectorToContainHtml('.project-header', projectName)

  // go back to project list
  await goto('https://datatools-ui-proxy/project', {waitUntil: 'networkidle0'})

  // verify the new project is listed in the project list
  await expectSelectorToContainHtml('[data-test-id="project-list-table"]', projectName)
  log.info(`confirmed successful creation of project with name: ${projectName}`)
}

/**
 * Helper function to delete a project with a given id string.
 */
async function deleteProject (projectId: string) {
  log.info(`deleting project with id: ${projectId}`)
  // navigate to that project's settings
  await goto(`https://datatools-ui-proxy/project/${projectId}/settings`)

  // delete that project
  await waitForAndClick('[data-test-id="delete-project-button"]')
  await wait(500, 'for modal to appear')
  await waitForAndClick('[data-test-id="modal-confirm-ok-button"]')
  log.info('deleted project')

  // verify deletion
  await goto(`https://datatools-ui-proxy/project/${projectId}`)
  await wait(3000, 'for project page to load')
  await waitForSelector('.project-not-found')
  await wait(5000, 'for previously rendered project markup to be removed')
  await expectSelectorToContainHtml('.project-not-found', projectId)
  log.info(`confirmed successful deletion of project with id ${projectId}`)
}

/**
 * Helper function to upload a GTFS file to a given feed source. This function
 * assumes that the puppeteer instance is currnetly open on the desired feed
 * source.
 */
async function uploadGtfs () {
  log.info('uploading gtfs')
  // create new feed version by clicking on dropdown and upload link
  await click('#bg-nested-dropdown')
  // TODO replace with more specific selector
  await waitForSelector('[data-test-id="upload-feed-button"]')
  await click('[data-test-id="upload-feed-button"]')

  // set file to upload in modal dialog
  // TODO replace with more specific selector
  await waitForSelector('.modal-body input')
  // $FlowFixMe cryptic error that is hard to resolve :(
  const uploadInput = await page.$('.modal-body input')
  if (!uploadInput) throw new Error('Could not find upload input')
  await uploadInput.uploadFile(gtfsUploadFile)

  // confirm file upload
  // TODO replace with more specific selector
  const footerButtons = await getAllElements('.modal-footer button')
  await footerButtons[0].click()

  await waitAndClearCompletedJobs()
  log.info('completed gtfs upload')
}

/**
 * Fill out create feed source form, save feed source, verify creation and also
 * that it is presnt in the list of project feed sources.
 */
async function createFeedSourceViaForm (feedSourceName) {
  // wait for form to be visible
  await waitForSelector('[data-test-id="feed-source-name-input-container"]')

  // enter feed source name
  await type(
    '[data-test-id="feed-source-name-input-container"] input',
    feedSourceName
  )

  // save and wait
  await click('[data-test-id="create-feed-source-button"]')
  await wait(2000, 'for feed source to be created and saved')

  // verify that feed source was created
  await waitForSelector('.manager-header')
  await expectSelectorToContainHtml('.manager-header', feedSourceName)

  // go to feed source's project page
  await click('[data-test-id="feed-project-link"]')

  // wait for data to load
  await wait(2000, 'additional time for deployment data to load')

  // verify that the feed source is listed in project feed sources
  await waitForSelector('#project-viewer-tabs')
  await expectSelectorToContainHtml('#project-viewer-tabs', feedSourceName)

  log.info(`Successfully created Feed Source with name: ${feedSourceName}`)
}

/**
 * A helper function to create a feed source by clicking through the project
 * header button.
 */
async function createFeedSourceViaProjectHeaderButton (feedSourceName) {
  log.info(`create Feed Source with name: ${feedSourceName} via project header button`)
  // go to project page
  await goto(
    `https://datatools-ui-proxy/project/${testProjectId}`,
    {
      waitUntil: 'networkidle0'
    }
  )
  await waitForAndClick('[data-test-id="project-header-action-dropdown-button"]')
  await waitForAndClick('[data-test-id="project-header-create-new-feed-source-button"]')
  await createFeedSourceViaForm(feedSourceName)
}

/**
 * A helper function to create a new stop in the feed editor. This function
 * assumes that the stop editor is active and the map window is ready to receive
 * a right click to create a new stop.
 */
async function createStop ({
  code,
  description,
  id,
  lat,
  locationType = '0',
  lon,
  name,
  timezone = { initalText: 'america/lo', option: 1 },
  url,
  wheelchairBoarding = '1',
  zoneId = '1'
}: {
  code: string,
  description: string,
  id: string,
  lat: string,
  locationType?: string, // make optional due to https://github.com/facebook/flow/issues/183
  lon: string,
  name: string,
  timezone?: { // make optional due to https://github.com/facebook/flow/issues/183
    initalText: string,
    option: number
  },
  url: string,
  wheelchairBoarding?: string, // make optional due to https://github.com/facebook/flow/issues/183
  zoneId?: string // make optional due to https://github.com/facebook/flow/issues/183
}) {
  log.info(`creating stop with name: ${name}`)
  // right click on map to create stop
  await page.mouse.click(700, 200, { button: 'right' })

  // wait for entity details sidebar to appear
  await waitForSelector('[data-test-id="stop-stop_id-input-container"]')
  await wait(2000, 'for initial data to load')

  // fill out form

  // set stop_id
  await clearAndType(
    '[data-test-id="stop-stop_id-input-container"] input',
    id
  )

  // code
  await type(
    '[data-test-id="stop-stop_code-input-container"] input',
    code
  )

  // set stop name
  await clearAndType(
    '[data-test-id="stop-stop_name-input-container"] input',
    name
  )

  // description
  await type(
    '[data-test-id="stop-stop_desc-input-container"] input',
    description
  )

  // lat
  await clearAndType(
    '[data-test-id="stop-stop_lat-input-container"] input',
    lat
  )

  // lon
  await clearAndType(
    '[data-test-id="stop-stop_lon-input-container"] input',
    lon
  )

  // zone
  const zoneIdSelector = '[data-test-id="stop-zone_id-input-container"]'
  await click(
    `${zoneIdSelector} .Select-control`
  )
  await type(`${zoneIdSelector} input`, zoneId)
  await page.keyboard.press('Enter')

  // stop url
  await type(
    '[data-test-id="stop-stop_url-input-container"]',
    url
  )

  // stop location type
  await page.select(
    '[data-test-id="stop-location_type-input-container"] select',
    locationType
  )

  // timezone
  await reactSelectOption(
    '[data-test-id="stop-stop_timezone-input-container"]',
    timezone.initalText,
    timezone.option
  )

  // wheelchair boarding
  await page.select(
    '[data-test-id="stop-wheelchair_boarding-input-container"] select',
    wheelchairBoarding
  )

  // save
  await click('[data-test-id="save-entity-button"]')
  await wait(5000, 'for save to happen')
  log.info(`created stop with name: ${name}`)
}

/**
 * Enters in some text into the user search input, submits search and waits for
 * results
 * @param  {string} searchText the text to enter into the search input
 */
async function filterUsers (searchText: string) {
  await wait(8000, 'for user list to load')
  // type in text
  await type('[data-test-id="search-user-input"]', searchText)

  // submit search
  await click('[data-test-id="submit-user-search-button"]')

  // wait for results
  await wait(2000, 'for user list to be updated')
}

/**
 * Clears any text currently in an input field found at the given selector
 * string. If an input is not found, an error is thrown.
 */
async function clearInput (inputSelector: string) {
  await page.$eval(
    inputSelector,
    input => {
      if (!input) {
        throw new Error(`Could not find input with selector: ${inputSelector}`)
      }
      // make flow happy cause flow-typed page.$eval doesn't get specifc enough
      const _input = (input: any)
      _input.value = ''
    }
  )
}

/**
 * A helper method to choose a color from a color selector.
 */
async function pickColor (containerSelector: string, color: string) {
  await click(`${containerSelector} button`)
  await waitForSelector(`${containerSelector} .sketch-picker`)
  await clearAndType(`${containerSelector} input`, color)
}

/**
 * A helper method to choose a route type
 * in the route editor (but not in the feed editor).
 */
async function pickRouteType (containerSelector: string, routeOptionId: string) {
  await click(`${containerSelector} a`)
  await waitForSelector(`${containerSelector} .dropdown-content`)
  await waitForSelector(`[data-test-id="${routeOptionId}"]`)
  await click(`[data-test-id="${routeOptionId}"] label`)
}

/**
 * A helper method to type in an autocomplete value and then select an option
 * from an react-select component.
 */
async function reactSelectOption (
  containerSelector: string,
  initalText: string,
  optionToSelect: number,
  virtualized: boolean = false
) {
  log.info(`selecting option from react-select container: ${containerSelector}`)
  await click(`${containerSelector} .Select-control`)
  await type(`${containerSelector} input`, initalText)
  const optionSelector =
    `.${virtualized ? 'VirtualizedSelectOption' : 'Select-option'}:nth-child(${optionToSelect})`
  await waitForSelector(optionSelector)
  await click(optionSelector)
  log.info('selected option')
}

function formatSecondsElapsed (startTime: number) {
  return `${(new Date() - startTime) / 1000} seconds`
}

/**
 * Waits for all currently running jobs to complete.
 */
async function waitAndClearCompletedJobs () {
  const startTime = new Date()
  try {
    // wait for an active job to appear
    await waitForSelector('[data-test-id="possibly-active-jobs"]')
    // All jobs completed span will appear when all jobs are done.
    await waitForSelector(
      '[data-test-id="all-jobs-completed"]',
      {timeout: defaultJobTimeout}
    )
  } catch {
    console.log("couldn't find active job panel. assuming job completed")
  }

  await waitForSelector('[data-test-id="clear-completed-jobs-button"]')
  // Clear retired jobs to remove all jobs completed span.
  await click('[data-test-id="clear-completed-jobs-button"]')
  log.info(`cleared completed jobs in ${formatSecondsElapsed(startTime)}`)
}

/**
 * Clears the current the value in an input found at the given selector and
 * types in the new given text
 */
async function clearAndType (selector: string, text: string) {
  await clearInput(selector)
  await type(selector, text)
}

/**
 * Adds text to the end of input field.
 */
async function appendText (selector: string, text: string) {
  log.info(`focusing on selector: ${selector}`)
  await page.focus(selector)
  await page.keyboard.press('End')
  log.info(`appending text: ${text}`)
  await page.keyboard.type(text)
}

/**
 * Waits for a selector to be visible on the page. Does some logging about it.
 */
async function waitForSelector (selector: string, options?: any) {
  const startTime = new Date()
  await wait(100, 'delay before looking for selector...')
  log.info(`waiting for selector: ${selector}`)
  await page.waitForSelector(selector, options)
  log.info(`selector ${selector} took ${formatSecondsElapsed(startTime)}`)
}

/**
 * Clicks on the given selector
 */
async function click (selector: string) {
  log.info(`clicking selector: ${selector}`)
  await page.click(selector) // , {delay: 3})
}

/**
 * Finds and then clicks on a selector within the dom tree of the given element
 */
async function elementClick (elementHandle: any, selector: string) {
  log.info(`finding selector: ${selector} in element handle ${elementHandle}`)
  const selectedElement = await elementHandle.$(selector)
  if (!selectedElement) {
    throw new Error(`Could't find "${selector}" within elementHandle ${elementHandle}`)
  }
  log.info(`clicking selector: ${selector} of element handle: ${elementHandle}`)
  await selectedElement.click() // , {delay: 3})
}

/**
 * Waits for a selector to show up and then clicks on it.
 */
async function waitForAndClick (selector: string, waitOptions?: any, retry?: boolean) {
  await waitForSelector(selector, waitOptions)
  await click(selector)
}

/**
 * Waits for the specified amount of milliseconds and provides some useful
 * logging.
 */
async function wait (milliseconds: number, reason?: string) {
  log.info(`waiting ${milliseconds} ms${reason ? ` ${reason}` : ''}...`)
  await page.waitForTimeout(milliseconds)
}

/**
 * Navigates to the given url. Sends the collected coverage to the server that
 * has been obtained thus far.
 */
async function goto (url: string, options?: any) {
  // before navigating away from the page, collect and report coverage thus far
  await sendCoverageToServer()

  log.info(`navigating to: ${url}`)
  await page.goto(url, options)
  await wait(1000, 'for page to load')
}

/**
 * Strips react tags from a string.
 */
function stripReactTags (str: any): any {
  return str.replace(/<!--[\s\w-:/]*-->/g, '')
}

/**
 * Gets the href attribute from the given element.
 */
async function getHref (element: any) {
  log.info(`getting href for element: ${element}`)
  const href = await page.evaluate(
    el => {
      const _el = (el: any)
      // make flow happy cause flow-typed page.$eval doesn't get specifc enough
      return _el.href
    },
    element
  )
  return href
}

/**
 * Gets the innerHTML and strips the react tags of a given element.
 */
async function getInnerHTML (element: any) {
  log.info(`getting innerHTML for element: ${element}`)
  const html = await page.evaluate(
    el => {
      const _el = (el: any)
      // make flow happy cause flow-typed page.$eval doesn't get specifc enough
      return _el.innerHTML
    },
    element
  )
  return stripReactTags(html)
}

/**
 * Gets the innerHTML and strips the react tags of a given selector.
 */
async function getInnerHTMLFromSelector (selector: string) {
  log.info(`getting innerHTML for selector: ${selector}`)
  const html = (await page.$eval(selector, el => {
    const _el = (el: any)
    // make flow happy cause flow-typed page.$eval doesn't get specifc enough
    return _el.innerHTML
  }): any)
  return stripReactTags(html)
}

/**
 * Gets all the element handles found using the given selector.
 */
async function getAllElements (selector: string) {
  log.info(`getting all elements for selector: ${selector}`)
  const elements = await page.$$(selector)
  if (!elements || elements.length === 0) {
    throw new Error(`Could not find any elements for selector: ${selector}`)
  }
  return elements
}

/**
 * Types some text into the given selector.
 */
async function type (selector: string, text: string) {
  log.info(`typing text: "${text}" into selector: ${selector}`)
  await page.focus(selector)
  await page.type(selector, text)
}

/**
 * Types some text into an input found at a selector found within the element
 * tree of the given element.
 */
async function elementType (elementHandle: any, selector: string, text: string) {
  log.info(`finding selector: ${selector} in element handle ${elementHandle}`)
  const selectedElement = await elementHandle.$(selector)
  if (!selectedElement) {
    throw new Error(`Could't find "${selector}" within elementHandle ${elementHandle}`)
  }
  log.info(`typing text: "${text}" into selector: ${selector}`)
  await selectedElement.type(text)
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Start of test suite
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

describe('end-to-end', () => {
  beforeAll(async () => {
    // Ping the otp endpoint to ensure the server is running.
    try {
      log.info(`Pinging OTP at ${OTP_ROOT}`)
      await fetch(`${OTP_ROOT}`)
      log.info('OTP is OK.')
      // if (response.status !== 200) throw new Error('OTP not ready!')
      // else log.info('OTP is OK.')
    } catch (e) {
      if (testOptions.failFast) {
        log.error('OpenTripPlanner not accepting requests. Failing remaining tests due to fail fast option.')
        failingFast = true
      } else log.warn('OpenTripPlanner not accepting requests. Start it up for deployment tests!!')
    }
    log.info('Launching chromium for testing...')
    browser = await puppeteer.launch(puppeteerOptions)
    page = await browser.newPage()
    cdpSession = await page.target().createCDPSession()
    recorder = new PuppeteerScreenRecorder(page)
    await recorder.start('/datatools-ui/e2e-test-results/recording.mp4')

    // setup listeners for various events that happen in the browser. In each of
    // the following instances, write to the browser events log that will be
    // included in the zipped upload of the e2e logs.

    // log everything that was logged to the browser console
    page.on('console', msg => { browserEventLogs.info(msg.text()) })
    // log all errors that were logged to the browser console
    page.on('warn', warn => {
      browserEventLogs.error(warn)
    })
    page.on('error', error => {
      browserEventLogs.error(error)
      browserEventLogs.error(error.stack)
    })
    // log all uncaught exceptions
    page.on('pageerror', error => { browserEventLogs.error(`Page Error: ${error}`) })
    // log all failed requests
    page.on('requestfailed', req => {
      browserEventLogs.error(`Request failed: ${req.method()} ${req.url()}`)
    })
    // log all successful requests
    // page.on('requestfinished', req => {
    //   browserEventLogs.info(`Request finished: ${req.method()} ${req.url()}`)
    // })

    // set the default download behavior to download files to the cwd
    cdpSession.send(
      'Page.setDownloadBehavior',
      { behavior: 'allow', downloadPath: './' }
    )

    log.info('Setup complete.')
  }, 120000)

  afterAll(
    async () => {
      // delete test project
      if (successfullyCreatedTestProject) {
        try {
          await deleteProject(testProjectId)
          log.info('Successfully deleted test project. Closing Chromium...')
        } catch (e) {
          log.error(`could not delete project with id "${testProjectId}" due to error: ${e}`)
        }
      }
      // close browser
      await recorder.stop()
      await page.close()
      await browser.close()
      log.info('Chromium closed.')
    },
    // wait for up to 2 minutes for the teardown to complete. The default of 5
    // seconds may not be long enough to delete the test project and close the
    // browser
    120000
  )

  // ---------------------------------------------------------------------------
  // Begin tests
  // ---------------------------------------------------------------------------

  makeTest('should load the page', async () => {
    await goto('https://datatools-ui-proxy')
    await waitForSelector('h1')
    await expectSelectorToContainHtml('h1', 'Data Tools')
    testResults['should load the page'] = true
  })

  makeTest('should login', async () => {
    const username = process.env.E2E_AUTH0_USERNAME
    const password = process.env.E2E_AUTH0_PASSWORD
    if (!username || !password) throw Error('E2E username and password must be set!')

    await goto('https://datatools-ui-proxy', { waitUntil: 'networkidle0' })
    await waitForAndClick('[data-test-id="header-log-in-button"]')
    await waitForSelector('button[class="auth0-lock-submit"]', { visible: true })
    await waitForSelector('input[class="auth0-lock-input"][name="email"]')
    await type('input[class="auth0-lock-input"][name="email"]', username)
    await type('input[class="auth0-lock-input"][name="password"]', password)
    await click('button[class="auth0-lock-submit"]')
    await waitForSelector('#context-dropdown')
    await wait(2000, 'for projects to load')
  }, defaultTestTimeout, 'should load the page')

  describe('admin', () => {
    const testUserEmail = `e2e-test-${fileSafeTestTime}@ibigroup.com`.toLowerCase()
    const testUserSlug = testUserEmail.split('@')[0]
    makeTestPostLogin('should allow admin user to create another user', async () => {
      // navigage to admin page
      await goto('https://datatools-ui-proxy/admin/users', { waitUntil: 'networkidle0' })

      // click on create user button
      await waitForAndClick('[data-test-id="create-user-button"]')

      // wait for create user dialog to show up
      await waitForSelector('#formControlsEmail')

      // enter in user data
      await type('#formControlsEmail', testUserEmail)
      await type('#formControlsPassword', uuidv4())

      // submit form
      await click('[data-test-id="confirm-create-user-button"]')

      // wait for user to be saved
      await wait(30000, 'for user to be created')

      // filter users
      await filterUsers(testUserSlug)

      // verify that new user is found in list of filtered users
      await waitForSelector(`[data-test-id="edit-user-${testUserSlug}"]`)
      await expectSelectorToContainHtml('[data-test-id="user-list"]', testUserEmail)
    }, defaultTestTimeout)

    makeTestPostLogin('should update a user', async () => {
      // click on edit button for user
      await click(`[data-test-id="edit-user-${testUserSlug}"]`)

      // make user an admin
      await waitForAndClick(`[data-test-id="app-admin-checkbox-${testUserSlug}"]`)

      // save
      await click(`[data-test-id="save-user-${testUserSlug}"]`)

      // refresh page
      await page.reload({ waitUntil: 'networkidle0' })

      // filter users
      await filterUsers(testUserSlug)

      // verify that user is now an admin
      await waitForAndClick(`[data-test-id="edit-user-${testUserSlug}"]`)
      // $FlowFixMe cryptic error that is hard to resolve :(
      const adminCheckbox = await page.$(`[data-test-id="app-admin-checkbox-${testUserSlug}"]`)
      const isAdmin = await (await adminCheckbox.getProperty('checked')).jsonValue()
      expect(isAdmin).toBe(true)
    }, defaultTestTimeout, 'should allow admin user to create another user')

    makeTestPostLogin('should delete a user', async () => {
      // click delete user button
      await click(`[data-test-id="delete-user-${testUserSlug}"]`)

      // confirm action in modal
      await waitForAndClick('[data-test-id="modal-confirm-ok-button"]')
      await wait(2000, 'for data to refresh')

      // filter users
      await filterUsers(testUserSlug)

      // verify that test user is not in list
      await expectSelectorToNotContainHtml('[data-test-id="user-list"]', testUserEmail)
    }, defaultTestTimeout, 'should allow admin user to create another user')
  })

  // ---------------------------------------------------------------------------
  // Project tests
  // ---------------------------------------------------------------------------

  describe('project', () => {
    makeTestPostLogin('should create a project', async () => {
      await goto('https://datatools-ui-proxy/home', { waitUntil: 'networkidle0' })
      await createProject(testProjectName)

      // go into the project page and verify that it looks ok-ish
      const projectEls = await getAllElements('.project-name-editable a')

      let projectFound = false
      for (const projectEl of projectEls) {
        const innerHtml = await getInnerHTML(projectEl)
        if (innerHtml.indexOf(testProjectName) > -1) {
          const href = await getHref(projectEl)
          testProjectId = href.match(/\/project\/([\w-]*)/)[1]
          await projectEl.click()
          projectFound = true
          break
        }
      }
      if (!projectFound) throw new Error('Created project not found')

      await waitForSelector('#project-viewer-tabs')
      await expectSelectorToContainHtml('#project-viewer-tabs', 'What is a feed source?')
      successfullyCreatedTestProject = true
    }, defaultTestTimeout)

    makeTestPostLogin('should update a project by adding an otp server', async () => {
      // navigate to server admin page
      await goto(
        `https://datatools-ui-proxy/admin/servers`,
        {
          waitUntil: 'networkidle0'
        }
      )
      const containerSelector = '.server-settings-panel'
      await waitForSelector(containerSelector)
      // add a server
      const serverName = 'test-otp-server'
      await click('[data-test-id="add-server-button"]')
      await waitForSelector('[data-test-id="[Server name]"]')
      const newServerPanel = await page.$('[data-test-id="[Server name]"]')
      await elementType(
        newServerPanel,
        'input[name="otpServers.$index.name"]',
        serverName
      )
      await elementType(
        newServerPanel,
        'input[name="otpServers.$index.publicUrl"]',
        'http://datatools-server:8080'
      )
      await elementType(
        newServerPanel,
        'input[name="otpServers.$index.internalUrl"]',
        'http://datatools-server:8080/otp'
      )
      await elementClick(newServerPanel, '[data-test-id="save-item-button"]')

      // reload page an verify test server persists
      await page.reload({ waitUntil: 'networkidle0' })
      await expectSelectorToContainHtml(containerSelector, serverName)
    }, defaultTestTimeout, 'should create a project')

    if (doNonEssentialSteps) {
      makeTestPostLogin('should delete a project', async () => {
        const testProjectToDeleteName = `test-project-that-will-get-deleted-${testTime}`

        // navigate to home project view
        await goto(
          `https://datatools-ui-proxy/home/${testProjectId}`,
          {
            waitUntil: 'networkidle0'
          }
        )
        await waitForSelector('#context-dropdown')

        // create a new project
        await createProject(testProjectToDeleteName)

        // get the created project id
        // go into the project page and verify that it looks ok-ish
        const projectEls = await getAllElements('.project-name-editable a')

        let projectFound = false
        let projectToDeleteId = ''
        for (const projectEl of projectEls) {
          const innerHtml = await getInnerHTML(projectEl)
          if (innerHtml.indexOf(testProjectToDeleteName) > -1) {
            const href = await getHref(projectEl)
            projectToDeleteId = href.match(/\/project\/([\w-]*)/)[1]
            projectFound = true
            break
          }
        }
        if (!projectFound) throw new Error('Created project not found')

        await deleteProject(projectToDeleteId)
      }, defaultTestTimeout, 'should create a project')
    }
  })

  // ---------------------------------------------------------------------------
  // Feed Source tests
  // ---------------------------------------------------------------------------

  describe('feed source', () => {
    makeTestPostLogin('should create feed source', async () => {
      // go to project page
      await goto(
        `https://datatools-ui-proxy/project/${testProjectId}`,
        {
          waitUntil: 'networkidle0'
        }
      )
      await waitForAndClick('[data-test-id="create-first-feed-source-button"]')
      await createFeedSourceViaForm(testFeedSourceName)

      // find feed source id
      // enter into feed source
      const feedSourceEls = await getAllElements('h4 a')
      let feedSourceFound = false
      feedSourceId = ''
      for (const feedSourceEl of feedSourceEls) {
        const innerHtml = await getInnerHTML(feedSourceEl)
        if (innerHtml.indexOf(testFeedSourceName) > -1) {
          const href = await getHref(feedSourceEl)
          feedSourceId = href.match(/\/feed\/([\w-]*)/)[1]
          feedSourceFound = true
          await feedSourceEl.click()
          break
        }
      }
      if (!feedSourceFound) throw new Error('Created feedSource not found')

      await waitForSelector('#feed-source-viewer-tabs')
      await wait(4000, 'for feed versions to load')
      expectSelectorToContainHtml(
        '#feed-source-viewer-tabs',
        'No versions exist for this feed source.'
      )
    }, defaultTestTimeout, 'should create a project')

    makeTestPostFeedSource('should process uploaded gtfs', async () => {
      await uploadGtfs()

      // wait for main tab to show up with version validity info
      await waitForSelector('[data-test-id="active-feed-version-validity-start"]')

      // verify feed was uploaded
      await expectFeedVersionValidityDates('Jan 1, 2014', 'Dec 31, 2018')
    }, defaultTestTimeout)

    // this test also sets the feed source as deployable
    makeTestPostFeedSource('should process fetched gtfs', async () => {
      // navigate to feed source settings
      await click('#feed-source-viewer-tabs-tab-settings')

      // make feed source deployable
      await waitForAndClick(
        '[data-test-id="make-feed-source-deployable-button"]',
        { visible: true }
      )
      // set fetch url
      await type(
        '[data-test-id="feed-source-url-input-group"] input',
        'https://github.com/ibi-group/datatools-ui/raw/dev/configurations/end-to-end/test-gtfs-to-fetch.zip'
      )
      await click('[data-test-id="feed-source-url-input-group"] button')
      await wait(2000, 'for feed source to update')

      // go back to feed source GTFS tab
      await click('#feed-source-viewer-tabs-tab-')
      // Open dropdown
      await waitForAndClick(
        '#bg-nested-dropdown',
        { visible: true }
      )
      // create new version by fetching
      await waitForAndClick(
        '[data-test-id="fetch-feed-button"]',
        { visible: true }
      )

      // wait for gtfs to be fetched and processed
      await waitAndClearCompletedJobs()

      // wait a little extra time for stuff to load
      await wait(2000, 'for feed source to update')

      // verify that feed was fetched and processed
      await expectFeedVersionValidityDates('Apr 8, 2018', 'Jun 30, 2018')
    }, defaultTestTimeout)

    if (doNonEssentialSteps) {
      makeTestPostFeedSource('should delete feed source', async () => {
        const testFeedSourceToDeleteName = `test-feed-source-to-delete-${testTime}`

        // create a new feed source to delete
        await createFeedSourceViaProjectHeaderButton(testFeedSourceToDeleteName)

        // find created feed source
        const listItemEls = await getAllElements('.feed-source-table-row')
        let feedSourceFound = false
        // cast to any to avoid flow errors
        for (const listItemEl: any of listItemEls) {
          const feedSourceNameEl = await listItemEl.$('h4 a')
          const innerHtml = await getInnerHTML(feedSourceNameEl)
          if (innerHtml.indexOf(testFeedSourceToDeleteName) > -1) {
            const href = await getHref(feedSourceNameEl)
            const feedSourceToDeleteId = href.match(/\/feed\/([\w-]*)/)[1]
            // click dropdown and delete menu item button
            await click(`#feed-source-action-button-${feedSourceToDeleteId}`)
            await wait(2000, 'for dropdown menu to render')
            // in order to make sure puppeteer finds the correct element, we
            // must narrow down the choices to the specific dropdown list of the
            // feed
            const feedDropdownSelector = `[aria-labelledby="feed-source-action-button-${feedSourceToDeleteId}"]`
            const deleteFeedButtonSelector = '[data-test-id="feed-source-dropdown-delete-feed-source-button"]'
            await waitForAndClick(`${feedDropdownSelector} ${deleteFeedButtonSelector}`)

            // confirm action in modal
            await waitForAndClick('[data-test-id="modal-confirm-ok-button"]')
            await wait(2000, 'for data to refresh')
            feedSourceFound = true
            break
          }
        }
        if (!feedSourceFound) throw new Error('Created feedSource not found')

        // verify deletion
        const feedSourceEls = await getAllElements('h4 a')
        let deletedFeedSourceFound = false
        for (const feedSourceEl of feedSourceEls) {
          const innerHtml = await getInnerHTML(feedSourceEl)
          if (innerHtml.indexOf(testFeedSourceToDeleteName) > -1) {
            deletedFeedSourceFound = true
            break
          }
        }
        if (deletedFeedSourceFound) throw new Error('Feed source did not get deleted!')
      }, defaultTestTimeout)
    }
  })

  // ---------------------------------------------------------------------------
  // Feed Version tests
  // ---------------------------------------------------------------------------

  describe('feed version', () => {
    makeTestPostFeedSource('should download a feed version', async () => {
      await goto(`https://datatools-ui-proxy/feed/${feedSourceId}`)
      // Select previous version
      await waitForAndClick('[data-test-id="decrement-feed-version-button"]')
      await wait(2000, 'for previous version to be active')
      // Download version
      await click('[data-test-id="download-feed-version-button"]')
      await wait(15000, 'for file to download')

      // file should get saved to the current root directory, go looking for it
      // verify that file exists
      const downloadsDir = './'
      // $FlowFixMe old version of flow doesn't know latest fs methods
      const files = await fs.readdir(downloadsDir)
      let feedVersionDownloadFile = ''
      // assume that this file will be the only one matching the feed source ID
      for (const file of files) {
        if (file.indexOf(feedSourceId.replace(/:/g, '')) > -1) {
          feedVersionDownloadFile = file
          break
        }
      }
      if (!feedVersionDownloadFile) {
        throw new Error('Feed Version gtfs file not found in Downloads folder!')
      }

      // verify that file has same hash as gtfs file that was uploaded
      const filePath = path.join(downloadsDir, feedVersionDownloadFile)
      expect(await md5File(filePath)).toEqual(await md5File(gtfsUploadFile))

      // delete file
      // $FlowFixMe old version of flow doesn't know latest fs methods
      await fs.remove(filePath)
    }, defaultTestTimeout)

    if (doNonEssentialSteps) {
      // this uploads a feed source again because we want to end up with 2
      // feed versions after this test takes place
      makeTestPostFeedSource('should delete a feed version', async () => {
        // browse to feed source page
        await goto(`https://datatools-ui-proxy/feed/${feedSourceId}`)
        // for whatever reason, waitUntil: networkidle0 was not working with the
        // above goto, so wait for a few seconds here
        await wait(5000, 'additional time for page to load')
        // upload gtfs
        await uploadGtfs()
        // click delete button
        await waitForAndClick('[data-test-id="delete-feed-version-button"]')
        // confirm action in modal
        await waitForAndClick('[data-test-id="modal-confirm-ok-button"]')
        await wait(2000, 'for data to refresh')
        await waitForSelector('#feed-source-viewer-tabs')
        // verify that the previous feed is now the displayed feed
        await expectFeedVersionValidityDates('Apr 8, 2018', 'Jun 30, 2018')
      }, defaultTestTimeout)
    }
  })

  // ---------------------------------------------------------------------------
  // Editor tests
  // ---------------------------------------------------------------------------

  describe('editor', () => {
    makeTestPostFeedSource('should load a feed version into the editor', async () => {
      // click edit feed button
      await click('[data-test-id="edit-feed-version-button"]')

      // wait for editor to get ready and show starting dialog
      await waitForAndClick('[data-test-id="import-latest-version-button"]')
      // wait for snapshot to get created
      await waitAndClearCompletedJobs()

      // begin editing
      await waitForAndClick('[data-test-id="begin-editing-button"]')
      await wait(2000, 'for dialog to close')
    }, defaultTestTimeout)

    // prepare a new feed source to use the editor from scratch
    makeTestPostFeedSource('should edit a feed from scratch', async () => {
      // browse to feed source page
      const feedSourceName = `feed-source-to-edit-from-scratch-${testTime}`
      await createFeedSourceViaProjectHeaderButton(feedSourceName)

      // find created feed source
      const listItemEls = await getAllElements('.feed-source-table-row')
      let feedSourceFound = false
      for (const listItemEl: any of listItemEls) {
        const feedSourceNameEl = await listItemEl.$('h4 a')
        const innerHtml = await getInnerHTML(feedSourceNameEl)
        if (innerHtml.indexOf(feedSourceName) > -1) {
          feedSourceFound = true
          const href = await getHref(feedSourceNameEl)
          scratchFeedSourceId = href.match(/\/feed\/([\w-]*)/)[1]
          await feedSourceNameEl.click()
          break
        }
      }
      if (!feedSourceFound) throw new Error('Created feedSource not found')

      // wait for navigation to feed source
      await waitForSelector('#feed-source-viewer-tabs')
      await wait(2000, 'for feed versions to load')

      // click edit feed button
      await click('[data-test-id="edit-feed-version-button"]')

      // wait for editor to get ready and show starting dialog
      await waitForAndClick('[data-test-id="edit-from-scratch-button"]')
      // wait for snapshot to get created
      await waitAndClearCompletedJobs()

      // begin editing
      await waitForAndClick('[data-test-id="begin-editing-button"]')
      await wait(2000, 'for welcome dialog to close')
    }, defaultTestTimeout)

    // ---------------------------------------------------------------------------
    // Feed Info tests
    // ---------------------------------------------------------------------------
    // all of the following editor tests assume the use of the scratch feed
    describe('feed info', () => {
      makeEditorEntityTest('should create feed info data', async () => {
        // If the editor doesn't load properly, reload the page in hopes of fixing it
        try {
          await waitForSelector('[data-test-id="editor-feedinfo-nav-button"]:not([disabled])')
        } catch {
          await page.reload({ waitUntil: 'networkidle0' })
        }
        // open feed info sidebar
        await click('[data-test-id="editor-feedinfo-nav-button"]')

        // wait for feed info sidebar form to appear
        await waitForSelector('#feed_publisher_name')

        // fill out form
        await type('#feed_publisher_name', 'end-to-end automated test')
        await type('#feed_publisher_url', 'example.test')
        await reactSelectOption(
          '[data-test-id="feedinfo-feed_lang-input-container"]',
          'eng',
          2
        )
        await clearAndType(
          '[data-test-id="feedinfo-feed_start_date-input-container"] input',
          '05/29/18'
        )
        await clearAndType(
          '[data-test-id="feedinfo-feed_end_date-input-container"] input',
          '05/29/38'
        )
        await pickColor(
          '[data-test-id="feedinfo-default_route_color-input-container"]',
          '3D65E2'
        )
        await page.select(
          '[data-test-id="feedinfo-default_route_type-input-container"] select',
          '6'
        )
        await type(
          '[data-test-id="feedinfo-feed_version-input-container"] input',
          testTime
        )

        // save
        await click('[data-test-id="save-entity-button"]')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for feed info sidebar form to appear
        await waitForSelector('#feed_publisher_name')

        // verify data was saved and retrieved from server
        await expectSelectorToContainHtml(
          '[data-test-id="feedinfo-feed_publisher_name-input-container"]',
          'end-to-end automated test'
        )
      }, defaultTestTimeout)

      makeEditorEntityTest('should update feed info data', async () => {
        // update publisher name by appending to end
        await appendText('#feed_publisher_name', ' runner')

        // save
        await click('[data-test-id="save-entity-button"]')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for feed info sidebar form to appear
        await waitForSelector('#feed_publisher_name')

        // verify data was saved and retrieved from server
        await expectSelectorToContainHtml(
          '[data-test-id="feedinfo-feed_publisher_name-input-container"]',
          'end-to-end automated test runner'
        )
      }, defaultTestTimeout, 'should create feed info data')
    })

    // ---------------------------------------------------------------------------
    // Agency tests
    // ---------------------------------------------------------------------------
    // all of the following editor tests assume the use of the scratch feed
    describe('agencies', () => {
      makeEditorEntityTest('should create agency', async () => {
        // open agency sidebar
        await click('[data-test-id="editor-agency-nav-button"]')

        // wait for agency sidebar form to appear and click to create agency
        await waitForAndClick('[data-test-id="create-first-agency-button"]')
        // wait for entity details sidebar to appear
        await waitForSelector('[data-test-id="agency-agency_id-input-container"]')

        // fill out form
        await type(
          '[data-test-id="agency-agency_id-input-container"] input',
          'test-agency-id'
        )
        await type(
          '[data-test-id="agency-agency_name-input-container"] input',
          'test agency name'
        )
        await type(
          '[data-test-id="agency-agency_url-input-container"] input',
          'example.test'
        )
        await reactSelectOption(
          '[data-test-id="agency-agency_timezone-input-container"]',
          'america/lo',
          1
        )
        // the below doesn't save the language unless chrome debugger is on.
        // Don't know why, spent way too much time trying to figure out.
        await reactSelectOption(
          '[data-test-id="agency-agency_lang-input-container"]',
          'eng',
          2
        )
        await type(
          '[data-test-id="agency-agency_phone-input-container"] input',
          '555-555-5555'
        )
        await type(
          '[data-test-id="agency-agency_fare_url-input-container"] input',
          'example.fare.test'
        )
        await type(
          '[data-test-id="agency-agency_email-input-container"] input',
          'test@example.com'
        )
        await type(
          '[data-test-id="agency-agency_branding_url-input-container"] input',
          'example.branding.url'
        )

        // save
        await click('[data-test-id="save-entity-button"]')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for agency sidebar form to appear
        await waitForSelector(
          '[data-test-id="agency-agency_id-input-container"]'
        )

        // verify data was saved and retrieved from server
        await expectSelectorToContainHtml(
          '[data-test-id="agency-agency_id-input-container"]',
          'test-agency-id'
        )
      }, defaultTestTimeout)

      makeEditorEntityTest('should update agency data', async () => {
        // update agency name by appending to end
        await appendText(
          '[data-test-id="agency-agency_name-input-container"] input',
          ' updated'
        )

        // save
        await click('[data-test-id="save-entity-button"]')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for agency sidebar form to appear
        await waitForSelector(
          '[data-test-id="agency-agency_name-input-container"] input'
        )

        // verify data was saved and retrieved from server
        await expectSelectorToContainHtml(
          '[data-test-id="agency-agency_name-input-container"]',
          'test agency name updated'
        )
      }, defaultTestTimeout, 'should create agency')

      makeEditorEntityTest('should delete agency data', async () => {
        // create a new agency that will get deleted
        await click('[data-test-id="clone-agency-button"]')

        // update agency id by appending to end
        await appendText(
          '[data-test-id="agency-agency_id-input-container"] input',
          '-copied'
        )

        // update agency name
        await appendText(
          '[data-test-id="agency-agency_name-input-container"] input',
          ' to delete'
        )

        // save
        await click('[data-test-id="save-entity-button"]')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for agency sidebar form to appear
        await waitForSelector(
          '[data-test-id="agency-agency_name-input-container"] input'
        )

        // verify that agency to delete is listed
        await expectSelectorToContainHtml(
          '.entity-list',
          'test agency name updated to delete'
        )

        // delete the agency
        await click('[data-test-id="delete-agency-button"]')
        await waitForAndClick('[data-test-id="modal-confirm-ok-button"]')
        await wait(2000, 'for delete to happen')

        // verify that agency to delete is no longer listed
        await expectSelectorToNotContainHtml(
          '.entity-list',
          'test agency name updated to delete'
        )
      }, defaultTestTimeout)
    })

    // ---------------------------------------------------------------------------
    // Route tests
    // ---------------------------------------------------------------------------
    // all of the following editor tests assume the use of the scratch feed and
    // successful completion of the agencies test suite
    describe('routes', () => {
      makeEditorEntityTest('should create route', async () => {
        // open routes sidebar
        await waitForAndClick('[data-test-id="editor-route-nav-button"]')

        await wait(1500, 'for route page to open')

        // wait for route sidebar form to appear and click button to open form
        // to create route
        await waitForAndClick('[data-test-id="create-first-route-button"]')
        // wait for entity details sidebar to appear
        await waitForSelector('[data-test-id="route-route_id-input-container"]')

        // fill out form
        // set route_id
        await clearAndType(
          '[data-test-id="route-route_id-input-container"] input',
          'test-route-id'
        )

        // set route short name
        await clearAndType(
          '[data-test-id="route-route_short_name-input-container"] input',
          'test1'
        )

        // long name
        await type(
          '[data-test-id="route-route_long_name-input-container"] input',
          'test route 1'
        )

        // description
        await type(
          '[data-test-id="route-route_desc-input-container"] input',
          'test route 1 description'
        )

        // route type
        await pickRouteType(
          '[data-test-id="route-route_type-input-container"]',
          'route-type-option-3'
        )

        // route color
        await pickColor(
          '[data-test-id="route-route_color-input-container"]',
          '1cff32'
        )

        // route text color
        await page.select(
          '[data-test-id="route-route_text_color-input-container"] select',
          '000000'
        )

        // wheelchair accessible
        await page.select(
          '[data-test-id="route-wheelchair_accessible-input-container"] select',
          '1'
        )

        // branding url
        await type(
          '[data-test-id="route-route_branding_url-input-container"] input',
          'example.branding.test'
        )

        // Set status to approved so the route is exported to a snapshot.
        // Do this last, otherwise the approved status will change back to in-progress.
        await page.select(
          '[data-test-id="route-status-input-container"] select',
          '2'
        )

        // save
        await click('[data-test-id="save-entity-button"]')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for routes sidebar form to appear
        await waitForSelector(
          '[data-test-id="route-route_id-input-container"]'
        )

        // verify data was saved and retrieved from server
        await expectSelectorToContainHtml(
          '[data-test-id="route-route_id-input-container"]',
          'test-route-id'
        )
      }, defaultTestTimeout, 'should create agency')

      makeEditorEntityTest('should update route data', async () => {
        // update route name by appending to end
        await appendText(
          '[data-test-id="route-route_long_name-input-container"] input',
          ' updated'
        )

        // Set status to approved so the route is exported to a snapshot.
        // Do this last, otherwise the approved status will change back to in-progress.
        await page.select(
          '[data-test-id="route-status-input-container"] select',
          '2'
        )

        // save
        await click('[data-test-id="save-entity-button"]')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for routes sidebar form to appear
        await waitForSelector(
          '[data-test-id="route-route_long_name-input-container"] input'
        )

        // verify data was saved and retrieved from server
        await expectSelectorToContainHtml(
          '[data-test-id="route-route_long_name-input-container"]',
          'test route 1 updated'
        )
      }, defaultTestTimeout, ['should create agency', 'should create route'])

      makeEditorEntityTest('should delete route data', async () => {
        // create a new route that will get deleted
        await click('[data-test-id="clone-route-button"]')

        // update route id by appending to end
        await appendText(
          '[data-test-id="route-route_id-input-container"] input',
          '-copied'
        )

        // update route name
        await appendText(
          '[data-test-id="route-route_long_name-input-container"] input',
          ' to delete'
        )

        // save
        await click('[data-test-id="save-entity-button"]')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for routes sidebar form to appear
        await waitForSelector(
          '[data-test-id="route-route_long_name-input-container"] input'
        )

        // verify that route to delete is listed
        await expectSelectorToContainHtml(
          '.entity-list',
          'test route 1 updated to delete'
        )

        // delete the route
        await click('[data-test-id="delete-route-button"]')
        await waitForAndClick('[data-test-id="modal-confirm-ok-button"]')
        await wait(2000, 'for delete to happen')

        // verify that route to delete is no longer listed
        await expectSelectorToNotContainHtml(
          '.entity-list',
          'test route 1 updated to delete'
        )
      }, defaultTestTimeout, 'should create agency')
    })

    // ---------------------------------------------------------------------------
    // Stops tests
    // ---------------------------------------------------------------------------
    // all of the following editor tests assume the use of the scratch feed
    describe('stops', () => {
      makeEditorEntityTest('should create stop', async () => {
        // open stop info sidebar
        await click('[data-test-id="editor-stop-nav-button"]')

        // wait for stop sidebar form to appear
        await waitForSelector('[data-test-id="create-stop-instructions"]')

        await createStop(dummyStop1)

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for feed info sidebar form to appear
        await waitForSelector(
          '[data-test-id="stop-stop_id-input-container"]'
        )

        // verify data was saved and retrieved from server
        await expectSelectorToContainHtml(
          '[data-test-id="stop-stop_id-input-container"]',
          dummyStop1.id
        )
        // verify stop shows up in stop entity list
        await expectSelectorToContainHtml(
          '.EntityList',
          dummyStop1.name
        )
      }, defaultTestTimeout)

      makeEditorEntityTest('should update stop data', async () => {
        // create a 2nd stop
        await createStop(dummyStop2)

        // update stop name by appending to end
        await appendText(
          '[data-test-id="stop-stop_desc-input-container"] input',
          ' updated'
        )

        // save
        await click('[data-test-id="save-entity-button"]')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for feed info sidebar form to appear
        await waitForSelector(
          '[data-test-id="stop-stop_desc-input-container"] input'
        )

        // verify the second stop was saved and retrieved from server
        await expectSelectorToContainHtml(
          '[data-test-id="stop-stop_desc-input-container"]',
          'test 2 updated'
        )
        // verify the second stop shows up in stop entity list
        await expectSelectorToContainHtml(
          '.EntityList',
          dummyStop2.name
        )
        // verify the first stop shows up in stop entity list
        await expectSelectorToContainHtml(
          '.EntityList',
          dummyStop1.name
        )
      }, defaultTestTimeout, 'should create stop')

      makeEditorEntityTest('should delete stop', async () => {
        // create a new stop that will get deleted
        await click('[data-test-id="clone-stop-button"]')

        // update stop id by appending to end
        await appendText(
          '[data-test-id="stop-stop_id-input-container"] input',
          '-copied'
        )

        // update stop code
        await clearAndType(
          '[data-test-id="stop-stop_code-input-container"] input',
          '3'
        )

        // update stop name
        await appendText(
          '[data-test-id="stop-stop_name-input-container"] input',
          ' to delete'
        )

        // save
        await click('[data-test-id="save-entity-button"]')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for feed info sidebar form to appear
        await waitForSelector(
          '[data-test-id="stop-stop_name-input-container"] input'
        )

        // verify that stop to delete is listed
        await expectSelectorToContainHtml(
          '.entity-list',
          'Russell Ave and Valley Dr to delete (3)'
        )

        // delete the stop
        await click('[data-test-id="delete-stop-button"]')
        await waitForAndClick('[data-test-id="modal-confirm-ok-button"]')
        await wait(2000, 'for delete to happen')

        // verify that stop to delete is no longer listed
        await expectSelectorToNotContainHtml(
          '.entity-list',
          'Russell Ave and Valley Dr to delete (3)'
        )
        // verify the second stop shows up in stop entity list
        await expectSelectorToContainHtml(
          '.EntityList',
          dummyStop2.name
        )
        // verify the first stop shows up in stop entity list
        await expectSelectorToContainHtml(
          '.EntityList',
          dummyStop1.name
        )
      }, defaultTestTimeout, 'should update stop data')
    })

    // ---------------------------------------------------------------------------
    // Calenadar tests
    // ---------------------------------------------------------------------------
    // all of the following editor tests assume the use of the scratch feed
    describe('calendars', () => {
      makeEditorEntityTest('should create calendar', async () => {
        // open calendar sidebar
        await click('[data-test-id="editor-calendar-nav-button"]')

        // wait for calendar sidebar form to appear and click button to open
        // form to create calendar
        await waitForAndClick('[data-test-id="create-first-calendar-button"]')
        // wait for entity details sidebar to appear
        await waitForSelector('[data-test-id="calendar-service_id-input-container"]')

        // fill out form

        // service_id
        await type(
          '[data-test-id="calendar-service_id-input-container"] input',
          'test-service-id'
        )

        // description
        await type(
          '[data-test-id="calendar-description-input-container"] input',
          'test calendar'
        )

        // monday
        await click(
          '[data-test-id="calendar-monday-input-container"] input'
        )

        // tuesday
        await click(
          '[data-test-id="calendar-tuesday-input-container"] input'
        )

        // start date
        await clearAndType(
          '[data-test-id="calendar-start_date-input-container"] input',
          '05/29/18'
        )

        // end date
        await clearAndType(
          '[data-test-id="calendar-end_date-input-container"] input',
          '05/29/28'
        )

        // save
        await click('[data-test-id="save-entity-button"]')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for calendar sidebar form to appear
        await waitForSelector(
          '[data-test-id="calendar-service_id-input-container"]'
        )

        // verify data was saved and retrieved from server
        await expectSelectorToContainHtml(
          '[data-test-id="calendar-service_id-input-container"]',
          'test-service-id'
        )
      }, defaultTestTimeout)

      makeEditorEntityTest('should update calendar data', async () => {
        // update calendar name by appending to end
        await appendText(
          '[data-test-id="calendar-description-input-container"] input',
          ' updated'
        )

        // save
        await click('[data-test-id="save-entity-button"]')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for calendar sidebar form to appear
        await waitForSelector(
          '[data-test-id="calendar-description-input-container"] input'
        )

        // verify data was saved and retrieved from server
        await expectSelectorToContainHtml(
          '[data-test-id="calendar-description-input-container"]',
          'test calendar updated'
        )
      }, defaultTestTimeout, 'should create calendar')

      makeEditorEntityTest('should delete calendar data', async () => {
        // create a new calendar that will get deleted
        await click('[data-test-id="clone-calendar-button"]')

        // update service id by appending to end
        await appendText(
          '[data-test-id="calendar-service_id-input-container"] input',
          '-copied'
        )

        // update description
        await appendText(
          '[data-test-id="calendar-description-input-container"] input',
          ' to delete'
        )

        // save
        await click('[data-test-id="save-entity-button"]')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for calendar sidebar form to appear
        await waitForSelector(
          '[data-test-id="calendar-description-input-container"] input'
        )

        // verify that calendar to delete is listed
        await expectSelectorToContainHtml(
          '.entity-list',
          'test-service-id-copied (test calendar updated to delete)'
        )

        // delete the calendar
        await click('[data-test-id="delete-calendar-button"]')
        await waitForAndClick('[data-test-id="modal-confirm-ok-button"]')
        await wait(2000, 'for delete to happen')

        // verify that calendar to delete is no longer listed
        await expectSelectorToNotContainHtml(
          '.entity-list',
          'test-service-id-copied (test calendar updated to delete)'
        )
      }, defaultTestTimeout)
    })

    // ---------------------------------------------------------------------------
    // Exceptions tests
    // ---------------------------------------------------------------------------
    // all of the following editor tests assume the use of the scratch feed and
    // successful completion of the calendars test suite
    describe('exceptions', () => {
      makeEditorEntityTest('should create exception', async () => {
        // open exception sidebar
        await waitForAndClick('[data-test-id="exception-tab-button"]')

        // wait for exception sidebar form to appear and click button to open
        // form to create exception
        await waitForAndClick('[data-test-id="create-first-scheduleexception-button"]')
        // wait for entity details sidebar to appear
        await waitForSelector('[data-test-id="exception-name-input-container"]')

        // fill out form

        // name
        await type(
          '[data-test-id="exception-name-input-container"] input',
          'test exception'
        )

        // exception type
        await page.select(
          '[data-test-id="exception-type-input-container"] select',
          '7' // no service
        )

        // add exception date
        await click('[data-test-id="exception-add-date-button"]')
        await waitForSelector(
          '[data-test-id="exception-dates-container"] input'
        )
        await wait(250, 'for date range picker to load')
        await wait(1000, 'for date range animation to finish')
        await clearAndType(
          '[data-test-id="exception-dates-container"] input',
          '07/04/18'
        )

        // save
        await click('[data-test-id="save-entity-button"]')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for exception sidebar form to appear
        await waitForSelector(
          '[data-test-id="exception-name-input-container"]'
        )

        // verify data was saved and retrieved from server
        await expectSelectorToContainHtml(
          '[data-test-id="exception-name-input-container"]',
          'test exception'
        )
      }, defaultTestTimeout, 'should create calendar')

      makeEditorEntityTest('should update exception data', async () => {
        // update exception name by appending to end
        await appendText(
          '[data-test-id="exception-name-input-container"] input',
          ' updated'
        )

        // save
        await click('[data-test-id="save-entity-button"]')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for exception sidebar form to appear
        await waitForSelector(
          '[data-test-id="exception-name-input-container"] input'
        )

        // verify data was saved and retrieved from server
        await expectSelectorToContainHtml(
          '[data-test-id="exception-name-input-container"]',
          'test exception updated'
        )
      }, defaultTestTimeout, 'should create exception')

      makeEditorEntityTest('should delete exception data', async () => {
        // create a new exception that will get deleted
        await click('[data-test-id="clone-scheduleexception-button"]')

        // update description
        await appendText(
          '[data-test-id="exception-name-input-container"] input',
          ' to delete'
        )

        // set new date
        await wait(1250, 'for date range picker to load')
        await clearAndType(
          '[data-test-id="exception-dates-container"] input',
          '07/05/18'
        )

        // save
        await click('[data-test-id="save-entity-button"]')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for exception sidebar form to appear
        await waitForSelector(
          '[data-test-id="exception-name-input-container"] input'
        )

        // verify that exception to delete is listed
        await expectSelectorToContainHtml(
          '.entity-list',
          'test exception updated to delete'
        )

        // delete the exception
        await click('[data-test-id="delete-scheduleexception-button"]')
        await waitForAndClick('[data-test-id="modal-confirm-ok-button"]')
        await wait(2000, 'for delete to happen')

        // verify that exception to delete is no longer listed
        await expectSelectorToNotContainHtml(
          '.entity-list',
          'test exception updated to delete'
        )
      }, defaultTestTimeout, 'should create calendar')

      makeEditorEntityTest('should create exception range', async () => {
        // create a new exception
        await waitForAndClick('[data-test-id="new-scheduleexception-button"]')

        // name
        await type(
          '[data-test-id="exception-name-input-container"] input',
          'test exception range'
        )

        // exception type
        await page.select(
          '[data-test-id="exception-type-input-container"] select',
          '7' // no service
        )

        // add start range exception date
        await click('[data-test-id="exception-add-date-button"]')
        await waitForSelector(
          '[data-test-id="exception-dates-container"] input'
        )
        await wait(1050, 'for date range picker to load')
        await clearAndType(
          '[data-test-id="exception-dates-container"] input',
          '08/04/18'
        )

        await wait(1050, 'for date range picker to load')
        await click('[data-test-id="exception-add-range"]')

        // add end of range exception date (July 10, 2018)
        await wait(1050, 'for date range picker to load')
        await waitForSelector(
          '[data-test-id="exception-date-range-0-2"] input'
        )

        await wait(1050, 'for date range picker to load')
        await clearAndType(
          '[data-test-id="exception-date-range-0-2"] input',
          '08/10/18'
        )

        // save
        await click('[data-test-id="save-entity-button"]')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for exception sidebar form to appear
        await waitForSelector(
          '[data-test-id="exception-name-input-container"]'
        )

        // verify data was saved and retrieved from server
        // TODO: verify the contents of the range?
        await expectSelectorToContainHtml(
          '[data-test-id="exception-name-input-container"]',
          'test exception range'
        )
      }, defaultTestTimeout, 'should create calendar')
    })

    // ---------------------------------------------------------------------------
    // Fares tests
    // ---------------------------------------------------------------------------
    // all of the following editor tests assume the use of the scratch feed and
    // successful completion of the routes test suite
    describe('fares', () => {
      makeEditorEntityTest('should create fare', async () => {
        // open fare sidebar
        await click('[data-test-id="editor-fare-nav-button"]')

        // wait for fare sidebar form to appear and click button to open form
        // to create fare
        await waitForAndClick('[data-test-id="create-first-fare-button"]')
        // wait for entity details sidebar to appear
        await waitForSelector('[data-test-id="fare-fare_id-input-container"]')

        // fill out form

        // fare_id
        await type(
          '[data-test-id="fare-fare_id-input-container"] input',
          'test-fare-id'
        )

        // price
        await type(
          '[data-test-id="fare-price-input-container"] input',
          '1'
        )

        // currency
        await page.select(
          '[data-test-id="fare-currency_type-input-container"] select',
          'USD'
        )

        // payment method
        await page.select(
          '[data-test-id="fare-payment_method-input-container"] select',
          '0'
        )

        // transfers
        await page.select(
          '[data-test-id="fare-transfers-input-container"] select',
          '2'
        )

        // transfer duration
        await type(
          '[data-test-id="fare-transfer_duration-input-container"] input',
          '12345'
        )

        // save
        await click('[data-test-id="save-entity-button"]')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for fare sidebar form to appear
        await waitForSelector(
          '[data-test-id="fare-fare_id-input-container"]'
        )

        // verify data was saved and retrieved from server
        await expectSelectorToContainHtml(
          '[data-test-id="fare-fare_id-input-container"]',
          'test-fare-id'
        )

        // add a fare rule
        await click('[data-test-id="fare-rules-tab-button"]')
        await waitForAndClick('[data-test-id="add-fare-rule-button"]')
        // select route type
        await waitForAndClick('input[name="fareRuleType-0-route_id"]')
        // select route
        await waitForSelector('[data-test-id="fare-rule-selections"] input')
        await reactSelectOption(
          '[data-test-id="fare-rule-selections"]',
          '1',
          1,
          true
        )

        // save
        await click('[data-test-id="save-entity-button"]')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for fare sidebar form to appear
        await waitForSelector(
          '[data-test-id="fare-fare_id-input-container"]'
        )

        // go to rules tab
        await click('[data-test-id="fare-rules-tab-button"]')
        await waitForSelector('[data-test-id="add-fare-rule-button"]')

        // verify data was saved and retrieved from server
        await expectSelectorToContainHtml(
          '[data-test-id="fare-rule-selections"]',
          'test route 1 updated'
        )
      }, defaultTestTimeout, 'should create route')

      makeEditorEntityTest('should update fare data', async () => {
        // browse back to fare attributes tab
        await click('[data-test-id="fare-attributes-tab-button"]')
        await waitForSelector('[data-test-id="fare-fare_id-input-container"]')

        // update fare id by appending to end
        await appendText(
          '[data-test-id="fare-fare_id-input-container"] input',
          '-updated'
        )

        // save
        await click('[data-test-id="save-entity-button"]')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for fare sidebar form to appear
        await waitForSelector(
          '[data-test-id="fare-fare_id-input-container"] input'
        )

        // verify data was saved and retrieved from server
        await expectSelectorToContainHtml(
          '[data-test-id="fare-fare_id-input-container"]',
          'test-fare-id-updated'
        )
      }, defaultTestTimeout, 'should create fare')

      makeEditorEntityTest('should delete fare data', async () => {
        // create a new fare that will get deleted
        await click('[data-test-id="clone-fare-button"]')

        // update service id by appending to end
        await appendText(
          '[data-test-id="fare-fare_id-input-container"] input',
          '-copied'
        )

        // save
        await click('[data-test-id="save-entity-button"]')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for fare sidebar form to appear
        await waitForSelector(
          '[data-test-id="fare-fare_id-input-container"] input'
        )

        // verify that fare to delete is listed
        await expectSelectorToContainHtml(
          '.entity-list',
          'test-fare-id-updated-copied'
        )

        // delete the fare
        await click('[data-test-id="delete-fare-button"]')
        await waitForAndClick('[data-test-id="modal-confirm-ok-button"]')
        await wait(2000, 'for delete to happen')

        // verify that fare to delete is no longer listed
        await expectSelectorToNotContainHtml(
          '.entity-list',
          'test-fare-id-updated-copied'
        )
      }, defaultTestTimeout, 'should create fare')
    })

    // ---------------------------------------------------------------------------
    // Pattern tests
    // ---------------------------------------------------------------------------
    // all of the following editor tests assume the use of the scratch feed and
    // successful completion of the routes test suite
    describe('patterns', () => {
      makeEditorEntityTest(
        'should create pattern',
        async () => {
          // open route sidebar
          await waitForAndClick('[data-test-id="editor-route-nav-button"]')
          await wait(2000, 'for page to catch up with itself')

          // wait for route sidebar form to appear and select first route
          await waitForAndClick('.entity-list-row')
          // wait for route details sidebar to appear and go to trip pattern tab
          await waitForAndClick('[data-test-id="trippattern-tab-button"]')
          // wait for tab to load and click button to create pattern
          await waitForAndClick('[data-test-id="new-pattern-button"]')
          // wait for new pattern to appear
          await waitForSelector('[data-test-id="pattern-title-New Pattern"]')

          // toggle the FeedInfoPanel in case it gets in the way of panel stuff
          await click('[data-test-id="FeedInfoPanel-visibility-toggle"]')
          await wait(2000, 'for page to catch up with itself')

          // click add stop by name
          await waitForAndClick('[data-test-id="add-stop-by-name-button"]')

          // wait for stop selector to show up
          await waitForSelector('.pattern-stop-card .Select-control')

          // add 1st stop
          await reactSelectOption('.pattern-stop-card', 'la', 1, true)
          await wait(500, 'for 1st stop to be selected')
          await click('[data-test-id="add-pattern-stop-button"]')
          await wait(2000, 'for 1st stop to save')

          // add 2nd stop
          await reactSelectOption('.pattern-stop-card', 'ru', 1, true)
          await wait(500, 'for 2nd stop to be selected')
          await click('[data-test-id="add-pattern-stop-button"]')
          await wait(2000, 'for auto-save to happen')

          // save
          await click('[data-test-id="save-entity-button"]')
          await wait(2000, 'for save to happen')

          // reload to make sure stuff was saved
          await page.reload({ waitUntil: 'networkidle0' })

          // wait for pattern sidebar form to appear
          await waitForSelector(
            '[data-test-id="pattern-title-New Pattern"]'
          )

          await wait(2000, 'for trip pattern list to load')
          // verify data was saved and retrieved from server
          await expectSelectorToContainHtml(
            '.trip-pattern-list',
            'Russell Av'
          )
        },
        defaultTestTimeout,
        ['should create route', 'should create stop', 'should update stop data']
      )

      makeEditorEntityTest('should update pattern data', async () => {
        // change pattern name by appending to end
        // begin editing
        await click('[data-test-id="editable-text-field-edit-button"]')

        // wait for text field to appear
        await waitForSelector('[data-test-id="editable-text-field-edit-container"]')
        await appendText(
          '[data-test-id="editable-text-field-edit-container"] input',
          ' updated'
        )

        // save
        await click('[data-test-id="editable-text-field-edit-container"] button')
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for pattern sidebar form to appear
        await waitForSelector(
          '[data-test-id="pattern-title-New Pattern updated"]'
        )

        // verify data was saved and retrieved from server
        await expectSelectorToContainHtml(
          '[data-test-id="pattern-title-New Pattern updated"]',
          'New Pattern updated'
        )
      }, defaultTestTimeout, 'should create pattern')

      makeEditorEntityTest('should delete pattern data', async () => {
        // create a new pattern that will get deleted
        await click('[data-test-id="duplicate-pattern-button"]')
        await wait(2000, 'for save to happen')

        // verify that pattern to delete is listed
        await expectSelectorToContainHtml(
          '.trip-pattern-list',
          'New Pattern updated copy'
        )

        // delete the pattern
        await click('[data-test-id="delete-pattern-button"]')
        await waitForSelector('[data-test-id="modal-confirm-ok-button"]')
        await wait(2000, 'for page to catch up?')
        await click('[data-test-id="modal-confirm-ok-button"]')
        await wait(2000, 'for delete to happen')

        // verify that pattern to delete is no longer listed
        await expectSelectorToNotContainHtml(
          '.trip-pattern-list',
          'New Pattern updated copy'
        )
      }, defaultTestTimeout, 'should update pattern data')
    })

    // ---------------------------------------------------------------------------
    // Timetable tests
    // ---------------------------------------------------------------------------
    // all of the following editor tests assume the use of the scratch feed and
    // successful completion of the patterns and calendars test suites
    describe('timetables', () => {
      makeEditorEntityTest(
        'should create trip',
        async () => {
          // expand pattern
          await click('[data-test-id="pattern-title-New Pattern updated"]')

          // wait for edit schedules button to appear and click edit schedules
          await waitForAndClick('[data-test-id="edit-schedules-button"]')
          // wait for calendar selector to appear
          await waitForSelector('[data-test-id="calendar-select-container"]')

          // select first calendar
          await reactSelectOption(
            '[data-test-id="calendar-select-container"]',
            'te',
            1
          )

          // wait for new trip button to appear
          await waitForSelector('[data-test-id="add-new-trip-button"]')
          await wait(2000, 'for page to catch up with itself?')

          // click button to create trip
          await click('[data-test-id="add-new-trip-button"]')

          // wait for new trip to appear
          await waitForSelector('[data-test-id="timetable-area"]')

          // click first cell to begin editing
          await click('.editable-cell')

          // enter block id
          await page.keyboard.type('test-block-id')
          await page.keyboard.press('Tab')
          await page.keyboard.press('Enter')

          // trip id
          await page.keyboard.type('test-trip-id')
          await page.keyboard.press('Tab')
          await page.keyboard.press('Enter')

          // trip headsign
          await page.keyboard.type('test-headsign')
          await page.keyboard.press('Tab')
          await page.keyboard.press('Enter')

          // trip short name
          await page.keyboard.type('test-trip-short-name')
          await page.keyboard.press('Tab')
          await page.keyboard.press('Enter')

          // Laurel Dr arrival
          await page.keyboard.type('12:34')
          await page.keyboard.press('Tab')
          await page.keyboard.press('Enter')

          // Laurel Dr departure
          await page.keyboard.type('12:35')
          await page.keyboard.press('Tab')
          await page.keyboard.press('Enter')

          // Russell Av arrival
          await page.keyboard.type('12:44')
          await page.keyboard.press('Tab')
          await page.keyboard.press('Enter')

          // Russell Av departure
          await page.keyboard.type('12:45')
          await page.keyboard.press('Enter')

          // save
          await click('[data-test-id="save-trip-button"]')
          await wait(2000, 'for save to happen')

          // reload to make sure stuff was saved
          await page.reload({ waitUntil: 'networkidle0' })

          // wait for trip sidebar form to appear
          await waitForSelector(
            '[data-test-id="timetable-area"]'
          )

          // verify data was saved and retrieved from server
          await expectSelectorToContainHtml(
            '[data-test-id="timetable-area"]',
            'test-trip-id'
          )
        },
        defaultTestTimeout,
        ['should create calendar', 'should delete pattern data']
      )

      makeEditorEntityTest('should update trip data', async () => {
        // click first editable cell to begin editing
        await click('.editable-cell')

        // advance to right to trip id
        await page.keyboard.press('Tab')

        // change trip id by appending to end
        // begin editing
        await page.keyboard.press('Enter')
        await page.keyboard.press('End')
        await page.keyboard.type('-updated')
        await page.keyboard.press('Enter')

        // save
        await click('[data-test-id="save-trip-button"]')

        // wait for save to happen
        await wait(2000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for timetable  to appear
        await waitForSelector(
          '[data-test-id="timetable-area"]'
        )

        // verify data was saved and retrieved from server
        await expectSelectorToContainHtml(
          '[data-test-id="timetable-area"]',
          'test-trip-id-updated'
        )
      }, defaultTestTimeout, 'should create trip')

      makeEditorEntityTest('should delete trip data', async () => {
        // create a new trip that will get deleted
        await click('[data-test-id="duplicate-trip-button"]')
        await wait(2000, 'for new trip to appear')

        // click first editable cell to begin editing
        await click('.editable-cell')

        // advance down and to right to trip id
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('ArrowRight')

        // change trip id by appending to end
        // begin editing
        await page.keyboard.press('Enter')
        await page.keyboard.type('test-trip-to-delete')
        await page.keyboard.press('Enter')
        await wait(4000, 'for save to happen')

        // save
        await click('[data-test-id="save-trip-button"]')
        await wait(6000, 'for save to happen')

        // reload to make sure stuff was saved
        await page.reload({ waitUntil: 'networkidle0' })

        // wait for timetable  to appear
        await waitForSelector(
          '[data-test-id="timetable-area"]'
        )

        // verify that trip to delete is listed
        await expectSelectorToContainHtml(
          '[data-test-id="timetable-area"]',
          'test-trip-to-delete'
        )

        // select the row
        await click('.timetable-left-grid .text-center:nth-child(2)')

        // delete the trip
        await click('[data-test-id="delete-trip-button"]')

        // confirm delete
        await waitForAndClick('[data-test-id="modal-confirm-ok-button"]')
        await wait(3000, 'for delete to happen')
        await page.reload({ waitUntil: 'networkidle0' })

        // verify that trip to delete is no longer listed
        await expectSelectorToNotContainHtml(
          '[data-test-id="timetable-area"]',
          'test-trip-to-delete'
        )
      }, defaultTestTimeout, 'should create trip')
    })

    // ---------------------------------------------------------------------------
    // Snapshot tests
    // ---------------------------------------------------------------------------
    // all of the following tests depend on the editor tests completing successfully
    describe('snapshot', () => {
      makeEditorEntityTest('should create snapshot', async () => {
        // open create snapshot dialog
        await click('[data-test-id="take-snapshot-button"]')

        // wait for dialog to appear
        await waitForSelector('[data-test-id="snapshot-dialog-name"]')

        // enter name
        await type('[data-test-id="snapshot-dialog-name"]', 'test-snapshot')

        // confrim snapshot creation
        await click('[data-test-id="confirm-snapshot-create-button"]')

        // wait for jobs to complete
        await waitAndClearCompletedJobs()
      }, defaultTestTimeout, 'should create trip')
    })
  })

  // ---------------------------------------------------------------------------
  // Feed Source Snapshot tests
  // ---------------------------------------------------------------------------
  describe('feed source snapshot', () => {
    makeEditorEntityTest('should make snapshot active version', async () => {
      // go back to feed
      // not sure why, but clicking on the nav home button doesn't work
      await goto(`https://datatools-ui-proxy/feed/${scratchFeedSourceId}`)

      // wait for page to be visible and go to snapshots tab
      await waitForAndClick('#feed-source-viewer-tabs-tab-snapshots')
      await wait(2000, 'for page to load?')

      // wait for snapshots tab to load and publish snapshot
      await waitForAndClick('[data-test-id="publish-snapshot-button"]')
      // wait for version to get created
      await waitAndClearCompletedJobs()

      // go to main feed tab
      await click('#feed-source-viewer-tabs-tab-')

      // wait for main tab to show up with version validity info
      await waitForSelector('[data-test-id="active-feed-version-validity-start"]')

      // verify that snapshot was made active version
      await expectFeedVersionValidityDates('May 29, 2018', 'May 29, 2028')
    }, defaultTestTimeout, 'should create snapshot')

    // TODO: download and validate gtfs??
  })

  // ---------------------------------------------------------------------------
  // Deployment tests
  // ---------------------------------------------------------------------------
  // the following tests depend on the snapshot test suite to have passed
  // successfully and also assumes a local instance of OTP is running
  describe('deployment', () => {
    makeTestPostFeedSource('should create deployment', async () => {
      // trigger creation of feed source-based deployment.
      await waitForAndClick('[data-test-id="deploy-feed-version-button"]')
      // wait for deploy dropdown button to appear and open dropdown
      await waitForSelector('#deploy-server-dropdown')
      await wait(2000, 'for dropdown to fully render')
      await click('#deploy-server-dropdown')
      // wait for dropdown to open and click to deploy to server
      await waitForAndClick('[data-test-id="deploy-server-0-button"]')
      // wait for deployment dialog to appear
      await waitForSelector('[data-test-id="confirm-deploy-server-button"]')
      await wait(1500, 'for deployment panel to properly load')

      // get the router name
      const innerHTML = await getInnerHTMLFromSelector(
        '[data-test-id="deployment-router-id"]'
      )
      // get rid of router id text and react tags
      // (remove any square brackets too)
      routerId = innerHTML
        .replace('Router ID: ', '')
        .replace(/[[\]]/g, '')

      // confirm deployment
      await click('[data-test-id="confirm-deploy-server-button"]')

      // wait for jobs to complete
      await waitAndClearCompletedJobs()
    }, defaultTestTimeout + 60000) // Add sixty seconds for deployment job

    makeEditorEntityTest('should be able to do a trip plan on otp', async () => {
      await wait(15000, 'for OTP to pick up the newly-built graph')
      // hit the otp endpoint
      const url = `${OTP_ROOT}${routerId}/plan?fromPlace=37.04532992924222%2C-122.07542181015015&toPlace=37.04899494106061%2C-122.07432746887208&time=00%3A32&date=2018-07-24&mode=TRANSIT%2CWALK&maxWalkDistance=804.672&arriveBy=false&wheelchair=false&locale=en`
      const response = await fetch(
        url,
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          }
        }
      )

      // expect response to be successful
      expect(response.status).toBe(200)

      // expect response to include text of a created stop
      const text = await response.text()
      expect(text).toContain(dummyStop1.name)
    }, defaultTestTimeout, 'should create snapshot')
  })
})
