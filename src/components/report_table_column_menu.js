import React from 'react'

import ReportTableMenu from './report_table_menu'

const ReportTableColumnMenu = ({ config }) => {
  const { table, field, column } = config

  const columnItems = [
    { key: 'id', level: 'column', label: 'ID', type: 'label', value: column.id },
    { key: 'pivoted', level: 'column', label: 'Pivoted', type: 'boolean', value: column.pivoted },
  ]

  var fieldItems = [
    { key: 'label', level: 'field', label: 'Label', type: 'inputText', value: field.label },
    { key: 'heading', level: 'field', label: 'Heading', type: 'inputText', value: field.hide },
    { key: 'hide', level: 'field', label: 'Hide', type: 'switch', value: field.hide },
  ]

  if (field.type === 'dimension') {
    fieldItems = fieldItems.concat([
      { key: 'geo', level: 'field', label: 'Geo', type: 'label', value: field.geo_type },
    ])
  } else {
    fieldItems = fieldItems.concat([
      { key: 'style', level: 'field', label: 'Style', type: 'dropdown', value: field.style, options: [] },
      { key: 'reportIn', level: 'field', label: 'Report In', type: 'dropdown', value: 'TBD', options: [] },
      { key: 'unit', level: 'field', label: 'Unit', type: 'label', value: field.unit },
      { key: 'comparison', level: 'field', label: 'Comparison', type: 'dropdown', value: 'TBD', options: [] },
      { key: 'comparisonSwitch', level: 'field', label: 'Switch', type: 'switch', value: field.geo_type },
      { key: 'var_num', level: 'field', label: 'Var #', type: 'switch', value: false },
      { key: 'var_pct', level: 'field', label: 'Var %', type: 'switch', value: false },
    ])
  }

  const displayItems = [
    { key: 'useViewName', level: 'table', label: 'Use View Name:', type: 'switch', value: table.useViewName },
    { key: 'useHeadings', level: 'table', label: 'Use Headings:', type: 'switch', value: table.useHeadings },
    { key: 'useShortName', level: 'table', label: 'Use Short Name:', type: 'switch', value: table.useShortName },
    { key: 'useUnit', level: 'table', label: 'Use Units:', type: 'switch', value: table.useUnit },
    { key: 'groupVarianceColumns', level: 'table', label: 'Group Variance Columns:', type: 'switch', value: table.groupVarianceColumns },
    { key: 'genericLabelForSubtotals', level: 'table', label: 'Use "Subtotal" for all Subtotal labels:', type: 'switch', value: table.genericLabelForSubtotals },
    { key: 'transposeTable', level: 'table', label: 'Transpose Table:', type: 'switch', value: table.transposeTable },
  ]

  const tableItems = [
    { key: 'rowSubtotals', level: 'table', label: 'Row Subtotals:', type: 'switch', value: table.rowSubtotals },
    { key: 'colSubtotals', level: 'table', label: 'Col Subtotals:', type: 'switch', value: table.colSubtotals },
    { key: 'sortRowSubtotalsBy', level: 'table', label: 'Sort Row Subtotals By:', type: 'dropdown', value: table.sortRowSubtotalsBy },
    { key: 'spanRows', level: 'table', label: 'Merge Dimensions:', type: 'switch', value: table.spanRows },
    { key: 'calculateOthers', level: 'table', label: 'Calculate Others Row:', type: 'switch', value: table.calculateOthers },
    { key: 'subtotalDepth', level: 'table', label: 'Depth:', type: 'dropdown', value: table.subtotalDepth },
    { key: 'sortColumnsBy', level: 'table', label: 'Sort Columns By:', type: 'dropdown', value: table.sortColumnsBy },
  ]

  return (
    <div className='rt-report-table-column-menu'>
      <ReportTableMenu label={'Column Info...'} items={columnItems} />
      <ReportTableMenu label={'Field Options...'} items={fieldItems} />
      <ReportTableMenu label={'Display Options...'} items={displayItems} />
      <ReportTableMenu label={'Table Settings...'} items={tableItems} />
    </div>
  )  
}

export default ReportTableColumnMenu