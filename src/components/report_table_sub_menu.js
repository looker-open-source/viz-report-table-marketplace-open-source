import React, { useContext } from 'react'

import { Popover} from '@looker/components'

import ReportTableContext from './report_table_context'
import ReportTableMenuItem from './report_table_menu_item'

const ReportTableSubMenu = ({ label, items }) => {
  const context = useContext(ReportTableContext)
  console.log('ReportTableMenu() tableConfig', context)
  
  const updateReportTable = (event) => {
    console.log('ReportTableSubMenu().updateReportTable() event', event)
    console.log('ReportTableSubMenu().updateReportTable() context.tableConfig', context.tableConfig)
    // let newconfig = Object.entries(context.tableConfig).map(([a, b]) => {
    //    var newobj = {}
    //    newobj[a] = b
    //    return newobj 
    // })
    let newconfig = []
    for (const [key, value] of Object.entries(context.tableConfig)) {
      if ([
        'transposeTable',
        'useHeadings',
        'useViewName'
      ].includes(key)) {
        let newoption = {}
        newoption[key] = value
        newconfig.push(newoption)
      }
    }
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