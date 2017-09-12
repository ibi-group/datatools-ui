import objectPath from 'object-path'

export const getConfigProperty = (propertyString) => {
  return objectPath.get(window.DT_CONFIG, propertyString)
}

export const getComponentMessages = (componentName) => {
  return objectPath.get(window.DT_CONFIG, ['messages', 'active', componentName]) || {}
}

export const getMessage = (messages, path) => {
  const message = objectPath.get(messages, path)
  return typeof message === 'string' ? message : `{${path}}`
}

export const isModuleEnabled = (moduleName) => {
  return Boolean(objectPath.get(window.DT_CONFIG, ['modules', moduleName, 'enabled']))
}

export const isExtensionEnabled = (extensionName) => {
  return Boolean(objectPath.get(window.DT_CONFIG, ['extensions', extensionName, 'enabled']))
}

export function initializeConfig () {
  const config = JSON.parse(process.env.SETTINGS)
  if (config.modules.gtfsplus && config.modules.gtfsplus.enabled) {
    config.modules.gtfsplus.spec = require('../../../gtfsplus.yml')
  }
  config.modules.editor.spec = require('../../../gtfs.yml')

  const lang = [
    require('../../../i18n/english.yml'),
    require('../../../i18n/espanol.yml'),
    require('../../../i18n/francais.yml')
  ]

  // is an array containing all the matching modules
  config.messages = {}
  config.messages.all = lang
  const languageId = window.localStorage.getItem('lang')
  ? window.localStorage.getItem('lang')
  : navigator.language || navigator.userLanguage

  config.messages.active = lang.find(l => l.id === languageId) || lang.find(l => l.id === 'en-US')

  // console.log('config', config)
  window.DT_CONFIG = config
}
