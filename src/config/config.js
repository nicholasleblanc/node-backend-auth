import fs from 'fs';
import path from 'path';

import devConfig from './environments/dev.environment'
import testConfig from './environments/test.environment'

// Default configuration for all environments. Environment specific configs
// extend from this one.
const defaultConfig = {
  port: 3000, // Server port.
  dev: false, // Is development environment?
  test: false, // Is test environment?
  jwtSecret: 'secret',
  hashSecret: 'secret',
  mongodb: 'mongodb://localhost/decisive-lobster',
  email: {
    from: 'John Smith <test@gmail.com>' // Email from address.
  }
};

/**
 * Load up the proper config based on environment.
 */
const createConfig = (defaultConfig) => {
  let localConfig = {};
  let localConfigFile = path.join(__dirname, './config.local.js')

  // Load up local config if one exists.
  // Local config location is: /src/config/config.local.js
  if (fs.existsSync(localConfigFile)) {
    localConfig = require(localConfigFile).default;
  }

  switch (process.env.NODE_ENV) {
    case 'test':
      return Object.assign({}, defaultConfig, testConfig, localConfig);
    case 'development':
    default:
      return Object.assign({}, defaultConfig, devConfig, localConfig);
  }
}

export default createConfig(defaultConfig);
