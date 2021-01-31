import React from "react"
import ReactDOM from "react-dom"

import { VisPluginTableModel } from './model/vis_table_plugin'
import ReportTableProvider from './components/report_table'


const loadStylesheet = function(link) {
  const linkElement = document.createElement('link');

  linkElement.setAttribute('rel', 'stylesheet');
  linkElement.setAttribute('href', link);

  document.getElementsByTagName('head')[0].appendChild(linkElement);
};

looker.plugins.visualizations.add({
  options: VisPluginTableModel.getCoreConfigOptions(),
  
  create: function(element, config) {
    console.log('%c **------ create() ------**', 'color: red; font-weight: bold')
    this.chart = ReactDOM.render(
      <>
        {console.log('%c ------- Empty <div />', 'color:darkorange')}
        <div className='pluginCreate' />
      </>, 
      element
    )
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    console.log('%c **------ updateAsync() ------**', 'color: red; font-weight: bold')

    const updatePluginConfig = (newConfig) => {
      console.log('updateAsync().updatePluginConfig() newConfig', newConfig)
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
    // console.log('%c queryResponse', 'color: green', queryResponse)
    // console.log('%c data', 'color: green', data)

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
    var dataTable = new VisPluginTableModel(data, queryResponse, config, updatePluginConfig)
    // const rowData = dataTable.getDataRows()

    this.trigger('registerOptions', dataTable.configOptions)

    if (details.print) { fonts.forEach(e => loadStylesheet(e) ); }

    console.log('%c dataTable', 'color: blue', dataTable)  
    this.chart = ReactDOM.render(
      <>
        {console.log('%c ======> updateAsync() ReactDOM.render()', 'color:darkorange')}
        {console.log('------- useViewName', dataTable.useViewName)}
        <ReportTableProvider dataTable={dataTable} updatePluginConfig={updatePluginConfig} />
      </>,
      element
    );
    
    console.log('%c element', 'color:red', element)
    done();
  }
})