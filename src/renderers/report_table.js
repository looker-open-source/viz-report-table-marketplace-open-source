import { Grid } from '@ag-grid-community/core'
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
ModuleRegistry.registerModules([ClientSideRowModelModule])

import ReportTableHeaderGroup from '../renderers/report_table_header_group'
import ReportTableHeader from '../renderers/report_table_header'
import ReportTableCell from '../renderers/report_table_cell'
import { ReportTableColumnMenu } from '../renderers/report_table_column_menu'

require('../styles/report_table_themes.scss')


const ReportTable = (rtProps, element) => {
  const onFirstDataRendered = (params) => {
    console.log('onFirstDataRendered() params', params)
    // params.api.sizeColumnsToFit();

    var allColumnIds = [];
    gridOptions.columnApi.getAllColumns().forEach(function (column) {
      allColumnIds.push(column.colId);
    });
    gridOptions.columnApi.autoSizeColumns(allColumnIds, true)
  }

  var gridOptions = {
    ...rtProps,
    // onFirstDataRendered: onFirstDataRendered,
    components: {
      reportTableHeaderGroupComponent: ReportTableHeaderGroup,
      reportTableHeaderComponent: ReportTableHeader,
      reportTableCellComponent: ReportTableCell
    }
  }

  element.classList.add('ag-theme-finance')
  new Grid(element, gridOptions)
}

export default ReportTable