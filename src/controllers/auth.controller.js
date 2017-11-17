import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import config from '../config/config';
import User from '../models/user.model';
import VerificationToken from '../models/verification-token.model';
import ForgotPasswordToken from '../models/forgot-password-token.model';
import APIError from '../helpers/APIError';
import Email from '../helpers/Email';

const register = (req, res, next) => {
  const user = new User(req.body);

  user.save()
    .then(savedUser => {
      // Create email verification token
      const generatedToken = crypto.randomBytes(16).toString('hex');
      const verificationToken = new VerificationToken({ _userId: savedUser._id, token: generatedToken });

      verificationToken.save()
        .then((savedVerificationToken) => {
          // Send verification email
          Email.send({
            template: 'verification-token',
            message: {
              to: savedUser.email
            },
            locals: {
              token: generatedToken
            }
          }).then(console.log).catch(console.error); // TODO: Catch error, but figure out how to log but not notify user
        });

      // Generate JWT
      const token = jwt.sign({ id: user._id, email: user.email }, config.jwtSecret, {
        expiresIn: 86400 // Expires in 24 hours
      });

      res.status(httpStatus.CREATED);
      res.json({ token, user: savedUser });
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

    // Compare passwords, ensure they match
    user.comparePassword(req.body.password, (err, isMatch) => {
      if (isMatch && !err) {
        var token = jwt.sign({ id: user._id, email: user.email }, config.jwtSecret);

        res.status(httpStatus.OK);
        res.json({ token });
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
  // Tokens live for 1 day
  // TODO: This can be removed once we expire in MongoDB
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Find verification token
  VerificationToken.findOne({ token: VerificationToken.getHash(req.body.token), createdAt: { $gte: yesterday } }, (err, verificationToken) => {
    if (err) return next(err);

    if (!verificationToken) {
      return next(new APIError({
        message: 'Verification token does not exist or is not valid.',
        status: httpStatus.BAD_REQUEST
      }));
    }

    // Lookup related user
    User.findOne({ _id: verificationToken._userId }, (err, user) => {
      if (err) return next(err);

      if (user.isVerified) {
        return next(new APIError({
          message: 'User already verified.',
          status: httpStatus.BAD_REQUEST
        }));
      }

      // Verify and save the user
      user.isVerified = true;
      user.save()
        .then(() => {
          res.status(httpStatus.OK);
          res.json({ success: true });
        })
        .catch(error => next(error));
    });
  });
};

const forgotPassword = (req, res, next) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) return next(err);

    if (user) {
      const generatedToken = crypto.randomBytes(16).toString('hex');
      const forgotPasswordToken = new ForgotPasswordToken({ _userId: user._id, token: generatedToken });

      forgotPasswordToken.save()
        .then((savedForgotPasswordToken) => {
          // Send forgot password email
          Email.send({
            template: 'forgot-password',
            message: {
              to: user.email
            },
            locals: {
              token: generatedToken
            }
          }).then(console.log).catch(console.error); // TODO: Catch error, but figure out how to log but not notify user
        });
    }

    res.status(httpStatus.OK);
    res.json({ success: true });
  });
};

const resetPassword = (req, res, next) => {
  // TODO: Ensure this is not happening too much, or lock account

  // TODO: This can be removed once we expire in MongoDB
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Find forgot password token
  ForgotPasswordToken.findOne({ token: ForgotPasswordToken.getHash(req.body.token), createdAt: { $gte: yesterday }, used: false }, (err, forgotPasswordToken) => {
    if (err) return next(err);

    if (!forgotPasswordToken) {
      return next(new APIError({
        message: 'Forgot password token does not exist or is not valid.',
        status: httpStatus.BAD_REQUEST
      }));
    }

    // Lookup related user
    User.findOne({ _id: forgotPasswordToken._userId }, (err, user) => {
      if (err) return next(err);

      // If supplied email does not match provided email, we have a problem
      if (user.email !== req.body.email) {
        return next(new APIError({
          message: 'Forgot password token does not exist or is not valid.',
          status: httpStatus.BAD_REQUEST
        }));
      }

      // Set new password and save the user
      user.password = req.body.newPassword;
      user.save()
        .then(() => {
          // Mark the forgot password token as used
          forgotPasswordToken.used = true;
          forgotPasswordToken.save();

          res.status(httpStatus.OK);
          res.json({ success: true });
        })
        .catch(error => next(error));
    });
  });
};

export default { register, activate, login, forgotPassword, resetPassword };
