import httpStatus from 'http-status';
import crypto from 'crypto';

import APIError from '../helpers/APIError';
import APIResponse from '../helpers/APIResponse';
import User from '../models/user.model';
import logger from '../helpers/logger';
import VerificationToken from '../models/verification-token.model';

const update = (req, res, next) => {
  const user = req.user;
  let comparePassword = true;
  let duplicateEmail = false;

  // User is trying to change password.
  if (req.body.password) {
    // Before changing the password, ensure current one provided is correct.
    // If not correct, then it's a no-go.
    comparePassword = req.user.comparePassword(req.body.password).then(isMatch => {
      if (isMatch) {
        user.password = req.body.newPassword;
      }

      return isMatch;
    });
  }

  // User is trying to change email.
  if (req.body.email && req.body.email !== user.email) {
    // Check for dupes
    duplicateEmail = User.findOne({ email: req.body.email }).then(userFound => {
      user.email = req.body.email;

      return userFound || false;
    });
  }

  // Wait for all promises to resolve before proceeding.
  Promise.all([comparePassword, duplicateEmail]).then(values => {
    // Password was incorrect, let's return an error.
    if (!values[0]) {
      return next(new APIError({
        message: 'Validation Error',
        errors: [{
          field: ['password'],
          location: 'body',
          messages: ['"password" is incorrect'],
        }],
        status: httpStatus.CONFLICT,
        isPublic: true
      }));
    }

    // New email address already exists.
    if (values[1]) {
      return next(new APIError({
        message: 'Validation Error',
        errors: [{
          field: ['email'],
          location: 'body',
          messages: ['"email" already exists'],
        }],
        status: httpStatus.CONFLICT,
        isPublic: true
      }));
    }

    // Save user
    user.save()
      .then(savedUser => {
        new APIResponse({
          res,
          data: {
            user: savedUser
          }
        });
      })
      .catch(error => {
        logger.error('Unable to update user information.', error);
        next(error)
      });
  })
};

const resendActivationEmail = (req, res, next) => {
  const user = req.user;

  // Create email verification token.
  const generatedToken = crypto.randomBytes(16).toString('hex');
  const verificationToken = new VerificationToken({ user, token: generatedToken });

  verificationToken.save()
    .then((savedVerificationToken) => {
      savedVerificationToken.sendEmail(generatedToken).then(() => {
        new APIResponse({ res });
      }).catch(error => {
        logger.error('Could not send activation email.', error);

        return next(new APIError({
          message: 'Could not send activation email.',
          status: httpStatus.INTERNAL_SERVER_ERROR,
        }));
      });
    });
};

export default { update, resendActivationEmail };
