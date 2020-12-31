import React from 'react'

const ReportTableCell = (params) => {
  // constructor(params) {
    // console.log('ReportTableCell()', params)  
    // get value for the cell
    var text = ''
    var row = params.data
    var data = params.data.data[params.rtColumn.id]
    // console.log('cell params', params)
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

    var textClass = data.cell_style.join(' ')
    if (data.cell_style.includes('total')) {
      // console.log('cell_style', data.cell_style)
      var topline = 'top total-overline'
      var bottomline = data.cell_style.includes('subtotal') && row.id !== 'Total' ? 'bottom' : 'bottom total-underline'
    } else {
      var topline = 'top'
      var bottomline = 'bottom'
    }

  // getGui() {
  //   console.log(this.eGui)
  //   return this.eGui
  // }

  return (
    <div className="rt-finance-cell-container">
      <div className="top-left"></div>
      <div className={topline}></div>
      <div className="top-right"></div>
      <div className="left"></div>
      <div className={"center " + textClass}>{text}</div>
      <div className="right"></div>
      <div className="bottom-left"></div>
      <div className={bottomline}></div>
      <div className="bottom-right"></div>
    </div>
  )
};

// ReportTableCell.prototype.getGui = function() {
//     return this.eGui;
// };

export default ReportTableCell