import { VisPluginTableModel } from './model/vis_table_plugin'
import { buildReportTable } from './view/report_table_builder'


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

    // PREVENT MULTIPLE TABLES BEING RENDERED
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
    var dataTable = new VisPluginTableModel(data, queryResponse, config, updateConfig)
    console.log('dataTable', dataTable)

    this.trigger('registerOptions', dataTable.getConfigOptions())
    
    buildReportTable(config, dataTable, element)
    
    if (details.print) { fonts.forEach(e => loadStylesheet(e) ); }
    
    console.log('element', element)
    
    done();
  }
})