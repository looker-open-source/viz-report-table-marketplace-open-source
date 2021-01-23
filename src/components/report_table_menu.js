import React from 'react'

import { Popover} from '@looker/components'

import ReportTableMenuItem from './report_table_menu_item'

const ReportTableMenu = ({ label, items }) => {
  
  return (
    <Popover
      content={
        <div className='rt-report-table-column-submenu'>
          {items.map(item => {
            return (<ReportTableMenuItem key={item.key} item={item} />)
          })}
        </div>
      }
      placement='right'
    >
      <div>{label}</div>
    </Popover>
  )
}

export default ReportTableMenu