import SSF from "ssf"
import { cloneDeep } from "lodash"

import { 
  ModelDimension, 
  ModelPivot, 
  ModelMeasure, 
  CellSeries, 
  ColumnSeries, 
  Row, 
  Column, 
  DataCell, 
  HeaderCell 
} from './vis_primitives'

const tableModelCoreOptions = {
  theme: {
    section: "Theme",
    type: "string",
    display: "select",
    label: "Theme",
    values: [
      { 'Traditional': 'traditional' },
      { 'Looker': 'looker' },
      { 'Contemporary': 'contemporary' },
      { 'Use custom theme': 'custom'}
    ],
    default: "traditional",
    order: 1,
  },
  customTheme: {
    section: "Theme",
    type: "string",
    label: "Load custom CSS from:",
    default: "",
    order: 2,
  },
  layout: {
    section: "Theme",
    type: "string",
    display: "select",
    label: "Layout",
    values: [
      { 'Even': 'fixed' },
      { 'Auto': 'auto' }
    ],
    default: "fixed",
    order: 3,
  },
  minWidthForIndexColumns: {
    section: 'Theme',
    type: 'boolean',
    label: "Automatic column width on index",
    default: true,
    order: 3.5
  },
  headerFontSize: {
    section: 'Theme',
    type: 'number',
    display_size: 'half',
    label: 'Header Size',
    default: 12,
    order: 4,
  },
  bodyFontSize: {
    section: 'Theme',
    type: 'number',
    display_size: 'half',
    label: 'Body Size',
    default: 12,
    order: 5,
  },
  showTooltip: {
    section: 'Theme',
    type: 'boolean',
    display_size: 'half',
    label: "Show tooltip",
    default: true,
    order: 6
  },
  showHighlight: {
    section: 'Theme',
    type: 'boolean',
    display_size: 'half',
    label: "Show highlight",
    default: true,
    order: 7
  },

  columnOrder: {},
  
  rowSubtotals: {
    section: "Table",
    type: "boolean",
    label: "Row Subtotals",
    display_size: 'half',
    default: false,
    order: 1,
  },
  colSubtotals: {
    section: "Table",
    type: "boolean",
    label: "Col Subtotals",
    display_size: 'half',
    default: false,
    order: 2,
  },
  spanRows: {
    section: "Table",
    type: "boolean",
    label: "Merge Dims",
    display_size: 'half',
    default: true,
    order: 3,
  },
  spanCols: {
    section: "Table",
    type: "boolean",
    label: "Merge Headers",
    display_size: 'half',
    default: true,
    order: 4,
  },
  calculateOthers: {
    section: "Table",
    type: "boolean",
    label: "Calculate Others Row",
    default: true,
    order: 4.5
  },
  sortColumnsBy: {
    section: "Table",
    type: "string",
    display: "select",
    label: "Sort Columns By",
    values: [
      { 'Pivots': 'pivots' },
      { 'Measures': 'measures' }
    ],
    default: "pivots",
    order: 6,
  },
  useViewName: {
    section: "Table",
    type: "boolean",
    label: "Include View Name",
    default: false,
    order: 7,
  },
  useHeadings: {
    section: "Table",
    type: "boolean",
    label: "Use Headings",
    default: false,
    order: 8,
  },
  useShortName: {
    section: "Table",
    type: "boolean",
    label: "Use Short Name (from model tags)",
    default: false,
    order: 9,
  },
  useUnit: {
    section: "Table",
    type: "boolean",
    label: "Use Unit (when reporting in 000s)",
    default: false,
    order: 9.5,
  },
  groupVarianceColumns: {
    section: "Table",
    type: "boolean",
    label: "Group Variance Columns",
    default: false,
    order: 10,
  },
  genericLabelForSubtotals: {
    section: 'Table',
    type: 'boolean',
    label: "Label all subtotal rows as 'Subtotal'",
    default: false,
    order: 11
  },
  indexColumn: {
    section: "Dimensions",
    type: "boolean",
    label: "Use Last Field Only",
    default: false,
    order: 0,
  },
  transposeTable: {
    section: "Table",
    type: "boolean",
    label: "Transpose Table",
    default: false,
    order: 100,
  },
}
/**
 * Represents an "enriched data object" with additional methods and properties for data vis
 * Takes the data, config and queryResponse objects as inputs to the constructor
 */
class VisPluginTableModel {
  /**
   * Build the LookerData object
   * @constructor
   * 
   * - TODO: add new column series
   * - TODO: Get table column groups
   * 
   * @param {*} lookerData 
   * @param {*} queryResponse 
   * @param {*} config 
   */
  constructor(lookerData, queryResponse, config) {
    this.visId = 'report_table'
    this.config = config

    this.headers = []
    this.dimensions = []
    this.measures = []
    this.columns = []
    this.data = []
    this.subtotals_data = {}

    this.transposed_headers = []
    this.transposed_columns = []
    this.transposed_data = []

    this.pivot_fields = []
    this.pivot_values = typeof queryResponse.pivots !== 'undefined' ? queryResponse.pivots : []
    this.variances = []
    this.column_series = []

    this.firstVisibleDimension = ''

    this.useIndexColumn = config.indexColumn || false
    this.useHeadings = config.useHeadings || false
    this.useShortName = config.useShortName || false
    this.useViewName = config.useViewName || false
    this.addRowSubtotals = config.rowSubtotals || false
    this.addSubtotalDepth = parseInt(config.subtotalDepth)|| this.dimensions.length - 1
    this.addColSubtotals = config.colSubtotals || false
    this.spanRows = false || config.spanRows
    this.spanCols = false || config.spanCols
    this.sortColsBy = config.sortColumnsBy || 'pivots' // matches to Column methods: pivots(), measures)
    this.fieldLevel = 0 // set in addPivotsAndHeaders()
    this.groupVarianceColumns = config.groupVarianceColumns || false
    this.minWidthForIndexColumns = config.minWidthForIndexColumns || false
    this.showTooltip = config.showTooltip || false
    this.showHighlight = config.showHighlight || false
    this.genericLabelForSubtotals = config.genericLabelForSubtotals || false

    this.sorts = queryResponse.sorts
    this.hasTotals = typeof queryResponse.totals_data !== 'undefined' ? true : false
    this.calculateOthers = typeof queryResponse.truncated !== 'undefined' ? queryResponse.truncated && config.calculateOthers : false 
    this.hasSubtotals = typeof queryResponse.subtotals_data !== 'undefined' ? true : false
    this.hasRowTotals = queryResponse.has_row_totals || false
    this.hasPivots = typeof queryResponse.pivots !== 'undefined' ? true : false
    this.hasSupers = typeof queryResponse.fields.supermeasure_like !== 'undefined' ? Boolean(queryResponse.fields.supermeasure_like.length) : false

    this.transposeTable = config.transposeTable || false

    var col_idx = 0
    this.addPivotsAndHeaders(queryResponse)
    this.addDimensions(queryResponse, col_idx)
    this.addMeasures(queryResponse, col_idx)

    this.checkVarianceCalculations()
    if (this.useIndexColumn) { this.addIndexColumn(queryResponse) }
    if (this.hasSubtotals) { this.checkSubtotalsData(queryResponse) }

    this.addRows(lookerData)
    this.addColumnSeries()

    if (this.hasTotals) { this.buildTotals(queryResponse) }
    if (this.spanRows) { this.setRowSpans() }
    if (this.addRowSubtotals) { this.addSubTotals() }
    // console.log('table in progress', this)
    if (this.addColSubtotals && this.pivot_fields.length === 2) { this.addColumnSubTotals() }
    // console.log('addColumnSubTotals() complete')
    if (this.variances) { this.addVarianceColumns() }

    // this.addColumnSeries()    // TODO: add column series for generated columns (eg column subtotals)
    this.sortColumns()
    this.columns.forEach(column => column.setHeaderCellLabels())
    if (this.spanCols) { this.setColSpans() }
    this.applyFormatting()

    if (this.transposeTable) { 
      this.transposeDimensionsIntoHeaders()
      this.transposeRowsIntoColumns() 
      this.transposeColumnsIntoRows()
    }

    this.validateConfig()
    this.getTableColumnGroups() 
  }

  static getCoreConfigOptions() {
    return tableModelCoreOptions
  }

