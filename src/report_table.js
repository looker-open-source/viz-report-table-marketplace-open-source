import { Grid } from 'ag-grid-community'
import { csvParse } from 'd3'

import { VisPluginTableModel } from './vis_table_plugin'

const agGridTheme = require('./styles/ag-grid.css')
const themes = {
  finance: require('./styles/finance.scss'),
  balham: require('./styles/ag-theme-balham.css'),
}

const removeStyles = async function() {
  const links = document.getElementsByTagName('link')
  while (links[0]) links[0].parentNode.removeChild(links[0])

  Object.keys(themes).forEach(async (theme) => await themes[theme].unuse() )
}

const loadStylesheet = function(link) {
  const linkElement = document.createElement('link');

  linkElement.setAttribute('rel', 'stylesheet');
  linkElement.setAttribute('href', link);

  document.getElementsByTagName('head')[0].appendChild(linkElement);
};


const buildReportTable = function(config, dataTable, element) {

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

  const cellRenderer = (column, params) => { 
    // console.log('cellRenderer params', params)
    var text = ''
    var data = params.data.data[column.id]
    if (typeof params.data !== 'undefined') {
      if (data.html) {                              // cell has HTML defined
        var parser = new DOMParser()
        var parsed_html = parser.parseFromString(data.html, 'text/html')
        text = parsed_html.documentElement.textContent
      } else if (data.rendered || data.rendered === '') {     // could be deliberate choice to render empty string
        text = data.rendered
      } else {
        text = data.value   
      }
    } else {
      text = 'RENDER ERROR'
    }
    return text
  }

  const getColDef = column => {
    return  {
      colId: column.id,
      suppressMovable: true,
      columnGroupShow: 'open',
      hide: column.hide,
      headerName: column.levels[dataTable.headers.length-1].label,
      headerTooltip: column.modelField.name,
      headerClass: 'text-' + column.modelField.align,
      field: column.id,
      valueGetter: function(params) { 
        return typeof params.data === 'undefined' ? '' : '' + params.data.data[column.id].value 
      },
      cellRenderer: params => cellRenderer(column, params),
      cellClass: params => {
        var cell_styles = params.data.data[column.id].cell_style
        if (dataTable.transposeTable) {
          cell_styles.push('transposed')
        }
        return cell_styles
      },
      filter: true,
      sortable: true,
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

    // if this is a transposed subtotal, then can return with itself as sole child
    if (dataTable.transposeTable && columns[0].levels[0].rowspan === dataTable.headers.length) {
      return {
        headerName: headerName,
        marryChildren: true,
        openByDefault: true,
        children: [getColDef(columns[0])]
      }
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
      return {
        headerName: headerName,
        marryChildren: true,
        children: children.map(child => getColDef(child.column))
      }
    } else {
      return {
        headerName: headerName,
        children: children.map(child => getColumnGroup(columns.slice(child.index, columns.length), level + 1))
      }
    }
  }

  var columnDefs = []

  if (dataTable.headers.length === 1) {
    dataTable.getDataColumns.forEach(column => columnDefs.push(getColDef(column)))
  } else {
    // DIMENSIONS
    var dimensionGroup = {
      headerName: 'Dimensions',
      marryChildren: true,
      children: []
    }
    var dimensions = dataTable.getDataColumns()
      .filter(column => ['dimension', 'transposed_table_index'].includes(column.modelField.type))
    dimensions.forEach(column => {
      dimensionGroup.children.push(getColDef(column))
    })
    columnDefs.push(dimensionGroup)

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
    var supermeasureGroup = {
      headerName: 'Supermeasures',
      marryChildren: true,
      children: []
    }
    var supermeasures = dataTable.getDataColumns()
        .filter(column => column.modelField.type === 'measure')
        .filter(column => !column.pivoted)
        .filter(column => column.super)
    supermeasures.forEach(column => {
      supermeasureGroup.children.push(getColDef(column))
    })
    columnDefs.push(supermeasureGroup)
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
  };
  console.log('gridOptions', gridOptions)
  element.classList.add('ag-theme-balham')
  new Grid(element, gridOptions)
}

looker.plugins.visualizations.add({
  //Removes custom CSS theme for now over supportability concerns
  options: (function() { 
    let ops = VisPluginTableModel.getCoreConfigOptions();
    // ops.theme.values.pop()
    // delete ops.customTheme
    return ops
  })(),
  
  create: function(element, config) {},

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

    try {
      var elem = document.querySelector('.ag-root-wrapper');
      elem.parentNode.removeChild(elem);  
    } catch(e) {}

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
        theme: "balham",
        showHighlight: true,
        showTooltip: true
      }, config)
    }

    // BUILD THE VIS
    // 1. Create object
    // 2. Register options
    // 3. Build vis

    var dataTable = new VisPluginTableModel(data, queryResponse, config, updateConfig)
    this.trigger('registerOptions', dataTable.getConfigOptions())
    buildReportTable(config, dataTable, element)
    if (details.print) { fonts.forEach(e => loadStylesheet(e) ); }

    // DEBUG OUTPUT AND DONE
    console.log('dataTable', dataTable)
    console.log('element', element)
    console.log('document', document)
    
    done();
  }
})