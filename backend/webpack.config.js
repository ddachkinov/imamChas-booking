module.exports = function (options, webpack) {
  return {
    ...options,
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true, // Skip type checking for faster builds
                experimentalWatchApi: true,
              },
            },
          ],
          exclude: /node_modules/,
        },
      ],
    },
  };
};
