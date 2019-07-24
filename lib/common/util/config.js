// @flow

import objectPath from 'object-path'

import type {GtfsPlusTable} from '../../types'

type ModuleType = 'enterprise' | 'editor' | 'alerts' | 'sign_config' | 'user_admin' | 'gtfsplus' | 'deployment' | 'validator'
type ExtensionType = 'mtc' | 'transitland' | 'transitfeeds' | 'nysdot'

export function getConfigProperty (propertyString: string): ?any {
  return objectPath.get(window.DT_CONFIG, propertyString)
}

export function getGtfsSpec (): Array<any> {
  return window.DT_CONFIG.modules.editor.spec
}

export function getGtfsPlusSpec (): Array<GtfsPlusTable> {
  return window.DT_CONFIG.modules.gtfsplus.spec
}

/**
 * Create a function to lookup and return a message within a particular component.
 * This function must be called after the config has been initialized.
 */
export function getComponentMessages (componentName: string): string => string {
  const componentMessages = (
    objectPath.get(window.DT_CONFIG, ['messages', 'active', 'components', componentName]) ||
    {}
  )
  return (path: string) => {
    const message = objectPath.get(componentMessages, path)
    if (typeof message === 'string') {
      return message
    } else {
      console.warn(`Couldn't find message entry for ${componentName}.${path}`)
      return `{${path}}`
    }
  }
}

export function isModuleEnabled (moduleName: ModuleType): boolean {
  return !!(
    objectPath.get(window.DT_CONFIG, ['modules', moduleName, 'enabled'])
  )
}

export function isExtensionEnabled (extensionName: ExtensionType): boolean {
  return !!(
    objectPath.get(window.DT_CONFIG, ['extensions', extensionName, 'enabled'])
  )
}

function initializeConfig () {
  if (!process.env.SETTINGS) {
    throw new Error('SETTINGS environment variable not set')
  }
  const config = JSON.parse(process.env.SETTINGS)
  if (config.modules.gtfsplus && config.modules.gtfsplus.enabled) {
    // $FlowFixMe - assume file exists and make flow happy
    config.modules.gtfsplus.spec = require('../../../gtfsplus.yml')
  }
  // $FlowFixMe - assume file exists and make flow happy
  config.modules.editor.spec = require('../../../gtfs.yml')

  const lang = [
    // $FlowFixMe - assume file exists and make flow happy
    require('../../../i18n/english.yml'),
    // $FlowFixMe - assume file exists and make flow happy
    require('../../../i18n/espanol.yml'),
    // $FlowFixMe - assume file exists and make flow happy
    require('../../../i18n/francais.yml')
  ]

  // is an array containing all the matching modules
  config.messages = {}
  config.messages.all = lang
  const languageId = window.localStorage.getItem('lang')
    ? window.localStorage.getItem('lang')
    : navigator.language

  config.messages.active =
    lang.find(l => l._id === languageId) || lang.find(l => l._id === 'en-US')

  // console.log('config', config)
  window.DT_CONFIG = config
}

if (process.env.NODE_ENV !== 'test') {
  // skip this, cause there's an error in jest
  initializeConfig()
}
