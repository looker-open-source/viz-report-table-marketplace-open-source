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

const use_minicharts = false

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


const buildReportTable = function(config, lookerDataTable, callback) {
  var dropTarget = null;

  removeStyles().then(() => {
    if (typeof config.customTheme !== 'undefined' && config.customTheme && config.theme === 'custom') {
      loadStylesheet(config.customTheme)
    } else if (typeof themes[config.theme] !== 'undefined') {
      themes[config.theme].use()
    }
    if (typeof themes[config.layout] !== 'undefined') {
      themes[config.layout].use()
    }
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


  var header_rows = table.append('thead')
    .selectAll('tr')
    .data(lookerDataTable.getLevels()).enter() 


  var header_cells = header_rows.append('tr')
    .selectAll('th')
    .data(function(level, i) { 
      return lookerDataTable.getTableHeaders(i).map(function(column) {
        // console.log('buildReportTable() level', i, ' column.id:', column.id)

        var header = {
          'id': column.id,
          'text': column.getLabel(i),
          'align': typeof column.parent !== 'undefined' ? column.parent.align : 'left',
          'colspan': typeof column.colspans !== 'undefined' ? column.colspans[i] : 1,
          'type': typeof column.parent !== 'undefined' ? column.parent.type : 'measure',
          'calculation': typeof column.parent !== 'undefined' ? column.parent.is_table_calculation : false
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

  header_cells.append('th')
    .text(d => d.text)
    .attr('id', d => d.id)
    .attr('colspan', d => d.colspan)
    .attr('class', d => {
      // if (d.id === '$$$_index_$$$') { console.log('buildReportTable() adding index field', d.id, d.colspan)}
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


  var table_rows = table.append('tbody')
    .selectAll('tr')
    .data(lookerDataTable.getDataRows()).enter()
      .append('tr')
      .selectAll('td')
      .data(function(row) {  
        return lookerDataTable.getTableColumns(row).map( column => {
          var cell = row.data[column.id]

          cell.colid = column.id
          cell.rowid = row.id
          cell.rowspan = column.rowspan
          cell.align = column.parent.align

          return cell;
        })
      }).enter()

  table_rows.append('td')
    .text(d => {
      if (typeof d.value === 'object') {
        return null
      } else if (typeof d.html !== 'undefined') {
        var parser = new DOMParser()
        var parsed_html = parser.parseFromString(d.html, 'text/html')
        return parsed_html.documentElement.textContent
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
    .on('click', d => {
      console.log('click d', d)
      console.log('click event', d3.event)
      LookerCharts.Utils.openDrillMenu({
        links: d.links,
        event: d3.event
      })
    })

  if (use_minicharts) {
    var barHeight = 16
    var minicharts = table.selectAll('.cellSeries')
          .append('svg')
            .attr('height', d => barHeight)
            .attr('width', '100%')
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

    
    var cellWidth = table.selectAll('.cellSeries')._groups[0][0].clientWidth
    var barWidth = Math.floor( cellWidth / 10 )
    console.log('cellWidth', cellWidth)
    console.log('barHeight', barHeight)
    console.log('barWidth', barWidth)

    minicharts.append('rect')
      .style('fill', 'steelblue')
      .attr('x', value => {
        return value.idx * barWidth
      })
      .attr('y', value => barHeight - Math.floor(value.value / value.max * barHeight))
      .attr('width', barWidth)
      .attr('height', value => Math.floor(value.value / value.max * barHeight))

      
    console.log('table', table)    
  }

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

    done();
  }
})