  /**
   * Hook to be called by a Looker custom vis, for example:
   *    this.trigger('registerOptions', VisPluginTableModel.getConfigOptions())
   * 
   * Returns a new config object, combining the core options with dynamic options based on available dimensions and measures
   */
  getConfigOptions() {
    var newOptions = tableModelCoreOptions

    var subtotal_options = []
    this.dimensions.forEach((dimension, i) => {
      newOptions['label|' + dimension.name] = {
        section: 'Dimensions',
        type: 'string',
        label: dimension.label,
        default: dimension.label,
        order: i * 10 + 1,
      }

      newOptions['heading|' + dimension.name] = {
        section: 'Dimensions',
        type: 'string',
        label: 'Heading',
        default: '',
        order: i * 10 + 2,
      }

      newOptions['hide|' + dimension.name] = {
        section: 'Dimensions',
        type: 'boolean',
        label: 'Hide',
        display_size: 'third',
        default: false,
        order: i * 10 + 3,
      }

      if (i < this.dimensions.length - 1) {
        var subtotal_option = {}
        subtotal_option[dimension.label] = (i + 1).toString()
        subtotal_options.push(subtotal_option)
      }
    })

    newOptions['subtotalDepth'] = {
      section: "Table",
      type: "string",
      label: "Sub Total Depth",
      display: 'select',
      values: subtotal_options,
      default: "1",
      order: 5,
    }

    this.measures.forEach((measure, i) => {
      newOptions['label|' + measure.name] = {
        section: 'Measures',
        type: 'string',
        label: measure.label,
        default: measure.label,
        order: 100 + i * 10 + 1,
      }

      newOptions['heading|' + measure.name] = {
        section: 'Measures',
        type: 'string',
        label: 'Heading for ' + measure.label,
        default: '',
        order: 100 + i * 10 + 2,
      }

      newOptions['style|' + measure.name] = {
        section: 'Measures',
        type: 'string',
        label: 'Style',
        display: 'select',
        display_size: 'third',
        values: [
          {'Normal': 'normal'},
          {'Black/Red': 'black_red'},
          {'Subtotal': 'subtotal'},
          {'Hidden': 'hide'}
        ],
        default: 'normal',
        order: 100 + i * 10 + 3
      }

      newOptions['reportIn|' + measure.name] = {
        section: 'Measures',
        type: 'string',
        label: 'Report In',
        display: 'select',
        display_size: 'third',
        values: [
          {'Absolute Figures': '1'},
          {'Thousands': '1000'},
          {'Millions': '1000000'},
          {'Billions': '1000000000'}
        ],
        default: '1',
        order: 100 + i * 10 + 3.5
      }

      newOptions['unit|' + measure.name] = {
        section: 'Measures',
        type: 'string',
        label: 'Unit',
        // display: 'select',
        display_size: 'third',
        default: '',
        order: 100 + i * 10 + 3.7
      }

      var comparisonOptions = []
      
      if (measure.can_pivot) {
        var pivotComparisons = []
        this.pivot_fields.forEach((pivot_field, p) => {
          if (this.pivot_fields.length === 1 || p === 1 || this.config.colSubtotals ) {
            var option = {}
            option['By ' + pivot_field.label] = pivot_field.name
            pivotComparisons.push(option)
          }
        })
        comparisonOptions = comparisonOptions.concat(pivotComparisons)
      }

      // measures, row totals and supermeasures
      this.measures.forEach((comparisonMeasure, j) => {
        var includeMeasure = measure.can_pivot === comparisonMeasure.can_pivot
                              || 
                            this.hasRowTotals && !comparisonMeasure.is_table_calculation         
        if (i != j && includeMeasure) {
          var option = {}
          option['Vs. ' + comparisonMeasure.label] = comparisonMeasure.name
          comparisonOptions.push(option)
        }
      })
      comparisonOptions.unshift({ '(none)': 'no_variance'})

      newOptions['comparison|' + measure.name] = {
        section: 'Measures',
        type: 'string',
        label: 'Comparison',
        display: 'select',
        values: comparisonOptions,
        default: 'no_variance',
        order: 100 + i * 10 + 5
      }

      newOptions['switch|' + measure.name] = {
        section: 'Measures',
        type: 'boolean',
        label: 'Switch',
        display_size: 'third',
        default: false,
        order: 100 + i * 10 + 6,
      }

      newOptions['var_num|' + measure.name] = {
        section: 'Measures',
        type: 'boolean',
        label: 'Var #',
        display_size: 'third',
        default: true,
        order: 100 + i * 10 + 7,
      }

      newOptions['var_pct|' + measure.name] = {
        section: 'Measures',
        type: 'boolean',
        label: 'Var %',
        display_size: 'third',
        default: false,
        order: 100 + i * 10 + 8,
      }
    })
    return newOptions
  }

  /**
   * - this.pivot_fields
   * - this.headers
   * @param {*} queryResponse 
   */
  addPivotsAndHeaders(queryResponse) {
    queryResponse.fields.pivots.forEach((pivot, i) => {
      var pivot_field = new ModelPivot({ vis: this, queryResponseField: pivot })
      this.pivot_fields.push(pivot_field)
      this.headers.push({ type: 'pivot' + i, modelField: pivot_field })
    })

    var measureHeaders = this.useHeadings 
      ? [{ type: 'heading', modelField: { label: '(will be replaced by header for column)s' } }] 
      : []
    
    measureHeaders.push({ type: 'field', modelField: { label: '(will be replaced by field for column)' } })

    if (this.sortColsBy === 'pivots') {
      this.headers.push(...measureHeaders)
    } else {
      this.headers.unshift(...measureHeaders)
    }

    for (var i = 0; i < this.headers.length; i++) {
      if (!this.headers[i] === 'field') {
        this.fieldLevel = i
        break
      }
    }
  }

  /**
   * - this.dimensions
   * - this.columns
   * @param {*} queryResponse 
   * @param {*} col_idx 
   */
  addDimensions(queryResponse, col_idx) {
    queryResponse.fields.dimension_like.forEach(dimension => {
      var newDimension = new ModelDimension({
        vis: this,
        queryResponseField: dimension
      })
      newDimension.hide = this.useIndexColumn ? true : newDimension.hide
      this.dimensions.push(newDimension)

      var column = new Column(newDimension.name, this, newDimension) 
      column.idx = col_idx
      column.sort.push({name: 'section', value: 0})
      this.headers.forEach(header => {
        switch (header.type) {
          case 'pivot0':
          case 'pivot1':
            var pivotField = new ModelPivot({ vis: this, queryResponseField: header.modelField })
            var headerCell = new HeaderCell({ column: column, type: header.type, modelField: pivotField })
            headerCell.label = '' // TODO: Decide how (if) it makes sense to add pivot labels at top of dimension columns
            column.levels.push(headerCell)
            column.sort.push({name: header.type, value: 0})
            break
          case 'heading':
            column.levels.push(new HeaderCell({ column: column, type: 'heading', modelField: newDimension }))
            break
          case 'field':
            column.levels.push(new HeaderCell({ column: column, type: 'field', modelField: newDimension }))
            column.sort.push({name: 'col_idx', value: col_idx})
            break
        }
      })

      this.columns.push(column)
      col_idx += 10
    })

    for (var i = 0; i < this.dimensions.length; i++) {
      var dimension = this.dimensions[i]
      if (!dimension.hide) {
        this.firstVisibleDimension = dimension.name
        break
      }
    }
  }

  /**
   * Registers measures with the VisPluginTableModel
   * - this.measures
   * - this.columns
   * 
   * Uses this.applyVisToolsTags() to enrich column information
   * 
   * @param {*} queryResponse 
   * @param {*} col_idx 
   */
  addMeasures(queryResponse, col_idx) {
    // add measures, list of ids
    queryResponse.fields.measure_like.forEach(measure => {
      var newMeasure = new ModelMeasure({
        vis: this,
        queryResponseField: measure,
        can_pivot: true
      })

      var reportInSetting = this.config['reportIn|' + measure.name]
      var unitSetting = this.config['unit|' + measure.name]
      if (typeof reportInSetting !== 'undefined'  && reportInSetting !== '1') {
        newMeasure.value_format = '#,##0'
        if (typeof unitSetting !== 'undefined' && unitSetting !== '') {
           newMeasure.unit = unitSetting
        }
      }
      this.measures.push(newMeasure) 
    })
    
    // add measures, list of full objects
    if (this.hasPivots) {
      this.pivot_values.forEach(pivot_value => {
        var isRowTotal = pivot_value.key === '$$$_row_total_$$$'
        this.measures.forEach((measure, m) => {
          // for pivoted measures, skip table calcs for row totals 
          // if user wants a row total of a table calc, it must be defined as another table calc (in which case, it will be a supermeasure)
          var include_measure = !isRowTotal || ( isRowTotal && !measure.is_table_calculation )
          
          if (include_measure) {
            var column = new Column([pivot_value.key, measure.name].join('.'), this, measure)
            column.pivoted = isRowTotal ? false : true
            column.isRowTotal = isRowTotal
            column.pivot_key = pivot_value.key
            column.idx = col_idx

            var tempSort = []
            var level_sort_values = []
            this.headers.forEach(header => {
              switch (header.type) {
                case 'pivot0':
                case 'pivot1':
                  var label = isRowTotal ? '' : pivot_value.metadata[header.modelField.name].rendered || pivot_value.metadata[header.modelField.name].value
                  if (isRowTotal && header.type.startsWith('pivot') && header.type === 'pivot' + (this.pivot_fields.length - 1)) {
                    label = 'Row Total'
                  }
                  column.levels.push(new HeaderCell({ 
                    column: column, 
                    type: header.type, 
                    modelField: { label: label },
                    pivotData: pivot_value
                  }))
                  level_sort_values.push(pivot_value.sort_values[header.modelField.name])
                  if (column.pivoted) {
                    tempSort.push({ name: header.modelField.name, value: pivot_value.sort_values[header.modelField.name] })
                  } else {
                    tempSort.push({ name: header.modelField.name, value: 0 })
                  }
                  break

                case 'heading':
                  column.levels.push(new HeaderCell({ column: column, type: 'heading', modelField: measure}))
                  break

                case 'field':
                  column.levels.push(new HeaderCell({ column: column, type: 'field', modelField: measure}))
                  break;
              }
            })

            var sort = []
            sort.push({ name: 'section', value: isRowTotal ? 2 : 1 })
            if (this.sortColsBy === 'measures') {
              sort.push({ name: 'measure_idx', value: m })
            }
            if (this.pivot_fields.length === 2) {
              if (this.addColSubtotals) {
                // column subtotals present, therefore must sort by pivot0, pivot1 to get correct grouping 
                sort = sort.concat(tempSort)
              } else {
                // no col subtotals, so add pivot values to the sort array in the order they are configured in this.sorts
                // if pivot0 is first sort, add pivot1 as second sort to ensure meausure grouping
                var sortTracker = []
                this.sorts.forEach(s => {
                  this.pivot_fields.forEach(p => {
                    if (p.name === s.name) {
                      tempSort.forEach(t => {
                        if (t.name === p.name) {
                          sortTracker.push(t.name)
                        }
                      })
                    }
                  })
                })
                if (sortTracker[0] === this.pivot_fields[0].name) {
                  sort = sort.concat(tempSort)
                } else {
                  sort = sort.concat(tempSort.reverse())
                }
              }
            } else {
              sort.push(tempSort[0])
            }
            
            if (this.sortColsBy === 'pivots') {
              sort.push({ name: 'measure_idx', value: m })
            }
            column.sort = sort

            this.columns.push(column)
            col_idx += 10
          }
        })
      })
    } else {
      // noticeably simpler for flat tables!
      this.measures.forEach(measure => {
        var column = new Column(measure.name, this, measure)
        column.sort.push({name: 'section', value: 1})
        column.idx = col_idx

        try {
          if (typeof this.config.columnOrder[column.id] !== 'undefined') {
            column.pos = this.config.columnOrder[column.id]
          } else {
            column.pos = col_idx
          }
        }
        catch {
          column.pos = col_idx
        }

        this.headers.forEach(header => {
          switch (header.type) {
            case 'heading':
              column.levels.push(new HeaderCell({ column: column, type: 'heading', modelField: measure}))
              break

            case 'field':
              column.levels.push(new HeaderCell({ column: column, type: 'field', modelField: measure}))
              column.sort.push({name: 'column.pos', value: column.pos})
              break;
          }
        })

        this.columns.push(column)
        col_idx += 10
      })
    }
    
    // add supermeasures, if present
    if (typeof queryResponse.fields.supermeasure_like !== 'undefined') {
      queryResponse.fields.supermeasure_like.forEach(supermeasure => {
        var meas = new ModelMeasure({
          vis: this,
          queryResponseField: supermeasure,
          can_pivot: false,
        })
        var reportInSetting = this.config['reportIn|' + supermeasure.name]
        var unitSetting = this.config['unit|' + supermeasure.name]
        if (typeof reportInSetting !== 'undefined'  && reportInSetting !== '1') {
          meas.value_format = '#,##0'
          if (typeof unitSetting !== 'undefined' && unitSetting !== '') {
            meas.unit = unitSetting
          }
        }
        this.measures.push(meas) 

        var column = new Column(meas.name, this, meas)
        column.sort.push({ name: 'section', value: 2 })
        this.headers.forEach(header => {
          switch (header.type) {
            case 'pivot0':
            case 'pivot1':
              column.levels.push(new HeaderCell({ column: column, type: header.type, modelField: { label: '' } }))
              column.sort.push({name: header.type, value: 0})
              break
            case 'heading':
              column.levels.push(new HeaderCell({ column: column, type: 'heading', modelField: meas }))
              break
            case 'field':
              column.levels.push(new HeaderCell({ column: column, type: 'field', modelField: meas }))
              column.sort.push({name: 'col_idx', value: col_idx})
              break
          }
        })
        column.idx = col_idx
        column.super = true

        this.columns.push(column)
        col_idx += 10
      })
    }
  }

