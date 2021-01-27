import React, { useContext } from 'react'

import { Popover} from '@looker/components'

import ReportTableContext from './report_table_context'
import ReportTableMenuItem from './report_table_menu_item'

const ReportTableSubMenu = ({ label, items }) => {
  const context = useContext(ReportTableContext)
  console.log('ReportTableMenu() tableConfig', context)
  
  const updateReportTable = (event) => {
    console.log('updateReportTable() event', event)
    // let newconfig = [{ transposeTable: context.tableConfig.transposeTable }]
    let newconfig = Object.entries(context.tableConfig).map(([a, b]) => {
       var newobj = {}
       newobj[a] = b
       return newobj 
    }).filter(conf => conf.hasOwnProperty('transposeTable'))
    context.updateTableConfig(newconfig)
  }


  return (
      <Popover
        content={
          <div className='rt-report-table-column-submenu' onMouseLeave={updateReportTable}>
              {items.map(item => {
                return (<ReportTableMenuItem key={item.key} item={item} update={updateReportTable} />)
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