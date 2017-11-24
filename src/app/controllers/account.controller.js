import httpStatus from 'http-status';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

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
  Promise.all([comparePassword, duplicateEmail]).then(([isValidPassword, isDuplicateEmail]) => {
    // Password was incorrect, let's return an error.
    if (!isValidPassword) {
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
    if (isDuplicateEmail) {
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
  const generatedToken = VerificationToken.generateToken();
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

const enableTwoFactor = (req, res, next) => {
  const secret = speakeasy.generateSecret();
  const user = req.user;

  // Check to see if two-factor is already enabled.
  if (user.twoFactor.enabled) {
    return next(new APIError({
      message: 'Two-factor authentication is already enabled.',
      status: httpStatus.CONFLICT,
    }));
  }

  // Save temp secret to user.
  user.twoFactor.tempSecret = secret.base32;
  user.save()
    .then(user => {
      return new Promise((resolve, reject) => {
        // Generate data URL to pass to client.
        qrcode.toDataURL(secret.otpauth_url, (error, dataUrl) => {
          if (error) {
            reject(error);
          } else {
            resolve(dataUrl);
          }
        })
      });
    })
    .then(dataUrl => {
      new APIResponse({
        res,
        data: {
          dataUrl,
          otpAuthUrl: secret.otpauth_url,
          base32: secret.base32
        }
      });
    })
    .catch(error => {
      logger.error('Could not generate QR code to activate two-factor authentiction.', error);

      return next(new APIError({
        message: 'There was a problem generating the QR code.',
        status: httpStatus.INTERNAL_SERVER_ERROR,
      }));
    });
}

const confirmEnableTwoFactor = (req, res, next) => {
  const user = req.user;

  // Check to see if two-factor is already enabled.
  if (!user.twoFactor.tempSecret) {
    return next(new APIError({
      message: 'Enabling two-factor has not been initialized. Call this endpoint with a GET request to initialize.',
      status: httpStatus.FORBIDDEN,
    }));
  }

  const secret = user.twoFactor.tempSecret;
  const token = req.body.token;

  // Verify the user provided token.
  const verified = speakeasy.totp.verify({ // TODO: Move to user model
    secret,
    encoding: 'base32',
    token
  });

  // If token is invalid, return an error response.
  if (!verified) {
    return next(new APIError({
      message: 'Token provided was incorrect.',
      status: httpStatus.BAD_REQUEST,
    }));
  }

  // Save two factor data to user.
  user.twoFactor = {
    enrolled: true,
    secret,
    tempSecret: null
  }
  user.save()
    .then(user => {
      new APIResponse({ res });
    });
}

const disableTwoFactor = (req, res, next) => {
  const user = req.user;

  // Ensure two factor is enabled.
  if (!user.twoFactor.enrolled) {
    return next(new APIError({
      message: 'Token provided was incorrect.',
      status: httpStatus.FORBIDDEN,
    }));
  }

  const token = req.body.token;

  // Verify the user provided token.
  const verified = speakeasy.totp.verify({ // TODO: Move to user model
    secret: user.twoFactor.secret,
    encoding: 'base32',
    token
  });

  // If token is invalid, return an error response.
  if (!verified) {
    return next(new APIError({
      message: 'Token provided was incorrect.',
      status: httpStatus.BAD_REQUEST,
    }));
  }

  // Save two factor data to user.
  user.twoFactor = {
    enabled: false,
    secret: null,
    tempSecret: null
  }
  user.save()
    .then(user => {
      new APIResponse({ res });
    });
}

export default { update, resendActivationEmail, enableTwoFactor, confirmEnableTwoFactor, disableTwoFactor };
