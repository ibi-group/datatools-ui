// @flow

// Note: The GTFS+ file should be required regardless of whether the module is
// enabled. Otherwise, it will not be loaded properly because the UI depends on
// the server config from the appinfo endpoint.

// $FlowFixMe Not sure why flow is not able to resolve this file.
import gtfsplus from '../../../gtfsplus.yml'
// $FlowFixMe Not sure why flow is not able to resolve this file.
import gtfs from '../../../gtfs.yml'

// Note: We are not using Vite's glob import feature (import.meta.glob(...)).
// Flow treats that as a syntax error that cannot be waived.

// $FlowFixMe Not sure why flow is not able to resolve this file.
import english from '../../../i18n/english.yml'
// $FlowFixMe Not sure why flow is not able to resolve this file.
import polish from '../../../i18n/polish.yml'
// $FlowFixMe Not sure why flow is not able to resolve this file.
import german from '../../../i18n/german.yml'
// Import additional language files here, e.g.:
// import spanish from '../../../i18n/espanol.yml'

// Only used in the test environment for now.
const extraSettings = {}

export default {
  english,
  extraSettings,
  german,
  gtfs,
  gtfsplus,
  polish
}
