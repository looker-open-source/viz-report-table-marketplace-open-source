/* https://raw.githack.com/ContrastingSounds/Looker-Custom-Vis/master/report_table/report_table.js */
/* Dependency: https://cdnjs.cloudflare.com/ajax/libs/d3/5.15.0/d3.min.js */

const formatter = d3.format(',.2f')


const options = {
  columnOrder: {},
  subtotalDepth: {
    section: "Table",
    type: "number",
    label: "Sub Total Depth",
    default: 1
  },
  indexColumn: {
    section: "Table",
    type: "boolean",
    label: "Use Index Dimension",
    default: "false",
  },
  sortColumnsBy: {
    section: "Table",
    type: "string",
    display: "select",
    label: "Sort Columns By",
    values: [
      { 'Pivots': 'getSortByPivots' },
      { 'Measures': 'getSortByMeasures' }
    ],
    default: "getSortByPivots",
  },
  spanRows: {
    section: "Table",
    type: "boolean",
    label: "Span Rows",
    display_size: 'half',
    default: "true",
  },
  spanCols: {
    section: "Table",
    type: "boolean",
    label: "Span Cols",
    display_size: 'half',
    default: "true",
  },
  rowSubtotals: {
    section: "Table",
    type: "boolean",
    label: "Row Subtotals",
    display_size: 'half',
    default: "true",
  },
  colSubtotals: {
    section: "Table",
    type: "boolean",
    label: "Col Subtotals",
    display_size: 'half',
    default: "true",
  },
  // my_object_list: {
  //   type: 'object_list',
  //   label: 'My cool object list',
  //   newItem: {
  //     my_color: '#F0000D',
  //     label_position: 'right',
  //     my_number: 7,
  //     my_dropdown: 'three',
  //     show_label: true
  //   },
  //   options: {
  //     my_dropdown: {
  //       label: 'Dropdown stuff',
  //       type: 'string',
  //       display: 'select',
  //       values: [
  //         { One: 'one' },
  //         { Two: 'two' },
  //         { Three: 'three' },
  //         { Four: 'four' }
  //       ],
  //       order: 3
  //     },
  //     my_number: {
  //       label: 'A number',
  //       type: 'number',
  //       default: 7,
  //       placeholder: 'Positive integer (1,2,3...)',
  //       step: 1,
  //       min: 1,
  //       order: 4,
  //     },
  //     my_color: {
  //       type: 'string',
  //       display: 'color',
  //       label: 'Color'
  //     },
  //     my_boolean: {
  //       type: 'boolean',
  //       label: 'Hide or show a thing',
  //       order: 9
  //     },
  //   }
  // }
}

/**
 * Builds new config object based on available dimensions and measures
 * @param {*} table 
 */
const getNewConfigOptions = function(table) {
  newOptions = options;

  for (var i = 0; i < table.dimensions.length; i++) {
    newOptions['label|' + table.dimensions[i].name] = {
      section: 'Dimensions',
      type: 'string',
      label: table.dimensions[i].label,
      default: table.dimensions[i].label,
      order: i * 10 + 1,
    }

    newOptions['hide|' + table.dimensions[i].name] = {
      section: 'Dimensions',
      type: 'boolean',
      label: 'Hide',
      display_size: 'third',
      order: i * 10 + 2,
    }
  }

  for (var i = 0; i < table.measures.length; i++) {
    newOptions['label|' + table.measures[i].name] = {
      section: 'Measures',
      type: 'string',
      label: table.measures[i].label_short || table.measures[i].label,
      default: table.measures[i].label_short || table.measures[i].label,
      order: 100 + i * 10 + 1,
    }

    newOptions['style|' + table.measures[i].name] = {
      section: 'Measures',
      type: 'string',
      label: 'Style',
      display: 'select',
      values: [
        {'Normal': 'normal'},
        {'Black/Red': 'black_red'},
        {'Hide': 'hide'}
      ],
      order: 100 + i * 10 + 2
    }

    comparisonOptions = []
    // pivoted measures
    if (table.measures[i].can_pivot) {
      pivotComparisons = []
      for (var p = 0; p < table.pivot_fields.length; p++) {
        var option = {}
        option['By ' + table.pivot_fields[p]] = table.pivot_fields[p]
        pivotComparisons.push(option)
      }
      comparisonOptions = comparisonOptions.concat(pivotComparisons)
    }
    // row totals and supermeasures
    for (var j = 0; j < table.measures.length; j++) {
      var includeMeasure = table.measures[i].can_pivot === table.measures[j].can_pivot
                            || 
                          table.has_row_totals && !table.measures[j].is_table_calculation         
      if (i != j && includeMeasure) {
        var option = {}
        option['vs. ' + table.measures[j].label] = table.measures[j].name
        comparisonOptions.push(option)
      }
    }
    comparisonOptions.unshift({ '(none)': 'no_variance'})

    newOptions['comparison|' + table.measures[i].name] = {
      section: 'Measures',
      type: 'string',
      label: 'Comparison', // for ' + ( table.measures[i].label_short || table.measures[i].label ),
      display: 'select',
      values: comparisonOptions,
      order: 100 + i * 10 + 5
    }

    newOptions['switch|' + table.measures[i].name] = {
      section: 'Measures',
      type: 'boolean',
      label: 'Switch',
      display_size: 'third',
      order: 100 + i * 10 + 6,
    }

    newOptions['var_num|' + table.measures[i].name] = {
      section: 'Measures',
      type: 'boolean',
      label: 'Var #',
      display_size: 'third',
      order: 100 + i * 10 + 7,
    }

    newOptions['var_pct|' + table.measures[i].name] = {
      section: 'Measures',
      type: 'boolean',
      label: 'Var %',
      display_size: 'third',
      order: 100 + i * 10 + 8,
    }
  }
  return newOptions
}

