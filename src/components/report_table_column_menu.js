const buildColumnMenu = () => {
  const menu = document.createElement('div')
  menu.className = 'hidden'
  menu.id = 'columnMenu'

  return menu
}

const updateColumnMenu = (event, agParams) => {
  console.log('Column menu clicked', event)
  console.log('event', event)
  console.log('agParams', agParams)
  console.log('X', event.x, 'Y', event.y)

  var modelField = agParams.dataTableColumn.modelField
  var config = agParams.dataTableColumn.vis.config
  
  // All fields
  var heading = config['heading|' + modelField.name]
  var label = config['label|' + modelField.name]

  // Dimensions
  var hide = config['hide|' + modelField.name]

  // Measures
  var comparison = config['comparison|' + modelField.name]
  var reportIn = config['reportIn|' + modelField.name]
  var style = config['style|' + modelField.name]
  var switchVar = config['switch|' + modelField.name]
  var varNum = config['var_num|' + modelField.name]
  var VarPct = config['var_pct|' + modelField.name]
  var unit = config['unit|' + modelField.name]

  const menu = document.getElementById('columnMenu')
  menu.style = 'left: ' + event.x + 'px; top: ' + event.y + ' + px'
  menu.innerHTML = ''
    + '<div>Heading: ' + heading + '</div>'
    + '<div>Label: ' + label + '</div>'
    + '<div>Hide: ' + hide + '</div>'
    + '<hr>'
    + '<div>Style: ' + style + '</div>'
    + '<div>Report In: ' + reportIn + '</div>'
    + '<div>Unit: ' + unit + '</div>'
    + '<div>Comparison: ' + comparison + '</div>'
    + '<div>Var Num: ' + varNum + '</div>'
    + '<div>Var Pct: ' + VarPct + '</div>'
    + '<div>Switch Var: ' + switchVar + '</div>'
    + '<hr>'
    + '<div>Row Subtotals: ' + config.rowSubtotals + '</div>'
    + '<div>Col Subtotals: ' + config.colSubtotals + '</div>'
    + '<div>Sort Row Subtotals By: ' + config.sortRowSubtotalsBy + '</div>'
    + '<div>Merge Dimensions: ' + config.spanRows + '</div>'
    + '<div>Calculate Others Row: ' + config.calculateOthers + '</div>'
    + '<div>Subtotal Depth: ' + config.subtotalDepth + '</div>'
    + '<div>Sort Columns By: ' + config.sortColumnsBy + '</div>'
    + '<hr>'
    + '<div>Use View Name: ' + config.useViewName + '</div>'
    + '<div>Use Headings: ' + config.useHeadings + '</div>'
    + '<div>Use Short Name: ' + config.useShortName + '</div>'
    + '<div>Use Units: ' + config.useUnit + '</div>'
    + '<div>Group Variance Columns: ' + config.groupVarianceColumns + '</div>'
    + '<div>Use "Subtotal" for all Subtotal labels: ' + config.genericLabelForSubtotals + '</div>'
    + '<div>Transpose Table: ' + config.transposeTable + '</div>'
    
  menu.classList.toggle('hidden')
} 


export { buildColumnMenu, updateColumnMenu }