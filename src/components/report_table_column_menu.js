import React, { useCallback } from 'react'

const ReportTableColumnMenu = ({ tableConfig, columnConfig, setShowMenu }) => {
  console.log('ReportTableColumnMenu() called')
  const onMouseLeave = useCallback((event) => {
    console.log('onMouseLeave', columnConfig.id)
    setShowMenu(false)
  })

  return (
    <div className='rt-report-table-column-menu' onMouseLeave={onMouseLeave}>
      <div>Column: {columnConfig.id}</div>
      <hr />
      <div>Row Subtotals: {tableConfig.rowSubtotals}</div>
      <div>Col Subtotals: {tableConfig.colSubtotals}</div>
      <div>Sort Row Subtotals By: {tableConfig.sortRowSubtotalsBy}</div>
      <div>Merge Dimensions: {tableConfig.spanRows}</div>
      <div>Calculate Others Row: {tableConfig.calculateOthers}</div>
      <div>Subtotal Depth: {tableConfig.subtotalDepth}</div>
      <div>Sort Columns By: {tableConfig.sortColumnsBy}</div>
      <hr />
      <div>Use View Name: {tableConfig.useViewName}</div>
      <div>Use Headings: {tableConfig.useHeadings}</div>
      <div>Use Short Name: {tableConfig.useShortName}</div>
      <div>Use Units: {tableConfig.useUnit}</div>
      <div>Group Variance Columns: {tableConfig.groupVarianceColumns}</div>
      <div>Use "Subtotal" for all Subtotal labels: {tableConfig.genericLabelForSubtotals}</div>
      <div>Transpose Table: {tableConfig.transposeTable}</div>
    </div>
  )  
}

export default ReportTableColumnMenu