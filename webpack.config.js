const path = require('path');

module.exports = {
  entry: './src/report_table.js',
  output: {
    filename: 'report_table.js',
    path: path.resolve(__dirname),
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      }
    ]
  }
};

