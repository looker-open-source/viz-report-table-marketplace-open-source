function ReportTableHeader() {}
  
ReportTableHeader.prototype.init = function (agParams) {
  this.agParams = agParams;
  this.eGui = document.createElement('div');
  this.eGui.innerHTML =
    '' +
    '<div class="customHeaderMenuButton"><i class="fa ' +
      this.agParams.menuIcon +
      '"></i></div>' +
    '<div class="customHeaderLabel">' +
      this.agParams.displayName +
    '</div>' +
    '<div class="customSortDownLabel inactive"><i class="fa fa-long-arrow-alt-down"></i></div>' +
    '<div class="customSortUpLabel inactive"><i class="fa fa-long-arrow-alt-up"></i></div>' +
    '<div class="customSortRemoveLabel inactive"><i class="fa fa-times"></i></div>';
  
  this.eMenuButton = this.eGui.querySelector('.customHeaderMenuButton');
  this.eSortDownButton = this.eGui.querySelector('.customSortDownLabel');
  this.eSortUpButton = this.eGui.querySelector('.customSortUpLabel');
  this.eSortRemoveButton = this.eGui.querySelector('.customSortRemoveLabel');

  if (this.agParams.enableMenu) {
    this.onMenuClickListener = this.onMenuClick.bind(this);
    this.eMenuButton.addEventListener('click', this.onMenuClickListener);
  } else {
    this.eGui.removeChild(this.eMenuButton);
  }
}

export { ReportTableHeader }