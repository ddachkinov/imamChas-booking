module.exports = function (options, webpack) {
  return {
    ...options,
    ignoreWarnings: [/./],
    stats: {
      errors: false,
      warnings: false,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                errorFormatter: () => '', // Suppress error output
                onlyCompileBundledFiles: true,
              },
            },
          ],
          exclude: /node_modules/,
        },
      ],
    },
  };
};
