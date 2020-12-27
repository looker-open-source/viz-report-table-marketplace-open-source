const path = require('path');

module.exports = {
  entry: [
    './src/report_table.js',
    // './src/styles/finance.scss'
  ],
  output: {
    filename: 'report_table.js',
    path: path.resolve(__dirname),
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
				test: /\.scss$/,
				use: [
          { 
            loader: 'style-loader', 
            // options: { injectType: 'lazyStyleTag' } 
          },
          { loader: 'css-loader?sourceMap=true' },
          { loader: 'resolve-url-loader' },
					{ loader: 'sass-loader?sourceMap=true' }
				]
			},
      {
        test: /\.css$/i,
        use: [
          { 
            loader: 'style-loader', 
            // options: { injectType: 'lazyStyleTag' } 
          },
          {
            loader: 'css-loader'
          }
        ],
      },
      {
        test: /\.(woff|woff2|ttf|otf)$/,
        loader: 'url-loader',
      }
    ]
  }
};

