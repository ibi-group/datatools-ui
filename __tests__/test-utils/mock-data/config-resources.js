// @flow

import objectPath from 'object-path'

// This file is used for jest.
// The paths below are relative to file lib/common/util/config-resources.js
// that is replaced with this file for jest, where support for `import '...yml'` syntax does not exist.

// $FlowFixMe - assume file exists and make flow happy
const english = require('../../../i18n/english.yml')
// $FlowFixMe - assume file exists and make flow happy
const polish = require('../../../i18n/polish.yml')
// $FlowFixMe - assume file exists and make flow happy
const german = require('../../../i18n/german.yml')
// Add additional language files here.
// E.g., require('../../../i18n/espanol.yml')

// Note: The GTFS+ file should be required regardless of whether the module is
// enabled. Otherwise, it will not be loaded properly because the UI depends on
// the server config from the appinfo endpoint.
// $FlowFixMe - assume file exists and make flow happy
const gtfsplus = require('../../../gtfsplus.yml')
// $FlowFixMe - assume file exists and make flow happy
const gtfs = require('../../../gtfs.yml')

const languages = [
  english,
  polish,
  german
]

// For some weird reason that probably has to do with how yaml files are
// required in the test environment, the message files are stored with an
// object key that contains the full path. Therefore, do a little hack to
// fix this.
languages.forEach(lang => {
  Object.keys(lang).forEach(key => {
    if (key.indexOf('.') > -1) {
      objectPath.set(lang, key, lang[key])
    }
  })
})

if (!process.env.SETTINGS) {
  throw new Error('SETTINGS environment variable not set')
}

const extraSettings = JSON.parse(process.env.SETTINGS)

export default {
  english,
  extraSettings,
  german,
  gtfs,
  gtfsplus,
  polish
}
