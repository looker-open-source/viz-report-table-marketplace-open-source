function ReportTableHeader() {}
  
ReportTableHeader.prototype.init = function (agParams) {
  console.log('ReportTableHeader() agParams', agParams)
  this.agParams = agParams;
  this.eGui = document.createElement('div');
  this.eGui.className = 'rt-finance-cell-container rt-header-cell-container'
  this.eGui.innerHTML = ''
    + '<div class="top-left"></div>'
    + '<div class="top"></div>'
    + '<div class="top-right"></div>'
    + '<div class="left"></div>'
    + '<div class="center rt-header-cell-label">'
    +    '<div class="rt-header-menu-button">+ </div>'
    +    '<div>' + this.agParams.displayName + '</div>'
    + '</div>'
    + '<div class="right"></div>'
    + '<div class="bottom-left"></div>'
    + '<div class="bottom"></div>'
    + '<div class="bottom-right"></div>'
    ;
  
  this.eMenuButton = this.eGui.querySelector('.rt-header-menu-button');
  this.eMenuButton.addEventListener('click', event => console.log('Column menu clicked', event));

  if (this.agParams.enableMenu) {
    this.onMenuClickListener = this.onMenuClick.bind(this);
    this.eMenuButton.addEventListener('click', this.onMenuClickListener);
  } else {
    // this.eGui.removeChild(this.eMenuButton);
  }
}

ReportTableHeader.prototype.getGui = function () {
  console.log('innerHTML', this.eGui.innerHTML)
  return this.eGui;
};

ReportTableHeader.prototype.onMenuClick = function () {
  this.agParams.showColumnMenu(this.eMenuButton);
};

export { ReportTableHeader }