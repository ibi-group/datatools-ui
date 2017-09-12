// This script seeds datatools-server with test project and
// NOTE: make sure you have a recent version of node (e.g., v8) for async/await
// USAGE: app_url='http://localhost:4000' num_feedsources=2 feed_path='/tmp/gtfs.zip' node seedData.js run

var fetch = require('isomorphic-fetch')
var fs = require('fs')
var request = require('request')

const API_ENDPOINT = `${process.env.app_url}/api/manager/secure`
const FEED_PATH = process.env.feed_path
const method = 'post'
const headers = {'Content-Type': 'application/json'}
const NUM_FEEDSOURCES = +process.env.num_feedsources || 5

async function createProject (data) {
  return await fetch(`${API_ENDPOINT}/project`, {
    method,
    headers,
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(p => p)
  .catch(err => console.log(err))
}

async function createFeedSource (data) {
  return await fetch(`${API_ENDPOINT}/feedsource`, {
    method,
    headers,
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(fs => fs)
  .catch(err => console.log(err))
}

async function uploadFeedVersion (feedSource, filePath) {
  const file = fs.createReadStream(filePath)
  const formData = {file}
  const url = `${API_ENDPOINT}/feedversion?feedSourceId=${feedSource.id}`
  await request.post({url, formData}, (err, resp, body) => {
    if (err) {
      console.log('Upload error!', err)
      // Exit script if upload fails
      process.exit(1)
    } else {
      console.log(`Upload success: ` + body)
    }
    // make sure to close read stream
    file.destroy()
  })
}

exports.run = async function () {
  console.log(`Using application URL: ${process.env.app_url}`)
  const proj = {name: 'tester 1'}
  const p = await createProject(proj)
  const {id: projectId} = p
  console.log(`Created project: ${projectId}`)
  console.log(`Creating ${NUM_FEEDSOURCES} feed sources`)
  for (var i = 0; i < NUM_FEEDSOURCES; i++) {
    const name = `test-${i}`
    const feedSource = await createFeedSource({name, projectId})
    console.log(`Created feedSource: ${feedSource.name} (${feedSource.id})`)
    console.log(`Uploading file from ${FEED_PATH}`)
    await uploadFeedVersion(feedSource, FEED_PATH)
  }
}

require('make-runnable')
