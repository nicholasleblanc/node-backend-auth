import devConfig from './environments/dev.environment'

// Default configuration for all environments. Environment specific configs
// extend from this one.
const defaultConfig = {
  port: 3000, // Server port.
  dev: false, // Is development environment?
  test: false, // Is test environment?
  jwtSecret: 'secret',
  hashSecret: 'secret'
};

/**
 * Load up the proper config based on environment.
 */
const createConfig = (defaultConfig) => {
  switch(process.env.NODE_ENV){
    case 'development':
    default:
      return Object.assign({}, defaultConfig, devConfig);
  }
}

export default createConfig(defaultConfig);
