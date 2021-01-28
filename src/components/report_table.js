import React, { useState } from "react"

import { AgGridReact } from '@ag-grid-community/react'
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
ModuleRegistry.registerModules([ClientSideRowModelModule])

import ReportTableContext from './report_table_context'
import ReportTableHeaderGroup from './report_table_header_group'
import ReportTableHeader from './report_table_header'
import ReportTableCell from '../renderers/report_table_cell'

require('../styles/report_table_themes.scss')


const ReportTable = (props) => {
  const [gridApi, setGridApi] = useState(null);
  const [gridColumnApi, setGridColumnApi] = useState(null);

  const tableContext = {
    theme: props.theme,
    tableConfig: props.tableConfig,
    tableConfigOptions: props.tableConfigOptions,
    updateTableConfig: props.updateTableConfig
  }

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

  console.log('%c RENDER', 'color: orange')
  console.log('%c tableContext', 'color: orange', tableContext)
  console.log('%c columnDefs', 'color: orange', props.columnDefs)
  console.log('%c rowData', 'color: orange', props.rowData)
  console.log('%c defaultColDef', 'color: orange', props.defaultColDef)

  return (
    <ReportTableContext.Provider value={tableContext}>
      <div className={'rt-container ' + props.theme}>
        <AgGridReact
          columnDefs={props.columnDefs}
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
    </ReportTableContext.Provider>
  )
}

export default ReportTable