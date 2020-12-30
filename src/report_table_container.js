// REACT VERSION
// import React from "react"
// import ReactDOM from "react-dom"

import { VisPluginTableModel } from './model/vis_table_plugin'
import ReportTable from './renderers/report_table'
import { buildColumnMenu } from './renderers/report_table_column_menu'


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
    element.appendChild(buildColumnMenu())
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

    // BUILD THE VIS
    var dataTable = new VisPluginTableModel(data, queryResponse, config, updateConfig)
    console.log('dataTable', dataTable)

    this.trigger('registerOptions', dataTable.getConfigOptions())
        
    if (details.print) { fonts.forEach(e => loadStylesheet(e) ); }

    // PREVENT MULTIPLE TABLES BEING RENDERED
    try {
      var elem = document.querySelector('.ag-root-wrapper')
      elem.parentNode.removeChild(elem); 
    } catch(e) {}

    ReportTable(dataTable, element)
    
    console.log('element', element)
    
    done();
  }
})