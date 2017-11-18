import httpStatus from 'http-status';

import APIError from '../helpers/APIError';
import User from '../models/user.model';

const update = (req, res, next) => {
  const user = req.user;
  let comparePassword = true;
  let duplicateEmail = false;

  let foo = 1;

  // User is trying to change password.
  if (req.body.password) {
    // Before changing the password, ensure current one provided is correct.
    // If not correct, then it's a no-go.
    comparePassword = req.user.comparePassword(req.body.password).then((isMatch) => {
      if (isMatch) {
        foo = 2
        user.password = req.body.newPassword;
      }

      return isMatch;
    });
  }

  // User is trying to change email.
  if (req.body.email && req.body.email !== user.email) {
    // Check for dupes
    duplicateEmail = User.findOne({ email: req.body.email }).then((userFound) => {
      user.email = req.body.email;

      return userFound || false;
    });
  }

  // Wait for all promises to resolve before proceeding.
  Promise.all([comparePassword, duplicateEmail]).then((values) => {
    // Password was incorrect, let's return an error.
    if (!values[0]) {
      return next(new APIError({
        message: 'Validation Error',
        errors: [{
          field: 'password',
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
          field: 'email',
          location: 'body',
          messages: ['"email" already exists'],
        }],
        status: httpStatus.CONFLICT,
        isPublic: true
      }));
    }

    // Save user
    user.save()
      .then((savedUser) => {
        res.status(httpStatus.OK);
        res.json({ data: { } });
      })
      .catch(error => next(error));
  })
};

export default { update };
