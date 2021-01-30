import React, { useContext } from 'react'

import { Popover} from '@looker/components'

import { ReportTableContext } from './report_table_context'
import ReportTableMenuItem from './report_table_menu_item'

const ReportTableSubMenu = ({ label, items }) => {
  const [context] = useContext(ReportTableContext)
  
  const updateReportTable = (event) => {
    context.updateTableConfig([context.tableConfig])
  }

  return (
      <Popover
        content={
          <div className='rt-report-table-column-submenu' onMouseLeave={updateReportTable}>
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

export default ReportTableSubMenu