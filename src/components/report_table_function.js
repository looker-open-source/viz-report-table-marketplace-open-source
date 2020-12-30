import React, { useState } from "react"

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

const ReportTable = ( { dataTable } ) => {
  const [gridApi, setGridApi] = useState(null);
  const [gridColumnApi, setGridColumnApi] = useState(null);

  const onGridReady = (params) => {
    console.log('onGridReady() params', params)
    setGridApi(params.api);
    setGridColumnApi(params.columnApi);
  }

  const getColDef = column => {
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

  const getColumnGroup = (columns, level=0) => {
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
      columnGroup.children = [getColDef(columns[0])]
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
      columnGroup.children = children.map(child => getColDef(child.column))
      return columnGroup
    } else {
      columnGroup.children = children.map(child => getColumnGroup(columns.slice(child.index, columns.length), level + 1))
      return columnGroup
    }
  }

  var columnDefs = []

  if (dataTable.headers.length === 1) {
    dataTable.getDataColumns.forEach(column => columnDefs.push(getColDef(column)))
  } else {
    // DIMENSIONS
    var dimensions = dataTable.getDataColumns()
      .filter(column => ['dimension', 'transposed_table_index'].includes(column.modelField.type))

    dimensions.forEach((dimension, idx) => {
      if (dimension.levels[0].colspan > 0) {
        columnDefs.push(getColumnGroup(dimensions.slice(idx, dimensions.length)))
      }
    })

    // MEASURES
    if (!dataTable.transposeTable) {
      var measures = dataTable.getDataColumns()
      .filter(column => column.modelField.type === 'measure')
      .filter(column => column.pivoted)
      .filter(column => !column.super)      
    } else {
      var measures = dataTable.getDataColumns()
      .filter(column => column.modelField.type === 'transposed_table_measure')
    }

    measures.forEach((measure, idx) => {
      if (measure.levels[0].colspan > 0) {
        columnDefs.push(getColumnGroup(measures.slice(idx, measures.length)))
      }
    })

    // SUPERMEASURES
    var supermeasures = dataTable.getDataColumns()
        .filter(column => column.modelField.type === 'measure')
        .filter(column => !column.pivoted)
        .filter(column => column.super || column.isRowTotal)

    supermeasures.forEach((supermeasure, idx) => {
      if (supermeasure.levels[0].colspan > 0) {
        columnDefs.push(getColumnGroup(supermeasures.slice(idx, supermeasures.length)))
      }
    })
  }
  var rowData = dataTable.getDataRows()

  var defaultColDef = {
    suppressMovable: true,
    columnGroupShow: 'open',
    filter: false,
    sortable: false,
    headerComponent: 'reportTableHeaderComponent',
    cellRenderer: 'reportTableCellComponent',
  }

  // var components = {
  //   reportTableCellComponent: ReportTableCell
  // }

  var frameworkComponents = {
    
  }

  var components = {
    reportTableHeaderGroupComponent: ReportTableHeaderGroup,
    reportTableHeaderComponent: ReportTableHeader,
    reportTableCellComponent: ReportTableCell
  }

  var getRowClass = (params) => params.data.type

  var modules = [ClientSideRowModelModule]

  return (
      <AgGridReact
        onGridReady={onGridReady}
        columnDefs={columnDefs}
        rowData={rowData}
        modules={modules}
        components={components}
        // frameworkComponents={frameworkComponents}
        defaultColDef={defaultColDef}
        getRowClass={getRowClass}
        // rowHeight={30}
        suppressFieldDotNotation
        suppressRowTransform

        // immutableData
        // disableStaticMarkup
        // rowDataChangeDetectionStrategy={ChangeDetectionService.NoCheck} // IdentityCheck
        // columnDefsChangeDetectionStrategy={ChangeDetectionService.NoCheck}
      />
  )
}

export default ReportTable