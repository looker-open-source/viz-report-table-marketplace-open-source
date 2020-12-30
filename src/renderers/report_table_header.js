function ReportTableHeader () {}

ReportTableHeader.prototype.init = function(params) {
  // console.log('ReportTableHeader() Params', params)

  const column = params.dataTableColumn
  
  // this.eMenuButton = this.eGui.querySelector('.rt-column-menu-button');
  // this.eMenuButton.addEventListener('click', event => updateColumnMenu(event, agParams));

  // if (this.agParams.enableMenu) {
  //   this.onMenuClickListener = this.onMenuClick.bind(this);
  //   this.eMenuButton.addEventListener('click', this.onMenuClickListener);
  // } else {
  //   // this.eGui.removeChild(this.eMenuButton);
  // }
  
  const textClass = column.modelField.is_numeric ? 'numeric' : 'nonNumeric'

  this.eGui = document.createElement('div')
  this.eGui.className = 'rt-finance-cell-container rt-header-cell-container'
  this.eGui.innerHTML = ''
    +  '<div class="top-left"></div>'
    +  '<div class="top"></div>'
    +  '<div class="top-right"></div>'
    +  '<div class="left"></div>'
    +  '<div class="center rt-header-cell-label">'
      +  '<div class="rt-column-menu-button">⦿</div>'
      +  '<div class="' + textClass + '" style="width: 100%">' + params.displayName + '</div>'
    +  '</div>'
    +  '<div class="right"></div>'
    +  '<div class="bottom-left"></div>'
    +  '<div class="bottom strong-underline"></div>'
    +  '<div class="bottom-right"></div>'
}

// ReportTableHeader.prototype.onMenuClick = function () {
//   this.agParams.showColumnMenu(this.eMenuButton);
// };

ReportTableHeader.prototype.getGui = function() {
  return this.eGui;
};

export default ReportTableHeader