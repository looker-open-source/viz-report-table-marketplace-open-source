import React from 'react'

const actions = {
  UPDATE_THEME: 'UPDATE_THEME',
  UDPATE_COLUMNS: 'UDPATE_COLUMN',
  UPDATE_TABLE_OPTION: 'UPDATE_TABLE_OPTION' 
}

const ReportTableContext = React.createContext({
  theme: '',
  columnDefs: [],
  tableConfig: {},
  tableConfigOptions: {},
  updateTableConfig: () => {},
})

const contextReducer = (state, action) => {
  switch (action.type) {
    case actions.UPDATE_THEME: {
      return {
        ...state,
        theme: action.payload
      }
    }
    case actions.UDPATE_COLUMNS: {
      return {
        ...state,
        columnDefs: action.payload
      }
    }
    case actions.UPDATE_TABLE_OPTION: {
      console.log('UPDATE_TABLE_OPTION')
      console.log('action', action)
      console.log('state', state)

      let tableConfig = state.tableConfig
      tableConfig[action.payload.option] = action.payload.value
      const newValue = {
        ...state,
        tableConfig: tableConfig
      }
      console.log('newValue', newValue)
      return newValue
    }
    default:
      return state
  }
}

export { actions, ReportTableContext, contextReducer }