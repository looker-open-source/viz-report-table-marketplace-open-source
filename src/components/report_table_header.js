import React from 'react'

import ReportTableHeaderMenuButton from './report_table_header_menu_button'

const ReportTableHeader = (params) => {
  // console.log('ReportTableHeader() Params', params)

  const column = params.rtColumn
  const tableConfig = params.rtColumn.visConfig
  const columnConfig = {
    id: params.column.colId,
    actualWidth: params.column.actualWidth
  }
  
  const headerClass = column.is_numeric ? 'rt-header-cell rt-header-cell-left' : 'rt-header-cell rt-header-cell-right'
  const labelClass = column.is_numeric ? 'rt-header-label numeric' : 'rt-header-label nonNumeric'

  return (
    <div className='rt-finance-cell-container'>
      <div className="top-left" />
      <div className="top" />
      <div className="top-right" />
      <div className="left" />
      <div className='center'>
        <div className={headerClass}>
          <div className={labelClass}>{params.displayName}</div>
          <ReportTableHeaderMenuButton tableConfig={tableConfig} columnConfig={columnConfig}  />
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