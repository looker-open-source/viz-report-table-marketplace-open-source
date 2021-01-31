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
  updatePluginConfig: () => {},
})

const contextReducer = (state, action) => {
  switch (action.type) {
    case actions.UPDATE_THEME: {
      // To Be Implemented
      return {
        ...state,
        // theme: action.payload
      }
    }

    case actions.UDPATE_COLUMNS: {
      // To Be Implemented
      return {
        ...state,
        // columnDefs: action.payload
      }
    }

    case actions.UPDATE_TABLE_OPTION: {
      console.log('UPDATE_TABLE_OPTION')
      console.log('state:', action.payload.option, state.tableConfig[action.payload.option])
      console.log('action:', action.payload.option, action.payload.value)
      
      state.tableConfig[action.payload.option] = action.payload.value

      // TEMP CODE TO VALIDATE FLOW
      if (action.payload.value) {
        state.columnDefs[0].headerName = 'Transactions Category'
        state.columnDefs[1].headerName = 'Transactions Total Transaction Value'
      } else {
        state.columnDefs[0].headerName = 'Category'
        state.columnDefs[1].headerName = 'Total Transaction Value'
      }
      
      console.log('new state:', JSON.stringify(state.columnDefs.map(col => col.headerName)))
      return state
    }
    
    default:
      return state
  }
}

export { actions, ReportTableContext, contextReducer }