import { Grid } from 'ag-grid-community'

import { ReportTableHeaderGroup } from './report_table_header_group'
import { ReportTableHeader } from './report_table_header'
import { ReportTableCell } from './report_table_cell'

const agGridTheme = require('../styles/ag-grid.css')
const themes = {
  finance: require('../styles/finance.scss'),
  balham: require('../styles/ag-theme-balham.css'),
}

const removeStyles = async function() {
  const links = document.getElementsByTagName('link')
  while (links[0]) links[0].parentNode.removeChild(links[0])

  Object.keys(themes).forEach(async (theme) => await themes[theme].unuse() )
}

const buildReportTable = (config, dataTable, element) => {
  removeStyles().then(() => {
    agGridTheme.use()
    if (typeof themes[config.theme] !== 'undefined') {
      themes[config.theme].use()
    }
  })

  // LookerCharts.Utils.openDrillMenu({
  //   links: d.links,
  //   event: event
  // })

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
      cellRenderer: 'reportTableCellComponent',
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
      headerGroupComponentParams : { dataTableColumn: columns[0] },
      marryChildren: true,
      children: []
    }

    // if this is a transposed subtotal, then can return with itself as sole child
    if (dataTable.transposeTable && columns[0].levels[0].rowspan === dataTable.headers.length) {
      columnGroup.openByDefault = true
      columnGroup.children = [getColDef(columns[0])]
      return columnGroup
      // {
      //   headerName: headerName,
      //   headerGroupComponent: 'reportTableHeaderGroupComponent',
      //   headerGroupComponentParams : { dataTableColumn: columns[0] },
      //   marryChildren: true,
      //   openByDefault: true,
      //   children: [getColDef(columns[0])]
      // }
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
      // {
      //   headerName: headerName,
      //   headerGroupComponent: 'reportTableHeaderGroupComponent',
      //   headerGroupComponentParams : { dataTableColumn: columns[0] },
      //   marryChildren: true,
      //   children: children.map(child => getColDef(child.column))
      // }
    } else {
      columnGroup.children = children.map(child => getColumnGroup(columns.slice(child.index, columns.length), level + 1))
      return columnGroup
      // {
      //   headerName: headerName,
      //   headerGroupComponent: 'reportTableHeaderGroupComponent',
      //   headerGroupComponentParams : { dataTableColumn: columns[0] },
      //   children: children.map(child => getColumnGroup(columns.slice(child.index, columns.length), level + 1))
      // }
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
  
  // let the grid know which columns and what data to use
  var gridOptions = {
    columnDefs: columnDefs,
    enableRangeSelection: true,
    rowData: rowData,
    suppressFieldDotNotation: true,
    suppressRowTransform: true,
    getRowClass: params => params.data.type,
    defaultColDef: {
      suppressMovable: true,
      columnGroupShow: 'open',
      filter: false,
      sortable: false,
      headerComponent: 'reportTableHeaderComponent',
    },
    components: {
      reportTableHeaderGroupComponent: ReportTableHeaderGroup,
      reportTableHeaderComponent: ReportTableHeader,
      reportTableCellComponent: ReportTableCell
    },
  };
  console.log('gridOptions', gridOptions)
  element.classList.add('ag-theme-balham')
  new Grid(element, gridOptions)
}

export { buildReportTable }