   /**
   * Update the VisPluginTableModel instace
   * - this.variances
   * 
   *  option is either 'no_variance' or a measure.name
   */
  checkVarianceCalculations() {
    Object.keys(this.config).forEach(option => {
      if (option.startsWith('comparison')) {
        var baseline = option.split('|')[1]
        var comparison = this.config[option]

        var baseline_in_measures = false
        this.measures.forEach(measure => {
          if (baseline === measure.name) {
            baseline_in_measures = true
          }
        })

        var comparison_available = false

        var comparison_options = [...this.measures.map(measure => measure.name), ...this.pivot_fields.map(pivot_field => pivot_field.name)]
        comparison_options.forEach(comparitor => {
          if (comparison === comparitor) {
            comparison_available = true
          }
        })

        if (baseline_in_measures && comparison_available) {
          if (this.pivot_fields.map(pivot_field => pivot_field.name).includes(this.config[option])) {
            var type = 'by_pivot'
          } else {
            var type = this.config[option] === 'no_variance' ? 'no_variance' : 'vs_measure'
          }
  
          if (typeof this.config['switch|' + baseline] !== 'undefined') {
            if (this.config['switch|' + baseline]) {
              var reverse = true
            } else {
              var reverse = false
            }
          }
  
          this.variances.push({
            baseline: baseline,
            comparison: this.config[option],
            type: type,
            reverse: reverse
          })
        } else if (baseline_in_measures) {
          this.config[option] = 'no_variance'
        } else {
          delete this.config[option]
        }
      }
    })
  }

  /**
   * Creates the index column, a "for display only" column when the set of dimensions is reduced to
   * a single column for reporting purposes.
   */
  addIndexColumn() {
    var dimension = this.dimensions[this.dimensions.length - 1]
    var dim_config_setting = this.config['hide|' + dimension.name]
    var column = new Column('$$$_index_$$$', this, dimension)
    column.sort.push({name: 'section', value: -1})
    column.hide = dim_config_setting === true ? dim_config_setting : false

    this.headers.forEach(header => {
      switch (header.type) {
        case 'pivot0':
        case 'pivot1':
          var pivotField = new ModelPivot({ vis: this, queryResponseField: header.modelField })
          var headerCell = new HeaderCell({ column: column, type: header.type, modelField: pivotField })
          headerCell.label = ''  // TODO: Decide how (if) it makes sense to add pivot labels at top of dimension columns
          column.levels.push(headerCell)
          column.sort.push({name: header.type, value: 0})
          break
        case 'heading':
          column.levels.push(new HeaderCell({ column: column, type: 'heading', modelField: dimension }))
          break
        case 'field':
          column.levels.push(new HeaderCell({ column: column, type: 'field', modelField: dimension }))
          column.sort.push({name: column.id, value: 0})
          break
      }
    })
    
    this.columns.push(column)
  }

  /**
   * this.subtotals_data
   * @param {*} queryResponse 
   */
  checkSubtotalsData(queryResponse) {
    if (typeof queryResponse.subtotals_data[this.addSubtotalDepth] !== 'undefined') {
      queryResponse.subtotals_data[this.addSubtotalDepth].forEach(lookerSubtotal => {
        var visSubtotal = new Row('subtotal')

        visSubtotal['$$$__grouping__$$$'] = lookerSubtotal['$$$__grouping__$$$']
        var groups = ['Subtotal']
        visSubtotal['$$$__grouping__$$$'].forEach(group => {
          groups.push(lookerSubtotal[group].value)
        })
        visSubtotal.id = groups.join('|')

        this.columns.forEach(column => {
          visSubtotal.data[column.id] = (column.pivoted || column.isRowTotal) ? lookerSubtotal[column.modelField.name][column.pivot_key] : lookerSubtotal[column.id]
          var cell = visSubtotal.data[column.id]

          if (typeof cell !== 'undefined') {
            if (typeof cell.cell_style === 'undefined') {
              cell.cell_style = ['total', 'subtotal']
            } else {
              cell.cell_style = cell.cell_style.concat(['total', 'subtotal'])
            }
            if (typeof column.modelField.style !== 'undefined') {
              cell.cell_style = cell.cell_style.concat(column.modelField.style)
            }
            if (cell.value === null) {
              cell.rendered = ''
            }

            var reportInSetting = this.config['reportIn|' + column.modelField.name]
            if (typeof reportInSetting !== 'undefined' && reportInSetting !== '1') {
              var unit = this.config.useUnit && column.modelField.unit !== '#' ? column.modelField.unit : ''
              cell.html = null
              cell.value = Math.round(cell.value / parseInt(reportInSetting))
              cell.rendered = column.modelField.value_format === '' ? cell.value.toString() : unit + SSF.format(column.modelField.value_format, cell.value)
            }
          }            
        })
        this.subtotals_data[visSubtotal.id] = visSubtotal
      })
    }
  }

  /**
   * Populates this.data with Rows of data
   * @param {*} lookerData 
   */
  addRows(lookerData) {
    lookerData.forEach((lookerRow, i) => {
      var row = new Row('line_item')
      row.id = this.dimensions.map(dimension => lookerRow[dimension.name].value).join('|')

      this.columns.forEach(column => {
        var cellValue = (column.pivoted || column.isRowTotal)? lookerRow[column.modelField.name][column.pivot_key] : lookerRow[column.id]
        var cell = new DataCell({ 
          ...cellValue, 
          ...{ 
            cell_style: [column.modelField.type], 
            colid: column.id, 
            rowid: row.id } 
        })

        if (column.modelField.is_numeric) {
          cell.cell_style.push('numeric')
          cell.align = 'right'
        } else {
          cell.cell_style.push('nonNumeric')
          cell.align = 'left'
        }

        if (typeof column.modelField.style !== 'undefined') {
          cell.cell_style = cell.cell_style.concat(column.modelField.style)
        }

        var reportInSetting = this.config['reportIn|' + column.modelField.name]
        if (typeof reportInSetting !== 'undefined'  && reportInSetting !== '1') {
          var unit = this.config.useUnit && column.modelField.unit !== '#'  ? column.modelField.unit : ''
          cell.html = null
          cell.value = Math.round(cell.value / parseInt(reportInSetting))
          cell.rendered = column.modelField.value_format === '' ? cell.value.toString() : unit + SSF.format(column.modelField.value_format, cell.value)
        }

        if (column.modelField.is_turtle) {
          var cell_series = new CellSeries({
            column: column,
            row: row,
            sort_value: cell.sort_value,
            series: {
              keys: row.data[column.id]._parsed.keys,
              values: row.data[column.id]._parsed.values
            }
          })
          cell.value = cell_series
          cell.rendered = cell_series.toString()
        }

        row.data[column.id] = cell
      })

      if (this.useIndexColumn) {
        var last_dim = this.dimensions[this.dimensions.length - 1].name
        var sourceCell = row.data[last_dim]

        row.data['$$$_index_$$$'] = new DataCell({
          value: sourceCell.value,
          rendered: sourceCell.rendered,
          html: sourceCell.html,
          cell_style: ['singleIndex', 'dimension'],
          align: this.dimensions[this.dimensions.length - 1].is_numeric ? 'right' : 'left',
          colid: '$$$_index_$$$',
          rowid: sourceCell.rowid
        })
      }

      row.sort = [
        {name: 'section', value: 0}, 
        {name: 'unknown', value: 0},
        {name: 'original_row', value: i}
      ]
      this.data.push(row)
    })
  }

