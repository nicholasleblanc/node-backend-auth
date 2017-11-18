import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import config from '../../config/config';
import User from '../models/user.model';
import VerificationToken from '../models/verification-token.model';
import ForgotPasswordToken from '../models/forgot-password-token.model';
import APIError from '../helpers/APIError';
import APIResponse from '../helpers/APIResponse';
import email from '../helpers/email';
import logger from '../helpers/logger';

const register = (req, res, next) => {
  const user = new User(req.body);

  user.save()
    .then(savedUser => {
      // Create email verification token.
      const generatedToken = crypto.randomBytes(16).toString('hex');
      const verificationToken = new VerificationToken({ user: savedUser, token: generatedToken });

      verificationToken.save()
        .then((savedVerificationToken) => {
          savedVerificationToken.sendEmail(generatedToken)
            .catch((error) => {
              logger.error('Could not send activation email.', error);
            });
        });

      // Generate JWT.
      const token = jwt.sign({ id: user._id, email: user.email }, config.jwtSecret, {
        expiresIn: 86400 // Expires in 24 hours.
      });

      new APIResponse({
        res,
        data: {
          token,
          user: savedUser
        }
      });
    })
    .catch(error => next(User.checkDuplicateEmail(error)));
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

          new APIResponse({
            res,
            data: { token }
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
    User.findOne({ _id: verificationToken.user }, (err, user) => {
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

          new APIResponse({ res });
        })
        .catch(error => {
          logger.error('Unable to activate user.', error);
          next(error)
        });
    });
  });
};

const forgotPassword = (req, res, next) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) return next(err);

    if (user) {
      const generatedToken = crypto.randomBytes(16).toString('hex');
      const forgotPasswordToken = new ForgotPasswordToken({ user, token: generatedToken });
      console.log(user.email)

      forgotPasswordToken.save()
        .then((savedForgotPasswordToken) => {
          savedForgotPasswordToken.sendEmail(generatedToken)
            .catch((error) => {
              logger.error('Could not send forgot password email.', error);
            });
        });
    }

    new APIResponse({ res });
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
    console.log('in0')
    User.findOne({ _id: forgotPasswordToken.user }, (err, user) => {
      if (err) return next(err);
      console.log('in1', user, user.email, req.body.email)
      if (user && user.email === req.body.email) {
        console.log('in2')

        // Set new password and save the user.
        user.password = req.body.newPassword;
        user.save()
          .then(() => {
            // Forgot password token has been used, remove it.
            forgotPasswordToken.remove();

            new APIResponse({ res });
          })
          .catch(error => {
            logger.error('Unable to reset user password.', error);
            next(error);
          });
      } else {
        // If user does not exist or supplied email does not match provided email, we have a problem.
        return next(new APIError({
          message: 'Forgot password token does not exist or is not valid.',
          status: httpStatus.BAD_REQUEST
        }));
      }
    });
  });
};

export default { register, activate, login, forgotPassword, resetPassword };