const buildReportTable = function(config, lookerData, callback) {
  var dropTarget = null;
  
  var table = d3.select('#visContainer')
    .append('table')
    .attr('class', 'reportTable');

  var drag = d3.drag()
    .on('start', (source, idx) => {
      // console.log('drag start', source, idx)
    })
    // .on('drag', (source, idx) => {
    //   console.log('drag drag', source, idx, d3.event.x, d3.event.y)
    // })
    .on('end', (source, idx) => {
      movingColumn = lookerData.getColumnById(source.id)
      targetColumn = lookerData.getColumnById(dropTarget.id)
      movingIdx = Math.floor(movingColumn.pos/10) * 10
      targetIdx = Math.floor(targetColumn.pos/10) * 10
      console.log('DRAG FROM', movingColumn, movingIdx, 'to', targetColumn, targetIdx)
      lookerData.moveColumns(config, movingIdx, targetIdx, callback)
    })

  table.append('thead')
    .selectAll('tr')
    .data(lookerData.getLevels()).enter() 
      .append('tr')
      .selectAll('th')
      .data(function(level, i) { 
        return lookerData.getColumnsToDisplay(i).map(function(column) {
          var header = {
            'id': column.id,
            'text': '',
            'align': column.align,
            'colspan': column.colspans[i]
          }
          if (lookerData.sortColsBy == 'getSortByPivots') {
            if (i < column.levels.length && column.pivoted) {
              header.text = column.levels[i]
            } else if (i === column.levels.length) {
              header.text = column.getLabel()
            } else {
              header.text = ''
            }
          } else {
            if (i == 0) {
              header.text = column.getLabel()
            } else {
              header.text = column.levels[i - 1]
            }
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
    .data(lookerData.data).enter()
      .append('tr')
      .selectAll('td')
      .data(function(row) {  
        return lookerData.getRow(row).map(function(column) {
          var cell = row.data[column.id]
          cell.rowspan = column.rowspan
          cell.align = column.align
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

  console.log(table)
}

looker.plugins.visualizations.add({
  options: options,

  create: function(element, config) {
    loadStylesheets();
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const updateColumnOrder = newOrder => {
      console.log('updateColumnOrder()', JSON.stringify(newOrder, null, 2))
      this.trigger('updateConfig', [{columnOrder: newOrder}])
    }

    this.clearErrors();

    console.log('data', data)
    console.log('config', config)
    console.log('queryResponse', queryResponse)

    if (queryResponse.fields.pivots.length > 2) {
      this.addError({
        title: 'Max Two Pivots',
        message: 'This visualization accepts no more than 2 pivot fields.'
      });
      return
    }

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
    lookerDataTable = new LookerDataTable(data, queryResponse, config)
    console.log(lookerDataTable)

    new_options = getNewConfigOptions(lookerDataTable)
    this.trigger('registerOptions', new_options)

    buildReportTable(config, lookerDataTable, updateColumnOrder)

    done();
  }
})