// @flow

/*
  Field props used in EditorInputs. POSITIVE_NUM is not included here since setting the
  input type to "number" was actually hiding validation under the native HTML input's rejection
  of anything NaN.
*/
export const FIELD_PROPS = [
  {
    inputType: 'DROPDOWN',
    props: {
      componentClass: 'select'
    }
  },
  {
    inputType: 'NUMBER',
    props: {
      type: 'number'
    }
  },
  {
    inputType: 'POSITIVE_INT',
    props: {
      min: 0,
      step: 1,
      type: 'number'
    }
  },
  {
    inputType: 'TIME',
    props: {
      placeholder: 'HH:MM:SS'
    }
  },
  {
    inputType: 'LATITUDE',
    props: {
      type: 'number'
    }
  },
  {
    inputType: 'LONGITUDE',
    props: {
      type: 'number'
    }
  }
]
