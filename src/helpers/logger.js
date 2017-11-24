import winston from 'winston';

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      json: false,
      colorize: true,
      handleExceptions: true,
      prettyPrint: true
    })
  ]
});

export default logger;
