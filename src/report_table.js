const { VisPluginTableModel } = require('../../vis-tools/vis_table_plugin.js')
const d3 = require('./d3loader')

const themes = {
  traditional: require('./theme_traditional.css'),
  looker: require('./theme_looker.css'),
  contemporary: require('./theme_contemporary.css'),

  fixed: require('./layout_fixed.css'),
  auto: require('./layout_auto.css')
}

const BBOX_X_ADJUST = 10
const BBOX_Y_ADJUST = 10

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





const buildReportTable = function(config, dataTable, updateColumnOrder, element) {
  // document.getElementById('visContainer').classList.add('hidden')
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

  const renderTable = async function() {
  var table = d3.select('#visContainer')
    .append('table')
      .attr('id', 'reportTable')
      .attr('class', 'reportTable');

  var drag = d3.drag()
    .on('start', (source, idx) => {
      if (!dataTable.has_pivots) {
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
      if (!dataTable.has_pivots) {
        d3.select("#tooltip") 
          .style("left", d3.event.x + "px")
          .style("top", d3.event.y + "px")  
      }
      
    })
    .on('end', (source, idx) => {
      if (!dataTable.has_pivots) {
        d3.select("#tooltip").classed("hidden", true);
        var movingColumn = dataTable.getColumnById(source.id)
        var targetColumn = dataTable.getColumnById(dropTarget.id)
        var movingIdx = Math.floor(movingColumn.pos/10) * 10
        var targetIdx = Math.floor(targetColumn.pos/10) * 10
        // console.log('DRAG FROM', movingColumn, movingIdx, 'TO', targetColumn, targetIdx)
        dataTable.moveColumns(movingIdx, targetIdx, updateColumnOrder)
      }
    })

  var header_rows = table.append('thead')
    .selectAll('tr')
    .data(dataTable.getHeaderTiers()).enter() 

  var header_cells = header_rows.append('tr')
    .selectAll('th')
    .data((level, i) => dataTable.getTableHeaderCells(i).map(column => column.levels[i]))
      .enter()    

  header_cells.append('th')
    .text(d => d.label)
    .attr('id', d => d.id)
    .attr('colspan', d => d.colspan)
    .attr('rowspan', d => d.rowspan)
    .attr('class', d => {
      var classes = ['reportTable']
      if (typeof d.align !== 'undefined') { classes.push(d.align) }
      if (typeof d.cell_style !== 'undefined') { classes = classes.concat(d.cell_style) }
      return classes.join(' ')
    })
    .attr('style', d => {
      if (10 <= config.headerFontSize <= 20) {
        var setting = ['font-size:', Math.floor(config.headerFontSize), 'px'].join('')
        return setting
      } else {
        return ''
      }
    })
    .attr('draggable', true)
    .call(drag)
    .on('mouseover', cell => dropTarget = cell)
    .on('mouseout', () => dropTarget = null)


  var table_rows = table.append('tbody')
    .selectAll('tr')
    .data(dataTable.getDataRows()).enter()
      .append('tr')
      .selectAll('td')
      .data(row => dataTable.getTableRowColumns(row).map(column => row.data[column.id]))
        .enter()

  table_rows.append('td')
    .text(d => {
      var text = ''
      if (Array.isArray(d.value)) {                     // cell is a list or number_list
        text = !(d.rendered === null) ? d.rendered : d.value.join(' ')
      } else if (typeof d.value === 'object') {         // cell is a turtle
        text = null
      } else if (d.html) {                              // cell has HTML defined
        var parser = new DOMParser()
        var parsed_html = parser.parseFromString(d.html, 'text/html')
        text = parsed_html.documentElement.textContent
      } else if (d.rendered || d.rendered === '') {     // could be deliberate choice to render empty string
        text = d.rendered
      } else {
        text = d.value   
      }
      text = String(text)
      return text ? text.replace('-', '\u2011') : text
    }) 
    .attr('rowspan', d => d.rowspan)
    .attr('colspan', d => d.colspan)
    .attr('style', d => {
      if (10 <= config.bodyFontSize <= 20) {
        var setting = ['font-size:', Math.floor(config.bodyFontSize), 'px'].join('')
        return setting
      } else {
        return ''
      }
    })
    .attr('class', d => {
      var classes = ['reportTable']
      if (typeof d.value === 'object') { classes.push('cellSeries') }
      if (typeof d.align !== 'undefined') { classes.push(d.align) }
      if (typeof d.cell_style !== 'undefined') { classes = classes.concat(d.cell_style) }
      return classes.join(' ')
    })
    .on('click', d => {
      console.log('click d:', d)
      console.log('click event:', d3.event)
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

  var addOverlay = () => {
    // console.log('table', table)
    // console.log('parent', element.parentNode)
    // console.log('parent offsetLeft offsetTop', element.parentNode.offsetLeft, element.parentNode.offsetTop)
    // console.log('parent bounding rect', element.parentNode.getBoundingClientRect())
    // console.log('element bounding rect', element.getBoundingClientRect())
    // console.log('visContainer bounding rect', document.getElementById('visContainer').getBoundingClientRect())
    // console.log('visSvg bounding rect', document.getElementById('visSvg').getBoundingClientRect())

    var viewbox_width = document.getElementById('reportTable').clientWidth
    var viewbox_height = document.getElementById('reportTable').clientHeight
    // var x_adjust = element.getBoundingClientRect().x
    // var y_adjust = element.getBoundingClientRect().height + CONTAINER_TOP_MARGIN

    // console.log('Table...')
    // console.log(viewbox_width)
    // console.log(viewbox_height)
    // console.log(x_adjust)
    // console.log(y_adjust)

    var allRects = []
    d3.selectAll('th')
      .select(function(d, i) {
        var bbox = this.getBoundingClientRect()
        // console.log('header d.id x y', d.id, bbox.x, bbox.y, bbox.top, bbox.left)
        allRects.push({
          index: i,
          data: d,
          x: bbox.x - BBOX_X_ADJUST, // - bbox.left, // - x_adjust,
          y: bbox.y - BBOX_Y_ADJUST, // - bbox.top, // - y_adjust,
          width: bbox.width,
          height: bbox.height
        })
      })

    d3.selectAll('td')
    .select(function(d, i) {
      var bbox = this.getBoundingClientRect()
      allRects.push({
        index: i,
        data: d,
        x: bbox.x - BBOX_X_ADJUST, // - bbox.left, // - x_adjust,
        y: bbox.y - BBOX_Y_ADJUST, // - bbox.top, // - y_adjust,
        width: bbox.width,
        height: bbox.height
      })
    })

    // console.log('rects', config.transposeTable, allRects.map(rect => {
    //   var debug = [rect.x, rect.y, rect.data.id].join(' ')
    //   return debug
    // }))

    var overlay = d3.select('#visSvg')
      .attr('width', viewbox_width)
      .attr('height', viewbox_height)
      .selectAll('rect')
        .data(allRects, d => d.data.id)
        .join(
            enter => enter.append('rect')
                .attr('x', d => d.x)
                .attr('y', d => -2000)
                .attr('width', d => d.width)
                .attr('height', d => d.height)
                .style('fill', 'none')
                .style("stroke", "red")
                .style("stroke-width", 1)
                .style('stroke-dasharray', '4')
              .call(
                enter => enter.transition().duration(1000)
                  .attr('x', d => d.x)
                  .attr('y', d => d.y)
                  .attr('width', d => d.width)
                  .attr('height', d => d.height)
                  .style('fill', 'none')
                  .style('stroke', 'red')
                  .style("stroke-width", 1)
              ),
            update => update
              .call(
                update => update.transition().duration(1000)
                  .attr('x', d => d.x)
                  .attr('y', d => d.y)
                  .attr('width', d => d.width)
                  .attr('height', d => d.height)
                  .style('stroke', 'red')
              ),
            exit => exit
                .attr('stroke', 'red')
              .call(
                exit => exit.transition().duration(1000)
                  .attr('y', 2000)
                  .remove()
              )
        )
  }

  renderTable().then(() => {
    if (config.customTheme === 'animate') {
      document.getElementById('visSvg').classList.remove('hidden')
      // setTimeout(addOverlay, 1000)
      addOverlay()
      // document.getElementById('visContainer').classList.remove('hidden')
    } else {
      document.getElementById('visSvg').classList.add('hidden')
      // document.getElementById('visContainer').classList.remove('hidden')
    }
  })

}

looker.plugins.visualizations.add({
  options: VisPluginTableModel.getCoreConfigOptions(),

  create: function(element, config) {
    // this.tableContainer = d3.select(element)
    //   .append('div')
    //   .attr('id', 'visContainer')

    this.svgContainer = d3.select(element)
      .append("svg")
      .attr("id", "visSvg")
      .attr("width", element.clientWidth)
      .attr("height", element.clientHeight);

    this.tooltip = d3.select(element)
      .append("div")
      .attr("class", "hidden")
      .attr("id", "tooltip")
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const updateColumnOrder = newOrder => {
      this.trigger('updateConfig', [{ columnOrder: newOrder }])
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

    // INITIALISE THE VIS

    try {
      var elem = document.querySelector('#visContainer');
      elem.parentNode.removeChild(elem);  
    } catch(e) {}    

    this.container = d3.select(element)
      .append('div')
      .attr('id', 'visContainer')
      .attr('class')

    if (typeof config.columnOrder === 'undefined') {
      this.trigger('updateConfig', [{ columnOrder: {} }])
    }


    // BUILD THE VIS
    // 1. Create object
    // 2. Register options
    // 3. Build vis

    var dataTable = new VisPluginTableModel(data, queryResponse, config)
    this.trigger('registerOptions', dataTable.getConfigOptions())
    buildReportTable(config, dataTable, updateColumnOrder, element)

    // DEBUG OUTPUT AND DONE
    console.log('dataTable', dataTable)
    console.log('container', this.container)

    done();
  }
})