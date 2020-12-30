import React, { Component } from "react"

import { AgGridReact } from '@ag-grid-community/react'
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
ModuleRegistry.registerModules([ClientSideRowModelModule])

import { ChangeDetectionService } from 'ag-grid-react/lib/changeDetectionService'

import ReportTableHeaderGroup from '../renderers/report_table_header_group'
import ReportTableHeader from '../renderers/report_table_header'
import ReportTableCell from '../renderers/report_table_cell'
import { ReportTableColumnMenu } from '../renderers/report_table_column_menu'

require('../styles/report_table_themes.scss')

const getColDef = (dataTable, column) => {
  return  {
    colId: column.id,
    headerComponentParams : { dataTableColumn: column },
    hide: column.hide,
    headerName: column.levels[dataTable.headers.length-1].label,
    headerTooltip: column.modelField.name,
    field: column.id,
    valueGetter: function(params) { 
      return typeof params.data === 'undefined' ? '' : '' + params.data.data[column.id].value 
    },
    cellRendererParams: {
      dataTableColumn: column
    },
    colSpan: function(params) {
      try {
        var colspan = params.data.data[column.id].colspan 
      } catch {
        var colspan = 1 
      }
      return colspan 
    },
    rowSpan: function(params) {
      try {
        var rowspan = params.data.data[column.id].rowspan 
      } catch {
        var rowspan = 1 
      }
      return rowspan 
    },
  }
}

const getColumnGroup = (dataTable, columns, level=0) => {
  var headerName = columns[0].levels[level].label
  var columnGroup = {
    headerName: headerName,
    headerGroupComponent: 'reportTableHeaderGroupComponent',
    headerGroupComponentParams : { 
      level: level,
      dataTableColumn: columns[0] 
    },
    marryChildren: true,
    children: []
  }

  // if this is a transposed subtotal, then can return with itself as sole child
  if (dataTable.transposeTable && columns[0].levels[0].rowspan === dataTable.headers.length) {
    columnGroup.openByDefault = true
    columnGroup.children = [getColDef(dataTable, columns[0])]
    return columnGroup
  }
  
  var children = []
  var idx = 0
  while (idx < columns.length && columns[idx].levels[level].label === columns[0].levels[level].label ) {
    if (columns[idx].levels[level + 1].colspan > 0) {
      children.push({
        index: idx, 
        column: columns[idx]
      })
    }
    idx = idx + 1
  }

  if (level + 2 === dataTable.headers.length) {
    columnGroup.children = children.map(child => getColDef(dataTable, child.column))
    return columnGroup
  } else {
    columnGroup.children = children.map(child => getColumnGroup(dataTable, columns.slice(child.index, columns.length), level + 1))
    return columnGroup
  }
}

class ReportTable extends Component {
  constructor(props) {
    super(props)

    this.state = {}
    
    this.onGridReady = this.onGridReady.bind(this);
    this.modules = [ClientSideRowModelModule]
    this.defaultColDef = {
      suppressMovable: true,
      columnGroupShow: 'open',
      filter: false,
      sortable: false,
      headerComponent: 'reportTableHeaderComponent',
      cellRenderer: 'reportTableCellComponent',
    }
    this.frameworkComponents = {}

    this.components = {
      reportTableHeaderGroupComponent: ReportTableHeaderGroup,
      reportTableHeaderComponent: ReportTableHeader,
      reportTableCellComponent: ReportTableCell
    }
  }

  onGridReady = (params) => {
    this.gridApi = params.api
    this.gridColumnApi = params.columnApi

    // this.gridApi.sizeColumnsToFit()
  }

  static getDerivedStateFromProps(props, state) {
    var columnDefs = []
    if (props.dataTable.headers.length === 1) {
      props.dataTable.getDataColumns.forEach(column => columnDefs.push(getColDef(props.dataTable, column)))
    } else {
      // DIMENSIONS
      var dimensions = props.dataTable.getDataColumns()
        .filter(column => ['dimension', 'transposed_table_index'].includes(column.modelField.type))
  
      dimensions.forEach((dimension, idx) => {
        if (dimension.levels[0].colspan > 0) {
          columnDefs.push(getColumnGroup(props.dataTable, dimensions.slice(idx, dimensions.length)))
        }
      })
  
      // MEASURES
      if (!props.dataTable.transposeTable) {
        var measures = props.dataTable.getDataColumns()
        .filter(column => column.modelField.type === 'measure')
        .filter(column => column.pivoted)
        .filter(column => !column.super)      
      } else {
        var measures = props.dataTable.getDataColumns()
        .filter(column => column.modelField.type === 'transposed_table_measure')
      }
  
      measures.forEach((measure, idx) => {
        if (measure.levels[0].colspan > 0) {
          columnDefs.push(getColumnGroup(props.dataTable, measures.slice(idx, measures.length)))
        }
      })
  
      // SUPERMEASURES
      var supermeasures = props.dataTable.getDataColumns()
          .filter(column => column.modelField.type === 'measure')
          .filter(column => !column.pivoted)
          .filter(column => column.super || column.isRowTotal)
  
      supermeasures.forEach((supermeasure, idx) => {
        if (supermeasure.levels[0].colspan > 0) {
          columnDefs.push(getColumnGroup(props.dataTable, supermeasures.slice(idx, supermeasures.length)))
        }
      })
    }

    return {
      dataTable: props.dataTable,
      columnDefs: columnDefs,
      rowData: props.dataTable.getDataRows(),
    }
  }

  shouldComponentUpdate = (nextProps, nextState) => {
    return true
  }

  getRowClass = (params) => { return params.data.type }

  render () {
    return (
      <AgGridReact
        onGridReady={this.onGridReady}
        columnDefs={this.state.columnDefs}
        rowData={this.state.rowData}
        modules={this.modules}
        components={this.components}
        // frameworkComponents={this.frameworkComponents}
        defaultColDef={this.defaultColDef}
        getRowClass={this.getRowClass}
        // rowHeight={30}
        suppressFieldDotNotation
        suppressRowTransform

        // immutableData
        // disableStaticMarkup
        rowDataChangeDetectionStrategy={ChangeDetectionService.NoCheck} // IdentityCheck
        columnDefsChangeDetectionStrategy={ChangeDetectionService.NoCheck}
      />
    )
  }
}

export default ReportTable