// @flow

import objectPath from 'object-path'

export function getConfigProperty (propertyString: string): any {
  return objectPath.get(window.DT_CONFIG, propertyString)
}

export function getComponentMessages (componentName: string): any {
  return (
    objectPath.get(window.DT_CONFIG, ['messages', 'active', componentName]) ||
    {}
  )
}

export function getMessage (messages: any, path: string): string {
  const message = objectPath.get(messages, path)
  return typeof message === 'string' ? message : `{${path}}`
}

export function isModuleEnabled (moduleName: string): boolean {
  return !!(
    objectPath.get(window.DT_CONFIG, ['modules', moduleName, 'enabled'])
  )
}

export function isExtensionEnabled (extensionName: string): boolean {
  return !!(
    objectPath.get(window.DT_CONFIG, ['extensions', extensionName, 'enabled'])
  )
}

export function initializeConfig () {
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
    lang.find(l => l.id === languageId) || lang.find(l => l.id === 'en-US')

  // console.log('config', config)
  window.DT_CONFIG = config
}