  /**
   * Generate data series to support transposition
   */
  addColumnSeries() {
    this.columns.forEach(column => {
      var keys = []
      var values = []
      var types = []

      this.data.forEach(row => {
        keys.push(row.id)
        values.push(row.data[column.id].value)
        types.push(row.type)
      })

      var new_series = new ColumnSeries({
        column: column,
        is_numeric: column.modelField.is_numeric,
        series: {
          keys: keys,
          values: values,
          types: types
        }
      })
      
      column.series = new_series
      this.column_series.push(new_series)
    })
  }

  buildTotals(queryResponse) {
    var totals_ = queryResponse.totals_data
    var totalsRow = new Row('total')

    this.columns.forEach(column => {
      totalsRow.id = 'Total'

      if (column.modelField.type === 'dimension') {
        if ([this.firstVisibleDimension, '$$$_index_$$$'].includes(column.id)) {
          var rowspan = 1
          var colspan = this.useIndexColumn ? 1 : this.dimensions.filter(d => !d.hide).length
        } else {
          var rowspan = -1
          var colspan = -1
        }
        totalsRow.data[column.id] = new DataCell({ 
          value: '', 
          cell_style: ['total', 'dimension'],
          rowspan: rowspan, 
          colspan: colspan,
          colid: column.id,
          align: column.modelField.is_numeric ? 'right' : 'left',
          rowid: 'Total' 
        })
      } else {
        var rowspan = 1
        var colspan = 1
      }
      
      
      if (column.modelField.type === 'measure') {
        var cell_style = column.modelField.is_numeric ? ['total', 'numeric', 'measure'] : ['total', 'nonNumeric', 'measure']
        var cellValue = (column.pivoted || column.isRowTotal) ? totals_[column.modelField.name][column.pivot_key] : totals_[column.id]

        cellValue = new DataCell({ 
          ...cellValue, 
          ...{ 
            cell_style: cell_style,
            rowspan: rowspan, 
            colspan: colspan, 
            colid: column.id, 
            align: column.modelField.is_numeric ? 'right' : 'left',
            rowid: 'Total'} 
        })

        if (typeof cellValue.rendered === 'undefined' && typeof cellValue.html !== 'undefined' ) { // totals data may include html but not rendered value
          cellValue.rendered = this.getRenderedFromHtml(cellValue)
        }

        var reportInSetting = this.config['reportIn|' + column.modelField.name]
        if (typeof reportInSetting !== 'undefined'  && reportInSetting !== '1') {
          var unit = this.config.useUnit && column.modelField.unit !== '#'  ? column.modelField.unit : ''
          cellValue.html = undefined
          cellValue.value = Math.round(cellValue.value / parseInt(reportInSetting))
          cellValue.rendered = column.modelField.value_format === '' ? cellValue.value.toString() : unit + SSF.format(column.modelField.value_format, cellValue.value)
        }
        
        totalsRow.data[column.id] = cellValue
        if (typeof totalsRow.data[column.id].links !== 'undefined') {
          totalsRow.data[column.id].links.forEach(link => {
            link.type = "measure_default"
          })
        }       
      }
    })

    if (this.useIndexColumn) {
      totalsRow.data['$$$_index_$$$'].value = 'TOTAL'
      totalsRow.data['$$$_index_$$$'].align = 'left'
      totalsRow.data['$$$_index_$$$'].colspan = this.dimensions.filter(d => !d.hide).length
    } else {
      if (this.firstVisibleDimension) {
        totalsRow.data[this.firstVisibleDimension].value = 'TOTAL'
        totalsRow.data[this.firstVisibleDimension].align = 'left'
      }
    }
    totalsRow.sort = [
      {name: 'section', value: 1},
      {name: 'unknown', value: 0},
      {name: 'original_row', value: 0}
    ]
    this.data.push(totalsRow)

    // Including an Others row: note the huge assumption in calculating a very simple average!
    // This will prevent a data gap distracting users, and may indicate whether the Others data
    // is "higher or lower" than the top x items. But it is not an accurate number.
    if (this.calculateOthers) {
      var othersRow = new Row('line_item')
      othersRow.id = 'Others'
      this.columns.forEach(column => {
        var othersValue = null
        var othersStyle = column.modelField.is_numeric ? ['numeric'] : ['nonNumeric']
        var totalValue = totalsRow.data[column.id]
        
        if (column.modelField.type === 'measure') {
          if (othersValue = ['sum', 'count'].includes(column.modelField.calculation_type)) {
            othersValue = totalValue.value - column.series.series.sum
            othersStyle.push('measure')
          } else {
            othersValue = (totalValue.value + column.series.series.avg) / 2
            othersStyle = othersStyle.concat(['estimate', 'measure'])
            if (['count', 'count_distinct'].includes(column.modelField.calculation_type)) {
              othersValue = Math.round(othersValue)
            }
          }
        } else {
          othersStyle.push('dimension')
        }

        if (othersValue) {
          var formatted_value = column.modelField.value_format === '' 
                ? othersValue.toString() 
                : SSF.format(column.modelField.value_format, othersValue)
          othersRow.data[column.id] = new DataCell({ 
            value: othersValue, 
            rendered: formatted_value, 
            cell_style: othersStyle,
            align: column.modelField.is_numeric ? 'right' : 'left',
            colid: column.id,
            rowid: 'Others'
          })
        } else {
          othersRow.data[column.id] = new DataCell({ 
            rendered: '',
            cell_style: othersStyle, 
            colid: column.id, 
            rowid: 'Others'
          })
        }
      })

      if (this.useIndexColumn) {
        othersRow.data['$$$_index_$$$'].value = 'Others'
        othersRow.data['$$$_index_$$$'].rendered = 'Others'
        othersRow.data['$$$_index_$$$'].align = 'left'
        othersRow.data['$$$_index_$$$'].cell_style.push('singleIndex')
      } else {
        if (this.firstVisibleDimension) {
          othersRow.data[this.firstVisibleDimension].value = 'Others'
          othersRow.data[this.firstVisibleDimension].rendered = 'Others'
          othersRow.data[this.firstVisibleDimension].align = 'left'
        }
      }
      othersRow.sort = [
        {name: 'section', value: 1},
        {name: 'unknown', value: -1},
        {name: 'original_row', value: -1}
      ] 
      this.data.push(othersRow)
    }
    
    this.sortData()
  }

  /**
   * 1. Build list of leaves
   * 2. Build list of tiers (and initialise span_tracker)
   * 3. Backwards <--- leaves
   *    4. Check for resets (n/a for colspans)
   *    5. Forwards ---> tiers
   *        6. Match: mark invisible (span_value = -1). Increment the span_tracker.
   *        7. Diff: set span_value from span_tracker. Partial reset and continue.
   */
  setRowSpans () {
    var leaves = []
    var tiers = []
    var span_tracker = {}

    // 1)
    leaves = this.data

    // 2)
    tiers = this.dimensions.filter(d => !d.hide)
    tiers.forEach(tier => {
      span_tracker[tier.name] = 1
    })

    // Loop backwards through leaves
    for (var l = leaves.length - 1; l >= 0 ; l--) {
      var leaf = leaves[l]

      // Totals/subtotals rows: full reset and continue
      if (leaf.type !== 'line_item' ) {
        tiers.forEach(tier => {
          span_tracker[tier.name] = 1
        })
        continue;
      }

      // Loop fowards through the tiers
      for (var t = 0; t < tiers.length; t++) {
        var tier = tiers[t]
        var this_tier_value = leaf.data[tier.name].value
        var neighbour_value = l > 0 ? leaves[l - 1].data[tier.name].value : null

        // Match: mark invisible (span_value = -1). Increment the span_tracker.
        if (l > 0 && this_tier_value === neighbour_value) {
          leaf.data[tier.name].rowspan = -1
          leaf.data[tier.name].colspan = -1
          span_tracker[tier.name] += 1
        } else {
        // Different: set span_value from span_tracker. Partial reset and continue
          for (var t_ = t; t_ < tiers.length; t_++) {
            var tier_ = tiers[t_]
            leaf.data[tier_.name].rowspan = span_tracker[tier_.name]
            if (leaf.data[tier_.name].rowspan > 1) {
              leaf.data[tier_.name].cell_style.push('merged')
            }
            span_tracker[tier_.name] = 1
          }
          break;
        }
      }
    }
  }

