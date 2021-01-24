import React from 'react'

import { ComponentsProvider, Icon, Popover} from '@looker/components'

import ReportTableColumnMenu from './report_table_column_menu'


const ReportTableHeaderMenuButton = ({ config, updateConfig }) => {
  
  return (
    <ComponentsProvider>
        <Popover
          content={<ReportTableColumnMenu config={config} updateConfig={updateConfig} />}
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