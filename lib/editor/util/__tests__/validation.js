// @flow

import {defaultState as defaultEditorDataState} from '../../reducers/data'
import {validate} from '../validation'

const defaultTablesData = defaultEditorDataState.tables
const routeSortOrderField = {
  columnWidth: 12,
  inputType: 'POSITIVE_INT',
  name: 'route_sort_order',
  required: false
}
const routeTypeField = {
  columnWidth: 12,
  inputType: 'GTFS_ROUTE_TYPE',
  name: 'route_type',
  options: [
    { text: '0', value: '0' },
    { text: '3', value: '3' },
    { text: '101', value: '101' }
  ],
  required: true
}
const shapedDistTraveledField = {
  columnWidth: 6,
  inputType: 'POSITIVE_NUM',
  name: 'shape_dist_traveled',
  required: false
}
const stopSequenceField = {
  columnWidth: 6,
  inputType: 'POSITIVE_INT',
  name: 'stop_sequence',
  required: true
}

describe('editor > util > gtfs >', () => {
  describe('validate', () => {
    describe('POSITIVE_INT', () => {
      it('undefined should be invalid for required field', () => {
        expect(
          validate(stopSequenceField, undefined, null, null, defaultTablesData)
        ).toEqual({
          field: 'stop_sequence',
          invalid: true,
          reason: 'Un champ requis ne doit être vide.'
        })
      })

      it('empty string should be invalid for required field', () => {
        expect(
          validate(stopSequenceField, '', null, null, defaultTablesData)
        ).toEqual({
          field: 'stop_sequence',
          invalid: true,
          reason: 'Un champ requis ne doit être vide.'
        })
      })

      it('empty string should be valid for optional field', () => {
        expect(
          validate(routeSortOrderField, '', null, null, defaultTablesData)
        ).toEqual(false)
      })

      it('string with alphanumeric characters should be invalid', () => {
        expect(
          validate(stopSequenceField, 'abcd123', null, null, defaultTablesData)
        ).toEqual({
          field: 'stop_sequence',
          invalid: true,
          reason: 'Field must be a valid number.'
        })
      })

      it('-1 should be invalid', () => {
        expect(
          validate(routeSortOrderField, '-1', null, null, defaultTablesData)
        ).toEqual({
          field: 'route_sort_order',
          invalid: true,
          reason: 'Field must be a positive number.'
        })
      })

      it('1 should be valid', () => {
        expect(
          validate(routeSortOrderField, '1', null, null, defaultTablesData)
        ).toEqual(false)
      })

      it('1.5 should be invalid', () => {
        expect(
          validate(routeSortOrderField, '1.5', null, null, defaultTablesData)
        ).toEqual({
          field: 'route_sort_order',
          invalid: true,
          reason: 'Field must be a positive integer.'
        })
      })

      it('1.0 should be invalid', () => {
        expect(
          validate(routeSortOrderField, '1.0', null, null, defaultTablesData)
        ).toEqual({
          field: 'route_sort_order',
          invalid: true,
          reason: 'Field must be a positive integer.'
        })
      })

      it('1. should be invalid', () => {
        expect(
          validate(routeSortOrderField, '1.', null, null, defaultTablesData)
        ).toEqual({
          field: 'route_sort_order',
          invalid: true,
          reason: 'Field must be a positive integer.'
        })
      })
    })

    describe('POSITIVE_NUM', () => {
      it('-1 should be invalid', () => {
        expect(
          validate(shapedDistTraveledField, '-1', null, null, defaultTablesData)
        ).toEqual({
          field: 'shape_dist_traveled',
          invalid: true,
          reason: 'Field must be a positive number.'
        })
      })

      it('1 should be valid', () => {
        expect(
          validate(shapedDistTraveledField, '1', null, null, defaultTablesData)
        ).toEqual(false)
      })

      it('1.5 should be valid', () => {
        expect(
          validate(shapedDistTraveledField, '1.5', null, null, defaultTablesData)
        ).toEqual(false)
      })
    })

    describe('GTFS_ROUTE_TYPE', () => {
      it('36 should be invalid', () => {
        expect(
          validate(routeTypeField, '36', null, null, defaultTablesData)
        ).toEqual({
          field: 'route_type',
          invalid: true,
          reason: 'Field must be a valid route type.'
        })
      })

      it('0 (tram) should be valid', () => {
        expect(
          validate(routeTypeField, '0', null, null, defaultTablesData)
        ).toEqual(false)
      })

      it('3 (bus) should be valid', () => {
        expect(
          validate(routeTypeField, '3', null, null, defaultTablesData)
        ).toEqual(false)
      })

      it('101 (High Speed Rail) should be valid', () => {
        expect(
          validate(routeTypeField, '101', null, null, defaultTablesData)
        ).toEqual(false)
      })
    })
  })
})
