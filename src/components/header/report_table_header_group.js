import React from 'react'

const ReportTableHeaderGroup = (props) => {
  // console.log('ReportTableHeaderGroup() params', params)
  const column = props.rtColumn
  const colspan = column.colspans[props.level]

  if (colspan > 1) {
    var textClass = 'centerText'
  } else {
    var textClass = column.is_numeric ? 'numeric' : 'nonNumeric'
  }

  var bottomClass = props.displayName === '' ? 'bottom' : 'bottom underline'

  return (
    <div className='rt-finance-cell-container'>
      <div className="top-left"></div>
      <div className="top"></div>
      <div className="top-right"></div>
      <div className="left"></div>
      <div className="center ag-header-group-cell-label">
        <div className={textClass} style={{width: '100%'}}>{props.displayName}</div>
      </div>
      <div className="right"></div>
      <div className="bottom-left"></div>
      <div className={bottomClass}></div>
      <div className="bottom-right"></div>
    </div>
  )
};

export default ReportTableHeaderGroup