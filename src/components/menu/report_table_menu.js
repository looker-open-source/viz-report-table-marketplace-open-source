import React, { useContext } from 'react'

import { ReportTableContext } from '../../context/report_table_context'
import ReportTableSubMenu from './report_table_sub_menu'

const ReportTableColumnMenu = ({ column }) => {
  const [{ tableConfig, tableConfigOptions }] = useContext(ReportTableContext)

  const defaultSections = ['Display Options', 'Table Settings']
  var submenus = {}
  if (column.field.type === 'dimension') {
    var sections = ['Dimension Options', ...defaultSections]
  } else {
    var sections = ['Measure Options', ...defaultSections]
  }

  Object.entries(tableConfigOptions)
    .forEach(([key, value]) => {
      if (sections.includes(value._menu)) {
        if (typeof submenus[value._menu] === 'undefined') {
          submenus[value._menu] = []
        }

        if (value._field === column.field.name || defaultSections.includes(value._menu) ) {
          submenus[value._menu].push({
            key: key,
            ...value,
            value: tableConfig[key]
          })
        }
      }
    })

  return (
    <div className='rt-report-table-column-menu'>{
      Object.entries(submenus).map(([submenu, items]) => {
        const label = submenu + '...'
        return (<ReportTableSubMenu key={submenu} label={label} items={items} />)
      })
    }</div>
  )  
}

export default ReportTableColumnMenu