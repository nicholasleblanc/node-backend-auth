import express from 'express';
import bodyParser from 'body-parser';
import expressWinston from 'express-winston';
import passport from 'passport';

import routes from '../app/routes';
import error from '../middleware/error';
import APIError from '../helpers/APIError';
import logger from '../helpers/logger';
import config from './config';
import strategies from './passport';

const app = express();

// Parse body params and attach them to request body.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set up Passport for JWT authentication.
app.use(passport.initialize());
passport.use(strategies.jwt);

// Detailed logging on dev env.
if (config.dev) {
  expressWinston.requestWhitelist.push('body');
  expressWinston.responseWhitelist.push('body');
  app.use(expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
    colorStatus: true
  }));
}

// Load up all API routes at /api.
app.use('/api', routes);

// Log errors in Winston transports except when running tests.
if (!config.test) {
  app.use(expressWinston.errorLogger({
    winstonInstance: logger
  }));
}

// If error is not an instanceOf APIError, convert it.
app.use(error.converter);

// Catch 404 and forward to error handler.
app.use(error.notFound);

// Error handler.
app.use(error.handler);

export default app;
