const ReportTableCell = (column, params) => { 
  // console.log('cellRenderer params', params)
  var text = ''
  var data = params.data.data[column.id]
  if (typeof params.data !== 'undefined') {
    if (data.html) {                              // cell has HTML defined
      var parser = new DOMParser()
      var parsed_html = parser.parseFromString(data.html, 'text/html')
      text = parsed_html.documentElement.textContent
    } else if (data.rendered || data.rendered === '') {     // could be deliberate choice to render empty string
      text = data.rendered
    } else {
      text = data.value   
    }
  } else {
    text = 'RENDER ERROR'
  }
  return text
}

export { ReportTableCell }