  /**
   * Generates subtotals values
   * 
   * 1. Build array of subtotal groups
   *    - Based on the joined values of each row's dimensions (up to the configured subtotal depth)
   *    - Update each row's sort value with its subtotal group number
   * 2. Generate data rows
   *    - For each subtotal group, create a new Row
   *      - For each Column
   *        - Set the style
   *        - In the index dimension and the firstVisibleDimension, put the subtotal label
   *        - If it's a measure 
   *          - Count & total all rows of type 'line_item'
   *          - Use total or average value based on calculation type
   *          - Set as blank if it's a string type
   *            // This is a gap in functionality. Ideally subtotal would replicate the logic that generated
   *            // the string values in the line items.
   */
  addSubTotals () { 
    var depth = this.addSubtotalDepth

    // BUILD GROUPINGS / SORT VALUES
    var subTotalGroups = []
    var latest_group = []
    this.data.forEach((row, i) => {    
      if (row.type !== 'total') {
        var group = []
        for (var g = 0; g < depth; g++) {
          var dim = this.dimensions[g].name
          group.push(row.data[dim].value)
        }
        if (group.join('|') !== latest_group.join('|')) {
          subTotalGroups.push(group)
          latest_group = group
        }
        row.sort = [
          {name: 'section', value: 0},
          {name: 'subtotal', value: subTotalGroups.length-1},
          {name: 'original_row', value: i}
        ]
      }
      
      if (row.id === 'Others' && row.type === 'line_item') {
        row.hide = true
      }
    })

    // GENERATE DATA ROWS FOR SUBTOTALS
    subTotalGroups.forEach((subTotalGroup, s) => {
      var subtotalRow = new Row('subtotal')
      var dims = subTotalGroup.join('|') ? subTotalGroup.join('|') : 'Others'
      subtotalRow.id = ['Subtotal', dims].join('|')

      this.columns.forEach(column => {
        if (column.modelField.type === 'dimension') {
          if ([this.firstVisibleDimension, '$$$_index_$$$'].includes(column.id)) {
            var rowspan = 1
            var colspan = this.useIndexColumn ? 1 : this.dimensions.filter(d => !d.hide).length
          } else {
            var rowspan = -1
            var colspan = -1
          }
          var cell_style = column.modelField.is_numeric ? ['total', 'subtotal', 'numeric', 'dimension'] : ['total', 'subtotal', 'nonNumeric', 'dimension']
          var cell = new DataCell({ 
            'cell_style': cell_style, 
            align: column.modelField.is_numeric ? 'right' : 'left', 
            rowspan: rowspan, 
            colspan: colspan,
            colid: column.id,
            rowid: subtotalRow.id
          })
          if (column.id === '$$$_index_$$$' || column.id === this.firstVisibleDimension ) {
            if (this.genericLabelForSubtotals) {
              cell.value = 'Subtotal'
              cell.rendered = 'Subtotal'
            } else {
              cell.value = subTotalGroup.join(' | ') ? subTotalGroup.join(' | ') : 'Others'
              cell.rendered = cell.value
            }
          }
          subtotalRow.data[column.id] = cell
        }

        if (column.modelField.type == 'measure') {
          var cell_style = column.modelField.is_numeric ? ['total', 'subtotal', 'numeric', 'measure'] : ['total', 'subtotal', 'nonNumeric', 'measure']
          var align = column.modelField.is_numeric ? 'right' : 'left'
          if (Object.entries(this.subtotals_data).length > 0 && !subtotalRow.id.startsWith('Subtotal|Others')) { // if subtotals already provided in Looker's queryResponse
            var cell = new DataCell({ 
              ...subtotalRow.data[column.id], 
              ...this.subtotals_data[subtotalRow.id].data[column.id],
              ...{ cell_style: cell_style, align: align, colid: column.id, rowid: subtotalRow.id }
            })
            subtotalRow.data[column.id] = cell
          } else {
            var subtotal_value = 0
            var subtotal_items = 0
            var rendered = ''
            this.data.forEach(data_row => {
              if (data_row.type == 'line_item' && data_row.sort[1].value == s) { // data_row.sort[1].value == s checks whether its part of the current subtotal group
                var value = data_row.data[column.id].value
                if (Number.isFinite(value)) {
                  subtotal_value += value
                  subtotal_items++
                }
              } 
            })
            
            if (column.modelField.calculation_type === 'average' && subtotal_items > 0) {
              subtotal_value = subtotal_value / subtotal_items
            }
            if (subtotal_value) {
              var unit = this.config.useUnit && column.modelField.unit !== '#'  ? column.modelField.unit : ''
              rendered = column.modelField.value_format === '' ? subtotal_value.toString() : unit + SSF.format(column.modelField.value_format, subtotal_value)
            }
            if (column.modelField.calculation_type === 'string') {
              subtotal_value = ''
              rendered = ''
            } 

            var cell = new DataCell({
              value: subtotal_value,
              rendered: rendered,
              cell_style: cell_style,
              align: align,
              colid: column.id,
              rowid: subtotalRow.id
            })
            subtotalRow.data[column.id] = cell
          }
        }
      })
      subtotalRow.sort = [
        {name: 'section', value: 0},
        {name: 'subtotal', value: s}, 
        {name: 'original_row', value: 9999}
      ]
      this.data.push(subtotalRow)
    })
    this.sortData()
    this.hasSubtotals = true
  }

  /**
   * Generates new column subtotals, where 2 pivot levels have been used
   * // TODO: Could also have subtotals for 1 pivot tables sorted by measure
   * 
   * 1. Derive the new column definitions
   * 2. Use the new definitions to add subtotal columns to table.columns
   * 3. Calculate the column subtotal values
   */
  addColumnSubTotals () {
    var subtotalColumns = []

    // Get a list of unique top-level pivot values in the pivot_values object
    var pivots = []
    var pivot_dimension = this.pivot_fields[0].name
    this.pivot_values.forEach(pivot_value => {
      var p_value = pivot_value['data'][pivot_dimension]
      if (p_value !== null) { pivots.push(p_value) }
    })
    pivots = [...new Set(pivots)]


    // DERIVE THE NEW COLUMN DEFINITIONS
    pivots.forEach(pivot => {
      this.measures.forEach((measure, m) => {
        if (measure.can_pivot) {
          var subtotalColumn = new Column(['$$$_subtotal_$$$', pivot, measure.name].join('.'), this, measure)
          subtotalColumn.pivoted = true
          subtotalColumn.subtotal = true
          subtotalColumn.pivot_key = [pivot, '$$$_subtotal_$$$'].join('|')
          subtotalColumn.subtotal_data = {
            pivot: pivot,
            measure_idx: m,
            columns: [],
          }
  
          this.columns.forEach((column, i) => { 
            var columnPivotValue = null
            for (var i = 0; i < column.levels.length; i++) {
              if (column.levels[i].type.startsWith('pivot')) {
                var pivotIdx = parseInt(column.levels[i].type.slice(-1))
                var pivotDimension = this.pivot_fields[pivotIdx].name
                if (typeof column.levels[i].pivotData.data !== 'undefined') {
                  columnPivotValue = column.levels[i].pivotData.data[pivotDimension]
                }
                break
              }
            }
            if (column.pivoted && columnPivotValue === pivot) {
              if (column.modelField.name === measure.name) {
                subtotalColumn.subtotal_data.columns.push(column)
              }
            }
          })
          subtotalColumns.push(subtotalColumn)
        }
      })
    })

    // USE THE NEW DEFINITIONS TO ADD SUBTOTAL COLUMNS TO TABLE.COLUMNS
    subtotalColumns.forEach((subtotalColumn, s) => { 
      subtotalColumn.sort.push({name: 'section', value: 1})

      this.headers.forEach((header, i) => {
        switch (header.type) {
          case 'pivot0': 
            // console.log('subtotalColumn:', subtotalColumn) // TODO: REMOVE
            var sortValueFromColumn = subtotalColumn.subtotal_data.columns[0].levels[i].pivotData.sort_values[header.modelField.name]
            subtotalColumn.levels.push(new HeaderCell({ 
              column: subtotalColumn, 
              type: header.type, 
              modelField: {
                name: header.modelField.name,
                label: subtotalColumn.subtotal_data.pivot,
              }
            }))
            subtotalColumn.sort.push({name: header.modelField.name, value: sortValueFromColumn})
            break

          case 'pivot1': console.log('line1453')
            subtotalColumn.levels.push(new HeaderCell({ column: subtotalColumn, type: header.type, modelField: {
              name: 'subtotal',
              label: 'Subtotal',
            }}))

            var sortOption = this.sorts.find(sort => sort.name === header.modelField.name)
            if (typeof sortOption === 'undefined' || typeof sortOption.desc === 'undefined') {
              var sortDescending = false
            } else {
              var sortDescending = Boolean(sortOption.desc)
            }
            if (sortDescending) {
              var subtotalSortValue = typeof this.pivot_values[0].sort_values[header.modelField.name] === 'string' ? 'aaaaaaaa' : Number.NEGATIVE_INFINITY
            } else {
              var subtotalSortValue = typeof this.pivot_values[0].sort_values[header.modelField.name] === 'string' ? 'ZZZZZZZZ' : Number.POSITIVE_INFINITY
            }
            subtotalColumn.sort.push({name: header.modelField.name, value: subtotalSortValue})
            break

          case 'heading':
            subtotalColumn.levels.push(new HeaderCell({ column: subtotalColumn, type: 'heading', modelField: subtotalColumn.modelField}))
            break

          case 'field':
            subtotalColumn.levels.push(new HeaderCell({ column: subtotalColumn, type: 'field', modelField: subtotalColumn.modelField}))
            subtotalColumn.sort.push({name: 'measure_idx', value: subtotalColumn.subtotal_data.measure_idx})
            break
        }
      })
      this.columns.push(subtotalColumn)
    })

    // CALCULATE COLUMN SUB TOTAL VALUES
    this.data.forEach(row => {
      subtotalColumns.forEach(subtotalColumn => {
        var cell_style = subtotalColumn.modelField.is_numeric ? ['subtotal', 'numeric', 'measure'] : ['subtotal', 'nonNumeric', 'measure']
        var subtotal_value = 0
        subtotalColumn.subtotal_data.columns.forEach(column => { // subtotalColumn.columns i.e. the individual columns that are aggregated into a single subtotal columns
          subtotal_value += row.data[column.id].value
        })
        row.data[subtotalColumn.id] = new DataCell({
          value: subtotal_value,
          rendered: subtotalColumn.modelField.value_format === '' ? subtotal_value.toString() : SSF.format(subtotalColumn.modelField.value_format, subtotal_value),
          cell_style: cell_style,
          colid: subtotalColumn.id,
          rowid: row.id
        })
        if (['subtotal', 'total'].includes(row.type)) { 
          row.data[subtotalColumn.id].cell_style.push('total') 
        }
      })
    })

    // return subtotals
  }

