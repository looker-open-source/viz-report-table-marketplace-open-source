import React from 'react'

import ReportTableContext from './report_table_context'

function handleChange(event, item, update) {
  console.log('handleChange()')
  console.log(' ------ event', event)
  console.log(' ------ item', item)
  console.log(item.key, event.target.checked || event.target.value)
  update(event)
}

const MenuSwitch = ({ item, update }) => {
  console.log('MenuSwitch', item)
  const onChange = (event) => handleChange(event, item, update)
  return (
    <input type='checkbox' id={item.key} name={item.key} value={item.value} onChange={onChange}></input>
  )
}

const MenuText = ({ item, update }) => {
  console.log('MenuText', item)
  const onChange = (event) => handleChange(event, item, update)
  return (
    <input type='text' id={item.key} placeholder={item.value} onChange={onChange} />
  )
}

const MenuSelect = ({ item, options, update }) => {
  console.log('MenuSelect() item', item)
  console.log('MenuSelect() options', options)
  const onChange = (event) => handleChange(event, item, update)
  return (
    <select name={item.key} id={item.key} onChange={onChange} >
      { options.map(option => <option key={option.label} value={option.value}>{option.label}</option>) }
    </select>
  )
}


const ReportTableMenuItem = ({ item, update }) => {
  console.log('ReportTableMenuItem() item', item)
  const context = React.useContext(ReportTableContext)

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
        { widgetType === 'text' && <MenuText item={item} update={update} /> }
        { widgetType === 'select' && <MenuSelect item={item} options={options} update={update} /> }
      </div>
    </>
  )
}

export default ReportTableMenuItem