// Travis was getting some errors from budo because it was watching lots of
// files.  This server is just to serve up the built files and proxy some
// requests to datatools-server.  It also helps because the build script can
// be ran and tracked independently of this server.

const express = require('express')
const proxy = require('express-http-proxy')
const app = express()

app.use('/dist', express.static('dist'))
app.use(
  '/api',
  proxy(
    'http://localhost:4000/api/',
    {
      proxyReqPathResolver: req => {
        // need to rewrite the url to include the api part
        return `/api${req.url}`
      }
    }
  )
)
app.get('/*', (req, res) => {
  res.set('Content-Type', 'text/html')
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">
        <link rel="shortcut icon" type="image/x-icon" href="dist/favicon.ico" />
        <link href="/dist/index.css" rel="stylesheet">

        <title>Conveyal Datatools</title>
      </head>
      <body>
        <div id="root"></div>
        <script src="/dist/index.js"></script>
      </body>
    </html>
  `)
})

const port = 9966
app.listen(port, () => {
  console.log('server listening on port ' + port)
})
