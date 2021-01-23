import React from 'react'

import { ComponentsProvider, Popover} from '@looker/components'

const ReportTableColumnMenu = ({ config }) => {
  const { table, field, column } = config

  return (
    <ComponentsProvider>
      <div className='rt-report-table-column-menu'>
        <Popover
          content={
            <div className='.rt-report-table-column-menu'>
              <div>Column: {column.id}</div>
            </div>
          }
          placement='right-start'
        >
          <div>Column... </div>
        </Popover>  
        
        <Popover
          content={
            <div className='.rt-report-table-column-menu'>
              <div>Use View Name: {table.useViewName}</div>
              <div>Use Headings: {table.useHeadings}</div>
              <div>Use Short Name: {table.useShortName}</div>
              <div>Use Units: {table.useUnit}</div>
              <div>Group Variance Columns: {table.groupVarianceColumns}</div>
              <div>Use "Subtotal" for all Subtotal labels: {table.genericLabelForSubtotals}</div>
              <div>Transpose Table: {table.transposeTable}</div>
            </div>
          }
          placement='right-start'
        >
          <div>Display... </div>
        </Popover> 

        <Popover
          content={
            <div className='.rt-report-table-column-menu'>
              <div>Row Subtotals: {table.rowSubtotals}</div>
              <div>Col Subtotals: {table.colSubtotals}</div>
              <div>Sort Row Subtotals By: {table.sortRowSubtotalsBy}</div>
              <div>Merge Dimensions: {table.spanRows}</div>
              <div>Calculate Others Row: {table.calculateOthers}</div>
              <div>Subtotal Depth: {table.subtotalDepth}</div>
              <div>Sort Columns By: {table.sortColumnsBy}</div>
            </div>
          }
          placement='right-start'
        >
          <div>Table... </div>
        </Popover>  
      </div>
    </ComponentsProvider>
  )  
}

export default ReportTableColumnMenu