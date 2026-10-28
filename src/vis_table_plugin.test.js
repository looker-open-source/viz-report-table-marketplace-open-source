const {VisPluginTableModel} = require('./vis_table_plugin');

describe('VisPluginTableModel', () => {
  let mockQueryResponse;
  let mockLookerData;
  let mockConfig;

  beforeEach(() => {
    mockQueryResponse = {
      fields: {
        dimension_like: [],
        measure_like: [],
        pivots: [],
        supermeasure_like: [],
      },
      sorts: [],
    };
    mockLookerData = [];
    mockConfig = {};
  });

  test('should render table calculations under pivot when all raw measures are hidden', () => {
    mockQueryResponse.fields.dimension_like = [
      {name: 'dim_1', label: 'Dimension 1', type: 'string'},
    ];
    mockQueryResponse.fields.pivots = [{name: 'pivot_1', label: 'Pivot 1'}];
    mockQueryResponse.pivots = [
      {
        key: '2021',
        metadata: {pivot_1: {value: '2021'}},
        sort_values: {pivot_1: '2021'},
      },
      {
        key: '2022',
        metadata: {pivot_1: {value: '2022'}},
        sort_values: {pivot_1: '2022'},
      },
    ];
    mockQueryResponse.fields.measure_like = [
      {name: 'measure_1', label: 'Measure 1', type: 'number', hidden: true},
    ];
    mockQueryResponse.fields.supermeasure_like = [
      {
        name: 'table_calc_1',
        label: 'Table Calculation 1',
        type: 'number',
        is_table_calculation: true,
      },
    ];

    mockLookerData = [
      {
        dim_1: {value: 'Val1'},
        table_calc_1: {
          2021: {value: 10, rendered: '10'},
          2022: {value: 20, rendered: '20'},
        },
      },
    ];

    const model = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      mockConfig
    );
    expect(model).toBeDefined();
    expect(model.measures.length).toBeGreaterThan(0);
    expect(model.columns.length).toBeGreaterThan(0);

    const calcCols = model.columns.filter(
      c => c.modelField.name === 'table_calc_1'
    );
    expect(calcCols.length).toBeGreaterThan(0);
  });

  test('should instantiate successfully with empty data and config', () => {
    const model = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      mockConfig
    );
    expect(model).toBeDefined();
    expect(model.dimensions).toEqual([]);
  });

  test('should not crash when dimensions are empty (zero dimensions)', () => {
    delete mockQueryResponse.pivots; // Force flat table
    mockQueryResponse.fields.dimension_like = [];
    mockQueryResponse.fields.measure_like = [
      {name: 'measure_1', label: 'M1', type: 'number', is_numeric: true},
    ];
    mockConfig = {
      indexColumn: true,
      rowSubtotals: true,
    };
    mockQueryResponse.subtotals_data = {};

    const model = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      mockConfig
    );
    expect(model).toBeDefined();
    expect(model.dimensions).toEqual([]);
    expect(model.columns.length).toBeGreaterThan(0);
  });

  test('should not crash when creating variance columns when config.columnOrder is undefined', () => {
    delete mockQueryResponse.pivots; // Force flat table
    mockQueryResponse.fields.dimension_like = [
      {name: 'dim_1', label: 'D1', type: 'string'},
    ];
    mockQueryResponse.fields.measure_like = [
      {name: 'measure_1', label: 'M1', type: 'number', is_numeric: true},
      {name: 'measure_2', label: 'M2', type: 'number', is_numeric: true},
    ];

    mockConfig = {
      'comparison|measure_1': 'measure_2',
      // config.columnOrder is undefined
      'var_num|measure_1': true,
      'var_pct|measure_1': true,
    };

    const model = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      mockConfig
    );
    expect(model).toBeDefined();

    // Check that variance columns were created
    const varianceCols = model.columns.filter(c => c.isVariance);
    expect(varianceCols.length).toBeGreaterThan(0);

    const absVarCol = varianceCols.find(c => c.variance_type === 'absolute');
    expect(absVarCol).toBeDefined();
    expect(absVarCol.pos).toBeDefined();
  });

  test('should preserve LookML-hidden dimensions in table model to construct correct transposed row IDs', () => {
    delete mockQueryResponse.pivots; // Force flat table initially
    mockConfig.transposeTable = true;
    
    mockQueryResponse.fields.dimension_like = [
      {name: 'dim_hidden', label: 'Hidden Dimension', type: 'string', hidden: true},
    ];
    mockQueryResponse.fields.measure_like = [
      {name: 'measure_1', label: 'M1', type: 'number', is_numeric: true},
    ];
    
    mockLookerData = [
      { dim_hidden: {value: '2024-01'}, measure_1: {value: 100} },
      { dim_hidden: {value: '2024-02'}, measure_1: {value: 200} },
    ];

    const model = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      mockConfig
    );
    
    // The dimension should be preserved
    expect(model.dimensions.length).toBe(1);
    expect(model.dimensions[0].name).toBe('dim_hidden');
    
    // The row IDs should be constructed accurately and uniquely based on the dimension values
    expect(model.data.length).toBe(2);
    expect(model.data[0].id).toBe('2024-01');
    expect(model.data[1].id).toBe('2024-02');
    
    // As transposed, columns should match the row IDs instead of defaulting to ""
    const col01 = model.transposed_columns.find(c => c.id === '2024-01');
    const col02 = model.transposed_columns.find(c => c.id === '2024-02');
    expect(col01).toBeDefined();
    expect(col02).toBeDefined();
  });

  test('should handle Boolean (YesNo) Dimensions correctly with Row Subtotals', () => {
    delete mockQueryResponse.pivots;
    mockConfig.rowSubtotals = true;
    
    mockQueryResponse.fields.dimension_like = [
      {name: 'dim_bool', label: 'Boolean Dimension', type: 'yesno'},
      {name: 'dim_other', label: 'Other Dimension', type: 'string'},
    ];
    mockQueryResponse.fields.measure_like = [
      {name: 'measure_1', label: 'M1', type: 'number', is_numeric: true},
    ];
    
    mockLookerData = [
      { dim_bool: {value: true, rendered: 'Yes'}, dim_other: {value: 'A'}, measure_1: {value: 10} },
      { dim_bool: {value: false, rendered: 'No'}, dim_other: {value: 'B'}, measure_1: {value: 20} },
    ];

    const model = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      mockConfig
    );
    
    expect(model.dimensions.length).toBe(2);
    // There should be a subtotal row for 'Yes' and 'No' groups
    const subtotalRows = model.data.filter(r => r.type === 'subtotal');
    expect(subtotalRows.length).toBeGreaterThan(0);
  });

  test('should parse Tier/Bucket Dimensions correctly in Transposed Tables without collision', () => {
    delete mockQueryResponse.pivots;
    mockConfig.transposeTable = true;
    
    mockQueryResponse.fields.dimension_like = [
      {name: 'dim_tier', label: 'Tier Dimension', type: 'tier'},
    ];
    mockQueryResponse.fields.measure_like = [
      {name: 'measure_1', label: 'M1', type: 'number', is_numeric: true},
    ];
    
    mockLookerData = [
      { dim_tier: {value: '>= 100'}, measure_1: {value: 50} },
      { dim_tier: {value: '0 to 49'}, measure_1: {value: 20} },
    ];

    const model = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      mockConfig
    );
    
    expect(model.data.length).toBe(2);
    expect(model.data[0].id).toBe('>= 100');
    expect(model.data[1].id).toBe('0 to 49');
    
    const col1 = model.transposed_columns.find(c => c.id === '>= 100');
    const col2 = model.transposed_columns.find(c => c.id === '0 to 49');
    expect(col1).toBeDefined();
    expect(col2).toBeDefined();
  });

  test('should safely handle missing or null pivoted table calculations', () => {
    mockConfig.transposeTable = false;
    mockQueryResponse.fields.dimension_like = [
      {name: 'dim_1', label: 'Dimension 1', type: 'string'},
    ];
    mockQueryResponse.fields.pivots = [{name: 'pivot_1', label: 'Pivot 1'}];
    mockQueryResponse.pivots = [
      { key: '2021', metadata: {pivot_1: {value: '2021'}}, sort_values: {pivot_1: '2021'} },
      { key: '2022', metadata: {pivot_1: {value: '2022'}}, sort_values: {pivot_1: '2022'} },
    ];
    mockQueryResponse.fields.measure_like = [];
    mockQueryResponse.fields.supermeasure_like = [
      { name: 'table_calc_1', label: 'Calc 1', type: 'number', is_table_calculation: true },
    ];

    mockLookerData = [
      {
        dim_1: {value: 'Val1'},
        // table_calc_1 is missing 2022 (e.g. returned null/error)
        table_calc_1: {
          2021: {value: 10, rendered: '10'},
        },
      },
    ];

    const model = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      mockConfig
    );
    
    expect(model).toBeDefined();
    // 2022 should just be undefined or empty in the model, not crash
    expect(model.data[0].data['table_calc_1|2022']).toBeUndefined();
  });

  test('should correctly generate subtotals when a dimension is LookML-hidden', () => {
    delete mockQueryResponse.pivots;
    mockConfig.rowSubtotals = true;

    mockQueryResponse.fields.dimension_like = [
      {name: 'dim_hidden', label: 'Hidden Dimension', type: 'string', hidden: true},
      {name: 'dim_visible', label: 'Visible Dimension', type: 'string'},
    ];
    mockQueryResponse.fields.measure_like = [
      {name: 'measure_1', label: 'M1', type: 'number', is_numeric: true},
    ];

    mockLookerData = [
      { dim_hidden: {value: 'Group1'}, dim_visible: {value: 'A'}, measure_1: {value: 10} },
      { dim_hidden: {value: 'Group1'}, dim_visible: {value: 'B'}, measure_1: {value: 20} },
      { dim_hidden: {value: 'Group2'}, dim_visible: {value: 'C'}, measure_1: {value: 30} },
    ];

    const model = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      mockConfig
    );

    expect(model).toBeDefined();
    expect(model.dimensions.length).toBe(2);
    const subtotalRows = model.data.filter(r => r.type === 'subtotal');
    expect(subtotalRows.length).toBe(2);
    expect(subtotalRows[0].id).toContain('Group1');
    expect(subtotalRows[1].id).toContain('Group2');
  });

  test('should preserve LookML-hidden measures in table model', () => {
    delete mockQueryResponse.pivots;

    mockQueryResponse.fields.dimension_like = [
      {name: 'dim_1', label: 'Dimension 1', type: 'string'},
    ];
    mockQueryResponse.fields.measure_like = [
      {name: 'measure_hidden', label: 'Hidden Measure', type: 'number', is_numeric: true, hidden: true},
      {name: 'measure_visible', label: 'Visible Measure', type: 'number', is_numeric: true},
    ];

    mockLookerData = [
      { dim_1: {value: 'Val1'}, measure_hidden: {value: 100}, measure_visible: {value: 200} },
    ];

    const model = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      mockConfig
    );

    expect(model).toBeDefined();
    expect(model.measures.length).toBe(2);
    const hiddenMeasure = model.measures.find(m => m.name === 'measure_hidden');
    expect(hiddenMeasure).toBeDefined();
    const hiddenCol = model.columns.find(c => c.id === 'measure_hidden');
    expect(hiddenCol).toBeDefined();
    expect(model.data[0].data['measure_hidden'].value).toBe(100);
  });

  test('should safely handle rows with missing dimension keys without throwing', () => {
    delete mockQueryResponse.pivots;

    mockQueryResponse.fields.dimension_like = [
      {name: 'dim_1', label: 'Dimension 1', type: 'string'},
      {name: 'dim_2', label: 'Dimension 2', type: 'string'},
    ];
    mockQueryResponse.fields.measure_like = [
      {name: 'measure_1', label: 'M1', type: 'number', is_numeric: true},
    ];

    mockLookerData = [
      { dim_1: {value: 'A'}, measure_1: {value: 10} },
      { dim_2: {value: 'B'}, measure_1: {value: 20} },
    ];

    const model = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      mockConfig
    );

    expect(model).toBeDefined();
    expect(model.data.length).toBe(2);
    expect(model.data[0].id).toBe('A|');
    expect(model.data[1].id).toBe('|B');
  });

  test('should support variance, subtotals, and totals for supermeasure_like table calculations on pivoted queries with hidden raw measures', () => {
    mockQueryResponse.fields.dimension_like = [
      {name: 'dim_1', label: 'Dimension 1', type: 'string'},
    ];
    mockQueryResponse.fields.pivots = [{name: 'pivot_1', label: 'Pivot 1'}];
    mockQueryResponse.pivots = [
      {
        key: '2025-Q1',
        metadata: {pivot_1: {value: '2025-Q1', rendered: '2025-Q1'}},
        sort_values: {pivot_1: '2025-Q1'},
      },
    ];
    mockQueryResponse.fields.measure_like = [];
    mockQueryResponse.fields.supermeasure_like = [
      {
        name: 'profit_calc',
        label: 'Profit Calc',
        type: 'number',
        is_numeric: true,
        is_table_calculation: true,
        can_pivot: false,
      },
      {
        name: 'profit_2',
        label: 'Profit 2',
        type: 'number',
        is_numeric: true,
        is_table_calculation: true,
        can_pivot: false,
      },
    ];
    mockQueryResponse.totals_data = {
      profit_calc: {value: 30, rendered: '30'},
      profit_2: {value: 15, rendered: '15'},
    };
    mockQueryResponse.subtotals_data = {
      1: [
        {
          $$$__grouping__$$$: ['dim_1'],
          dim_1: {value: 'Brand A'},
          profit_calc: {value: 30, rendered: '30'},
        },
      ],
    };

    mockLookerData = [
      {
        dim_1: {value: 'Brand A', rendered: 'Brand A'},
        profit_calc: {value: 30, rendered: '30'},
        profit_2: {value: 15, rendered: '15'},
      },
    ];

    mockConfig = {
      rowSubtotals: true,
      'comparison|profit_calc': 'profit_2',
      'var_num|profit_calc': true,
      'var_pct|profit_calc': true,
    };

    const model = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      mockConfig
    );

    expect(model).toBeDefined();
    const varianceCols = model.columns.filter(c => c.isVariance);
    expect(varianceCols.length).toBe(2);
    const absVarCol = varianceCols.find(c => c.variance_type === 'absolute');
    expect(absVarCol).toBeDefined();
    const lineItemRow = model.data.find(r => r.type === 'line_item');
    expect(lineItemRow.data[absVarCol.id].value).toBe(15);
  });

  test('should support mixed variance between a pivoted measure_like and a non-pivoted supermeasure_like when hasRowTotals is true', () => {
    mockQueryResponse.fields.dimension_like = [
      {name: 'dim_1', label: 'Dimension 1', type: 'string'},
    ];
    mockQueryResponse.fields.pivots = [{name: 'pivot_1', label: 'Pivot 1'}];
    mockQueryResponse.pivots = [
      {
        key: '2025-Q1',
        is_total: false,
        metadata: {pivot_1: {value: '2025-Q1', rendered: '2025-Q1'}},
        sort_values: {pivot_1: '2025-Q1'},
      },
      {
        key: '$$$_row_total_$$$',
        is_total: true,
        metadata: {pivot_1: {value: 'Row Total', rendered: 'Row Total'}},
        sort_values: {pivot_1: 'zzz'},
      },
    ];
    mockQueryResponse.has_row_totals = true;
    mockQueryResponse.fields.measure_like = [
      {
        name: 'pivoted_sales',
        label: 'Pivoted Sales',
        type: 'number',
        is_numeric: true,
      },
    ];
    mockQueryResponse.fields.supermeasure_like = [
      {
        name: 'target_calc',
        label: 'Target Calc',
        type: 'number',
        is_numeric: true,
        is_table_calculation: true,
        can_pivot: false,
      },
    ];

    mockLookerData = [
      {
        dim_1: {value: 'Brand A', rendered: 'Brand A'},
        pivoted_sales: {
          '2025-Q1': {value: 100, rendered: '100'},
          $$$_row_total_$$$: {value: 100, rendered: '100'},
        },
        target_calc: {value: 80, rendered: '80'},
      },
    ];

    mockConfig = {
      'comparison|pivoted_sales': 'target_calc',
      'var_num|pivoted_sales': true,
      'var_pct|pivoted_sales': false,
      'comparison|target_calc': 'pivoted_sales',
      'var_num|target_calc': true,
      'var_pct|target_calc': false,
    };

    const model = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      mockConfig
    );

    const varianceCols = model.columns.filter(c => c.isVariance);
    expect(varianceCols.length).toBe(4);
    const lineItemRow = model.data.find(r => r.type === 'line_item');
    const salesVsTargetCol = varianceCols.find(
      c =>
        c.variance_type === 'absolute' &&
        c.id.includes('$$$_row_total_$$$.pivoted_sales|target_calc')
    );
    const targetVsSalesCol = varianceCols.find(
      c =>
        c.variance_type === 'absolute' &&
        c.id.includes('target_calc|$$$_row_total_$$$.pivoted_sales')
    );
    expect(salesVsTargetCol).toBeDefined();
    expect(targetVsSalesCol).toBeDefined();
    expect(lineItemRow.data[salesVsTargetCol.id].value).toBe(20);
    expect(lineItemRow.data[targetVsSalesCol.id].value).toBe(-20);
  });

  test('should safely skip mixed variance between pivoted measure_like and non-pivoted supermeasure_like when hasRowTotals is false', () => {
    mockQueryResponse.fields.dimension_like = [
      {name: 'dim_1', label: 'Dimension 1', type: 'string'},
    ];
    mockQueryResponse.fields.pivots = [{name: 'pivot_1', label: 'Pivot 1'}];
    mockQueryResponse.pivots = [
      {
        key: '2025-Q1',
        is_total: false,
        metadata: {pivot_1: {value: '2025-Q1', rendered: '2025-Q1'}},
        sort_values: {pivot_1: '2025-Q1'},
      },
    ];
    mockQueryResponse.has_row_totals = false;
    mockQueryResponse.fields.measure_like = [
      {
        name: 'pivoted_sales',
        label: 'Pivoted Sales',
        type: 'number',
        is_numeric: true,
      },
    ];
    mockQueryResponse.fields.supermeasure_like = [
      {
        name: 'target_calc',
        label: 'Target Calc',
        type: 'number',
        is_numeric: true,
        is_table_calculation: true,
        can_pivot: false,
      },
    ];

    mockLookerData = [
      {
        dim_1: {value: 'Brand A', rendered: 'Brand A'},
        pivoted_sales: {
          '2025-Q1': {value: 100, rendered: '100'},
        },
        target_calc: {value: 80, rendered: '80'},
      },
    ];

    mockConfig = {
      'comparison|pivoted_sales': 'target_calc',
      'var_num|pivoted_sales': true,
    };

    const model = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      mockConfig
    );

    expect(model).toBeDefined();
    const varianceCols = model.columns.filter(c => c.isVariance);
    expect(varianceCols.length).toBe(0);
  });

  test('should safely build totals and Others row when indexColumn and calculateOthers are enabled with zero dimensions and missing supermeasure totals', () => {
    delete mockQueryResponse.pivots;
    mockQueryResponse.fields.dimension_like = [];
    mockQueryResponse.fields.measure_like = [];
    mockQueryResponse.fields.supermeasure_like = [
      {
        name: 'super_sum',
        label: 'Super Sum',
        type: 'number',
        is_numeric: true,
        calculation_type: 'sum',
      },
      {
        name: 'super_avg',
        label: 'Super Avg',
        type: 'number',
        is_numeric: true,
        calculation_type: 'average',
      },
    ];
    mockQueryResponse.totals_data = {};
    mockQueryResponse.truncated = true;

    mockLookerData = [
      {
        super_sum: {value: 50, rendered: '50'},
        super_avg: {value: 25, rendered: '25'},
      },
    ];

    mockConfig = {
      indexColumn: true,
      calculateOthers: true,
    };

    const model = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      mockConfig
    );

    expect(model).toBeDefined();
    const totalRow = model.data.find(r => r.type === 'total');
    const othersRow = model.data.find(r => r.id === 'Others');
    expect(totalRow).toBeDefined();
    expect(othersRow).toBeDefined();
  });

  test('should generate subtotal cell tooltips cleanly both with visible dimensions and when all dimensions are hidden', () => {
    delete mockQueryResponse.pivots;
    mockQueryResponse.fields.dimension_like = [
      {name: 'dim_1', label: 'Department', type: 'string'},
      {name: 'dim_2', label: 'Category', type: 'string'},
    ];
    mockQueryResponse.fields.measure_like = [];
    mockQueryResponse.fields.supermeasure_like = [
      {
        name: 'profit_calc',
        label: 'Profit Calc',
        type: 'number',
        is_numeric: true,
        is_table_calculation: true,
      },
    ];

    mockLookerData = [
      {
        dim_1: {value: 'Apparel', rendered: 'Apparel Rendered'},
        dim_2: {value: 'Shoes', rendered: 'Shoes'},
        profit_calc: {value: 120, rendered: '$120'},
      },
    ];

    const visibleModel = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      {rowSubtotals: true, showTooltip: true}
    );
    const subtotalRow = visibleModel.data.find(r => r.type === 'subtotal');
    expect(subtotalRow).toBeDefined();
    const tooltipVisible = visibleModel.getCellToolTip(
      subtotalRow.id,
      'profit_calc'
    );
    expect(tooltipVisible).toContain('Apparel');
    expect(tooltipVisible).toContain('120');

    const hiddenDimsModel = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      {
        rowSubtotals: true,
        showTooltip: true,
        'hide|dim_1': true,
        'hide|dim_2': true,
      }
    );
    const hiddenSubtotalRow = hiddenDimsModel.data.find(
      r => r.type === 'subtotal'
    );
    expect(hiddenSubtotalRow).toBeDefined();
    expect(() =>
      hiddenDimsModel.getCellToolTip(hiddenSubtotalRow.id, 'profit_calc')
    ).not.toThrow();
    expect(
      hiddenDimsModel.getCellToolTip(hiddenSubtotalRow.id, 'profit_calc')
    ).toContain('120');
  });

  test('should omit empty pivot header tiers when all pivoted measures are hidden (measure_like is empty)', () => {
    mockQueryResponse.fields.dimension_like = [
      {name: 'role.name', label: 'User Role Name', type: 'string'},
      {name: 'folders.name', label: 'Folders Name', type: 'string'},
    ];
    mockQueryResponse.fields.pivots = [
      {name: 'user.created_year', label: 'User Created Year'},
    ];
    mockQueryResponse.pivots = [
      {
        key: '2021',
        metadata: {'user.created_year': {value: '2021'}},
        sort_values: {'user.created_year': '2021'},
      },
    ];
    mockQueryResponse.fields.measure_like = [];
    mockQueryResponse.fields.supermeasure_like = [];

    mockLookerData = [
      {
        'role.name': {value: 'Admin', rendered: 'Admin'},
        'folders.name': {
          value: 'Martino Buffolino',
          rendered: 'Martino Buffolino',
        },
      },
    ];

    const model = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      mockConfig
    );

    expect(model.hasPivots).toBe(false);
    expect(model.headers.map(h => h.type)).toEqual(['field']);
    expect(model.columns.length).toBe(2);
    expect(model.data.length).toBe(1);
  });
});
