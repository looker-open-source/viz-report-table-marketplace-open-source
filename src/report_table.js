import { Grid } from 'ag-grid-community'
import 'ag-grid-enterprise';

import { VisPluginTableModel } from './vis_table_plugin'

const agGridTheme = require('./ag-grid.css')
const themes = {
  alpine: require('./ag-theme-alpine.css'),
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
  const getSubtotalColumnId = function(rowNode, keys = []) {
    keys.push(rowNode.key)
    if (rowNode.level == 0) {
      return ['CollapsibleSubtotal', ...keys.reverse()].join('|')
    } else {
      return getSubtotalColumnId(rowNode.parent, keys)
    }
  }

  const getSubtotalValue = function(params) {
    var value = ''
    if (
      // typeof params.rowNode.group !== 'undefined' 
      // && typeof params.rowNode.footer !== 'undefined' 
      // && params.colDef.rowGroup 
      params.rowNode.level < 0
      && params.column.colId === 'trans.type'
    ) {
      console.log('===============================================')
      console.log('row level', params.rowNode.level)
      console.log('row id', params.rowNode.id)
      console.log('row key', params.rowNode.key)
      console.log('colId', params.column.colId)
      if (params.rowNode.level >= 0) {
        var subtotalColumnId = getSubtotalColumnId(params.rowNode)
        console.log('subtotalColumnId', subtotalColumnId)
        console.log('subtotal rows', subtotalData)
        var subtotalRow = subtotalData.find(row => row.id === subtotalColumnId)
        console.log('subtotal row', subtotalRow)
        if (typeof subtotalRow !== 'undefined') {
          console.log('subtotal data', subtotalRow.data[params.column.colId])
        }
      } 
      console.log('params', params)
    }    
    // find subtotalData row where id = 'CollapsibleSort|DimValue|DimValue'
    // value = row[column.id].value

    // params.rowNode

    if (params.rowNode.level >= 0) {
      var subtotalColumnId = getSubtotalColumnId(params.rowNode)
      var subtotalRow = subtotalData.find(row => row.id === subtotalColumnId)
      if (typeof subtotalRow !== 'undefined') {
        value = subtotalRow.data[params.column.colId].value
      }
    } else if (params.rowNode.level === -1) {
      if (typeof totalData.data !== 'undefined') {
        value = totalData.data[params.column.colId].value
      }
    }

    return { value: value }
  }

  removeStyles().then(() => {
    agGridTheme.use()
    themes['alpine'].use()
    // if (typeof themes[config.theme] !== 'undefined') {
    //   // themes[config.theme].use()
    //   themes['alpine'].use()
    // }
  })

  // var column_groups = dataTable.getTableColumnGroups()
  // var header_rows = dataTable.getHeaderTiers()
  // var header_cells = dataTable.getTableHeaderCells(i).map(column => column.levels[i]))
  // var table_rows = dataTable.getDataRows()
  // dataTable.getTableRowColumns(row).map(column => row.data[column.id])
  // var html = dataTable.getCellToolTip(d.rowid, d.colid)

  // let event = {
  //   metaKey: d3.event.metaKey,
  //   pageX: d3.event.pageX,
  //   pageY: d3.event.pageY - window.pageYOffset
  // }
  // LookerCharts.Utils.openDrillMenu({
  //   links: d.links,
  //   event: event
  // })

  var columnDefs = []
  // Group column renderer
  // columnDefs.push({
  //   headerName: 'Group',
  //   showRowGroup: true,
  //   cellRenderer: 'agGroupCellRenderer'
  // })
  dataTable.getDataColumns().forEach(column => {
    columnDefs.push({
      colId: column.id,
      hide: column.modelField.type === 'dimension' ? true : column.hide,
      headerName: column.modelField.lable,
      headerTooltip: column.modelField.name,
      field: column.id,
      valueGetter: function(params) { 
        return typeof params.data === 'undefined' ? '' : '' + params.data.data[column.id].value 
      },
      cellRenderer: function(params) { 
        // console.log('cellRenderer params', params)
        if (typeof params.node.aggData !== 'undefined') {
          return '' + params.node.aggData[column.id].value
        } else {
          return typeof params.data === 'undefined' ? '' : '' + params.data.data[column.id].value 
        }
      },
      filter: true,
      sortable: true,
      rowGroup: column.modelField.type === 'dimension',
      aggFunc: 'getSubtotalValue',
    })
  })

  var tableData = dataTable.getDataRows()
  var rowData = tableData.filter(row => row.type === 'line_item')
  var subtotalData = tableData.filter(row => row.type === 'subtotal')
  var totalData = tableData.filter(row => row.type === 'total')[0]

  console.log('subtotalData', subtotalData)
  console.log('totalData', totalData)
  
  // let the grid know which columns and what data to use
  var gridOptions = {
    aggFuncs: {
      getSubtotalValue: getSubtotalValue
    },
    suppressAggFuncInHeader: true,
    columnDefs: columnDefs,
    // groupHideOpenParents: true,
    groupIncludeFooter: true,
    groupIncludeTotalFooter: true,
    autoGroupColumnDef: {
      // headerName: 'THE GROUPS!',
      cellRendererParams: {
        // suppressCount: true,
        checkbox: false,
        innerRenderer: function(params) { 
          console.log('autoGroupColumnDef cellRenderer params', params)
          return params.value
        },
      },
    },
    enableRangeSelection: true,
    rowData: rowData,
    suppressFieldDotNotation: true,
  };
  console.log('gridOptions', gridOptions)
  element.classList.add('ag-theme-alpine')
  new Grid(element, gridOptions)
}

looker.plugins.visualizations.add({
  //Removes custom CSS theme for now over supportability concerns
  options: (function() { 
    let ops = VisPluginTableModel.getCoreConfigOptions();
    ops.theme.values.pop()
    delete ops.customTheme
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
        theme: "alpine",
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
    // console.log('container', document.getElementById('visContainer').parentNode)
    
    done();
  }
})