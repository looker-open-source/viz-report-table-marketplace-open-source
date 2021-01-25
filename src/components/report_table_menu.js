import React, { useContext } from 'react'

import { Popover} from '@looker/components'

import ReportTableContext from './report_table_context'
import ReportTableMenuItem from './report_table_menu_item'

const ReportTableMenu = ({ label, items }) => {
  const context = useContext(ReportTableContext)
  console.log('ReportTableMenu() tableConfig', context)
  
  const updateReportTable = (event) => {
    console.log('updateReportTable() event', event)
  }


  return (
    <Popover
      onMouseLeave={updateReportTable}
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