import React from 'react'

import { ComponentsProvider, Icon, Menu, MenuDisclosure, MenuList, MenuItem } from '@looker/components'


const ReportTableHeaderMenuButton = (props) => {
  console.log('ReportTableHeaderMenuButton props', props)
  // className="showOnHover" 
  const hoverRef = React.useRef()
  
  return (
    <ComponentsProvider>
      <div ref={hoverRef}>
        <Menu hoverDisclosureRef={hoverRef}>
          <MenuDisclosure tooltip="Column Settings">
            <Icon name="DotsVert" size="xxsmall" />
          </MenuDisclosure>
          <MenuList compact>
            <MenuItem icon="FavoriteOutline">Gouda</MenuItem>
            <MenuItem icon="FavoriteOutline">Swiss</MenuItem>
          </MenuList>
        </Menu>
      </div>
    </ComponentsProvider>
  )
}

export default ReportTableHeaderMenuButton