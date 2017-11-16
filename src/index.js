import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import winston from 'winston';
import expressWinston from 'express-winston';
import passport from "passport";
import passportJWT from "passport-jwt";

import routes from './routes/index.route';
import error from './middleware/error';
import APIError from './helpers/APIError';
import User from './models/user.model';
import { jwtSecret } from '../config/config';

const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

const app = express();
const port = process.env.port || 3000;

// Initialize winston
const winstonInstance = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      json: true,
      colorize: true
    })
  ]
});

// Initialize mongoose
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/decisive-lobster', {
  useMongoClient: true
});

// Parse body params and attach them to request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set up Passport for JWT authentication
const jwtOpts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret
}

passport.use(new JwtStrategy(jwtOpts, (jwtPayload, done) => {
  User.findOne({ _id: jwtPayload.id }, (err, user) => {
    if (err) {
      return done(err, false);
    }

    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  });
}));
app.use(passport.initialize());

// This should only happen on dev environment, we don't need this detailed of logging on prod
expressWinston.requestWhitelist.push('body');
expressWinston.responseWhitelist.push('body');
app.use(expressWinston.logger({
  winstonInstance,
  meta: true, // optional: log meta data about request (defaults to true)
  msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
  colorStatus: true // Color the status code (default green, 3XX cyan, 4XX yellow, 5XX red).
}));

// This should happen everywhere except dev environment
app.use(expressWinston.errorLogger({
  winstonInstance
}));

// Load up all API routes at /api
app.use('/api', routes);

// If error is not an instanceOf APIError, convert it.
app.use(error.converter);

// Catch 404 and forward to error handler
app.use(error.notFound);

// Error handler
app.use(error.handler);

// Start server
app.listen(port, () => {
  winstonInstance.info(`RESTful API server started on: ${port}`)
});
