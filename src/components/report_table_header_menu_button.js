import React, { useState, useCallback } from 'react'

import { ComponentsProvider, Icon} from '@looker/components'

import ReportTableColumnMenu from './report_table_column_menu'


const ReportTableHeaderMenuButton = ({ tableConfig, columnConfig }) => {
  const [showMenu, setShowMenu] = useState(false)

  const clickHandler = useCallback((event) => {
      setShowMenu(true)
    }
  )
  
  return (
    <ComponentsProvider>
        {console.log('ReportTableMenuButton() showMenu', showMenu)}
        <Icon 
          className='rt-header-menu-button' 
          name="DotsVert" 
          size="xxsmall" 
          onClick={clickHandler} 
        />
        {showMenu && <ReportTableColumnMenu 
            tableConfig={tableConfig} 
            columnConfig={columnConfig}
            setShowMenu={setShowMenu}
        />}
    </ComponentsProvider>
  )
}

export default ReportTableHeaderMenuButton