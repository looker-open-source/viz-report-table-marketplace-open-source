const { VisPluginTableModel } = require('./vis_table_plugin');

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
        supermeasure_like: []
      },
      sorts: [],
      pivots: [],
    };
    mockLookerData = [];
    mockConfig = {};
  
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
});

  test('should instantiate successfully with empty data and config', () => {
    const model = new VisPluginTableModel(mockLookerData, mockQueryResponse, mockConfig);
    expect(model).toBeDefined();
    expect(model.dimensions).toEqual([]);
  });

  test('should not crash when dimensions are empty (zero dimensions)', () => {
    delete mockQueryResponse.pivots; // Force flat table
    mockQueryResponse.fields.dimension_like = [];
    mockQueryResponse.fields.measure_like = [
      { name: 'measure_1', label: 'M1', type: 'number', is_numeric: true }
    ];
    mockConfig = {
      indexColumn: true,
      rowSubtotals: true
    };
    mockQueryResponse.subtotals_data = {};

    const model = new VisPluginTableModel(mockLookerData, mockQueryResponse, mockConfig);
    expect(model).toBeDefined();
    expect(model.dimensions).toEqual([]);
    expect(model.columns.length).toBeGreaterThan(0);
  });

  test('should not crash when creating variance columns when config.columnOrder is undefined', () => {
    delete mockQueryResponse.pivots; // Force flat table
    mockQueryResponse.fields.dimension_like = [
      { name: 'dim_1', label: 'D1', type: 'string' }
    ];
    mockQueryResponse.fields.measure_like = [
      { name: 'measure_1', label: 'M1', type: 'number', is_numeric: true },
      { name: 'measure_2', label: 'M2', type: 'number', is_numeric: true }
    ];
    
    mockConfig = {
      'comparison|measure_1': 'measure_2',
      // config.columnOrder is undefined
      'var_num|measure_1': true,
      'var_pct|measure_1': true
    };
    
    const model = new VisPluginTableModel(mockLookerData, mockQueryResponse, mockConfig);
    expect(model).toBeDefined();
    
    // Check that variance columns were created
    const varianceCols = model.columns.filter(c => c.isVariance);
    expect(varianceCols.length).toBeGreaterThan(0);
    
    const absVarCol = varianceCols.find(c => c.variance_type === 'absolute');
    expect(absVarCol).toBeDefined();
    expect(absVarCol.pos).toBeDefined();
  });
});
