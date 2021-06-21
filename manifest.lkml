project_name: "test-viz-report_table-marketplace"

constant: VIS_LABEL {
  value: "Test Report Table"
  # export: override_optional
  export: none
}

constant: VIS_ID {
  value: "test-report_table-marketplace"
  # export:  override_optional
  export: none
}

visualization: {
  id: "@{VIS_ID}"
  # url: "https://marketplace-api.looker.com/viz-dist/report_table.js"
  file: "report_table.js"
  label: "@{VIS_LABEL}"
}
