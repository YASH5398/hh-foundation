module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.ignoreWarnings = [
        {
          message: /Failed to parse source map/,
        },
      ];
      return webpackConfig;
    },
  },
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      return middlewares;
    },
    // Override deprecated options to prevent warnings
    onBeforeSetupMiddleware: undefined,
    onAfterSetupMiddleware: undefined
  }
}; 