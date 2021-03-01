module.exports = function override(config, env) {
    config.module.rules.push({
        test: /\.worker\.js$/,
        use: { loader: 'workerize-loader' }
      })
    config.output['globalObject'] = 'this';

    return config;
  }