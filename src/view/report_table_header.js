function ReportTableHeader() {}
  
ReportTableHeader.prototype.init = function (agParams) {
  console.log('ReportTableHeader() agParams', agParams)
  this.agParams = agParams;
  this.eGui = document.createElement('div');
  this.eGui.innerHTML =
    '' +
    '<div class="reportTableHeaderMenuButton"><i class="fa ' + this.agParams.menuIcon + '"></i></div>' +
    // '<div><span>+</span></div>' +
    '<div class="reportTableHeaderLabel text-' + agParams.dataTableColumn.modelField.align + '">' +
      this.agParams.displayName +
    '</div>';
  
  this.eMenuButton = this.eGui.querySelector('.reportTableHeaderMenuButton');

  if (this.agParams.enableMenu) {
    this.onMenuClickListener = this.onMenuClick.bind(this);
    this.eMenuButton.addEventListener('click', this.onMenuClickListener);
  } else {
    this.eGui.removeChild(this.eMenuButton);
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