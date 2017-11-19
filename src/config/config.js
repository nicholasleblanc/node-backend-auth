import fs from 'fs';
import path from 'path';

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
const createConfig = defaultConfig => {
  let localConfig = {};
  let localConfigFile = path.join(__dirname, './config.local.js')
  let environmentConfig = {};
  let environmentConfigFile = path.join(__dirname, `./environments/${process.env.NODE_ENV}.environment.js`);

  // Load up local config if one exists.
  // Local config location is: /src/config/config.local.js
  if (fs.existsSync(localConfigFile)) {
    localConfig = require(localConfigFile).default;
  }

  // Load up environment config if one exists.
  if (fs.existsSync(environmentConfigFile)) {
    environmentConfig = require(environmentConfigFile).default;
  }

  return Object.assign({}, defaultConfig, environmentConfig, localConfig);
}

export default createConfig(defaultConfig);