  /**
   * Variance calculation function to enable addVariance()
   * @param {*} value_format 
   * @param {*} id 
   * @param {*} calc 
   * @param {*} baseline 
   * @param {*} comparison 
   */
  calculateVariance (value_format, id, calc, baseline, comparison) {
    this.data.forEach(row => {
      var baseline_value = row.data[baseline.id].value
      var comparison_value = row.data[comparison.id].value
      if (calc === 'absolute') {
        var cell = new DataCell({
          value: baseline_value - comparison_value,
          rendered: value_format === '' ? (baseline_value - comparison_value).toString() : SSF.format(value_format, (baseline_value - comparison_value)),
          cell_style: ['numeric', 'measure', 'variance', 'varianceAbsolute'],
          colid: id,
          rowid: row.id
        })
      } else {
        var value = (baseline_value - comparison_value) / Math.abs(comparison_value)
        if (!isFinite(value)) {
          var cell = new DataCell({
            value: null,
            rendered: '∞',
            cell_style: ['numeric', 'measure', 'variance', 'variancePercent'],
            colid: id,
            rowid: row.id
          })
        } else {
          var cell = new DataCell({
            value: value,
            rendered: SSF.format('#0.00%', value),
            cell_style: ['numeric', 'measure', 'variance', 'variancePercent'],
            colid: id,
            rowid: row.id
          })
        }
      }
      if (row.type == 'total' || row.type == 'subtotal') {
        cell.cell_style.push('total')
      }
      if (row.type === 'subtotal') {
        cell.cell_style.push('subtotal')
      }
      if (cell.value < 0) {
        cell.cell_style.push('negative')
      }
      row.data[id] = cell
    })
  }

  createVarianceColumn (colpair) {
    if (!this.config.colSubtotals && colpair.variance.baseline.startsWith('$$$_subtotal_$$$')) {
      console.log('Cannot calculate variance of column subtotals if subtotals disabled.')
      return
    }
    var id = ['$$$_variance_$$$', colpair.calc, colpair.variance.baseline, colpair.variance.comparison].join('|')
    var baseline = this.getColumnById(colpair.variance.baseline)
    var comparison = this.getColumnById(colpair.variance.comparison)
    var column = new Column(id, this, baseline.modelField)
    column.isVariance = true

    if (colpair.calc === 'absolute') {
      column.variance_type = 'absolute'
      column.idx = baseline.idx + 1
      column.pos = baseline.pos + 1
      var sortCopy = cloneDeep(baseline.sort)
      column.sort = [...sortCopy, {name: 'variance_absolute', value: 1}]
      column.hide = !this.config['var_num|' + baseline.modelField.name]
    } else {
      column.variance_type = 'percentage'
      column.idx = baseline.idx + 2
      column.pos = baseline.pos + 2
      var sortCopy = cloneDeep(baseline.sort)
      column.sort = [...sortCopy, {name: 'variance_percentage', value: 2}]
      column.unit = '%'
      column.hide = !this.config['var_pct|' + baseline.modelField.name]
    }

    if (typeof this.config.columnOrder[column.id] !== 'undefined') {
      column.pos = this.config.columnOrder[column.id]
    } 

    column.pivoted = baseline.pivoted
    column.super = baseline.super
    column.pivot_key = baseline.pivot_key

    if (this.groupVarianceColumns) {
        column.sort[0].value = 1.5
    }

    this.headers.forEach((header, i) => {
      switch (header.type) {
        case 'pivot0':
        case 'pivot1':
          var label = baseline.getHeaderCellLabelByType(header.type)
          if (this.groupVarianceColumns && header.type === 'pivot0') {
            var label = this.pivot_values.length === 2 ? 'Variance' : 'Variance: ' + label
          }
          var headerCell = new HeaderCell({ column: column, type: header.type, modelField: { label: label } })
          column.levels[i] = headerCell
          break
        case 'heading':
          var headerCell = new HeaderCell({ column: column, type: 'heading', modelField: baseline.modelField })
          column.levels[i] = headerCell
          break
        case 'field':
          var headerCell = new HeaderCell({ column: column, type: 'field', modelField: baseline.modelField })
          column.levels[i] = headerCell
          break;
      }
    })

    this.columns.push(column)
    if (colpair.variance.reverse) {
      this.calculateVariance(baseline.modelField.value_format, id, colpair.calc, comparison, baseline)
    } else {
      this.calculateVariance(baseline.modelField.value_format, id, colpair.calc, baseline, comparison)
    }
  }

  /**
   * Function to add variance columns directly within table vis rather than requiring a table calc
   * 
   * Takes list of variances configured by the user, and generates a list of column-pairs necessary
   * to calculate those variances. There is at least one baseline-comparison pair per variance.
   * Comparing different measures in a pivoted table will calculate a variance pair per pivot value.
   * Comparing the same measure across pivots will calculate one pair less than there are pivots e.g.
   * if comparing this year to last year, there are two "Reporting Period" values but only one variance.
   */
  addVarianceColumns () {
    var variance_colpairs = []
    var calcs = ['absolute', 'percent']
    
    Object.keys(this.variances).forEach(v => {
      var variance = this.variances[v]
      if (variance.comparison !== 'no_variance') {          
        if (variance.type === 'vs_measure') {
          if (!this.hasPivots) {
            calcs.forEach(calc => {
              variance_colpairs.push({
                variance: variance,
                calc: calc
              })
            })
          } else {
            this.pivot_values.forEach(pivot_value => {
              if (!pivot_value.is_total) {
                calcs.forEach(calc => {
                  variance_colpairs.push({
                    calc: calc,
                    variance: {
                      baseline: [pivot_value.key, variance.baseline].join('.'),
                      comparison: [pivot_value.key, variance.comparison].join('.'),
                      reverse: variance.reverse,
                      type: variance.type
                    }
                  })
                })
              }
            })
          }
        } else if (variance.type === 'by_pivot') { 
          if (this.pivot_fields.length === 1 || this.pivot_fields[1].name === variance.comparison) {
            this.pivot_values.slice(1).forEach((pivot_value, index) => {
              calcs.forEach(calc => {
                if (!pivot_value.is_total) {
                  variance_colpairs.push({
                    calc: calc,
                    variance: {
                      baseline: [pivot_value.key, variance.baseline].join('.'),
                      comparison: [this.pivot_values[index].key, variance.baseline].join('.'),
                      reverse: variance.reverse,
                      type: variance.type
                    }
                  })
                }
              })
            })
          } else { // top pivot value - variance by subtotal
            var top_level_pivots = []
            this.pivot_values.forEach(pivot_value => {
              if (!pivot_value.is_total) {
                var value = pivot_value.data[this.pivot_fields[0].name]
                if (!top_level_pivots.includes(value)) {
                  top_level_pivots.push(value)
                }
              }
            })
            top_level_pivots.slice(1).forEach((pivot_value, index) => {
              calcs.forEach(calc => {
                variance_colpairs.push({
                  calc: calc,
                  variance: {
                    baseline: ['$$$_subtotal_$$$', pivot_value, variance.baseline].join('.'),
                    comparison: ['$$$_subtotal_$$$', top_level_pivots[index], variance.baseline].join('.'),
                    reverse: variance.reverse,
                    type: variance.type
                  }
                })
              })
            })
          } 
        }
      }
    })

    variance_colpairs.forEach(colpair => {
      this.createVarianceColumn(colpair)
    })
  }

  compareSortArrays (dataTable) {
    return function(a, b) {
      var depth = Math.max(a.sort.length, b.sort.length)
      for (var i = 0; i < depth; i++) {
          var field = typeof a.sort[i].name !== 'undefined' ? a.sort[i].name : ''
          var sort = dataTable.sorts.find(item => item.name === field)
          var desc = typeof sort !== 'undefined' ? sort.desc : false

          var a_value = typeof a.sort[i] !== 'undefined' ? a.sort[i].value : 0
          var b_value = typeof b.sort[i] !== 'undefined' ? b.sort[i].value : 0

          if (desc) {
            if (a_value < b_value) { return 1 }
            if (a_value > b_value) { return -1 }
          } else {
            if (a_value > b_value) { return 1 }
            if (a_value < b_value) { return -1 }
          }
      }
      return -1
    }
  }
  /**
   * Sorts the rows of data, then updates vertical cell merge 
   * 
   * Rows are sorted by three values:
   * 1. Section
   * 2. Subtotal Group
   * 3. Row Value (currently based only on original row index from the Looker data object)
   */
  sortData () {
    this.data.sort(this.compareSortArrays(this))
    if (this.spanRows) { this.setRowSpans() }
  }

