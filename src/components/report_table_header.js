import React from 'react'

import ReportTableHeaderMenuButton from './report_table_header_menu_button'

const ReportTableHeader = (params) => {
  console.log('ReportTableHeader() Params', params)

  const config = {
    table: params.rtColumn.visConfig,
    field: {},
    column: {
      id: params.column.colId,
      actualWidth: params.column.actualWidth,
      is_numeric: params.column.is_numeric
    }
  }
  
  const headerClass = config.column.is_numeric ? 'rt-header-cell rt-header-cell-left' : 'rt-header-cell rt-header-cell-right'
  const labelClass = config.column.is_numeric ? 'rt-header-label numeric' : 'rt-header-label nonNumeric'

  return (
    <div className='rt-finance-cell-container'>
      <div className="top-left" />
      <div className="top" />
      <div className="top-right" />
      <div className="left" />
      <div className='center'>
        <div className={headerClass}>
          <div className={labelClass}>{params.displayName}</div>
          <ReportTableHeaderMenuButton config={config} />
        </div>
      </div>
      <div className="right" />
      <div className="bottom-left" />
      <div className="bottom strong-underline" />
      <div className="bottom-right" />
    </div>
  )
}

export default ReportTableHeader