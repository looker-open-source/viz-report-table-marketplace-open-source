import React, { Component, useCallback } from "react"

import { AgGridReact } from '@ag-grid-community/react'
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
ModuleRegistry.registerModules([ClientSideRowModelModule])


import ReportTableHeaderGroup from './report_table_header_group'
import ReportTableHeader from './report_table_header'
import ReportTableCell from '../renderers/report_table_cell'

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
    console.log('%c RENDER', 'color: orange')
    console.log('%c columnDefs', 'color: orange', this.props.columnDefs)
    console.log('%c rowData', 'color: orange', this.props.rowData)
    console.log('%c defaultColDef', 'color: orange', this.props.defaultColDef)
    console.log('%c getRowClass', 'color: orange', this.props.getRowClass)
    console.log('%c modules', 'color: orange', this.modules)

    return (
      <>
        <div className={'rt-container ' + this.props.theme}>
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
        </div>
      </>
    )
  }
}

export default ReportTable