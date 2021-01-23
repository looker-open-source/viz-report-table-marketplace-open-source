import React from 'react'
import { ComponentsProvider, Flex, Icon, Menu, MenuDisclosure, MenuList, MenuItem } from '@looker/components'
import ReportTableHeaderMenuButton from './report_table_header_menu_button'
// import { updateColumnMenu } from '../renderers/report_table_column_menu'

  
const ReportTableHeader = (params) => {
  // console.log('ReportTableHeader() Params', params)

  const column = params.rtColumn
  //rtColumn={params.rtColumn} column={params.column}
  const columnConfig = {
    id: params.column.colId,
    actualWidth: params.column.actualWidth
  }
  const hoverRef = React.useRef()
  // this.eMenuButton = this.eGui.querySelector('.rt-column-menu-button');
  // this.eMenuButton.addEventListener('click', event => updateColumnMenu(event, agParams));

  // if (this.agParams.enableMenu) {
  //   this.onMenuClickListener = this.onMenuClick.bind(this);
  //   this.eMenuButton.addEventListener('click', this.onMenuClickListener);
  // } else {
  //   // this.eGui.removeChild(this.eMenuButton);
  // }
  
  const headerClass = column.is_numeric ? 'rt-header-cell rt-header-cell-left' : 'rt-header-cell rt-header-cell-right'
  const labelClass = column.is_numeric ? 'rt-header-label numeric' : 'rt-header-label nonNumeric'
  //<div className="rt-column-menu-button">⦿</div>
  //           <ReportTableHeaderMenuButton rtColumn={params.rtColumn} column={params.column} />
  return (
    <ComponentsProvider>
      <div className='rt-finance-cell-container' ref={hoverRef}>
        <div className="top-left" />
        <div className="top" />
        <div className="top-right" />
        <div className="left" />
        <div className='center'>
          <div className={headerClass}>
            <div className={labelClass}>{params.displayName}</div>
            <ReportTableHeaderMenuButton columnConfig={columnConfig}  />
          </div>
        </div>
        <div className="right" />
        <div className="bottom-left" />
        <div className="bottom strong-underline" />
        <div className="bottom-right" />
      </div>
    </ComponentsProvider>
  )
}

// ReportTableHeader.prototype.onMenuClick = function () {
//   this.agParams.showColumnMenu(this.eMenuButton);
// };

export default ReportTableHeader