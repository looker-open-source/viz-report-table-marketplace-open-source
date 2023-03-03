/**
 * Returns an array of given length, all populated with same value
 * Convenience function e.g. to initialise arrays of zeroes or nulls
 * @param {*} length 
 * @param {*} value 
 */
const newArray = function(length, value) {
  var arr = []
  for (var l = 0; l < length; l++) {
    arr.push(value)
  }
  return arr
}

class ModelField {
  constructor({ vis, queryResponseField }) {
    this.vis = vis
    this.name = queryResponseField.name
    this.view = queryResponseField.view_label || ''
    this.label = queryResponseField.label_short || queryResponseField.label
    this.is_numeric = typeof queryResponseField.is_numeric !== 'undefined' ? queryResponseField.is_numeric : false
    this.is_array = ['list', 'number_list', 'location', 'tier'].includes(queryResponseField.type)
    this.value_format = queryResponseField.value_format ? queryResponseField.value_format : ''

    this.geo_type = ''
    if (queryResponseField.type === 'location' || queryResponseField.map_layer) {
      this.geo_type = queryResponseField.type === 'location' ? 'location' : queryResponseField.map_layer.name
    } 

    this.hide = false
    if (typeof this.vis.config['hide|' + this.name] !== 'undefined') {
      if (this.vis.config['hide|' + this.name]) {
        this.hide = true
      } 
    }

    this.style = ''
    var style_setting = this.vis.config['style|' + this.name]
    if (typeof style_setting !== 'undefined') {
      if (style_setting === 'hide') {
        this.hide = true
      } else {
        this.style = style_setting
      }
    }

    this.heading = ''
    this.short_name = ''
    this.unit = ''
    if (typeof queryResponseField.tags !== 'undefined') {
      queryResponseField.tags.forEach(tag => {
        var tags = tag.split(':')
        if (tags[0] === 'vis-tools') {
          switch (tags[1]) {
            case 'heading':
              this.heading = tags[2] ; break
            case 'short_name':
              this.short_name = tags[2] ; break
            case 'unit':
              this.unit = tags[2] ; break
            case 'style':
              this.style = tags[2] ; break
          }
        }
      })
    }
  }
}

class ModelDimension extends ModelField {
  constructor({ vis, queryResponseField }) {
    super({ vis, queryResponseField })

    this.type = 'dimension'    
    this.align = 'left'
  }
}

class ModelPivot extends ModelField {
  constructor({ vis, queryResponseField }) {
    super({ vis, queryResponseField })

    this.type = 'pivot'    
    this.align = 'center'
  }
}

class ModelMeasure extends ModelField {
  constructor({ vis, queryResponseField, can_pivot }) {
    super({ vis, queryResponseField })

    this.type = 'measure'
    this.align = 'right'

    this.is_table_calculation = typeof queryResponseField.is_table_calculation !== 'undefined' ? queryResponseField.is_table_calculation : false
    this.calculation_type = queryResponseField.type
    this.is_turtle = typeof queryResponseField.is_turtle !== 'undefined' ? queryResponseField.is_turtle : false
    this.can_pivot = can_pivot
  }
}

class HeaderCell {
  constructor({ column, type, label = null, align = '', cell_style = [], modelField = { name: '', label: '', view: '' }, pivotData = {} } = { column, type, label, align, cell_style, modelField, pivotData }) {
    this.id = [column.id, type].join('.')
    this.column = column
    this.type = type
    this.colspan = 1
    this.rowspan = 1
    this.headerRow = true
    this.cell_style = ['headerCell'].concat(cell_style)
    this.label = label

    this.align = align ? align : this.column.modelField.is_numeric ? 'right' : 'left'

    this.modelField = modelField
    this.pivotData = pivotData

    if (modelField.type) { this.cell_style.push(modelField.type)}
    if (modelField.is_table_calculation) { this.cell_style.push('calculation')}
  }
}

/**
 * types: dimension | line_item | subtotal | total
 */
class Series {
  constructor({ keys, values, types = [] }) {
    if (keys.length === values.length ) {
      this.keys = keys
      this.values = values
      this.types = types

      var line_items_only = []
      var with_subtotals = []

      this.values.forEach((value, i) => {
        this.types[i] = typeof types[i] !== 'undefined' ? types[i] : 'line_item'
        if (this.types[i] === 'line_item') {
          line_items_only.push(value)
          with_subtotals.push(value)
        } else if (this.types[i] === 'subtotal') {
          with_subtotals.push(value)
        }
      })

      this.min_for_display = Math.min(...with_subtotals)
      this.max_for_display = Math.max(...with_subtotals)
      this.min = Math.min(...line_items_only)
      this.max = Math.max(...line_items_only)
      this.sum = line_items_only.reduce((a, b) => a + b, 0)
      this.count = line_items_only.length
      this.avg = line_items_only.length > 0 ? this.sum / line_items_only.length : null
    } else {
      ('Could not construct series, arrays were of different length.')
    }
  }
}

class CellSeries {
  constructor({ column, row, sort_value, series}) {
    this.column = column
    this.row = row
    this.sort_value = sort_value
    this.series = new Series(series)
  }

