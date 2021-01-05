import React from "react"
import ReactDOM from "react-dom"

import { VisPluginTableModel } from './model/vis_table_plugin'
import ReportTable from './components/report_table'
// import { buildColumnMenu } from './renderers/report_table_column_menu'


const loadStylesheet = function(link) {
  const linkElement = document.createElement('link');

  linkElement.setAttribute('rel', 'stylesheet');
  linkElement.setAttribute('href', link);

  document.getElementsByTagName('head')[0].appendChild(linkElement);
};

looker.plugins.visualizations.add({
  //Removes custom CSS theme for now over supportability concerns
  options: (function() { 
    let ops = VisPluginTableModel.getCoreConfigOptions();
    // ops.theme.values.pop()
    // delete ops.customTheme
    return ops
  })(),
  
  create: function(element, config) {
    this.chart = ReactDOM.render(<div />, element);

    // element.appendChild(buildColumnMenu())
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const updateConfig = (newConfig) => {
      this.trigger('updateConfig', newConfig)
    }

    // ERROR HANDLING
    this.clearErrors();

    if (queryResponse.fields.pivots.length > 2) {
      this.addError({
        title: 'Max Two Pivots',
        message: 'This visualization accepts no more than 2 pivot fields.'
      });
      return
    }

    console.log('config', config)
    console.log('queryResponse', queryResponse)
    console.log('data', data)

    // INITIALISE THE VIS
    if (typeof config.columnOrder === 'undefined') {
      this.trigger('updateConfig', [{ columnOrder: {} }])
    }
    if (typeof config.collapseSubtotals === 'undefined') {
      this.trigger('updateConfig', [{ collapseSubtotals: {} }])
    }

  
    // Dashboard-next fails to register config if no one has touched it
    // Check to reapply default settings to the config object
    if (typeof config.theme === 'undefined') {
      config = Object.assign({
        bodyFontSize: 12,
        headerFontSize: 12,
        theme: "finance",
        showHighlight: true,
        showTooltip: true
      }, config)
    }

    // BUILD THE TABLE DATA OBJECT
    var dataTable = new VisPluginTableModel(data, queryResponse, config, updateConfig)
    console.log('dataTable', dataTable)

    this.trigger('registerOptions', dataTable.getConfigOptions())

    // PREPARE PROPS 

    const getColumnConfig = (column) => {
      return {
        id: column.id,
        is_numeric: column.modelField.is_numeric,
        levels: column.levels.map(level => level.colspan),
        visConfig: column.vis.config
      }
    }

    const getColDef = (column) => {
      var columnConfig = getColumnConfig(column)
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
  
    const getRowClass = (params) => { return params.data.type }
    
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
  
    const rowData = dataTable.getDataRows()
    console.log('rowData', rowData)
  
    const rtProps = {
      columnDefs: columnDefs, // columnDefs,
      rowData: rowData,
      getRowClass: getRowClass,
      suppressFieldDotNotation: true,
      suppressRowTransform: true,
      suppressColumnVirtualisation: true,
      suppressAnimationFrame: true,
      defaultColDef: {
        suppressMovable: true,
        columnGroupShow: 'open',
        filter: false,
        sortable: false,
        headerComponent: 'reportTableHeaderComponent',
        cellRenderer: 'reportTableCellComponent',
      },
    }
        
    if (details.print) { fonts.forEach(e => loadStylesheet(e) ); }

    console.log('COLUMN DEFINITIONS')
    console.log(rtProps.columnDefs)
    console.log('ROW DATA')
    console.log(rtProps.rowData)

    this.chart = ReactDOM.render(
      <div className={'rt-container ag-theme-' + config.theme}>
        <ReportTable {...rtProps} />
      </div>,
      element
    );
    
    console.log('element', element)
    
    done();
  }
})