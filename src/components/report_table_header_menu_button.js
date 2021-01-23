import React from 'react'

import { ComponentsProvider, Icon} from '@looker/components'


const ReportTableHeaderMenuButton = (props) => {
  console.log('%c ReportTableHeaderMenuButton() props', 'color: orange', props)
  
  return (
    <ComponentsProvider>
        <Icon className='rt-header-menu-button' name="DotsVert" size="xxsmall" />
    </ComponentsProvider>
  )
}

export default ReportTableHeaderMenuButton