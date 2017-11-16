import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';

import { jwtSecret } from '../../config/config';
import User from '../models/user.model';
import APIError from '../helpers/APIError';

const register = (req, res, next) => {
  const user = new User(req.body);

  user.save()
    .then(savedUser => {
      const token = jwt.sign({ id: user._id, email: user.email }, jwtSecret, { // TODO: Add secret to config
        expiresIn: 86400 // Expires in 24 hours
      });

      res.status(httpStatus.CREATED);
      res.json({ token, user: savedUser })
    })
    .catch(error => next(User.checkDuplicateEmail(error)));
};

const login = (req, res, next) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) return next(err);

    if (!user) {
      return next(new APIError({
        message: 'Authentication failed. User does not exist.',
        status: httpStatus.UNAUTHORIZED
      }));
    }

    user.comparePassword(req.body.password, (err, isMatch) => {
      if (isMatch && !err) {
        var token = jwt.sign({ id: user._id, email: user.email }, 'secret'); // TODO: Add secret to config

        res.json({ token });
      } else {
        return next(new APIError({
          message: 'Authentication failed. Wrong password.',
          status: httpStatus.UNAUTHORIZED
        }));
      }
    })
  })
};

export default { register, login };
