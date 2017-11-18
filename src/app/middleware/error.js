import httpStatus from 'http-status';
import expressValidation from 'express-validation';
import APIError from '../helpers/APIError';

import config from '../../config/config';

/**
 * Error handler.
 */
const handler = (err, req, res, next) => {
  const response = {
    code: err.status,
    message: err.message || httpStatus[err.status],
    errors: err.errors
  };

  // Only show stacktrace on dev
  if (config.dev) {
    response.stack = err.stack
  }

  res.status(err.status);
  res.json({ error: response });
  res.end();
};

/**
 * If error is not an instanceOf APIError, convert it.
 */
const converter = (err, req, res, next) => {
  let convertedError = err;

  if (err instanceof expressValidation.ValidationError) {
    convertedError = new APIError({
      message: 'Error',
      errors: err.errors,
      status: err.status,
      stack: err.stack,
    });
  } else if (!(err instanceof APIError)) {
    convertedError = new APIError({
      message: err.message,
      errors: err.errors,
      status: err.status,
      stack: err.stack,
    });
  }

  return handler(convertedError, req, res);
};

/**
 * Catch 404 and forward to error handler.
 */
const notFound = (req, res, next) => {
  const err = new APIError({
    message: 'Not found',
    status: httpStatus.NOT_FOUND,
  });
  return handler(err, req, res);
};

export default { handler, converter, notFound };
