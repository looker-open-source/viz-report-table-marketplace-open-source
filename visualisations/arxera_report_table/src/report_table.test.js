/**
 * @jest-environment jsdom
 */

// Mock global looker object before importing report_table
const mockAdd = jest.fn();
global.looker = {
  plugins: {
    visualizations: {
      add: mockAdd,
    },
  },
};

// Mock CSS imports required by report_table.js
jest.mock('./theme_traditional.css', () => ({ use: jest.fn(), unuse: jest.fn() }), { virtual: true });
jest.mock('./theme_looker.css', () => ({ use: jest.fn(), unuse: jest.fn() }), { virtual: true });
jest.mock('./theme_contemporary.css', () => ({ use: jest.fn(), unuse: jest.fn() }), { virtual: true });
jest.mock('./layout_fixed.css', () => ({ use: jest.fn(), unuse: jest.fn() }), { virtual: true });
jest.mock('./layout_auto.css', () => ({ use: jest.fn(), unuse: jest.fn() }), { virtual: true });

require('./report_table');

describe('report_table visualization plugin', () => {
  let vizPlugin;
  let element;
  let mockDone;
  let mockTrigger;

  beforeEach(() => {
    expect(mockAdd).toHaveBeenCalled();
    vizPlugin = mockAdd.mock.calls[0][0];
    
    element = document.createElement('div');
    element.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
    });
    
    // Create visualization container elements
    vizPlugin.create(element, {});

    mockDone = jest.fn();
    mockTrigger = jest.fn();
    vizPlugin.clearErrors = jest.fn();
    vizPlugin.addError = jest.fn();
    vizPlugin.trigger = mockTrigger;
  });

  describe('defensive done() callback execution', () => {
    test('should call done() when queryResponse has pivots but no measures', async () => {
      const queryResponse = {
        fields: {
          pivots: [{ name: 'p1' }],
          measure_like: [],
          dimension_like: [{ name: 'd1' }],
        },
      };
      const data = [{ 'd1': { value: 'val1' } }];

      await vizPlugin.updateAsync(data, element, {}, queryResponse, {}, mockDone);

      expect(vizPlugin.addError).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Empty Pivot(s)' })
      );
      expect(mockDone).toHaveBeenCalledTimes(1);
    });

    test('should call done() when pivots count exceeds 2', async () => {
      const queryResponse = {
        fields: {
          pivots: [{ name: 'p1' }, { name: 'p2' }, { name: 'p3' }],
          measure_like: [{ name: 'm1' }],
          dimension_like: [{ name: 'd1' }],
        },
      };
      const data = [{ 'd1': { value: 'val1' } }];

      await vizPlugin.updateAsync(data, element, {}, queryResponse, {}, mockDone);

      expect(vizPlugin.addError).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Max Two Pivots' })
      );
      expect(mockDone).toHaveBeenCalledTimes(1);
    });

    test('should call done() when data is empty', async () => {
      const queryResponse = {
        fields: {
          pivots: [],
          measure_like: [{ name: 'm1' }],
          dimension_like: [{ name: 'd1' }],
        },
      };

      await vizPlugin.updateAsync([], element, {}, queryResponse, {}, mockDone);

      expect(vizPlugin.addError).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'No Results' })
      );
      expect(mockDone).toHaveBeenCalledTimes(1);
    });

    test('should call done() when queryResponse has no valid fields', async () => {
      const queryResponse = {
        fields: {
          pivots: [],
          measure_like: [],
          dimension_like: [],
        },
      };
      const data = [{ 'd1': { value: 'val1' } }];

      await vizPlugin.updateAsync(data, element, {}, queryResponse, {}, mockDone);

      expect(vizPlugin.addError).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'No Fields' })
      );
      expect(mockDone).toHaveBeenCalledTimes(1);
    });

    test('should call done() on successful render with valid data and fields', async () => {
      const queryResponse = {
        fields: {
          pivots: [],
          dimension_like: [
            { name: 'dim1', label: 'Dimension 1', type: 'string' }
          ],
          measure_like: [
            { name: 'meas1', label: 'Measure 1', type: 'number', is_numeric: true }
          ],
        },
        sorts: [],
        pivots: [],
      };
      const data = [
        {
          dim1: { value: 'Category A', rendered: 'Category A' },
          meas1: { value: 100, rendered: '$100' },
        },
      ];

      await vizPlugin.updateAsync(data, element, { theme: 'traditional' }, queryResponse, {}, mockDone);

      expect(mockDone).toHaveBeenCalledTimes(1);
      expect(element.querySelector('#reportTable')).not.toBeNull();
    });

    test('should call done() even if an exception occurs during table rendering', async () => {
      const queryResponse = {
        fields: {
          pivots: [],
          dimension_like: [
            { name: 'dim1', label: 'Dimension 1', type: 'string' }
          ],
          measure_like: [
            { name: 'meas1', label: 'Measure 1', type: 'number', is_numeric: true }
          ],
        },
        sorts: [],
        pivots: [],
      };
      const data = [
        {
          dim1: { value: 'Category A' },
          meas1: { value: 100 },
        },
      ];

      // Break element.querySelector to simulate an unexpected runtime error
      const brokenElement = {
        ...element,
        querySelector: () => { throw new Error('Simulated DOM failure'); },
        getBoundingClientRect: element.getBoundingClientRect,
      };

      await vizPlugin.updateAsync(data, brokenElement, { theme: 'traditional' }, queryResponse, {}, mockDone);

      expect(vizPlugin.addError).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Rendering Error' })
      );
      expect(mockDone).toHaveBeenCalledTimes(1);
    });

    test('should render cleanly and call done() when details.print is set (PDF export mode)', async () => {
      const queryResponse = {
        fields: {
          pivots: [],
          dimension_like: [
            { name: 'dim1', label: 'Dimension 1', type: 'string' }
          ],
          measure_like: [
            { name: 'meas1', label: 'Measure 1', type: 'number', is_numeric: true }
          ],
        },
        sorts: [],
        pivots: [],
      };
      const data = [
        {
          dim1: { value: 'PDF Test', rendered: 'PDF Test' },
          meas1: { value: 500, rendered: '$500' },
        },
      ];
      const details = { print: true };

      await vizPlugin.updateAsync(
        data,
        element,
        { theme: 'traditional', customTheme: 'animate' },
        queryResponse,
        details,
        mockDone
      );

      expect(mockDone).toHaveBeenCalledTimes(1);
      expect(element.querySelector('#reportTable')).not.toBeNull();
    });
  });
});
