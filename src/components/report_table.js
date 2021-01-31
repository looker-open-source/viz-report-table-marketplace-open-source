import React, { useEffect, useState, useContext, useReducer } from "react"

import { AgGridReact } from '@ag-grid-community/react'
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
ModuleRegistry.registerModules([ClientSideRowModelModule])

import { contextReducer, ReportTableContext } from '../context/report_table_context'

import ReportTableHeaderGroup from './header/report_table_header_group'
import ReportTableHeader from './header/report_table_header'
import ReportTableCell from '../renderers/report_table_cell'

require('../styles/report_table_themes.scss')


const ReportTable = ({ rowData }) => {
  const [{ theme, columnDefs }] = useContext(ReportTableContext)
  const [gridApi, setGridApi] = useState(null);
  const [gridColumnApi, setGridColumnApi] = useState(null);

  const getRowClass = (params) => { return params.data.type }
  const defaultColDef = {
    suppressMovable: true,
    columnGroupShow: 'open',
    filter: false,
    sortable: false,
    headerComponent: 'reportTableHeaderComponent',
    cellRenderer: 'reportTableCellComponent',
  }

  const components = {
    reportTableCellComponent: ReportTableCell
  }

  const frameworkComponents = {
    reportTableHeaderGroupComponent: ReportTableHeaderGroup,
    reportTableHeaderComponent: ReportTableHeader,
  }
  
  const onGridReady = (params) => {
    console.log('onGridReady() params', params)
    setGridApi(params.api)
    setGridColumnApi(params.columnApi)

    params.api.sizeColumnsToFit()
  }

  useEffect(() => {
    console.log('ReportTable().useEffect() columnDefs')
    console.log(JSON.stringify(columnDefs.map(col => col.headerName)))
  }, [columnDefs])

  // console.log('%c RENDER', 'color: orange')
  // console.log('%c context', 'color: orange', context)
  // console.log('%c columnDefs', 'color: orange', columnDefs)
  // console.log('%c rowData', 'color: orange', props.rowData)
  // console.log('%c defaultColDef', 'color: orange', props.defaultColDef)

  return (
    <div className={'rt-container ' + theme}>
      {console.log('%c ======> ReportTable() / AgGridReact', 'color:darkorange')}
      {console.log('------- ', JSON.stringify(columnDefs.map(col => col.headerName)))}
      <AgGridReact
        columnDefs={columnDefs}
        rowData={rowData}
        defaultColDef={defaultColDef}
        getRowClass={getRowClass}
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

const ReportTableProvider = ({ dataTable, updatePluginConfig }) => {
  // console.log('ReportTable() props', props)
  const getColumnConfig = (column) => {
    return {
      id: column.id,
      colspans: column.levels.map(level => level.colspan),
      is_first_column: column.id === '$$$_index_$$$' || column.id === column.vis.firstVisibleDimension,
      field: {
        name: column.modelField.name,
        type: column.modelField.type,
        is_numeric: column.modelField.is_numeric,
      },
      subtotals: {
        levels: column.vis.subtotalLevels,
        show: column.vis.hasSubtotals && column.vis.addRowSubtotals,
        show_depth: column.vis.addSubtotalDepth,
        show_all: column.vis.addSubtotalDepth === -1,
      }
    }
  }

  const getColDef = (column) => {
    // console.log('%c getColumnDef() column', 'color: purple', column)
    const columnConfig = getColumnConfig(column)
    return  {
      colId: column.id,
      headerComponentParams : { 
        rtColumn: columnConfig
      },
      hide: column.hide,
      headerName: column.levels[dataTable.headers.length-1].label,
      headerTooltip: column.modelField.name,
      field: column.id,
      valueGetter: function(params) { 
        return typeof params.data === 'undefined' ? '' : '' + params.data.data[column.id].value 
      },
      cellRendererParams: { 
        rtColumn: columnConfig
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
    // console.log('%c getColumnGroup() columns level', 'color: purple', columns, level)
    var headerName = columns[0].levels[level].label
    var columnConfig = getColumnConfig(columns[0])
    var columnGroup = {
      headerName: headerName,
      headerGroupComponent: 'reportTableHeaderGroupComponent',
      headerGroupComponentParams : { 
        level: level,
        rtColumn: columnConfig
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

  const getColumnDefs = () => {
    // console.log('%c GET COLUMNS getColumnDefs()', 'color: purple', dataTable.getDataColumns())
    const columns = dataTable.getDataColumns()
    var columnDefs = []
  
    if (dataTable.headers.length === 1) {
      columns.forEach(column => columnDefs.push(getColDef(column)))
    } else {
      var groups = [
        [], // dimensions
        [], // measures
        [], // supermeasures
      ] 

      columns.filter(c => !c.hide).forEach(column => {
        if (['dimension', 'transposed_table_index'].includes(column.modelField.type)) {
          // dimensions
          groups[0].push(column)
        } else if (!dataTable.transposeTable && column.modelField.type === 'measure' && !column.isRowTotal && !column.super) {
          // measures
          groups[1].push(column)
        } else if (column.modelField.type === 'transposed_table_measure') {
          // measures in a transposed table
          groups[1].push(column)
        } else if (column.super || column.isRowTotal) {
          // supermeasures
          groups[2].push(column)
        }
      })
      // console.log('%c Column "Supergroups":', 'color: purple', groups)

      groups.forEach(columns => {
        columns.forEach((column, idx) => {
          if (column.levels[0].colspan > 0) {
            columnDefs.push(getColumnGroup(columns.slice(idx, columns.length)))
          }
        })
      })
    }

    return columnDefs
  }

  const initialState = {
    theme: 'ag-theme-' + dataTable.config.theme,
    columnDefs: getColumnDefs(),
    tableConfig: dataTable.config,
    tableConfigOptions: dataTable.configOptions,
    updatePluginConfig: updatePluginConfig
  }

  const [state, dispatch] = useReducer(contextReducer, initialState)
  const rowData = dataTable.getDataRows()

  useEffect(() => {
    console.log('ReportTableProvider().useEffect() columnDefs', state.columnDefs)
  }, state.columnDefs)

  return (
    <ReportTableContext.Provider value={[ state, dispatch ]}>
      {console.log('%c ======> ReportTableProvider()', 'color:darkorange')}
      {console.log('------- ', JSON.stringify(state.columnDefs.map(col => col.headerName)))}
      <ReportTable rowData={rowData} />
    </ReportTableContext.Provider>
  )
}

export default ReportTableProvider