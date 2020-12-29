function ReportTableCell () {}

ReportTableCell.prototype.init = function(params) {
  // console.log('ReportTableCell()', params)  
  // get value for the cell
  var text = ''
  var data = params.data.data[params.dataTableColumn.id]
  // console.log('data', data)
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
  // console.log('text', text)

  // create the cell
  this.eGui = document.createElement('div');
  this.eGui.className = 'rt-finance-cell-container'
  this.eGui.innerHTML = ''
    + '<div class="top-left"></div>'
    + '<div class="top"></div>'
    + '<div class="top-right"></div>'
    + '<div class="left"></div>'
    + '<div class="center">'
    +   text
    + '</div>'
    + '<div class="right"></div>'
    + '<div class="bottom-left"></div>'
    + '<div class="bottom"></div>'
    + '<div class="bottom-right"></div>'
    ;
};

ReportTableCell.prototype.getGui = function() {
    return this.eGui;
};

export { ReportTableCell }