import React from 'react'

import ReportTableContext from './report_table_context'

const MenuSwitch = ({ item, localRefresh, update }) => {
  const onChange = (event) => localRefresh(event, item, update)
  return (
    <input type='checkbox' id={item.key} name={item.key} value={item.value} onChange={onChange}></input>
  )
}

const MenuText = ({ item, localRefresh, update }) => {
  const onChange = (event) => localRefresh(event, item, update)
  return (
    <input type='text' id={item.key} placeholder={item.value} onChange={onChange} />
  )
}

const MenuSelect = ({ item, options, localRefresh, update }) => {
  const onChange = (event) => localRefresh(event, item, update)
  return (
    <select name={item.key} id={item.key} onChange={onChange} >
      { options.map(option => <option key={option.label} value={option.value}>{option.label}</option>) }
    </select>
  )
}


const ReportTableMenuItem = ({ item, update }) => {
  const context = React.useContext(ReportTableContext)

  function localRefresh (event, item, update) {
    console.log('handleChange()')
    console.log(' ------ event', event)
    console.log(' ------ item', item)
    console.log(item.key, event.target.checked || event.target.value)
    if ([
      'transposeTable',
      'useHeadings',
      'useViewName'
    ].includes(item.key)) {
      context.tableConfig[item.key] = event.target.checked || event.target.value
      console.log('new context.tableConfig', context.tableConfig)
    }
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
        { widgetType === 'toggle' && <MenuSwitch item={item} localRefresh={localRefresh} update={update} /> }
        { widgetType === 'text' && <MenuText item={item} localRefresh={localRefresh} update={update} /> }
        { widgetType === 'select' && <MenuSelect item={item} options={options} localRefresh={localRefresh} update={update} /> }
      </div>
    </>
  )
}

export default ReportTableMenuItem