  /**
   * Sorts columns by config option
   * 
   * Depending on the colsSortBy option, columns are sorted by either:
   * 
   * Sort by Pivots (default)
   * 1. Section: Index, Dimensions, Measures, or Supermeasures
   * 2. Pivot sort values
   * 3. Original column number for the Looker data obect [last item in sort value array]
   * 
   * Sort by Measures
   * 1. Section: Index, Dimensions, Measures, or Supermeasures
   * 2. Original Column Number
   * 3. Measure sort values [remainder of sort value array]
   * 
   * Note that column sort values can be over-riden by manual drag'n'drop 
   */
  sortColumns () {
    this.columns.sort(this.compareSortArrays(this))
  }

  /**
   * 1. Build list of leaves
   * 2. Build list of tiers (and initialise span_tracker)
   * 3. Backwards <--- leaves
   *    4. Check for resets (n/a for colspans)
   *    5. Forwards ---> tiers
   *        6. Match: mark invisible (span_value = -1). Increment the span_tracker.
   *        7. Diff: set span_value from span_tracker. Partial reset and continue.
   */
  setColSpans () {
    var leaves = []
    var tiers = []
    var span_tracker = {}
    
    // 1)
    var columns = this.columns.filter(c => !c.hide)

    columns.forEach(column => {
      var leaf = {
        id: column.id,
        data: column.getHeaderData()
      }
      leaves.push(leaf)
    })

    // 2)
    tiers = this.headers
    tiers.forEach(tier => {
      span_tracker[tier.type] = 1
    })

    // 3)
    for (var l = leaves.length - 1; l >= 0; l--) {
      var leaf = leaves[l]

      // 5)
      for (var t = 0; t < tiers.length; t++) {
        var tier = tiers[t]
        var this_tier_value = leaf.data[tier.type].label
        var neighbour_value = l > 0 ? leaves[l - 1].data[tier.type].label : null

        // 6) 
        if (l > 0 && this_tier_value === neighbour_value) {
          leaf.data[tier.type].colspan = -1
          leaf.data[tier.type].rowspan = -1
          span_tracker[tier.type] += 1;
        } else {
        // 7) 
          for (var t_ = t; t_ < tiers.length; t_++) {
            var tier_ = tiers[t_]
            leaf.data[tier_.type].colspan = span_tracker[tier_.type]
            if (leaf.data[tier_.type].colspan > 1) {
              leaf.data[tier_.type].align = 'center'
              leaf.data[tier_.type].cell_style.push('merged')
            }
            span_tracker[tier_.type] = 1
          }
          break;
        }
      }
    }
  }

  /**
   * Applies conditional formatting (red if negative) to all measure columns set to use it 
   */
  applyFormatting() {
    this.columns.forEach(column => {
      var config_setting = this.config['style|' + column.modelField.name]
      if (typeof config_setting !== 'undefined') {
        switch (config_setting) {
          case 'black_red':
            this.data.forEach(row => {
              if (row.data[column.id].value < 0) {
                row.data[column.id].cell_style.push('negative')
              }
            })
            break
        }
      }
    })
  }

  transposeDimensionsIntoHeaders () {
    this.transposed_headers = this.columns
      .filter(c => c.modelField.type === 'dimension')
      .filter(c => !c.hide)
      .map(c => { return { type: 'field', modelField: c.modelField } })
  }

  /**
   * For rendering a transposed table i.e. with the list of measures on the left hand side
   * 1. Add an index column per header
   * 2. Add a transposed column for every data row
   */
  transposeRowsIntoColumns () {
    // TODO: review logic for cell.align
    var index_parent = {
      align: 'left',
      type: 'transposed_table_index',
      is_table_calculation: false
    }

    // One "index column" per header row from original table
    this.headers.forEach((indexColumn, i) => {
      var transposedColumn = new Column(indexColumn.type, this, index_parent)

      this.transposed_headers.forEach((header, h) => {
        var sourceCell = this.columns[h].levels[i]
        var headerCell = new HeaderCell({
          column: transposedColumn,
          type: sourceCell.type,
          label: sourceCell.label,
          cell_style: sourceCell.cell_style,
          align: sourceCell.align,
          modelField: sourceCell.modelField
        })
        headerCell.rowspan = sourceCell.colspan
        headerCell.colspan = sourceCell.rowspan
        headerCell.id = [sourceCell.modelField.name, sourceCell.type].join('.')
        headerCell.cell_style.push('transposed')

        if (headerCell.colspan > 0) {
          headerCell.cell_style.push('merged')
        }

        transposedColumn.levels.push(headerCell)
      })

      this.transposed_columns.push(transposedColumn)
    })
    
    var measure_parent = {
      align: 'right',
      type: 'transposed_table_measure',
      is_table_calculation: false
    }
  
    // One column per data row (line items, subtotals, totals)
    this.data.forEach(sourceRow => {
      var transposedColumn = new Column(sourceRow.id, this, measure_parent)

      this.transposed_headers.forEach(header => {
        var cellRef = this.useIndexColumn && ['subtotal', 'total'].includes(sourceRow.type) ? '$$$_index_$$$' : header.modelField.name
        var sourceCell = sourceRow.data[cellRef]
        var headerCell = new HeaderCell({ 
          column: transposedColumn, 
          type: header.type, 
          label: sourceCell.rendered === '' ? sourceCell.rendered : sourceCell.rendered || sourceCell.value, 
          align: 'center',
          cell_style: sourceCell.cell_style,
        })
        headerCell.colspan = sourceCell.rowspan
        headerCell.rowspan = sourceCell.colspan
        headerCell.id = [sourceCell.colid, sourceCell.rowid].join('.')
        headerCell.cell_style.push('transposed')

        transposedColumn.levels.push(headerCell)
      })

      this.transposed_columns.push(transposedColumn)
    })
  }

  transposeColumnsIntoRows () { 
    this.columns.filter(c => c.modelField.type === 'measure').forEach(column => {
      var transposedData = {}

      // INDEX FIELDS // every index/dimension column in original table must be represented as a data cell in the new transposed rows
      column.levels.forEach((level, i) => {        
        var cell = new DataCell({
          value: level.label,
          rendered: level.label,
          rowspan: level.colspan,
          colspan: level.rowspan,
          cell_style: ['indexCell', 'transposed'],
          align: 'left',
          colid: column.id,
          rowid: level.type
        })

        switch (level.type) {
          case 'pivot0':
          case 'pivot1':
            cell.cell_style.push('pivot')
            break
          case 'heading':
          case 'field':
            var style = column.modelField.is_table_calculation ? 'calculation' : 'measure'
            cell.cell_style.push(style)
            break
        }

        if (cell.rowspan > 1) {
          cell.cell_style.push('merged')
        }

        transposedData[level.type] = cell
      })

      // MEASURE FIELDS // every measure column in original table is converted to a data row
      this.data.forEach(row => {
        if (typeof row.data[column.id] !== 'undefined') {
          var sourceCell = row.data[column.id]
          transposedData[row.id] = row.data[column.id]
          transposedData[row.id].id = [sourceCell.colid, sourceCell.rowid].join('.')
          transposedData[row.id]['cell_style'].push('transposed')
        } else {
          // console.log('row data does not exist for', column.id)
        }
      })

      var transposed_row = new Row('line_item')
      transposed_row.id = column.id
      transposed_row.modelField = column.modelField
      transposed_row.hide = column.hide
      transposed_row.data = transposedData

      this.transposed_data.push(transposed_row)

    })
  }

  validateConfig() {
    if (!['traditional', 'looker', 'contemporary', 'custom'].includes(this.config.theme)) {
      this.config.theme = 'traditional'
    }

    if (!['fixed', 'auto'].includes(this.config.layout)) {
      this.config.layout = 'fixed'
    }

    if (typeof this.config.transposeTable === 'undefined') {
      this.config.transposeTable = false
    }

    Object.entries(this.config).forEach(option => {
      if (option[1] === 'false') {
        option[1] = false
      } else if (option[1] === 'true') {
        option[1] = true
      }

      if (option[0].split('|').length === 2) {
        var [field_option, field_name] = option[0].split('|')
        if (['label', 'heading', 'hide', 'style', 'switch', 'var_num', 'var_pct', 'comparison'].includes(field_option)) {
          var keep_option = false
          this.dimensions.forEach(dimension => {
            if (dimension.name === field_name) { keep_option = true }
          })
          this.measures.forEach(measure => {
            if (measure.name === field_name) { keep_option = true }
          })
          if (!keep_option) {
            delete this.config[option[0]]
          } 
        }
      }
    })
  }

  /**
   * Returns column that matches ID provided
   * @param {*} id 
   */
  getColumnById (id) {
    var column = {}
    this.columns.forEach(c => {
      if (id === c.id) { 
        column = c 
      }
    })
    return column
  }

  /**
   * Returns row that matches ID provided
   * @param {*} id 
   */
  getRowById (id) {
    var row = {}
    this.data.forEach(r => {
      if (id === r.id) {
        row = r
      }
    })
    return row
  }

  getMeasureByName (name) {
    var measure = ''
    this.measures.forEach(m => {
      if (name === m.name) { 
        measure = m
      }
    })
    return measure
  }


