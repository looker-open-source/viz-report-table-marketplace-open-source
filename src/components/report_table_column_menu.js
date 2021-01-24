import React from 'react'

import ReportTableMenu from './report_table_menu'

const ReportTableColumnMenu = ({ config }) => {
  const { table, field, column } = config

  const getFieldConfig = (field, option) => {

  }

  const columnItems = [
    { key: 'id', label: 'ID', type: 'label', value: column.id },
    { key: 'pivoted', label: 'Pivoted', type: 'boolean', value: column.pivoted },
  ]

  var fieldItems = [
    { key: 'label', label: 'Label', type: 'inputText', value: field.label },
    { key: 'heading', label: 'Heading', type: 'inputText', value: field.hide },
    { key: 'hide', label: 'Hide', type: 'switch', value: field.hide },
  ]

  if (field.type === 'dimension') {
    fieldItems = fieldItems.concat([
      { key: 'geo', label: 'Geo', type: 'label', value: field.geo_type },
    ])
  } else {
    fieldItems = fieldItems.concat([
      { key: 'style', label: 'Style', type: 'dropdown', value: field.style, options: [] },
      { key: 'reportIn', label: 'Report In', type: 'dropdown', value: 'TBD', options: [] },
      { key: 'unit', label: 'Unit', type: 'label', value: field.unit },
      { key: 'comparison', label: 'Comparison', type: 'dropdown', value: 'TBD', options: [] },
      { key: 'comparisonSwitch', label: 'Switch', type: 'switch', value: field.geo_type },
      { key: 'var_num', label: 'Var #', type: 'switch', value: false },
      { key: 'var_pct', label: 'Var %', type: 'switch', value: false },
    ])
  }

  const displayItems = [
    { key: 'useViewName', label: 'Use View Name:', type: 'switch', value: table.useViewName },
    { key: 'useHeadings', label: 'Use Headings:', type: 'switch', value: table.useHeadings },
    { key: 'useShortName', label: 'Use Short Name:', type: 'switch', value: table.useShortName },
    { key: 'useUnit', label: 'Use Units:', type: 'switch', value: table.useUnit },
    { key: 'groupVarianceColumns', label: 'Group Variance Columns:', type: 'switch', value: table.groupVarianceColumns },
    { key: 'genericLabelForSubtotals', label: 'Use "Subtotal" for all Subtotal labels:', type: 'switch', value: table.genericLabelForSubtotals },
    { key: 'transposeTable', label: 'Transpose Table:', type: 'switch', value: table.transposeTable },
  ]

  const tableItems = [
    { key: 'rowSubtotals', label: 'Row Subtotals:', type: 'switch', value: table.rowSubtotals },
    { key: 'colSubtotals', label: 'Col Subtotals:', type: 'switch', value: table.colSubtotals },
    { key: 'sortRowSubtotalsBy', label: 'Row Subtotals By:', type: 'dropdown', value: table.sortRowSubtotalsBy },
    { key: 'spanRows', label: 'Merge Dimensions:', type: 'switch', value: table.spanRows },
    { key: 'calculateOthers', label: 'Calculate Others Row:', type: 'switch', value: table.calculateOthers },
    { key: 'subtotalDepth', label: 'Depth:', type: 'dropdown', value: table.subtotalDepth },
    { key: 'sortColumnsBy', label: 'Columns By:', type: 'dropdown', value: table.sortColumnsBy },
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