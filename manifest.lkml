project_name: "test-viz-report_table-marketplace"

constant: VIS_LABEL {
  value: "Test Report Table"
  export: override_optional
}

constant: VIS_ID {
  value: "test-report_table-marketplace"
  export:  override_optional
}

visualization: {
  id: "@{VIS_ID}"
  url: "https://marketplace-api.looker.com/viz-dist/report_table.js"
  label: "@{VIS_LABEL}"
}
