// const { LookerDataTable } = require('vis-tools') 
const { LookerDataTable } = require('../../vis-tools/looker_data_table.js')
const d3 = require('./d3loader')

const themes = {
  traditional: require('./traditional_report_table.css'),
  looker: require('./looker_report_table.css'),
  contemporary: require('./contemporary_report_table.css'),

  fixed: require('./fixed_layout.css'),
  auto: require('./auto_layout.css')
}

const removeStyles = async function() {
  Object.keys(themes).forEach(async (theme) => await themes[theme].unuse() )
}


const buildReportTable = function(config, lookerDataTable, callback) {
  var dropTarget = null;

  removeStyles().then(() => {
    themes[config.theme].use()
    themes[config.layout].use()
  })

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
        lookerDataTable.moveColumns(movingIdx, targetIdx, callback)
      }
    })

  table.append('thead')
    .selectAll('tr')
    .data(lookerDataTable.getLevels()).enter() 
      .append('tr')
      .selectAll('th')
      .data(function(level, i) { 
        return lookerDataTable.getColumnsToDisplay(i).map(function(column) {
          var labelParams = {
            hasPivots: lookerDataTable.has_pivots,
            level: i,
          }

          var header = {
            'id': column.id,
            'text': column.getLabel(labelParams),
            'align': column.parent.align,
            'colspan': column.colspans[i],
            'type': column.parent.type,
            'calculation': column.parent.is_table_calculation
          }

          if (lookerDataTable.useHeadings && !lookerDataTable.has_pivots && i === 0) {
            header.align = 'center'
            header.headerRow = true
          } else if (lookerDataTable.has_pivots && i < lookerDataTable.pivot_fields.length) {
            header.align = 'center'
            header.headerRow = true
          }
          
          return header
        })
      }).enter()
          .append('th')
          .text(d => d.text)
          .attr('id', d => d.id)
          .attr('colspan', d => d.colspan)
          .attr('class', d => {
            var classes = ['reportTable', 'headerCell']
            if (typeof d.align !== 'undefined') { classes.push(d.align) }
            if (typeof d.type !== 'undefined') { classes.push(d.type) }
            if (typeof d.calculation !== 'undefined' && d.calculation) { classes.push('calculation') }
            if (typeof d.headerRow !== 'undefined' && d.headerRow) { classes.push('headerRow') }
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
          cell.colid = column.id
          cell.rowid = row.id
          cell.rowspan = column.rowspan
          cell.align = column.parent.align
          return cell;
        })
      }).enter()
        .append('td')
          .text(d => {
            if (typeof d.value === 'object') {
              return null
            } else {
              return typeof d.rendered !== 'undefined' ? d.rendered : d.value   
            }
          }) 
          .attr('rowspan', d => d.rowspan)
          .attr('class', d => {
            var classes = ['reportTable', 'rowCell']
            if (typeof d.value === 'object') { classes.push('cellSeries') }
            if (typeof d.align !== 'undefined') { classes.push(d.align) }
            if (typeof d.cell_style !== 'undefined') { classes = classes.concat(d.cell_style) }
            return classes.join(' ')
          })

  table.selectAll('.cellSeries').append('svg')
        .attr('height', 16)
      .append('g')
        .attr('class', '.cellSeriesChart')
      .selectAll('rect')
      .data(d => {
        values = []
        for (var i = 0; i < d.value.series.keys.length; i++) {
          values.push({
            idx: i,
            max: 10000,
            key: d.value.series.keys[i],
            value: d.value.series.values[i],
            type: d.value.series.types[i],
          })
        }
        return values.filter(value => value.type === 'line_item')
      }).enter()
        .append('rect')
          .style('fill', 'steelblue')
          .attr('x', value => {
            console.log('inside cellSeries this', this)
            console.log('inside cellSeries this', this)
            console.log('inside cellSeries rect value', value)
            return value.idx * 5
          })
          .attr('y', value => Math.floor(16 - (value.value / value.max * 16)))
          .attr('width', 5)
          .attr('height', value => Math.floor(value.value / value.max * 16))
    
  console.log('table', table)
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

    console.log('queryResponse', queryResponse)
    console.log('data', data)

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

    console.log('lookerDataTable', lookerDataTable)
    console.log('container', this.container)

    done();
  }
})