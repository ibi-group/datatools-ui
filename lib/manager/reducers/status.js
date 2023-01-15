// @flow

import update from 'react-addons-update'

import type {Action} from '../../types/actions'
import type {StatusState} from '../../types/reducers'

export const defaultState = {
  message: null,
  modal: null,
  appInfo: null,
  applicationJobs: [],
  applicationRequests: [],
  jobMonitor: {
    timer: null,
    visible: false,
    jobs: [],
    retired: []
  }
}

/* eslint-disable complexity */
const config = (state: StatusState = defaultState, action: Action): StatusState => {
  switch (action.type) {
    // Status Messages
    case 'REQUESTING_PROJECTS':
      return {...state, message: 'Cargando proyectos...'}
    case 'REQUESTING_PROJECT':
      return {...state, message: 'Cargando proyecto...'}
    case 'SAVING_PROJECT':
      return {...state, message: 'Guardando proyecto...'}
    case 'REQUESTING_FEEDSOURCES':
      return {...state, message: 'Cargando feeds...'}
    case 'REQUESTING_FEEDSOURCE':
      return {...state, message: 'Cargando feed...'}
    case 'SAVING_FEEDSOURCE':
      return {...state, message: 'Guardando feed...'}
    case 'DELETING_FEEDSOURCE':
      return {...state, message: 'Eliminando feed...'}
    case 'RUNNING_FETCH_FEED':
      return {...state, message: 'Actualizando feed...'}
    case 'REQUESTING_FEEDVERSIONS':
      return {...state, message: 'Cargando versiones del feed...'}
    case 'DELETING_FEEDVERSION':
      return {...state, message: 'Eliminando versión del feed...'}
    case 'UPLOADING_FEED':
      return {...state, message: 'Cargando feed...'}
    case 'REQUESTING_SYNC':
      return {...state, message: 'Sincronizando feeds...'}
    case 'RUNNING_FETCH_FEED_FOR_PROJECT':
      return {...state, message: 'Actualizando feeds para el proyecto...'}
    case 'REQUESTING_PUBLIC_FEEDS':
      return {...state, message: 'Cargando feeds públicos...'}
    case 'REQUESTING_VALIDATION_ISSUE_COUNT':
      return {...state, message: 'Cargando resultado de la validación...'}
    case 'REQUESTING_NOTES':
      return {...state, message: 'Cargando comentarios...'}
    case 'REQUESTING_GTFSPLUS_CONTENT':
      return {...state, message: 'Cargando datos GTFS+...'}
    case 'UPLOADING_GTFSPLUS_FEED':
      return {...state, message: 'Guardar datos de GTFS+...'}
    case 'PUBLISHING_GTFSPLUS_FEED':
      return {...state, message: 'Publicando feeds GTFS+...'}
    case 'VALIDATING_GTFSPLUS_FEED':
      return {...state, message: 'Actualizando la validación GTFS+...'}
    case 'REQUESTING_FEEDVERSION_ISOCHRONES':
      return {...state, message: 'Calculando el acceso...'}
    case 'REQUESTING_DEPLOYMENTS':
      return {...state, message: 'Cargando despliegues...'}
    case 'REQUESTING_DEPLOYMENT':
      return {...state, message: 'Cargando despliegue...'}
    case 'REQUESTING_USERS':
      return {...state, message: 'Cargando usuarios...'}
    case 'UPDATING_USER_DATA':
      return {...state, message: 'Actualizando usuario...'}
    case 'SAVING_DEPLOYMENT':
      return {...state, message: 'Guardando despliegue...'}
    case 'REQUESTING_GTFSEDITOR_SNAPSHOTS':
      return {...state, message: 'Cargando snapshots...'}
    case 'SAVING_AGENCY':
      return {...state, message: 'Guardando agencia...'}
    case 'SAVING_STOP':
      return {...state, message: 'Guardando parada...'}
    case 'SAVING_ROUTE':
      return {...state, message: 'Guardando ruta...'}
    case 'REQUESTING_AGENCIES':
      return {...state, message: 'Cargando agencias...'}
    case 'REQUESTING_STOPS':
      return {...state, message: 'Cargando paradas...'}
    case 'REQUESTING_ROUTES':
      return {...state, message: 'Cargando rutas...'}
    case 'REQUESTING_TRIPS_FOR_CALENDAR':
      return {...state, message: 'Cargando viajes...'}
    case 'CREATING_SNAPSHOT':
      return {...state, message: 'Creando snapshot...'}
    case 'DELETING_SNAPSHOT':
      return {...state, message: 'Eliminando snapshot...'}
    case 'DELETING_AGENCY':
      return {...state, message: 'Eliminando agencia...'}
    case 'DELETING_TRIPS_FOR_CALENDAR':
      return {...state, message: 'Eliminidando viajes...'}
    case 'RESTORING_SNAPSHOT':
      return {...state, message: 'Restaurando snapshot...'}
    case 'RENAMING_FEEDVERSION':
      return {...state, message: 'Renombrando versión del feed...'}
    case 'LOADING_FEEDVERSION_FOR_EDITING':
      return {...state, message: 'Cargando versión en el editor...'}
    case 'REQUESTING_ORGANIZATIONS':
      return {...state, message: 'Cargando organizaciones...'}
    case 'UPDATING_SERVER':
      return {...state, message: 'Guardando servidor...'}
    case 'FETCHING_ALL_JOBS':
      return {...state, message: 'Descargando trabajos...'}

    // Alerts status message
    case 'REQUEST_RTD_ALERTS':
      return {...state, message: 'Cargando alertas...'}

    // STATUS MODAL UPDATES (TYPICALLY SET ON JOB COMPLETION)
    case 'SET_ERROR_MESSAGE':
      const {action: actionType, message: body, detail, title} = action.payload
      return update(state, {
        modal: {$set: {
          title: title || '¡Advertencia!',
          body,
          action: actionType,
          detail
        }},
        message: {$set: null}
      })
    case 'CLEAR_STATUS_MODAL':
      return update(state, {modal: {$set: null}})
    case 'CREATED_SNAPSHOT':
      return update(state, {
        modal: {$set: {
          title: 'Snapshot creado',
          body: `Nuevo snapshot "${action.payload}" creado. Será accesible desde la pestaña "Editor de Snapshots" en la página principal del Feed Source.`
        }},
        message: {$set: null}
      })
    case 'SET_STATUS_MODAL':
      return update(state, {
        modal: {$set: action.payload},
        message: {$set: null}
      })

    // Job Monitor
    case 'SET_JOBMONITOR_TIMER':
      return update(state, {jobMonitor: {$merge: {timer: action.payload}}})
    case 'SET_JOBMONITOR_VISIBLE':
      return update(state, {jobMonitor: {$merge: {visible: action.payload}}})
    case 'HANDLING_FINISHED_JOB':
      return update(state, {jobMonitor: {retired: {$push: [action.payload]}}})
    case 'REMOVE_RETIRED_JOB':
      const {jobId} = action.payload
      const jobIndex = state.jobMonitor.retired
        .findIndex(job => job.jobId === jobId)
      if (jobIndex === -1) {
        // If somehow the job does not exist in the state, ignore the action.
        console.warn(`El trabajo con ID ${jobId} no existe en la lista de trabajos retirados.`)
        return state
      }
      return update(state, {jobMonitor: {retired: {$splice: [[jobIndex, 1]]}}})
    case 'RECEIVE_JOBS':
      const updatedJobs = action.payload || []
      return update(state, {jobMonitor: {jobs: {$set: updatedJobs}}})
    case 'RECEIVE_ALL_REQUESTS':
      return update(state, {applicationRequests: {$set: action.payload}, message: {$set: null}})
    case 'RECEIVE_ALL_JOBS':
      return update(state, {applicationJobs: {$set: action.payload}, message: {$set: null}})
    // ***** The following actions simply blank out the status message ******
    case 'RECEIVE_PROJECTS':
    case 'RECEIVE_PROJECT':
    case 'RECEIVE_SYNC':
    case 'RECEIVE_FEEDSOURCES':
    case 'RECEIVE_FEEDSOURCE':
    case 'RECEIVE_FEEDVERSIONS':
    case 'RECEIVE_FEEDVERSION':
    case 'RECEIVED_FETCH_FEED':
    case 'RECEIVE_FETCH_FEED_FOR_PROJECT':
    case 'RECEIVE_PUBLIC_FEEDS':
    case 'RECEIVE_VALIDATION_ISSUE_COUNT':
    case 'RECEIVE_NOTES_FOR_FEEDVERSION':
    case 'RECEIVE_NOTES_FOR_FEEDSOURCE':
    case 'RECEIVE_GTFSPLUS_CONTENT':
    case 'UPLOADED_GTFSPLUS_FEED':
    case 'RECEIVE_GTFSPLUS_VALIDATION':
    case 'RECEIVE_FEEDVERSION_ISOCHRONES':
    case 'RECEIVE_DEPLOYMENTS':
    case 'RECEIVE_DEPLOYMENT':
    case 'RECEIVE_USERS':
    case 'USER_PROFILE_UPDATED':
    case 'RECEIVE_AGENCY':
    case 'RECEIVE_AGENCIES':
    case 'RECEIVE_STOP':
    case 'RECEIVE_STOPS':
    case 'RECEIVE_ROUTE':
    case 'RECEIVE_ROUTES':
    case 'DELETED_TRIPS_FOR_CALENDAR':
    case 'RECEIVE_TRIPS_FOR_CALENDAR':
    case 'RECEIVE_GTFSEDITOR_SNAPSHOTS':
    case 'RECEIVED_RTD_SIGNS':
    case 'RECEIVED_RTD_ALERTS':
    case 'RECEIVE_ORGANIZATIONS':
    case 'RECEIVE_SERVER':
    case 'RECEIVE_SERVERS':
      return update(state, {message: {$set: null}})
    case 'SET_APP_INFO':
      // If config was found in the app info response, overwrite whatever was
      // found in the UI config with the server values. This will ensure that
      // fields/properties shared between the server and UI will stay in sync
      // and that UI-only fields like `messages` will stay intact.
      // Some application properties might be overwritten unnecessarily, but
      // these should be added to the server config moving forward.
      if (action.payload.config) {
        window.DT_CONFIG = {
          ...window.DT_CONFIG,
          ...action.payload.config
        }
      }
      return update(state, {appInfo: {$set: action.payload}})
    default:
      return state
  }
}

export default config
