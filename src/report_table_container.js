import React from "react"
import ReactDOM from "react-dom"

import { VisPluginTableModel } from './model/vis_table_plugin'
import ReportTable from './components/report_table'


const loadStylesheet = function(link) {
  const linkElement = document.createElement('link');

  linkElement.setAttribute('rel', 'stylesheet');
  linkElement.setAttribute('href', link);

  document.getElementsByTagName('head')[0].appendChild(linkElement);
};

looker.plugins.visualizations.add({
  options: VisPluginTableModel.getCoreConfigOptions(),
  
  create: function(element, config) {
    this.chart = ReactDOM.render(<div />, element);
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

    console.log('%c config', 'color: green', config)
    console.log('%c queryResponse', 'color: green', queryResponse)
    console.log('%c data', 'color: green', data)

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
    console.log('%c dataTable', 'color: blue', dataTable)

    this.trigger('registerOptions', dataTable.getConfigOptions())

    // PREPARE PROPS 

    const getColumnConfig = (column) => {
      // console.log('%c getColumnConfig() column', 'color: purple', column)

      // use destructing to strip off the complex objects (vis) slowing down React's diffing
      var { vis, levels, series, ...col } = column
      var { modelField, ...col } = col
      var { vis, ...modelField } = modelField
      col.modelField = modelField

      return {
        ...col,
        colspans: column.levels.map(level => level.colspan),
        visConfig: column.vis.config
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
      // if (level === 0) { console.log('%c NEW HEADER GROUP', 'color: purple', columns[0].levels[0].label, '=================') }
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
    
    const rtProps = {
      // vis props
      tableConfig: dataTable.config,
      tableConfigOptions: VisPluginTableModel.getCoreConfigOptions(),
      updateTableConfig: updateConfig,
      
      // ag-grid theme
      theme: 'ag-theme-' + config.theme,

      // ag-grid component props
      columnDefs: getColumnDefs(),
      rowData: dataTable.getDataRows(),
      getRowClass: (params) => { return params.data.type },
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

    console.log('%c COLUMN DEFINITIONS', 'color: red')
    console.log(rtProps.columnDefs)
    console.log('%c ROW DATA', 'color: red')
    console.log(rtProps.rowData)

    this.chart = ReactDOM.render(
      <ReportTable {...rtProps} />,
      element
    );
    
    console.log('%c element', 'color: red', element)
    
    done();
  }
})