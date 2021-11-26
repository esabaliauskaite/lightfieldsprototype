module.exports = {
  entry: "./js/main.js",
  output: {
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        loader: "babel-loader",
        test: /\.js$/,
        resolve: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    ],
  },
  devServer: {
    port: 3000,
  },
};
