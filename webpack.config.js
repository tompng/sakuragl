module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  output: {
    path: `${__dirname}/dist`,
    filename: 'index.js'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader'
      },
      {
        test: /\.(frag|vert)$/,
        use: 'raw-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
}
