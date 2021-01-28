import React, { useState } from 'react'

import ReportTableContext from './report_table_context'

const MenuSwitch = ({ item, localRefresh }) => {
  // console.log('MenuSwitch() item', item)
  const [checked, setChecked] = useState(item.value)
  const onChange = (event) => {
    // console.log('onChange() event', event)
    setChecked(event.target.checked)
    localRefresh(event, item)
  }
  return (
    <input type='checkbox' id={item.key} name={item.key} value={item.value} checked={checked}  onChange={onChange}></input>
  ) // checked={item.value}
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


const ReportTableMenuItem = ({ item, update }) => {
  const context = React.useContext(ReportTableContext)

  function localRefresh (event, item) {
    const newValue = typeof event.target.checked === 'undefined' ? event.target.value : event.target.checked
    // if ([
    //   'transposeTable',
    //   'useHeadings',
    //   'useViewName',
    //   'useShortName',
    //   'groupVarianceColumns'
    // ].includes(item.key)) {
    //   const newValue = typeof event.target.checked === 'undefined' ? event.target.value : event.target.checked
    //   context.tableConfig[item.key] = newValue
    // }
    context.tableConfig[item.key] = newValue
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

  // console.log('ReportTableMenuItem() widgetType, item', widgetType, item)
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