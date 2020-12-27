function ReportTableCell () {}

ReportTableCell.prototype.init = function(params) {
  console.log('ReportTableCell()', params)  
  // get value for the cell
  var text = ''
  var data = params.data.data[params.dataTableColumn.id]
  console.log('data', data)
  if (typeof params.data !== 'undefined') {
    if (data.html) {                                     // cell has HTML defined
      var parser = new DOMParser()
      var parsed_html = parser.parseFromString(data.html, 'text/html')
      text = parsed_html.documentElement.textContent
    } else if (data.rendered || data.rendered === '') {  // could be deliberate choice to render empty string
      text = data.rendered
    } else {
      text = data.value   
    }
  } else {
    text = 'RENDER ERROR'
  }
  console.log('text', text)

  // create the cell
  // data.cell_style.push('ag-cell-label')
  console.log('class', data.cell_style.join(' '))
  this.eGui = document.createElement('div');
  this.eGui.className = 'eGui' // data.cell_style.join(' ')
  this.eGui.style = 'height: 100%; width: 100%; font-size: 12px; color: #000000;'
  // this.eGui.innerHTML = '<span class="my-value">' + text + '</span>';
  this.eGui.innerHTML = text

  // this.eValue = this.eGui.querySelector('.my-value');
  // this.eValue.innerHTML = text;
};

ReportTableCell.prototype.getGui = function() {
    console.log('this.eGui', this.eGui)
    return this.eGui;
};

export { ReportTableCell }