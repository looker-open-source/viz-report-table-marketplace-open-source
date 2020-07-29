# Report Table for Looker

A table dedicated to single-page, enterprise summary reports. Useful for PDF exports, report packs, finance reporting, etc. Does not do multi-page tables and lists. Does look good for your year-on-year analysis.

![Example Report](docs/marketplace_image.png)

- Quick variance calculations
- Add subtotals (including column subtotals for tables with two levels of pivot)

  - Subtotals taken from Looker subtotals if available, otherwise performed as front-end calculation
- Add a header row to non-pivoted tables
- Organise measure columns by pivot value, or by measure

  - Flat tables (i.e. no pivots) can be organised by drag'n'drop
- Transpose (any number of dimensions)
- Easy red/black conditional format
- "Subtotal" format e.g. for highlighting transposed rows of measures
- Themes, including ability to test custom themes using your own css file
- Use LookML tags to give default abbreviations to popular fields
- Reduce to a single dimension value for financial-style reporting
- Drill-to-detail 


## Examples

*Drag'n'drop columns for flat tables*

![Drag'n'drop columns for flat tables](docs/report_table_01_drag_and_drop.gif)

*Tags in LookML for consistent headers and abbreviations*

![Tags in LookML for consistent headers and abbreviations](docs/report_table_02_auto_headers_and_abbreviations.gif)

*Subtotals and "show last dimension only"*

![Subtotals and last field only](docs/report_table_03_subtotals_and_last_field_only.gif)

*Sort by Pivot or Measure*

![Sort by Pivot or Measure](docs/report_table_04_sort_by_pivot_or_measure.gif)

*Set headers and labels*

![Set headers and labels](docs/report_table_05_change_headers.gif)

*Even width columns or autolayout*

![Even width columns or autolayout](docs/report_table_06_even_width_or_auto_layout.gif)

*Transposing and PnL style reports*

![Transposing and PnL style reports](docs/report_table_07_PnL_transpose_theme.gif)


## Tagging fields in LookML

A common reporting requirement is grouping fields under headings, and abbreviating column headers when many columns are present. This can be repetitive work! The Report Table vis will pick up tags in the LookML model, with the format `"vis-tools:SETTING:VALUE"`.

The current tag settings available are `heading`, `short_name`, `unit`.

    measure: number_of_transactions {
      tags: [
        "vis-tools:heading:Transaction Value",
        "vis-tools:short_name:Volume",
        "vis-tools:unit:#"
      ]
      type: count
      value_format_name: decimal_0
      drill_fields: [transaction_details*]
    }

## Notes

- Maximum of two pivot fields
- Subtotals calculated at the front end are only for simple sums & averages
  - e.g. no Count Distincts, running totals, measures of type "number" with arbitrary calculations
  - The vis will use subtotals from the query response if available
  - The tooltip will alert users to "estimated" numbers

## Using Custom CSS 

You can also apply your own custom styling by supplying a URL to a CSS file in the `Load custom CSS from:` option and selecting `Use custom theme` in the `Theme` tab.

![Theme selector](/docs/custom_theme.png)

In order to serve raw CSS files from your git provider, first pass the URL through [raw.githack.com](https://raw.githack.com/). Please use (this example template)[/src/theme_custom_template.css] to help you get started with your customization.
