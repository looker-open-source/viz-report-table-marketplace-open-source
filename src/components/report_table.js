import React, { Component } from "react"

import { AgGridReact } from '@ag-grid-community/react'
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
ModuleRegistry.registerModules([ClientSideRowModelModule])


import ReportTableHeaderGroup from './report_table_header_group'
import ReportTableHeader from './report_table_header'
import ReportTableCell from '../renderers/report_table_cell'
// import { ReportTableColumnMenu } from '../renderers/report_table_column_menu'
import { slice } from "lodash";

require('../styles/report_table_themes.scss')


class ReportTable extends Component {
  constructor(props) {
    console.log('ReportTable() props', props)
    super(props)

    this.onGridReady = this.onGridReady.bind(this);
    this.modules = [ClientSideRowModelModule]
    this.components = {
      reportTableCellComponent: ReportTableCell
    }
    this.frameworkComponents = {
      reportTableHeaderGroupComponent: ReportTableHeaderGroup,
      reportTableHeaderComponent: ReportTableHeader,
    }
  }

  onGridReady = (params) => {
    this.gridApi = params.api
    this.gridColumnApi = params.columnApi

    // this.gridApi.sizeColumnsToFit()
  }

  render () {
    console.log('RENDER')
    console.log('columnDefs', this.props.columnDefs)
    console.log('rowData', this.props.rowData)
    console.log('defaultColDef', this.props.defaultColDef)
    console.log('getRowClass', this.props.getRowClass)
    console.log('modules', this.modules)
    // console.log('components', this.components)
    console.log('onGridReady', this.onGridReady)
    return (
      <AgGridReact
        columnDefs={this.props.columnDefs}
        rowData={this.props.rowData}
        defaultColDef={this.props.defaultColDef}
        getRowClass={this.props.getRowClass}
        suppressFieldDotNotation
        suppressRowTransform
        suppressColumnVirtualisation
        suppressAnimationFrame
        modules={this.modules}
        components={this.components}
        frameworkComponents={this.frameworkComponents}
        onGridReady={this.onGridReady}
      />
    )
  }
}

export default ReportTable