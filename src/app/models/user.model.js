import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';

import APIError from '../helpers/APIError';
import config from '../../config/config';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^\S+@\S+\.\S+$/,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

UserSchema.pre('save', function (next) {
  const user = this;

  if (this.isModified('password') || this.isNew) {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        return next(err);
      }

      bcrypt.hash(user.password, salt, (err, hash) => {
        if (err) {
          return next(err);
        }

        user.password = hash;

        return next();
      });
    })
  } else {
    return next();
  }
});

UserSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id, email: this.email }, config.jwtSecret);
}

UserSchema.statics.checkDuplicateEmail = function (error) {
  if (error.name === 'MongoError' && error.code === 11000) {
    return new APIError({
      message: 'Validation Error',
      errors: [{
        field: ['email'],
        location: 'body',
        messages: ['"email" already exists'],
      }],
      status: httpStatus.CONFLICT,
      isPublic: true,
      stack: error.stack,
    });
  }

  return error;
};

export default mongoose.model('User', UserSchema);
