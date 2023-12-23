const path = require('path');

module.exports = {
  entry: './src/report_table.js',
  output: {
    filename: 'dist/bundle.js',
    path: path.resolve(__dirname),
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          {loader: 'style-loader', options: {injectType: 'lazyStyleTag'}},
          'css-loader',
        ],
      },
      {
        test: /\.(woff|woff2|ttf|otf)$/,
        loader: 'url-loader',
      },
    ],
  },
};
