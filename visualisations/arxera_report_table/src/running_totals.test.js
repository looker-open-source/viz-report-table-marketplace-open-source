const {VisPluginTableModel} = require('./vis_table_plugin');

// A small P&L: three sections, two line items each, one measure.
const section = {
  name: 'pl.section',
  label: 'Section',
  type: 'string',
  is_numeric: false,
  value_format: null,
};
const line = {
  name: 'pl.line',
  label: 'Line',
  type: 'string',
  is_numeric: false,
  value_format: null,
};
const amount = {
  name: 'pl.amount',
  label: 'Amount',
  type: 'sum',
  is_numeric: true,
  value_format: '#,##0',
};

const lines = [
  ['Rental Income', 'Rent', 100],
  ['Rental Income', 'Turnover rent', 20],
  ['Other Property Income', 'Parking', 5],
  ['Other Property Income', 'Utilities income', 3],
  ['Direct Costs', 'Building costs', -40],
  ['Direct Costs', 'Insurance', -8],
];

const flatData = () =>
  lines.map(([s, l, a]) => ({
    'pl.section': {value: s},
    'pl.line': {value: l},
    'pl.amount': {value: a, rendered: String(a)},
  }));

const flatQuery = () => ({
  fields: {
    dimension_like: [section, line],
    measure_like: [amount],
    table_calculations: [],
    pivots: [],
    supermeasure_like: [],
  },
  sorts: [],
});

const config = runningTotals => ({
  rowSubtotals: true,
  subtotalDepth: '1',
  runningTotals: runningTotals,
});

const rowsOf = model =>
  model.data
    .filter(row => !row.hide)
    .map(row => ({
      type: row.runningTotal ? 'running_total' : row.type,
      label:
        row.type === 'line_item'
          ? row.data['pl.line'].value
          : row.data['pl.section'].value,
      amount: row.data['pl.amount'].value,
    }));

describe('parseRunningTotals', () => {
  test('reads entries separated by semicolons or new lines', () => {
    expect(
      VisPluginTableModel.parseRunningTotals(
        'Gross Operating Income > Other Property Income;\nNOI > Direct Costs'
      )
    ).toEqual([
      {label: 'Gross Operating Income', after: ['Other Property Income']},
      {label: 'NOI', after: ['Direct Costs']},
    ]);
  });

  test('ignores empty or malformed entries', () => {
    expect(VisPluginTableModel.parseRunningTotals('')).toEqual([]);
    expect(VisPluginTableModel.parseRunningTotals(undefined)).toEqual([]);
    expect(
      VisPluginTableModel.parseRunningTotals('no arrow; > Direct Costs; NOI >')
    ).toEqual([]);
  });
});

