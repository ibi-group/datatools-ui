// @flow

import objectPath from 'object-path'

import type {
  DataToolsConfig,
  ExtensionType,
  GtfsSpecTable,
  MessageFile,
  ModuleType
} from '../../types'
import { DEFAULT_TITLE } from '../constants'

import resources from './config-resources'
const { english, german, gtfs, gtfsplus, polish } = resources

const DEFAULT_CONFIG = {
  extensions: {},
  modules: {
    editor: {}
  },
  specifications: {
    gtfs: null,
    gtfsplus: null
  }
}

export function getConfigProperty (propertyString: string): ?any {
  const CONFIG: DataToolsConfig = window.DT_CONFIG
  return objectPath.get(CONFIG, propertyString)
}

export function getGtfsSpec (): Array<GtfsSpecTable> {
  const CONFIG: DataToolsConfig = window.DT_CONFIG
  const GTFS_SPEC = CONFIG.specifications.gtfs
  if (!GTFS_SPEC) throw new Error('GTFS yml configuration file is not defined!')
  return GTFS_SPEC
}

export function getGtfsPlusSpec (): Array<GtfsSpecTable> {
  const CONFIG: DataToolsConfig = window.DT_CONFIG
  const GTFS_PLUS_SPEC = CONFIG.specifications.gtfsplus
  if (!GTFS_PLUS_SPEC) throw new Error('GTFS+ yml configuration file is not defined!')
  return GTFS_PLUS_SPEC.sort((table1, table2) => table1.name.localeCompare(table2.name))
}

/**
 * Create a function to lookup and return a message within a particular component.
 * This function must be called after the config has been initialized.
 */
export function getComponentMessages (
  componentName: string
): (string, ?boolean) => string {
  const CONFIG: DataToolsConfig = window.DT_CONFIG
  const componentMessages = (
    objectPath.get(CONFIG, ['messages', 'active', 'components', componentName]) ||
    {}
  )
  return (path: string, logWarning: ?boolean = true) => {
    const message = objectPath.get(componentMessages, path)
    if (typeof message === 'string') {
      return message
    } else {
      if (logWarning) console.warn(`Couldn't find message entry for ${componentName}.${path}`)
      return message || `{${path}}`
    }
  }
}

export function isModuleEnabled (moduleName: ModuleType): boolean {
  const CONFIG: DataToolsConfig = window.DT_CONFIG
  return !!(
    objectPath.get(CONFIG, ['modules', moduleName, 'enabled'])
  )
}

export function isExtensionEnabled (extensionName: ExtensionType): boolean {
  const CONFIG: DataToolsConfig = window.DT_CONFIG
  return !!(
    objectPath.get(CONFIG, ['extensions', extensionName, 'enabled'])
  )
}

export function getAppName () {
  // A localized app title might exist in the ManagerPage i18n messages.
  // Use that as first fallback, then DEFAULT_TITLE if that one is not provided.
  const managerPageMessages = getComponentMessages('ManagerPage')
  const localizedDataToolsName = managerPageMessages('datatools')
  return getConfigProperty('application.title') || localizedDataToolsName || DEFAULT_TITLE
}

function initializeConfig () {
  // $FlowFixMe The application field will be populated later, after it is fetched from server.
  const config: DataToolsConfig = {
    ...DEFAULT_CONFIG
  }

  config.specifications.gtfsplus = gtfsplus
  config.specifications.gtfs = gtfs

  const languages: Array<MessageFile> = [
    english,
    polish,
    german
  ]

  // For some weird reason that probably has to do with how yaml files are
  // required in the test environment, the message files are stored with an
  // object key that contains the full path. Therefore, do a little hack to
  // fix this.
  // TODO: change this in mastarm?
  if (process.env.NODE_ENV === 'development' || jest) {
    languages.forEach(lang => {
      Object.keys(lang).forEach(key => {
        if (key.indexOf('.') > -1) {
          objectPath.set(lang, key, lang[key])
        }
      })
    })
  }
  const languageId = window.localStorage.getItem('lang')
    ? window.localStorage.getItem('lang')
    : navigator.language
  const active = languages.find(
    l => l._id === languageId || languageId.startsWith(l._id)
  ) || languages.find(l => l._id === 'en-US')
  if (!active) throw new Error('Language file is misconfigured!')
  // is an array containing all the matching modules
  config.messages = {
    active,
    all: languages
  }
  // Set config to global.
  // TODO: remove window.DT_CONFIG in favor of keeping config entirely in store.
  window.DT_CONFIG = config
}

initializeConfig()
