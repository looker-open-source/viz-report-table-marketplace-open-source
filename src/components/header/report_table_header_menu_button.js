import React from 'react'

import { ComponentsProvider, Icon, Popover} from '@looker/components'

import ReportTableColumnMenu from '../menu/report_table_menu'


const ReportTableHeaderMenuButton = ({ column }) => {
  
  return (
    <ComponentsProvider>
        <Popover
          content={<ReportTableColumnMenu column={column} />}
        >
          <Icon 
            className='rt-header-menu-button' 
            name="DotsVert" 
            size="xxsmall" 
          />
        </Popover>
    </ComponentsProvider>
  )
}

export default ReportTableHeaderMenuButton