  toString() {
    var rendered = ''
    this.series.keys.forEach((key, i) => {
      rendered += key + ':'
      var formatted_value = this.column.modelField.value_format === '' 
                            ? this.series.values[i].toString() 
                            : SSF.format(this.column.modelField.value_format, this.series.values[i])
      rendered += formatted_value + ' '
    })
    return rendered
  }
}

class ColumnSeries {
  constructor({ column, is_numeric, series }) {
    this.column = column
    this.is_numeric = is_numeric
    this.series = new Series(series)
  }
}

class DataCell {
  constructor({ value, rendered = null, html = null, links = [], cell_style = [], align = 'right', rowspan = 1, colspan = 1, rowid = '', colid = '' } = {})
    {
      this.value = value
      this.rendered = rendered
      this.html = html
      this.links = links
      this.cell_style = ['rowCell'].concat(cell_style)
      this.align = align
      this.rowspan = rowspan
      this.colspan = colspan

      this.colid = colid
      this.rowid = rowid
      this.id = colid && rowid ? [colid, rowid].join('.') : null

      if (this.value === null && this.rendered !== '∞') {
        this.rendered = '∅'
      }
    }
}

/**
 * Represents a row in the dataset that populates the vis.
 * This may be an addtional row (e.g. subtotal) not in the original query
 * @class
 */
class Row {
  constructor(type = 'line_item') {
    this.id = ''
    // this.modelField = null
    this.hide = false
    this.type = type  // line_item | subtotal | total
    this.sort = []    // [ section, subtotal group, row number ]
    this.data = {}    // Indexed by Column.id
                      // { value: any, rendered: string, html?: string, links?: array }
  }

  sortArray () {
    return this.sort
  }
}

/**
 * Represents a column in the dataset that populates the vis.
 * This may be an additional columns (e.g. subtotal, variance) not in the original query
 * 
 * Ensures all key vis properties (e.g. 'label') are consistent across different field types
 * 
 * @class
 */
class Column {
  constructor(id, vis, modelField) {
    this.id = id
    this.vis = vis
    this.modelField = modelField
    this.transposed = false

    this.idx = 0
    this.pos = 0
    this.levels = []
    this.pivot_key = '' 

    this.unit = modelField.unit || ''
    this.hide = modelField.hide || false
    this.isVariance = false
    this.variance_type = null
    this.pivoted = false
    this.isRowTotal = false
    this.super = false
    this.subtotal = false
    this.subtotal_data = {}
    
    this.series = null

    this.sort = []
    this.colspans = []
  }

  /**
   * Returns a header label for a column, to display in table vis
   * @param {*} level
   */
  getHeaderCellLabel (level) {
    var headerCell = this.levels[level]

    if (headerCell.label !== null) {
      var label = headerCell.label
    } else {
      var label = headerCell.modelField.label
      var header_setting = this.vis.config['heading|' + headerCell.modelField.name]
      var label_setting = this.vis.config['label|' + headerCell.modelField.name]

      if (headerCell.type === 'heading') {
        if (typeof header_setting !== 'undefined') {
          label = header_setting ? header_setting : headerCell.modelField.heading
        } else {
          label = headerCell.modelField.heading
        }
        return label
      }

      if (headerCell.type === 'field') {
        label = this.vis.useShortName
          ? headerCell.modelField.short_name || headerCell.modelField.label 
          : headerCell.modelField.label
        
        if (typeof label_setting !== 'undefined' && label_setting !== this.modelField.label) {
          label = label_setting ? label_setting : label
        }

        if (this.isVariance) {
          if (this.vis.groupVarianceColumns) {
            if (this.vis.pivot_values.length === 2) {
              label = this.variance_type === 'absolute' ? label + ' #' : label + ' %'
            } else {
              label = this.variance_type === 'absolute' ? label + ' Var #' : label + ' Var %'
            }
          } else {
            label = this.variance_type === 'absolute' ? 'Var #' : 'Var %'
          }
        }
    
        if (typeof this.vis.useViewName !== 'undefined' && this.vis.useViewName) {
          label = [this.modelField.view, label].join(' ') 
        }
      }

      if (headerCell.type === 'pivot') {
        if (this.isVariance && this.vis.groupVarianceColumns) {
          if (this.vis.pivot_values.length === 2) {
            label = 'Variance'
          } else {
            label = 'Var ' + label
          }
        }
      }
    }

    return label
  }

  getHeaderCellLabelByType (type) {
    for (var i = 0; i < this.vis.headers.length; i++) {
      if (type === this.vis.headers[i].type) {
        return this.getHeaderCellLabel(i)
      }
    }
    return null
  }

  setHeaderCellLabels () {
    this.levels.forEach((level, i) => {
      level.label = level.label === null ? this.getHeaderCellLabel(i) : level.label
    })
  }

  getHeaderData () {
    var headerData = {}
    this.modelField.vis.headers.forEach((header, i) => {
      headerData[header.type] = this.levels[i]
    })

    return headerData
  }
}


export {
  newArray,
  ModelDimension,
  ModelPivot,
  ModelMeasure,
  CellSeries,
  ColumnSeries,
  HeaderCell,
  DataCell,
  Row,
  Column
};
