// A simple server used to collect and aggregate code coverage from the e2e
// tests.  It also allows a coverage report to be downloaded.
// copied from https://github.com/ORESoftware/express-istanbul

const cov = require('istanbul-middleware')
const express = require('express')
const app = express()

app.use('/coverage', cov.createHandler())

app.listen(9999)
