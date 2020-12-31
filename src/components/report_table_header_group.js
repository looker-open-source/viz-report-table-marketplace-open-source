import React from 'react'

const ReportTableHeaderGroup = (params) => {
  // console.log('ReportTableHeaderGroup()', params)

  // this.onExpandButtonClickedListener = this.expandOrCollapse.bind(this);
  // this.eExpandButton = this.eGui.querySelector('.customExpandButton');
  // this.eExpandButton.addEventListener(
  //   'click',
  //   this.onExpandButtonClickedListener
  // );

  // this.onExpandChangedListener = this.syncExpandButtons.bind(this);
  // this.params.columnGroup
  //   .getOriginalColumnGroup()
  //   .addEventListener('expandedChanged', this.onExpandChangedListener);

  // this.syncExpandButtons();

  const level = params.level
  const column = params.rtColumn
  const colspan = column.levels[level].colspan

  if (colspan > 1) {
    var textClass = 'centerText'
  } else {
    var textClass = column.is_numeric ? 'numeric' : 'nonNumeric'
  }

  var bottomClass = params.displayName === '' ? 'bottom' : 'bottom underline'

  return (
    <div className='rt-finance-cell-container'>
      <div className="top-left"></div>
      <div className="top"></div>
      <div className="top-right"></div>
      <div className="left"></div>
      <div className="center ag-header-group-cell-label">
        <div className={textClass} style={{width: '100%'}}>{params.displayName}</div>
        {/* <div className="customExpandButton"><i className="fa fa-arrow-right"></i></div> */}
      </div>
      <div className="right"></div>
      <div className="bottom-left"></div>
      <div className={bottomClass}></div>
      <div className="bottom-right"></div>
    </div>
  )
};

// ReportTableHeaderGroup.prototype.getGui = function () {
//   return this.eGui;
// };

// ReportTableHeaderGroup.prototype.expandOrCollapse = function () {
//   var currentState = this.params.columnGroup
//     .getOriginalColumnGroup()
//     .isExpanded();
//   this.params.setExpanded(!currentState);
// };

// ReportTableHeaderGroup.prototype.syncExpandButtons = function () {
//   function collapsed(toDeactivate) {
//     toDeactivate.className =
//       toDeactivate.className.split(' ')[0] + ' collapsed';
//   }

//   function expanded(toActivate) {
//     toActivate.className = toActivate.className.split(' ')[0] + ' expanded';
//   }

//   if (this.params.columnGroup.getOriginalColumnGroup().isExpanded()) {
//     expanded(this.eExpandButton);
//   } else {
//     collapsed(this.eExpandButton);
//   }
// };

// ReportTableHeaderGroup.prototype.destroy = function () {
//   this.eExpandButton.removeEventListener(
//     'click',
//     this.onExpandButtonClickedListener
//   );
// };

export default ReportTableHeaderGroup