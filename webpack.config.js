const path = require('path');

module.exports = {
  entry: './src/report_table.js',
  output: {
    filename: 'bundle.js',
    path: path.join(path.resolve(__dirname), '/dist'),
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          { loader: 'style-loader', options: { injectType: 'lazyStyleTag' } },
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
