import crypto from 'crypto';
import httpStatus from 'http-status';
import mongoose from 'mongoose';

import APIError from '../helpers/APIError';
import email from '../helpers/email';
import logger from '../helpers/logger';
import config from '../config/config';

const ForgotPasswordTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  token: {
    type: String,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400
  }
});

ForgotPasswordTokenSchema.pre('save', function (next) {
  const forgotPasswordToken = this;

  if (this.isModified('token') || this.isNew) {
    const hash = ForgotPasswordTokenSchema.statics.getHash(forgotPasswordToken.token);

    forgotPasswordToken.token = hash;
    return next();
  } else {
    return next();
  }
});

ForgotPasswordTokenSchema.methods.sendEmail = function (token) {
  return email.send({
    template: 'forgot-password',
    message: {
      to: this.user.email
    },
    locals: {
      token: token
    }
  });
};

ForgotPasswordTokenSchema.statics.getHash = function (token) {
  return crypto.createHmac('sha256', config.hashSecret).update(token).digest('hex');
};

ForgotPasswordTokenSchema.statics.generateToken = function () {
  return crypto.randomBytes(16).toString('hex');
}

export default mongoose.model('ForgotPasswordToken', ForgotPasswordTokenSchema);
