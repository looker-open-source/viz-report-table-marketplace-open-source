import React from 'react'
import { ComponentsProvider, Icon, Menu, MenuDisclosure, MenuList, MenuItem } from '@looker/components'
// import ReportTableHeaderMenuButton from './report_table_header_menu_button'
// import { updateColumnMenu } from '../renderers/report_table_column_menu'

  
const ReportTableHeader = (params) => {
  // console.log('ReportTableHeader() Params', params)

  const column = params.rtColumn
  const hoverRef = React.useRef()
  // this.eMenuButton = this.eGui.querySelector('.rt-column-menu-button');
  // this.eMenuButton.addEventListener('click', event => updateColumnMenu(event, agParams));

  // if (this.agParams.enableMenu) {
  //   this.onMenuClickListener = this.onMenuClick.bind(this);
  //   this.eMenuButton.addEventListener('click', this.onMenuClickListener);
  // } else {
  //   // this.eGui.removeChild(this.eMenuButton);
  // }
  
  const textClass = column.is_numeric ? 'numeric' : 'nonNumeric'
  //<div className="rt-column-menu-button">⦿</div>
  //           <ReportTableHeaderMenuButton rtColumn={params.rtColumn} column={params.column} />
  return (
    <ComponentsProvider>
      <div className='rt-finance-cell-container rt-header-cell-container' ref={hoverRef}>
        <div className="top-left" />
        <div className="top" />
        <div className="top-right" />
        <div className="left" />
        <div className="center rt-header-cell-label">
          <Menu hoverDisclosureRef={hoverRef}>
            <MenuDisclosure tooltip="Column Settings">
              <Icon name="DotsVert" size="xxsmall" />
            </MenuDisclosure>
            <MenuList compact>
              <MenuItem icon="FavoriteOutline" description="Set column width to fit contents">Auto Size</MenuItem>
              <MenuItem icon="FavoriteOutline" description="Hidden items can still be found in config panel">Hide</MenuItem>
              <MenuItem icon="FavoriteOutline" description="Option to group columns under a heading">Set Heading</MenuItem>
            </MenuList>
          </Menu>
          <div className={textClass} style={{width: '100%'}}>{params.displayName}</div>
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