import React from 'react'

import { ToggleSwitch, InputText } from '@looker/components'

const AcceptBoolean = ({ id, value }) => {
  const [on, setOn] = React.useState(value)
  const handleChange = (event) => setOn(event.target.checked)
  return (
    <ToggleSwitch on={on} onChange={handleChange} id={id} />
  )
}

const DisplayBoolean = ({ id, value }) => {
  return (
    <ToggleSwitch on={value} id={id} disabled={true} />
  )
}

const AcceptInputText = ({ id, value }) => {
  return (
    <InputText id={id} placeholder={value}/>
  )
}

const DisplayLabel = ({ id, value} ) => {
  return (
    <span>{value}</span>
  )
}

const ReportTableMenuItem = ({ item }) => {
  const { key, level, label, type, value } = item
  return (
    <>
      <div className='rt-grid-item'>{label}</div>
      <div className='rt-grid-item'>
        { type === 'switch' && <AcceptBoolean id={key} value={value} /> }
        { type === 'boolean' && <DisplayBoolean id={key} value={value} /> }
        { type === 'inputText' && <AcceptInputText id={key} value={value} /> }
        { type === 'label' && <DisplayLabel id={key} value={value} /> }
        { type === 'dropdown' && <DisplayLabel id={key} value={value} /> }
      </div>
    </>
  )
}

export default ReportTableMenuItem