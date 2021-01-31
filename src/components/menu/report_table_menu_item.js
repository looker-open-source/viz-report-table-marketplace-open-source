import React, { useState } from 'react'

import { actions, ReportTableContext } from '../../context/report_table_context'

const MenuSwitch = ({ item, localRefresh }) => {
  const [checked, setChecked] = useState(item.value)
  const onChange = (event) => {
    setChecked(event.target.checked)
    localRefresh(event, item)
  }
  return (
    <input type='checkbox' id={item.key} name={item.key} value={item.value} checked={checked}  onChange={onChange}></input>
  ) 
}

const MenuText = ({ item, localRefresh }) => {
  const onChange = (event) => localRefresh(event, item)
  return (
    <input type='text' id={item.key} placeholder={item.value} onChange={onChange} />
  )
}

const MenuSelect = ({ item, options, localRefresh }) => {
  const onChange = (event) => localRefresh(event, item)
  return (
    <select name={item.key} id={item.key} onChange={onChange} >
      { options.map(option => <option key={option.label} value={option.value}>{option.label}</option>) }
    </select>
  )
}


const ReportTableMenuItem = ({ item }) => {
  const [state, dispatch] = React.useContext(ReportTableContext)

  function localRefresh (event, item) {
    const newValue = typeof event.target.checked === 'undefined' ? event.target.value : event.target.checked
    const message = {
      type: actions.UPDATE_TABLE_OPTION,
      payload: {
        option: item.key,
        value: newValue
      }
    }
    dispatch(message)
  }

  var widgetType
  if (item.type === 'boolean') {
    widgetType = 'toggle'
  } else if (item.type === 'string' && item.display !== 'select') {
    widgetType = 'text'
  } else if (item.type === 'string' && item.display === 'select') {
    widgetType = 'select'
    var options = []
    item.values.forEach((option) => {
      const [label, value] = Object.entries(option)[0]
      options.push({ label: label, value: value})
    })
  }

  return (
    <>
      <div className='rt-grid-item'>{item.label}</div>
      <div className='rt-grid-item'>
        { widgetType === 'toggle' && <MenuSwitch item={item} localRefresh={localRefresh} /> }
        { widgetType === 'text' && <MenuText item={item} localRefresh={localRefresh} /> }
        { widgetType === 'select' && <MenuSelect item={item} options={options} localRefresh={localRefresh} /> }
      </div>
    </>
  )
}

export default ReportTableMenuItem