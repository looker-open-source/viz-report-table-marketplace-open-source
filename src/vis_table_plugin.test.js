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
    expect(othersRow.data.super_sum.value).toBeUndefined();
    expect(othersRow.data.super_avg.value).toBeUndefined();
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

  test('should not crash in addColumnSubTotals when 2-pivot query also has Row Totals (is_total: true)', () => {
    mockQueryResponse.fields.dimension_like = [
      {name: 'dim_1', label: 'Department', type: 'string'},
    ];
    mockQueryResponse.fields.pivots = [
      {name: 'piv_1', label: 'Year'},
      {name: 'piv_2', label: 'Quarter'},
    ];
    mockQueryResponse.pivots = [
      {
        key: '2024|Q1',
        data: {piv_1: '2024', piv_2: 'Q1'},
        metadata: {piv_1: {value: '2024'}, piv_2: {value: 'Q1'}},
        sort_values: {piv_1: '2024', piv_2: 'Q1'},
      },
      {
        key: '2024|Q2',
        data: {piv_1: '2024', piv_2: 'Q2'},
        metadata: {piv_1: {value: '2024'}, piv_2: {value: 'Q2'}},
        sort_values: {piv_1: '2024', piv_2: 'Q2'},
      },
      {
        key: '$$$_row_total_$$$',
        is_total: true,
        data: {},
        metadata: {},
        sort_values: {},
      },
    ];
    mockQueryResponse.has_row_totals = true;
    mockQueryResponse.fields.measure_like = [
      {name: 'meas_1', label: 'Sales', type: 'number', is_numeric: true},
    ];

    mockLookerData = [
      {
        dim_1: {value: 'Apparel', rendered: 'Apparel'},
        meas_1: {
          '2024|Q1': {value: 100, rendered: '100'},
          '2024|Q2': {value: 150, rendered: '150'},
          $$$_row_total_$$$: {value: 250, rendered: '250'},
        },
      },
    ];

    const model = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      {colSubtotals: true}
    );

    const subtotalCols = model.columns.filter(c => c.subtotal);
    expect(subtotalCols.length).toBe(1);
    expect(subtotalCols[0].id).toBe('$$$_subtotal_$$$.2024.meas_1');
    expect(model.data[0].data['$$$_subtotal_$$$.2024.meas_1'].value).toBe(250);
  });

  test('should clamp subtotalDepth when it exceeds dimensions.length or when single dimension has undefined subtotalDepth', () => {
    delete mockQueryResponse.pivots;
    mockQueryResponse.fields.dimension_like = [
      {name: 'dim_1', label: 'Category', type: 'string'},
    ];
    mockQueryResponse.fields.measure_like = [
      {name: 'meas_1', label: 'Count', type: 'number', is_numeric: true},
    ];

    mockLookerData = [
      {
        dim_1: {value: 'A', rendered: 'A'},
        meas_1: {value: 100, rendered: '100'},
      },
      {
        dim_1: {value: 'B', rendered: 'B'},
        meas_1: {value: 200, rendered: '200'},
      },
    ];

    // Stale subtotalDepth ('3') > dimensions.length (1) should clamp to 1 without crashing
    const staleDepthModel = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      {rowSubtotals: true, subtotalDepth: '3'}
    );
    expect(staleDepthModel.addSubtotalDepth).toBe(1);
    expect(
      staleDepthModel.data.filter(r => r.type === 'subtotal').length
    ).toBe(2);

    // Undefined subtotalDepth on 1-dimension query should default to 1
    const defaultSingleDimModel = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      {rowSubtotals: true}
    );
    expect(defaultSingleDimModel.addSubtotalDepth).toBe(1);
    expect(
      defaultSingleDimModel.data.filter(r => r.type === 'subtotal').length
    ).toBe(2);
  });

  test('should not merge a line_item row upward into a preceding subtotal row in setRowSpans', () => {
    delete mockQueryResponse.pivots;
    mockQueryResponse.fields.dimension_like = [
      {name: 'dim_1', label: 'Department', type: 'string'},
      {name: 'dim_2', label: 'Category', type: 'string'},
    ];
    mockQueryResponse.fields.measure_like = [
      {name: 'meas_1', label: 'Sales', type: 'number', is_numeric: true},
    ];

    // Non-contiguous 'Apparel' groups (e.g. when sorted by measure)
    mockLookerData = [
      {
        dim_1: {value: 'Apparel', rendered: 'Apparel'},
        dim_2: {value: 'Shirts', rendered: 'Shirts'},
        meas_1: {value: 300, rendered: '300'},
      },
      {
        dim_1: {value: 'Footwear', rendered: 'Footwear'},
        dim_2: {value: 'Boots', rendered: 'Boots'},
        meas_1: {value: 200, rendered: '200'},
      },
      {
        dim_1: {value: 'Footwear', rendered: 'Footwear'},
        message_only: true,
        meas_1: {value: 100, rendered: '100'},
      },
    ];

    const model = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      {rowSubtotals: true, spanRows: true, subtotalDepth: '1'}
    );

    const lineItems = model.data.filter(r => r.type === 'line_item');
    lineItems.forEach(row => {
      // Top row of each subtotal group must remain visible (rowspan >= 1)
      if (row.data.dim_2.value === 'Boots' || row.data.dim_2.value === 'Shirts') {
        expect(row.data.dim_1.rowspan).toBeGreaterThanOrEqual(1);
        expect(row.data.dim_2.rowspan).toBeGreaterThanOrEqual(1);
      }
    });
  });

  test('should use visible dimension header cell and hide hidden Others column when transposing table', () => {
    delete mockQueryResponse.pivots;
    mockQueryResponse.truncated = true;
    mockQueryResponse.totals_data = {
      meas_1: {value: 500, rendered: '500'},
    };
    mockQueryResponse.fields.dimension_like = [
      {name: 'dim_1', label: 'Hidden Dept', type: 'string'},
      {name: 'dim_2', label: 'Visible Category', type: 'string'},
    ];
    mockQueryResponse.fields.measure_like = [
      {
        name: 'meas_1',
        label: 'Sales',
        type: 'number',
        is_numeric: true,
        calculation_type: 'sum',
      },
    ];

    mockLookerData = [
      {
        dim_1: {value: 'Apparel', rendered: 'Apparel'},
        dim_2: {value: 'Shoes', rendered: 'Shoes'},
        meas_1: {value: 300, rendered: '300'},
      },
    ];

    const model = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      {
        'hide|dim_1': true,
        transposeTable: true,
        calculateOthers: true,
        rowSubtotals: true,
        subtotalDepth: '1',
      }
    );

    // Top-left transposed index header cell should use dim_2 ('Visible Category'), not hidden dim_1
    const indexCol = model.transposed_columns.find(
      c => c.modelField.type === 'transposed_table_index'
    );
    expect(indexCol.levels[0].label).toBe('Visible Category');

    // Hidden 'Others' line_item row should also be marked hidden in transposed_columns
    const hiddenOthersCol = model.transposed_columns.find(
      c => c.id === 'Others'
    );
    expect(hiddenOthersCol.hide).toBe(true);
    expect(
      model.getTableHeaderCells(0).some(c => c.id === 'Others')
    ).toBe(false);
    const colGroups = model.getTableColumnGroups();
    const allGroupedColIds = colGroups.flat().map(c => c.id);
    expect(allGroupedColIds).not.toContain('Others');
  });

  test('should preserve useUnit prefix and blank string measures in client-calculated subtotals, set fieldLevel, and guard black_red formatting', () => {
    delete mockQueryResponse.pivots;
    delete mockQueryResponse.subtotals_data;
    mockQueryResponse.fields.dimension_like = [
      {name: 'dim_1', label: 'Department', type: 'string'},
      {name: 'dim_2', label: 'Brand', type: 'string'},
    ];
    mockQueryResponse.fields.measure_like = [
      {
        name: 'rev_meas',
        label: 'Revenue',
        type: 'sum',
        is_numeric: true,
        value_format: '#,##0',
        tags: ['vis-tools:unit:$'],
      },
      {
        name: 'note_meas',
        label: 'Note',
        type: 'string',
        is_numeric: false,
      },
    ];

    mockLookerData = [
      {
        dim_1: {value: 'Apparel', rendered: 'Apparel'},
        dim_2: {value: 'Brand A', rendered: 'Brand A'},
        rev_meas: {value: -150, rendered: '-$150'},
        note_meas: {value: 'Sample note', rendered: 'Sample note'},
      },
    ];

    const model = new VisPluginTableModel(
      mockLookerData,
      mockQueryResponse,
      {
        rowSubtotals: true,
        useUnit: true,
        useHeadings: true,
        'style|rev_meas': 'black_red',
      }
    );

    expect(model.fieldLevel).toBe(1);
    const subtotalRow = model.data.find(r => r.type === 'subtotal');
    expect(subtotalRow).toBeDefined();
    expect(subtotalRow.data.rev_meas.rendered).toBe('$-150');
    expect(subtotalRow.data.rev_meas.cell_style).toContain('negative');
    expect(subtotalRow.data.note_meas.rendered).toBe('');
  });

  describe('adversarial logic regression gates', () => {
    test('Gate #1: empty pivots array [] should not set hasPivots=true or drop measure_like columns', () => {
      mockQueryResponse.pivots = [];
      mockQueryResponse.fields.pivots = [];
      mockQueryResponse.fields.dimension_like = [
        {name: 'dim_1', label: 'Dim 1', type: 'string'},
      ];
      mockQueryResponse.fields.measure_like = [
        {name: 'meas_1', label: 'Meas 1', type: 'number', is_numeric: true},
      ];
      mockLookerData = [
        {
          dim_1: {value: 'A', rendered: 'A'},
          meas_1: {value: 42, rendered: '42'},
        },
      ];

      const model = new VisPluginTableModel(
        mockLookerData,
        mockQueryResponse,
        {transposeTable: true}
      );

      expect(model.hasPivots).toBe(false);
      expect(model.columns.map(c => c.id)).toContain('meas_1');
      expect(model.transposed_data.length).toBe(1);
    });

    test('Gate #2: subtotalDepth on multi-dimension query should clamp to dimensions.length - 1', () => {
      delete mockQueryResponse.pivots;
      mockQueryResponse.fields.dimension_like = [
        {name: 'dim_1', label: 'Dept', type: 'string'},
        {name: 'dim_2', label: 'Category', type: 'string'},
      ];
      mockQueryResponse.fields.measure_like = [
        {name: 'meas_1', label: 'Sales', type: 'number', is_numeric: true},
      ];
      mockLookerData = [
        {
          dim_1: {value: 'Apparel', rendered: 'Apparel'},
          dim_2: {value: 'Shirts', rendered: 'Shirts'},
          meas_1: {value: 100, rendered: '100'},
        },
        {
          dim_1: {value: 'Apparel', rendered: 'Apparel'},
          dim_2: {value: 'Pants', rendered: 'Pants'},
          meas_1: {value: 200, rendered: '200'},
        },
      ];

      const model = new VisPluginTableModel(
        mockLookerData,
        mockQueryResponse,
        {rowSubtotals: true, subtotalDepth: '3'}
      );

      expect(model.addSubtotalDepth).toBe(1);
      expect(model.data.filter(r => r.type === 'subtotal').length).toBe(1);
    });

    test('Gate #3: setRowSpans should reset colspan=1 and remove stale merged class when buildTotals runs before addSubTotals', () => {
      delete mockQueryResponse.pivots;
      mockQueryResponse.totals_data = {
        meas_1: {value: 300, rendered: '300'},
      };
      mockQueryResponse.fields.dimension_like = [
        {name: 'dim_1', label: 'Dept', type: 'string'},
        {name: 'dim_2', label: 'Category', type: 'string'},
        {name: 'dim_3', label: 'Item', type: 'string'},
      ];
      mockQueryResponse.fields.measure_like = [
        {name: 'meas_1', label: 'Sales', type: 'number', is_numeric: true},
      ];
      mockLookerData = [
        {
          dim_1: {value: 'Apparel', rendered: 'Apparel'},
          dim_2: {value: 'Shirts', rendered: 'Shirts'},
          dim_3: {value: 'Tee', rendered: 'Tee'},
          meas_1: {value: 100, rendered: '100'},
        },
        {
          dim_1: {value: 'Apparel', rendered: 'Apparel'},
          dim_2: {value: 'Pants', rendered: 'Pants'},
          dim_3: {value: 'Jeans', rendered: 'Jeans'},
          meas_1: {value: 200, rendered: '200'},
        },
      ];

      const model = new VisPluginTableModel(
        mockLookerData,
        mockQueryResponse,
        {rowSubtotals: true, subtotalDepth: '2', spanRows: true}
      );

      const lineItems = model.data.filter(r => r.type === 'line_item');
      lineItems.forEach(row => {
        expect(row.data.dim_1.rowspan).toBe(1);
        expect(row.data.dim_1.colspan).toBe(1);
        expect(row.data.dim_1.cell_style).not.toContain('merged');
      });
    });

    test('Gate #4b & #5: zero Others value is preserved, and null dimension group matches subtotals_data without colliding with Others', () => {
      delete mockQueryResponse.pivots;
      mockQueryResponse.truncated = true;
      mockQueryResponse.totals_data = {
        meas_1: {value: 300, rendered: '300'},
      };
      mockQueryResponse.subtotals_data = {
        1: [
          {
            $$$__grouping__$$$: ['dim_1'],
            dim_1: {value: null, rendered: '∅'},
            meas_1: {value: 100, rendered: '100'},
          },
          {
            $$$__grouping__$$$: ['dim_1'],
            dim_1: {value: 'Apparel', rendered: 'Apparel'},
            meas_1: {value: 200, rendered: '200'},
          },
        ],
      };
      mockQueryResponse.fields.dimension_like = [
        {name: 'dim_1', label: 'Dept', type: 'string'},
        {name: 'dim_2', label: 'Category', type: 'string'},
      ];
      mockQueryResponse.fields.measure_like = [
        {
          name: 'meas_1',
          label: 'Sales',
          type: 'sum',
          is_numeric: true,
        },
      ];
      mockLookerData = [
        {
          dim_1: {value: null, rendered: '∅'},
          dim_2: {value: 'Unassigned', rendered: 'Unassigned'},
          meas_1: {value: 100, rendered: '100'},
        },
        {
          dim_1: {value: 'Apparel', rendered: 'Apparel'},
          dim_2: {value: 'Shirts', rendered: 'Shirts'},
          meas_1: {value: 200, rendered: '200'},
        },
      ];

      const model = new VisPluginTableModel(
        mockLookerData,
        mockQueryResponse,
        {rowSubtotals: true, subtotalDepth: '1', calculateOthers: true}
      );

      const nullSubtotal = model.data.find(r => r.id === 'Subtotal|');
      const othersSubtotal = model.data.find(r => r.id === 'Subtotal|Others');
      expect(nullSubtotal).toBeDefined();
      expect(nullSubtotal.data.dim_1.rendered).toBe('∅');
      expect(nullSubtotal.data.meas_1.value).toBe(100);
      expect(othersSubtotal).toBeDefined();
      expect(othersSubtotal.data.dim_1.rendered).toBe('Others');
      expect(othersSubtotal.data.meas_1.value).toBe(0);
    });

    test('Gate #6: addColumnSubTotals averages average/% measures, blanks string measures, and renders null for all-null groups', () => {
      mockQueryResponse.fields.dimension_like = [
        {name: 'dim_1', label: 'Dept', type: 'string'},
      ];
      mockQueryResponse.fields.pivots = [
        {name: 'piv_1', label: 'Year'},
        {name: 'piv_2', label: 'Quarter'},
      ];
      mockQueryResponse.pivots = [
        {
          key: '2024|Q1',
          data: {piv_1: '2024', piv_2: 'Q1'},
          metadata: {
            piv_1: {value: '2024', rendered: 'FY2024'},
            piv_2: {value: 'Q1', rendered: 'Q1'},
          },
          sort_values: {piv_1: '2024', piv_2: 'Q1'},
        },
        {
          key: '2024|Q2',
          data: {piv_1: '2024', piv_2: 'Q2'},
          metadata: {
            piv_1: {value: '2024', rendered: 'FY2024'},
            piv_2: {value: 'Q2', rendered: 'Q2'},
          },
          sort_values: {piv_1: '2024', piv_2: 'Q2'},
        },
      ];
      mockQueryResponse.fields.measure_like = [
        {
          name: 'avg_meas',
          label: 'Avg Price',
          type: 'average',
          is_numeric: true,
          value_format: '#,##0',
        },
        {
          name: 'str_meas',
          label: 'Note',
          type: 'string',
          is_numeric: false,
        },
        {
          name: 'null_meas',
          label: 'Empty Metric',
          type: 'sum',
          is_numeric: true,
        },
      ];
      mockLookerData = [
        {
          dim_1: {value: 'Apparel', rendered: 'Apparel'},
          avg_meas: {
            '2024|Q1': {value: 100, rendered: '100'},
            '2024|Q2': {value: 200, rendered: '200'},
          },
          str_meas: {
            '2024|Q1': {value: 'A', rendered: 'A'},
            '2024|Q2': {value: 'B', rendered: 'B'},
          },
          null_meas: {
            '2024|Q1': {value: null, rendered: '∅'},
            '2024|Q2': {value: null, rendered: '∅'},
          },
        },
      ];

      const model = new VisPluginTableModel(
        mockLookerData,
        mockQueryResponse,
        {colSubtotals: true, spanCols: true}
      );

      const row = model.data[0];
      expect(row.data['$$$_subtotal_$$$.2024.avg_meas'].value).toBe(150);
      expect(row.data['$$$_subtotal_$$$.2024.str_meas'].value).toBe('');
      expect(row.data['$$$_subtotal_$$$.2024.str_meas'].rendered).toBe('');
      expect(row.data['$$$_subtotal_$$$.2024.null_meas'].value).toBeNull();
      expect(row.data['$$$_subtotal_$$$.2024.null_meas'].rendered).toBe('∅');
      const avgSubCol = model.getColumnById('$$$_subtotal_$$$.2024.avg_meas');
      expect(avgSubCol.getHeaderCellLabelByType('pivot0')).toBe('FY2024');
    });

    test('Gate #7: getConfigOptions allows pivoted measure vs supermeasure with Row Totals and aligns colgroup with columns', () => {
      mockQueryResponse.fields.dimension_like = [
        {name: 'dim_1', label: 'Dim 1', type: 'string'},
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
          can_pivot: true,
          is_table_calculation: false,
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

      const model = new VisPluginTableModel(
        mockLookerData,
        mockQueryResponse,
        {
          'comparison|pivoted_sales': 'target_calc',
          'var_num|pivoted_sales': true,
        }
      );

      const comparisonValues = model.config_options
        ? model.config_options['comparison|pivoted_sales'].values
        : model.getConfigOptions()['comparison|pivoted_sales'].values;
      expect(comparisonValues).toEqual(
        expect.arrayContaining([{'Vs. Target Calc': 'target_calc'}])
      );

      const visibleColIds = model.columns.filter(c => !c.hide).map(c => c.id);
      const colGroupIds = model.getTableColumnGroups().flat().map(c => c.id);
      expect(colGroupIds).toEqual(visibleColIds);
    });

    test('Gate #8: transposed table with indexColumn=true and calculateOthers=true preserves Others column header', () => {
      delete mockQueryResponse.pivots;
      mockQueryResponse.truncated = true;
      mockQueryResponse.totals_data = {
        meas_1: {value: 500, rendered: '500'},
      };
      mockQueryResponse.fields.dimension_like = [
        {name: 'dim_1', label: 'Dept', type: 'string'},
        {name: 'dim_2', label: 'Brand', type: 'string'},
      ];
      mockQueryResponse.fields.measure_like = [
        {
          name: 'meas_1',
          label: 'Sales',
          type: 'sum',
          is_numeric: true,
        },
      ];
      mockLookerData = [
        {
          dim_1: {value: 'Apparel', rendered: 'Apparel'},
          dim_2: {value: 'Acme', rendered: 'Acme'},
          meas_1: {value: 300, rendered: '300'},
        },
      ];

      const model = new VisPluginTableModel(
        mockLookerData,
        mockQueryResponse,
        {
          indexColumn: true,
          calculateOthers: true,
          transposeTable: true,
        }
      );

      const othersCol = model.transposed_columns.find(c => c.id === 'Others');
      expect(othersCol).toBeDefined();
      expect(othersCol.levels[0].label).toBe('Others');
    });

    test('Gate #9: getCellToolTip escapes HTML characters in labels and values', () => {
      delete mockQueryResponse.pivots;
      mockQueryResponse.fields.dimension_like = [
        {name: 'dim_1', label: 'Brand <script>', type: 'string'},
      ];
      mockQueryResponse.fields.measure_like = [
        {name: 'meas_1', label: 'Sales & Tax', type: 'number', is_numeric: true},
      ];
      mockLookerData = [
        {
          dim_1: {value: '<img onerror=alert(1)>', rendered: '<img onerror=alert(1)>'},
          meas_1: {value: 100, rendered: '$100 <raw>'},
        },
      ];

      const model = new VisPluginTableModel(
        mockLookerData,
        mockQueryResponse,
        {showTooltip: true}
      );

      const tip = model.getCellToolTip(model.data[0].id, 'meas_1');
      expect(tip).not.toContain('<script>');
      expect(tip).not.toContain('<img');
      expect(tip).toContain('&lt;script&gt;');
      expect(tip).toContain('&lt;img onerror=alert(1)&gt;');
      expect(tip).toContain('Sales &amp; Tax');
    });
  });
});
