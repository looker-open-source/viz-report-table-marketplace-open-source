import React from 'react'

import { updateColumnMenu } from './report_table_column_menu'

  
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
      <div class="top-left"></div>
      <div class="top"></div>
      <div class="top-right"></div>
      <div class="left"></div>
      <div class="center rt-header-cell-label">
        <div class="rt-column-menu-button">⦿</div>
        <div class={textClass} style={{width: '100%'}}>{params.displayName}</div>
      </div>
      <div class="right"></div>
      <div class="bottom-left"></div>
      <div class="bottom strong-underline"></div>
      <div class="bottom-right"></div>
    </div>
  )
}

// ReportTableHeader.prototype.onMenuClick = function () {
//   this.agParams.showColumnMenu(this.eMenuButton);
// };

export default ReportTableHeader