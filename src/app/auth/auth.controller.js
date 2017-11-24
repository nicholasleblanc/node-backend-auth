import httpStatus from 'http-status';
import crypto from 'crypto';
import speakeasy from 'speakeasy';

import config from '../../config/config';
import User from '../../models/user.model';
import LoginAttempt from '../../models/login-attempt.model';
import VerificationToken from '../../models/verification-token.model';
import ForgotPasswordToken from '../../models/forgot-password-token.model';
import APIError from '../../helpers/APIError';
import APIResponse from '../../helpers/APIResponse';
import email from '../../helpers/email';
import logger from '../../helpers/logger';

const register = (req, res, next) => {
  const user = new User(req.body);

  user.save()
    .then(savedUser => {
      // Create email verification token.
      const generatedToken = VerificationToken.generateToken();
      const verificationToken = new VerificationToken({ user: savedUser, token: generatedToken });

      verificationToken.save()
        .then((savedVerificationToken) => {
          savedVerificationToken.sendEmail(generatedToken)
            .catch(error => {
              logger.error('Could not send activation email.', error);
            });
        });

      // Generate JWT.
      const token = savedUser.getJwtToken();

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
  // Create login attempt.
  const loginAttempt = new LoginAttempt({
    email: req.body.email,
    ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  });

  // Save login attempt.
  loginAttempt.save()
    .then(() => {
      // Lookup user.
      return User.findOne({ email: req.body.email })
        .then(user => {
          if (!user) {
            return next(new APIError({
              message: 'Authentication failed.',
              status: httpStatus.UNAUTHORIZED
            }));
          }

          // Check if user has two-factor authentication enabled and a token passed over.
          if (user.twoFactor.enrolled && !req.body.token) {
            return next(new APIError({
              message: 'Authentication failed.',
              status: httpStatus.PARTIAL_CONTENT
            }));
          }

          loginAttempt.user = user;
          loginAttempt.twoFactorEnabled = user.twoFactor.enrolled;
          loginAttempt.save();

          // Verify the user provided token.
          if (user.twoFactor.enrolled) {
            const validToken = speakeasy.totp.verify({ // TODO: Move to user model
              secret: user.twoFactor.secret,
              encoding: 'base32',
              token: req.body.token
            });

            // Invalid token, error.
            if (!validToken) {
              return next(new APIError({
                message: 'Authentication failed.',
                status: httpStatus.UNAUTHORIZED
              }));
            }
          }

          // Compare users password.
          user.comparePassword(req.body.password)
            .then(isMatch => {
              if (isMatch) {
                loginAttempt.successful = true;
                loginAttempt.save();

                var token = user.getJwtToken();

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
    })
    .catch(error => next(error));
};

const activate = (req, res, next) => {
  // Find verification token.
  VerificationToken.findOne({ token: VerificationToken.getHash(req.body.token) })
    .then(verificationToken => {
      if (!verificationToken) {
        return next(new APIError({
          message: 'Validation Error',
          errors: [{
            field: ['token'],
            location: 'body',
            messages: ['"token" is incorrect'],
          }],
          status: httpStatus.BAD_REQUEST
        }));
      }

      // Lookup related user.
      User.findOne({ _id: verificationToken.user })
        .then(user => {
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
              next(error);
            });
        })
        .catch(error=> next(error));
    })
    .catch(error => next(error));
};

const forgotPassword = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then(user => {
      if (user) {
        const generatedToken = ForgotPasswordToken.generateToken();
        const forgotPasswordToken = new ForgotPasswordToken({ user, token: generatedToken });

        forgotPasswordToken.save()
          .then(savedForgotPasswordToken => {
            savedForgotPasswordToken.sendEmail(generatedToken)
              .catch(error => {
                logger.error('Could not send forgot password email.', error);
              });
          });
      }

      new APIResponse({ res });
    })
    .catch(error => next(error));
};

const resetPassword = (req, res, next) => {
  // Find forgot password token.
  ForgotPasswordToken.findOne({ token: ForgotPasswordToken.getHash(req.body.token) })
    .then(forgotPasswordToken => {
      if (!forgotPasswordToken) {
        return next(new APIError({
          message: 'Validation Error',
          errors: [{
            field: ['token'],
            location: 'body',
            messages: ['"token" is incorrect'],
          }],
          status: httpStatus.BAD_REQUEST
        }));
      }

      // Lookup related user.
      User.findOne({ _id: forgotPasswordToken.user })
        .then(user => {
          if (user && user.email === req.body.email) {
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
              message: 'Validation Error',
              errors: [{
                field: ['token'],
                location: 'body',
                messages: ['"token" is incorrect'],
              }],
              status: httpStatus.BAD_REQUEST
            }));
          }
        })
        .catch(error => next(error));
    })
    .catch(error => next(error));
};

export default { register, activate, login, forgotPassword, resetPassword };
