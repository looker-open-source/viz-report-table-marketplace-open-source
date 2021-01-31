function ReportTableCell () {}

ReportTableCell.prototype.init = function(params) {
    var text = ''
    const row = params.data
    const data = params.data.data[params.rtColumn.id]
    const subtotals = params.rtColumn.subtotals

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

    const tab_size = 7
    const textClass = data.cell_style.join(' ')
    var prefix = 0
    if (params.rtColumn.is_first_column) {
      if (data.cell_style.includes('total')) {
        var prefix = subtotals.show_all ? tab_size * row.depth : 0
      } else {
        var prefix = subtotals.show ? tab_size * subtotals.levels : 0
      }
    } 

    if (data.cell_style.includes('total')) {
      var topline = 'top total-overline'
      var bottomline = data.cell_style.includes('subtotal') && row.id !== 'Total' ? 'bottom' : 'bottom total-underline'
    } else {
      var topline = 'top'
      var bottomline = 'bottom'
    }

    this.eGui = document.createElement('div')
    this.eGui.className = 'rt-finance-cell-container'
    this.eGui.innerHTML = ''
      + '  <div class="top-left"></div>'
      + '  <div class=' + topline + '></div>'
      + '  <div class="top-right"></div>'
      + '  <div class="left"></div>'
      + '  <div class="center ' + textClass + '"><span style="margin-left: ' + prefix + 'px;">' + text + '</span></div>'
      + '  <div class="right"></div>'
      + '  <div class="bottom-left"></div>'
      + '  <div class="' + bottomline + '"></div>'
      + '  <div class="bottom-right"></div>'
      ;
}

ReportTableCell.prototype.getGui = function() {
    console.log('%c ======> ReportTableCell()', 'color:darkorange')
    return this.eGui;
};

export default ReportTableCell