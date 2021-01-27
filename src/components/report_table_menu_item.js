import React from 'react'

import ReportTableContext from './report_table_context'

function handleChange(event) {
  console.log('checkbox handleChange()')
  console.log(' ------ event', event)
  console.log(' ------ item', item)
  setOn(event.target.checked)
  update(item.key, event.target.checked)
}

const MenuSwitch = ({ item, update }) => {
  console.log('MenuSwitch', item)
  return (
    <input type='checkbox' id={item.key} name={item.key} value={item.value} onChange={handleChange}></input>
  )
}

const MenuText = ({ item }) => {
  console.log('MenuText', item)
  return (
    <input type='text' id={item.key} placeholder={item.value} onChange={handleChange} />
  )
}

const MenuSelect = ({ item, options }) => {
  console.log('MenuSelect', item)
  return (
    <select name={item.key} id={item.key} onChange={handleChange} >
      { options.map(option => <option key={option.label} value={option.value}>{option.label}</option>) }
    </select>
  )
}


const ReportTableMenuItem = ({ item }) => {
  console.log('ReportTableMenuItem() item', item)

  const context = React.useContext(ReportTableContext)

  const update = (update) => {
    console.log('update() update', update)
    // context.tableConfig[key] = value
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

    console.log('select options', options)
  }

  console.log('widgetType', widgetType)

  return (
    <>
      <div className='rt-grid-item'>{item.label}</div>
      <div className='rt-grid-item'>
        { widgetType === 'toggle' && <MenuSwitch item={item} update={update} /> }
        { widgetType === 'text' && <MenuText item={item} /> }
        { widgetType === 'select' && <MenuSelect item={item} options={options} update={update} /> }
      </div>
    </>
  )
}

export default ReportTableMenuItem