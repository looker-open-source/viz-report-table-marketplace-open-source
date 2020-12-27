function ReportTableCell () {}

ReportTableCell.prototype.init = function(params) {
  console.log('ReportTableCell()', params)  
  // get value for the cell
  var text = ''
  var data = params.data.data[params.dataTableColumn.id]
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

  // create the cell
  this.eGui = document.createElement('div');
  this.eGui.innerHTML = ''
  + '<span class="my-value"></span>';

  this.eValue = this.eGui.querySelector('.my-value');
  this.eValue.innerHTML = text;
};

ReportTableCell.prototype.getGui = function() {
    return this.eGui;
};

export { ReportTableCell }