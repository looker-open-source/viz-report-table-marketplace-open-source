import React from 'react'

import { updateColumnMenu } from '../renderers/report_table_column_menu'

  
const ReportTableHeader = (params) => {
  // console.log('ReportTableHeader() Params', params)

  const column = params.rtColumn
  
  // this.eMenuButton = this.eGui.querySelector('.rt-column-menu-button');
  // this.eMenuButton.addEventListener('click', event => updateColumnMenu(event, agParams));

  // if (this.agParams.enableMenu) {
  //   this.onMenuClickListener = this.onMenuClick.bind(this);
  //   this.eMenuButton.addEventListener('click', this.onMenuClickListener);
  // } else {
  //   // this.eGui.removeChild(this.eMenuButton);
  // }
  
  const textClass = column.is_numeric ? 'numeric' : 'nonNumeric'

  return (
    <div className='rt-finance-cell-container rt-header-cell-container'>
      <div className="top-left"></div>
      <div className="top"></div>
      <div className="top-right"></div>
      <div className="left"></div>
      <div className="center rt-header-cell-label">
        <div className="rt-column-menu-button">⦿</div>
        <div className={textClass} style={{width: '100%'}}>{params.displayName}</div>
      </div>
      <div className="right"></div>
      <div className="bottom-left"></div>
      <div className="bottom strong-underline"></div>
      <div className="bottom-right"></div>
    </div>
  )
}

// ReportTableHeader.prototype.onMenuClick = function () {
//   this.agParams.showColumnMenu(this.eMenuButton);
// };

export default ReportTableHeader