  /**
   * Extracts the formatted value of the field from the html: value
   * There are cases (totals data) where the formatted value isn't available as usual rendered_value
   * @param {*} cellValue 
   */
  getRenderedFromHtml (cellValue) {
    var parser = new DOMParser()
    if (typeof cellValue.html !== 'undefined' && !['undefined', ''].includes(cellValue.html)) {
      try {
        var parsed_html = parser.parseFromString(cellValue.html, 'text/html')
        var rendered = parsed_html.documentElement.textContent
      }
      catch(TypeError) {
        var rendered = cellValue.html
      }
    } else {
      var rendered = cellValue.value
    }

    return rendered
  }

  /**
   * Used to support rendering of table as vis. 
   * Returns an array of 0s, of length to match the required number of header rows
   */
  getHeaderTiers () {    
    if (!this.transposeTable) {
      return this.headers
    } else {
      return this.transposed_headers
    }
  }

  /**
   * Used to support rendering of data table as vis. 
   * Builds list of columns out of data set that should be displayed
   * @param {*} i 
   */
  getTableHeaderCells (i) {
    if (!this.transposeTable) {
      return this.columns
        .filter(c => !c.hide)
        .filter(c => c.levels[i].colspan > 0)
    } else {
      return this.transposed_columns
        .filter(c => c.levels[i].colspan > 0)
    }
  }

  getDataRows () {
    if (!this.transposeTable) {
      var dataRows = this.data.filter(row => !row.hide)
    } else {
      var dataRows = this.transposed_data.filter(row => !row.hide)
    }
    return dataRows
  }

  /**
   * Used to support rendering of data table as vis.
   * For a given row of data, returns filtered array of cells – only those cells that are to be displayed.
   * @param {*} row 
   */
  getTableRowColumns (row) {
    if (!this.transposeTable) {
      var cells = this.columns
        .filter(column => !column.hide)
        .filter(column => row.data[column.id].rowspan > 0)
    } else {
      var cells = this.transposed_columns
      .filter(column => !column.hide)
      .filter(column => row.data[column.id].rowspan > 0)
    }
    return cells    
  }

  /**
   * Used to support column drag'n'drop when rendering data table as vis.
   * Updates the table.config with the new pos values.
   * Accepts a callback function for interaction with the vis.
   * @param {*} from 
   * @param {*} to 
   * @param {*} callback 
   */
  moveColumns(from, to, updateColumnOrder) {
    var config = this.config
    if (from != to) {
      var shift = to - from
      var col_order = config.columnOrder
      this.columns.forEach(col => {
        if (col.modelField.type == 'measure' && !col.super) {
          if (col.pos >= from && col.pos < from + 10) {
            // console.log('MOVING COLUMN', col.id, col.pos, '->', col.pos + shift)
            col.pos += shift
          } else if (col.pos >= to && col.pos < from) {
            // console.log('NUDGING COLUMN', col.id, col.pos, '->', col.pos + 10)
            col.pos += 10
          } else if (col.pos >= from + 10 && col.pos < to + 10) {
            // console.log('NUDGING COLUMN', col.id, col.pos, '->', col.pos - 10)
            col.pos -= 10
          }
          col_order[col.id] = col.pos
        } 
      })
      updateColumnOrder(col_order)
    }
  }

  /**
   * Returns dataset as a simple json object
   * Includes line_items only (e.g. no row subtotals)
   * 
   * Convenience function when using LookerData as an object to support e.g. Vega Lite visualisations
   */
  getSimpleJson() {
    var raw_values = []
    this.data.forEach(r => {
      if (r.type === 'line_item') {
        var row = {}
        this.columns.forEach(c => {
          row[c.id] = r.data[c.id].value
        })
        raw_values.push(row)
      }
    })
    return raw_values
  }


  /**
   * Builds array of arrays, used at by table vis to build column groups
   * Three column groups: 
   * - index (dimensions)
   * - measures (standard measures)
   * - totals (supermeasures: row totals and some table calcs)
   * 
   * For transposed tables:
   * - index (headers, pivot value, measures)
   * - measures (Includes subtotals. Cells contain measure values, header rows contain dimension values)
   * - totals (totals)
   */
  getTableColumnGroups () {
    var indexColumns = []
    var measureColumns = []
    var totalColumns = []

    if (!this.transposeTable) {
      this.columns.forEach(column => {
        if (column.modelField.type === 'dimension' && !column.hide) {
          indexColumns.push({ id: column.id, type: 'index' })
        } else if (column.modelField.type === 'measure' && !column.isRowTotal && !column.super && !column.hide) {
          measureColumns.push({ id: column.id, type: 'dataCell' })
        } else if (column.modelField.type === 'measure' && (column.isRowTotal || column.super) && !column.hide) {
          totalColumns.push({ id: column.id, type: 'dataCell' })
        }
      })
    } else {
      this.transposed_columns.forEach(column => {
        if (column.modelField.type === 'transposed_table_index') {
          indexColumns.push({ id: column.id, type: 'index' })
        } else if (column.modelField.type === 'transposed_table_measure' && column.id !== 'Total') {
          measureColumns.push({ id: column.id, type: 'dataCell' })
        } else if (column.modelField.type === 'transposed_table_measure' && column.id === 'Total') {
          totalColumns.push({ id: column.id, type: 'dataCell' })
        }
      })
    }

    var columnGroups = []
    if (indexColumns.length > 0) {
      columnGroups.push(indexColumns)
    }
    if (measureColumns.length > 0) {
      columnGroups.push(measureColumns)
    }
    if (totalColumns.length > 0) {
      columnGroups.push(totalColumns)
    }

    return columnGroups
  }

  getCellToolTip (rowid, colid) {
    var tipHTML = '<table><tbody>'

    var row = this.getRowById(rowid)
    var focusColumn = this.getColumnById(colid) 
    var field = focusColumn.modelField 

    if (row.type === 'total') {
      var label = 'TOTAL'
      var value = ''
      var rowClass = 'focus'
      tipHTML += ['<tr class="', rowClass, '"><td><span style="float:left"><em>', label, ':</em></td><td></span><span style="float:left"> ', value, '</span></td></tr>'].join('')
    } else if (row.id.startsWith('Others')) {
      var label = 'Others'
      var value = ''
      var rowClass = 'focus'
      tipHTML += ['<tr class="', rowClass, '"><td><span style="float:left"><em>', label, ':</em></td><td></span><span style="float:left"> ', value, '</span></td></tr>'].join('')      
    } else if (row.type === 'subtotal') {
      var label = 'SUBTOTAL'
      var rowClass = 'focus'
      var subtotalColumn = this.columns.filter(c => !c.hide).filter(c => c.modelField.type === 'dimension')[0]
      var value = row.data[subtotalColumn.id].render || row.data[subtotalColumn.id].value
      tipHTML += ['<tr class="', rowClass, '"><td><span style="float:left"><em>', label, ':</em></td><td></span><span style="float:left"> ', value, '</span></td></tr>'].join('')
    } else {
      var dimensionColumns = this.columns
      .filter(c => c.id !== '$$$_index_$$$')
      .filter(c => c.modelField.type === 'dimension')

      dimensionColumns.forEach(column => {
        var label = column.getHeaderCellLabelByType('field')
        var value = row.data[column.id].rendered || row.data[column.id].value
        var rowClass = column.id === focusColumn.id ? 'focus' : ''
        tipHTML += ['<tr class="', rowClass, '"><td><span style="float:left"><em>', label, ':</em></td><td></span><span style="float:left"> ', value, '</span></td></tr>'].join('')
      })
    }
  
    tipHTML += '<tr style="height:10px"></tr>' // spacer row

    var isEstimate = false
    var measureLabel = ''
    var measureColumns = this.columns
      .filter(c => c.modelField.type === 'measure')
      .filter(c => c.modelField === field)
    
    measureColumns.forEach(column => {
      if (!column.isVariance) {
        measureLabel = column.getHeaderCellLabelByType('field')
      }

      if ((!column.pivoted && !column.isRowTotal) || (column.pivot_key === focusColumn.pivot_key)) {
        var label = column.getHeaderCellLabelByType('field')
        var rowClass = column.id === focusColumn.id ? 'focus' : ''
        
        var cell = row.data[column.id]
        var value = cell.rendered || cell.value
        if (cell.html) { 
          var parser = new DOMParser()
          var parsed_html = parser.parseFromString(cell.html, 'text/html')
          value = parsed_html.documentElement.textContent
        }

        if (cell.cell_style.includes('estimate')) {
          isEstimate = true
        }

        tipHTML += ['<tr class="', rowClass, '"><td><span style="float:left"><em>', label, ':</em></td><td></span><span style="float:right"> ', value, '</span></td></tr>'].join('')
      }
    })

    var isReportedIn = null
    var reportInSetting = this.config['reportIn|' + focusColumn.modelField.name]
    var reportInLabels = {
      1000: '000s',
      1000000: 'Millions',
      1000000000: 'Billions'
    }
    if (typeof reportInSetting !== 'undefined'  && reportInSetting !== '1') {
      isReportedIn = measureLabel + ' reported in ' + reportInLabels[reportInSetting]
    }

    if (isReportedIn || isEstimate) {
      tipHTML += '<tr style="height:10px"></tr>' // spacer row
    }

    if (isReportedIn) {
      tipHTML += '<tr><td colspan=2><span style="color:darkgrey">' + isReportedIn + '.</span></td></tr>'
    }

    if (isEstimate) {
      tipHTML += '<tr><td colspan=2><span style="color:red">Estimated figure due to query exceeding row limit.</span></td></tr>'
      tipHTML += '<tr><td colspan=2><span style="color:red">Consider increasing the row limit or using an alternative measure.</span></td></tr>'
    }

    tipHTML += '</tbody><table>'

    return tipHTML
  }
}

export { VisPluginTableModel }
