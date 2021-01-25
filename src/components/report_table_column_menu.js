import React, { useContext } from 'react'

import ReportTableContext from './report_table_context'
import ReportTableMenu from './report_table_menu'

const ReportTableColumnMenu = ({ config }) => {
  const { table, field, column } = config
  const tableContext = useContext(ReportTableContext)

  const defaultSections = ['Display Options', 'Table Settings']
  var submenus = {}
  if (field.type === 'dimension') {
    var sections = ['Dimension Options', ...defaultSections]
  } else {
    var sections = ['Measure Options', ...defaultSections]
  }

  Object.entries(tableContext.tableConfigOptions)
    .forEach(([key, value]) => {
      if (sections.includes(value._menu)) {
        if (typeof submenus[value._menu] === 'undefined') {
          submenus[value._menu] = []
        }

        if (value._field === field.name || defaultSections.includes(value._menu) ) {
          submenus[value._menu].push({
            key: key,
            ...value,
            value: tableContext.tableConfig[key]
          })
        }
      }
    })

  return (
    <div className='rt-report-table-column-menu'>{
      Object.entries(submenus).map(([submenu, items]) => {
        const label = submenu + '...'
        return (<ReportTableMenu key={submenu} label={label} items={items} />)
      })
    }</div>
  )  
}

export default ReportTableColumnMenu