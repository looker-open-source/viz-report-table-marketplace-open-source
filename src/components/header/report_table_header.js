import React from 'react'

import ReportTableHeaderMenuButton from './report_table_header_menu_button'

const ReportTableHeader = (props) => {
  console.log('%c ReportTableHeader() params', 'color:green', props)
  const column  = props.rtColumn
  
  const headerClass = column.field.is_numeric ? 'rt-header-cell rt-header-cell-left' : 'rt-header-cell rt-header-cell-right'
  const labelClass = column.field.is_numeric ? 'rt-header-label numeric' : 'rt-header-label nonNumeric'

  return (
    <div className='rt-finance-cell-container'>
      {console.log('%c ======> ReportTableHeader()', 'color:darkorange')}
      {console.log('------- params.displayName', props.displayName)}
      <div className="top-left" />
      <div className="top" />
      <div className="top-right" />
      <div className="left" />
      <div className='center'>
        <div className={headerClass}>
          <div className={labelClass}>{props.displayName}</div>
          <ReportTableHeaderMenuButton column={column} />
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