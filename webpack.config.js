const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/report_table_container.js',
  output: {
    filename: 'report_table.js',
    path: path.resolve(__dirname),
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            "presets": [
              "@babel/preset-env", 
              "@babel/preset-react",
              {
                'plugins': [
                  "babel-plugin-styled-components",
                  "@babel/plugin-proposal-class-properties"
                ]
              }
            ]
          }
        }
      },
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

