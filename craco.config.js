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
<<<<<<< HEAD
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      return middlewares;
    },
    // Override deprecated options to prevent warnings
    onBeforeSetupMiddleware: undefined,
    onAfterSetupMiddleware: undefined
  }
=======
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
}; 