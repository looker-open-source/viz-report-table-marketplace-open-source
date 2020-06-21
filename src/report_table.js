// const { LookerDataTable } = require('vis-tools') 
const { LookerDataTable } = require('../../vis-tools/looker_data_table.js')
const d3 = require('./d3loader')

import './report_table.css';


const buildReportTable = function(config, lookerDataTable, callback) {
  var dropTarget = null;
  
  var table = d3.select('#visContainer')
    .append('table')
    .attr('class', 'reportTable');

  var drag = d3.drag()
    .on('start', (source, idx) => {
      if (!lookerDataTable.has_pivots) {
        var xPosition = parseFloat(d3.event.x);
        var yPosition = parseFloat(d3.event.y);

        d3.select("#tooltip")
            .style("left", xPosition + "px")
            .style("top", yPosition + "px")                     
            .html();
   
        d3.select("#tooltip").classed("hidden", false);        
      }
    })
    .on('drag', (source, idx) => {
      // console.log('drag event', source, idx, d3.event.x, d3.event.y)
      if (!lookerDataTable.has_pivots) {
        d3.select("#tooltip") 
          .style("left", d3.event.x + "px")
          .style("top", d3.event.y + "px")  
      }
      
    })
    .on('end', (source, idx) => {
      if (!lookerDataTable.has_pivots) {
        d3.select("#tooltip").classed("hidden", true);
        var movingColumn = lookerDataTable.getColumnById(source.id)
        var targetColumn = lookerDataTable.getColumnById(dropTarget.id)
        var movingIdx = Math.floor(movingColumn.pos/10) * 10
        var targetIdx = Math.floor(targetColumn.pos/10) * 10
        // console.log('DRAG FROM', movingColumn, movingIdx, 'TO', targetColumn, targetIdx)
        lookerDataTable.moveColumns(config, movingIdx, targetIdx, callback)
      }
    })

  table.append('thead')
    .selectAll('tr')
    .data(lookerDataTable.getLevels()).enter() 
      .append('tr')
      .selectAll('th')
      .data(function(level, i) { 
        return lookerDataTable.getColumnsToDisplay(config, i).map(function(column) {
          var labelParams = {
            hasPivots: lookerDataTable.has_pivots,
            level: i,
          }

          var header = {
            'id': column.id,
            'text': column.getLabel(labelParams),
            'align': column.parent.align,
            'colspan': column.colspans[i]
          }

          if (lookerDataTable.useHeadings && !lookerDataTable.has_pivots && i === 0) {
            header.align = 'center'
          } else if (lookerDataTable.has_pivots && i < lookerDataTable.pivot_fields.length) {
            header.align = 'center'
          }
          
          return header
        })
      }).enter()
          .append('th')
          .text(d => d.text)
          .attr('id', d => d.id)
          .attr('colspan', d => d.colspan)
          .attr('class', d => {
            var classes = []
            if (typeof d.align !== 'undefined') { classes.push(d.align) }
            return classes.join(' ')
          })
          .attr('draggable', true)
          .call(drag)
          .on('mouseover', cell => dropTarget = cell)
          .on('mouseout', () => dropTarget = null)

  table.append('tbody')
    .selectAll('tr')
    .data(lookerDataTable.data).enter()
      .append('tr')
      .selectAll('td')
      .data(function(row) {  
        return lookerDataTable.getRow(row).map( column => {
          var cell = row.data[column.id]
          cell.rowspan = column.rowspan
          cell.align = column.parent.align
          return cell;
        })
      }).enter()
        .append('td')
          .text(d => d.rendered || d.value) 
          .attr('rowspan', d => d.rowspan)
          .attr('class', d => {
            var classes = []
            if (typeof d.align !== 'undefined') { classes.push(d.align) }
            if (typeof d.cell_style !== 'undefined') { 
              classes = classes.concat(d.cell_style) 
            }
            return classes.join(' ')
          })
}

looker.plugins.visualizations.add({
  options: LookerDataTable.getCoreConfigOptions(),

  create: function(element, config) {
    this.tooltip = d3.select(element)
        .append("div")
        .attr("class", "hidden")
        .attr("id", "tooltip")
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const updateColumnOrder = newOrder => {
      this.trigger('updateConfig', [{columnOrder: newOrder}])
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

    // "INITIALISING" THE VIS

    try {
      var elem = document.querySelector('#visContainer');
      elem.parentNode.removeChild(elem);  
    } catch(e) {}    

    this.container = d3.select(element)
      .append('div')
      .attr('id', 'visContainer')

    if (typeof config.columnOrder === 'undefined') {
      this.trigger('updateConfig', [{ columnOrder: {} }])
    }


    // BUILD THE REPORT TABLE VIS

    var lookerDataTable = new LookerDataTable(data, queryResponse, config)
    this.trigger('registerOptions', lookerDataTable.getConfigOptions())
    buildReportTable(config, lookerDataTable, updateColumnOrder)

    console.log('queryResponse', queryResponse)
    console.log('lookerDataTable', lookerDataTable)

    done();
  }
})