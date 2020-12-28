function ReportTableHeaderGroup() {}

ReportTableHeaderGroup.prototype.init = function (params) {
  // console.log('ReportTableHeaderGroup()', params)
  this.params = params;
  this.eGui = document.createElement('div');
  this.eGui.className = 'rt-finance-cell-container';
  this.eGui.innerHTML = ''
    + '<div class="top-left"></div>'
    + '<div class="top"></div>'
    + '<div class="top-right"></div>'
    + '<div class="left"></div>'
    + '<div class="center ag-header-group-cell-label">'
    +   this.params.displayName
    +   '<div class="customExpandButton"><i class="fa fa-arrow-right"></i></div>'
    + '</div>'
    + '<div class="right"></div>'
    + '<div class="bottom-left"></div>'
    + '<div class="bottom"></div>'
    + '<div class="bottom-right"></div>'
    ;

  this.onExpandButtonClickedListener = this.expandOrCollapse.bind(this);
  this.eExpandButton = this.eGui.querySelector('.customExpandButton');
  this.eExpandButton.addEventListener(
    'click',
    this.onExpandButtonClickedListener
  );

  this.onExpandChangedListener = this.syncExpandButtons.bind(this);
  this.params.columnGroup
    .getOriginalColumnGroup()
    .addEventListener('expandedChanged', this.onExpandChangedListener);

  this.syncExpandButtons();
};

ReportTableHeaderGroup.prototype.getGui = function () {
  return this.eGui;
};

ReportTableHeaderGroup.prototype.expandOrCollapse = function () {
  var currentState = this.params.columnGroup
    .getOriginalColumnGroup()
    .isExpanded();
  this.params.setExpanded(!currentState);
};

ReportTableHeaderGroup.prototype.syncExpandButtons = function () {
  function collapsed(toDeactivate) {
    toDeactivate.className =
      toDeactivate.className.split(' ')[0] + ' collapsed';
  }

  function expanded(toActivate) {
    toActivate.className = toActivate.className.split(' ')[0] + ' expanded';
  }

  if (this.params.columnGroup.getOriginalColumnGroup().isExpanded()) {
    expanded(this.eExpandButton);
  } else {
    collapsed(this.eExpandButton);
  }
};

ReportTableHeaderGroup.prototype.destroy = function () {
  this.eExpandButton.removeEventListener(
    'click',
    this.onExpandButtonClickedListener
  );
};

export { ReportTableHeaderGroup }