import { Grid } from 'ag-grid-community'

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
  const bounds = element.getBoundingClientRect()

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

  var columnDefs = [
    { headerName: 'Make', field: 'make' },
    { headerName: 'Model', field: 'model' },
    { headerName: 'Price', field: 'price' }
  ];
  
  // specify the data
  var rowData = [
    { make: 'Toyota', model: 'Celica', price: 35000 },
    { make: 'Ford', model: 'Mondeo', price: 32000 },
    { make: 'Porsche', model: 'Boxter', price: 72000 }
  ];
  
  // let the grid know which columns and what data to use
  var gridOptions = {
    columnDefs: columnDefs,
    rowData: rowData
  };
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