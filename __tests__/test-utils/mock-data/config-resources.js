// @flow

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

export default {
  english,
  german,
  gtfs,
  gtfsplus,
  polish
}
