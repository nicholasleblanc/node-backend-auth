import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import config from '../../config/config';
import User from '../models/user.model';
import VerificationToken from '../models/verification-token.model';
import ForgotPasswordToken from '../models/forgot-password-token.model';
import APIError from '../helpers/APIError';
import email from '../helpers/email';
import logger from '../helpers/logger';

const register = (req, res, next) => {
  const user = new User(req.body);

  user.save()
    .then(savedUser => {
      // Create email verification token.
      const generatedToken = crypto.randomBytes(16).toString('hex');
      const verificationToken = new VerificationToken({ _userId: savedUser._id, token: generatedToken });

      verificationToken.save()
        .then((savedVerificationToken) => {
          // Send verification email.
          email.send({
            template: 'verification-token',
            message: {
              to: savedUser.email
            },
            locals: {
              token: generatedToken
            }
          }).then(console.log).catch((error) => {
            logger.error('Could not send activation email.', error);
          });
        });

      // Generate JWT.
      const token = jwt.sign({ id: user._id, email: user.email }, config.jwtSecret, {
        expiresIn: 86400 // Expires in 24 hours.
      });

      res.status(httpStatus.CREATED);
      res.json({
        data: {
          token,
          user: savedUser
        }
      });
    })
    .catch(error => next(User.checkDuplicateemail(error)));
};

const login = (req, res, next) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) return next(err);

    if (!user) {
      return next(new APIError({
        message: 'Authentication failed.',
        status: httpStatus.UNAUTHORIZED
      }));
    }

    user.comparePassword(req.body.password)
      .then((isMatch) => {
        if (isMatch) {
          var token = jwt.sign({ id: user._id, email: user.email }, config.jwtSecret);

          res.status(httpStatus.OK);
          res.json({
            data: {
              token
            }
          });
        } else {
          return next(new APIError({
            message: 'Authentication failed.',
            status: httpStatus.UNAUTHORIZED
          }));
        }
      });
  });
};

const activate = (req, res, next) => {
  // Find verification token.
  VerificationToken.findOne({ token: VerificationToken.getHash(req.body.token) }, (err, verificationToken) => {
    if (err) return next(err);

    if (!verificationToken) {
      return next(new APIError({
        message: 'Verification token does not exist or is not valid.',
        status: httpStatus.BAD_REQUEST
      }));
    }

    // Lookup related user.
    User.findOne({ _id: verificationToken._userId }, (err, user) => {
      if (err) return next(err);

      if (user.isVerified) {
        return next(new APIError({
          message: 'User already verified.',
          status: httpStatus.BAD_REQUEST
        }));
      }

      // Verify and save the user.
      user.isVerified = true;
      user.save()
        .then(() => {
          // Verification token has been used, remove it.
          verificationToken.remove();

          res.status(httpStatus.OK);
          res.json({ data: { } });
        })
        .catch(error => next(error));
    });
  });
};

const forgotPassword = (req, res, next) => {
  // TODO: Ensure this is not happening too much, or lock account.

  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) return next(err);

    if (user) {
      const generatedToken = crypto.randomBytes(16).toString('hex');
      const forgotPasswordToken = new ForgotPasswordToken({ _userId: user._id, token: generatedToken });

      forgotPasswordToken.save()
        .then((savedForgotPasswordToken) => {
          // Send forgot password email.
          email.send({
            template: 'forgot-password',
            message: {
              to: user.email
            },
            locals: {
              token: generatedToken
            }
          }).then(console.log).catch((error) => {
            logger.error('Could not send forgot password email.', error);
          });
        });
    }

    res.status(httpStatus.OK);
    res.json({ data: { } });
  });
};

const resetPassword = (req, res, next) => {
  // Find forgot password token.
  ForgotPasswordToken.findOne({ token: ForgotPasswordToken.getHash(req.body.token) }, (err, forgotPasswordToken) => {
    if (err) return next(err);

    if (!forgotPasswordToken) {
      return next(new APIError({
        message: 'Forgot password token does not exist or is not valid.',
        status: httpStatus.BAD_REQUEST
      }));
    }

    // Lookup related user.
    User.findOne({ _id: forgotPasswordToken._userId }, (err, user) => {
      if (err) return next(err);

      // If supplied email does not match provided email, we have a problem.
      if (user.email !== req.body.email) {
        return next(new APIError({
          message: 'Forgot password token does not exist or is not valid.',
          status: httpStatus.BAD_REQUEST
        }));
      }

      // Set new password and save the user.
      user.password = req.body.newPassword;
      user.save()
        .then(() => {
          // Forgot password token has been used, remove it.
          forgotPasswordToken.remove();

          res.status(httpStatus.OK);
          res.json({ data: { } });
        })
        .catch(error => next(error));
    });
  });
};

export default { register, activate, login, forgotPassword, resetPassword };
