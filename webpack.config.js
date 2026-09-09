const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/report_table.js',
  output: {
    hashFunction: 'sha256',
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
        type: 'asset/inline',
      },
    ],
  },
};
