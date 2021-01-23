import React from 'react'

import { ComponentsProvider, Icon} from '@looker/components'


const ReportTableHeaderMenuButton = (props) => {
  console.log('%c ReportTableHeaderMenuButton() props', 'color: orange', props)
  
  return (
    <ComponentsProvider>
      <div className='rt-header-menu-button'>
        <Icon name="DotsVert" size="xxsmall" />
      </div>
    </ComponentsProvider>
  )
}

export default ReportTableHeaderMenuButton