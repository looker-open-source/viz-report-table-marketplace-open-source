import React, { useState, useContext, useReducer } from "react"

import { AgGridReact } from '@ag-grid-community/react'
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
ModuleRegistry.registerModules([ClientSideRowModelModule])

import { contextReducer, ReportTableContext } from './report_table_context'
import ReportTableHeaderGroup from './report_table_header_group'
import ReportTableHeader from './report_table_header'
import ReportTableCell from '../renderers/report_table_cell'

require('../styles/report_table_themes.scss')


const ReportTableComponent = (props) => {
  const [{ theme, columnDefs }] = useContext(ReportTableContext)
  const [gridApi, setGridApi] = useState(null);
  const [gridColumnApi, setGridColumnApi] = useState(null);

  console.log('ReportTableComponent()')
  // console.log(' --- tableContext.tableConfig view, transpose', context.tableConfig.useViewName, tableContext.tableConfig.transposeTable)

  const components = {
    reportTableCellComponent: ReportTableCell
  }

  const frameworkComponents = {
    reportTableHeaderGroupComponent: ReportTableHeaderGroup,
    reportTableHeaderComponent: ReportTableHeader,
  }
  
  const onGridReady = (params) => {
    setGridApi(params.api)
    setGridColumnApi(params.columnApi)

    // this.gridApi.sizeColumnsToFit()
  }

  // console.log('%c RENDER', 'color: orange')
  // console.log('%c context', 'color: orange', context)
  // console.log('%c columnDefs', 'color: orange', columnDefs)
  // console.log('%c rowData', 'color: orange', props.rowData)
  // console.log('%c defaultColDef', 'color: orange', props.defaultColDef)

  return (
    <div className={'rt-container ' + theme}>
      <AgGridReact
        columnDefs={columnDefs}
        rowData={props.rowData}
        defaultColDef={props.defaultColDef}
        getRowClass={props.getRowClass}
        suppressFieldDotNotation
        suppressRowTransform
        suppressColumnVirtualisation
        suppressAnimationFrame
        modules={[ClientSideRowModelModule]}
        components={components}
        frameworkComponents={frameworkComponents}
        onGridReady={onGridReady}
      />
    </div>
  )
} 

const ReportTable = ({ theme, columnDefs, tableConfig, tableConfigOptions, updateTableConfig, ...rest}) => {
  // console.log('ReportTable() props', props)

  const initialState = {
    theme: theme,
    columnDefs: columnDefs,
    tableConfig: tableConfig,
    tableConfigOptions: tableConfigOptions,
    updateTableConfig: updateTableConfig
  }

  const [context, dispatch] = useReducer(contextReducer, initialState)
    
  return (
    <ReportTableContext.Provider value={[ context, dispatch ]}>
      <ReportTableComponent {...rest} />
    </ReportTableContext.Provider>
  )
}

export default ReportTable