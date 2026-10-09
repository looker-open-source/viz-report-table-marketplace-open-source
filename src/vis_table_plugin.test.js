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

  test('should render table calculations under pivot when all raw measures are hidden (b/539669056)', () => {
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

  test('should preserve LookML-hidden dimensions in table model to construct correct transposed row IDs (b/568342728)', () => {
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

  test('should correctly generate subtotals when a dimension is LookML-hidden (b/568550506)', () => {
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

  test('should preserve LookML-hidden measures in table model (b/568569628, b/568326626)', () => {
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
});