describe('addRunningTotals', () => {
  test('inserts cumulative totals after their subtotal group, without double counting', () => {
    const model = new VisPluginTableModel(
      flatData(),
      flatQuery(),
      config(
        'Gross Operating Income > Other Property Income; NOI > Direct Costs'
      )
    );

    expect(rowsOf(model)).toEqual([
      {type: 'line_item', label: 'Rent', amount: 100},
      {type: 'line_item', label: 'Turnover rent', amount: 20},
      {type: 'subtotal', label: 'Rental Income', amount: 120},
      {type: 'line_item', label: 'Parking', amount: 5},
      {type: 'line_item', label: 'Utilities income', amount: 3},
      {type: 'subtotal', label: 'Other Property Income', amount: 8},
      {type: 'running_total', label: 'Gross Operating Income', amount: 128},
      {type: 'line_item', label: 'Building costs', amount: -40},
      {type: 'line_item', label: 'Insurance', amount: -8},
      {type: 'subtotal', label: 'Direct Costs', amount: -48},
      {type: 'running_total', label: 'NOI', amount: 80},
    ]);
  });

  test('styles running total rows as running totals and gives them no drill', () => {
    const model = new VisPluginTableModel(
      flatData(),
      flatQuery(),
      config('NOI > Direct Costs')
    );
    const noi = model.data.find(row => row.runningTotal);
    expect(noi.data['pl.amount'].cell_style).toEqual(
      expect.arrayContaining(['total', 'running_total'])
    );
    expect(noi.data['pl.amount'].cell_style).not.toContain('subtotal');
    expect(noi.data['pl.amount'].links || []).toEqual([]);
  });

  test('skips a running total whose group is not in the data', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const model = new VisPluginTableModel(
      flatData(),
      flatQuery(),
      config('Net Property Income > Refurbishments; NOI > Direct Costs')
    );
    expect(model.data.filter(row => row.runningTotal).map(r => r.id)).toEqual([
      'RunningTotal|NOI',
    ]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  test('adds a suffix to subtotal labels when configured', () => {
    const model = new VisPluginTableModel(flatData(), flatQuery(), {
      ...config(''),
      subtotalLabelSuffix: ' Total',
    });
    const labels = model.data
      .filter(row => row.type === 'subtotal')
      .map(row => row.data['pl.section'].value);
    expect(labels).toEqual([
      'Rental Income Total',
      'Other Property Income Total',
      'Direct Costs Total',
    ]);
  });

  test('changes nothing when no running totals are configured', () => {
    const model = new VisPluginTableModel(flatData(), flatQuery(), config(''));
    expect(model.data.some(row => row.runningTotal)).toBe(false);
  });

  test('calculates each pivot column separately', () => {
    const period = {
      name: 'pl.period',
      label: 'Period',
      type: 'string',
      is_numeric: false,
    };
    const query = {
      ...flatQuery(),
      fields: {...flatQuery().fields, pivots: [period]},
      pivots: [
        {
          key: '202608',
          data: {'pl.period': '202608'},
          metadata: {'pl.period': {value: '202608'}},
          sort_values: {'pl.period': '202608'},
          is_total: false,
        },
        {
          key: '202609',
          data: {'pl.period': '202609'},
          metadata: {'pl.period': {value: '202609'}},
          sort_values: {'pl.period': '202609'},
          is_total: false,
        },
      ],
    };
    // September = August doubled.
    const data = lines.map(([s, l, a]) => ({
      'pl.section': {value: s},
      'pl.line': {value: l},
      'pl.amount': {
        202608: {value: a, rendered: String(a)},
        202609: {value: a * 2, rendered: String(a * 2)},
      },
    }));
    const model = new VisPluginTableModel(
      data,
      query,
      config(
        'Gross Operating Income > Other Property Income; NOI > Direct Costs'
      )
    );
    const amountColumns = model.columns.filter(
      c => c.modelField.name === 'pl.amount'
    );
    expect(amountColumns.length).toBe(2);
    const noi = model.data.find(row => row.id === 'RunningTotal|NOI');
    const goi = model.data.find(
      row => row.id === 'RunningTotal|Gross Operating Income'
    );
    expect(amountColumns.map(c => noi.data[c.id].value)).toEqual([80, 160]);
    expect(amountColumns.map(c => goi.data[c.id].value)).toEqual([128, 256]);
  });

  test('keeps Looker Totals as the last row', () => {
    const query = {
      ...flatQuery(),
      totals_data: {'pl.amount': {value: 80, rendered: '80'}},
    };
    const model = new VisPluginTableModel(
      flatData(),
      query,
      config('NOI > Direct Costs')
    );
    const visible = model.data.filter(row => !row.hide);
    const last = visible[visible.length - 1];
    expect(last.type).toBe('total');
    expect(last.data['pl.amount'].value).toBe(80);
    expect(visible[visible.length - 2].id).toBe('RunningTotal|NOI');
  });

  test('calculates variance columns on running total rows', () => {
    const budget = {...amount, name: 'pl.budget', label: 'Budget'};
    const query = flatQuery();
    query.fields.measure_like = [amount, budget];
    const data = flatData().map(row => ({
      ...row,
      'pl.budget': {value: 10, rendered: '10'},
    }));
    const model = new VisPluginTableModel(data, query, {
      ...config('NOI > Direct Costs'),
      'comparison|pl.amount': 'pl.budget',
      'var_num|pl.amount': true,
    });
    const noi = model.data.find(row => row.id === 'RunningTotal|NOI');
    const varianceColumn = model.columns.find(
      c => c.isVariance && c.variance_type === 'absolute'
    );
    expect(varianceColumn).toBeDefined();
    // NOI amount 80 against budget 6 lines x 10 = 60.
    expect(noi.data['pl.budget'].value).toBe(60);
    expect(noi.data[varianceColumn.id].value).toBe(20);
    expect(noi.data[varianceColumn.id].cell_style).toContain('running_total');
  });

  test('goes after the last of its groups present, skipping groups with no rows', () => {
    // Refurbishments has no rows, so Net Property Income goes after Direct
    // Costs, after NOI, with the same cumulative value.
    const model = new VisPluginTableModel(
      flatData(),
      flatQuery(),
      config(
        'NOI > Direct Costs; Net Property Income > Direct Costs, Other Income / Costs, Refurbishments'
      )
    );
    const tail = rowsOf(model).slice(-3);
    expect(tail).toEqual([
      {type: 'subtotal', label: 'Direct Costs', amount: -48},
      {type: 'running_total', label: 'NOI', amount: 80},
      {type: 'running_total', label: 'Net Property Income', amount: 80},
    ]);
  });
});
