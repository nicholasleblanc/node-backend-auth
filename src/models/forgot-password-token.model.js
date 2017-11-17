import crypto from 'crypto';
import httpStatus from 'http-status';
import mongoose from 'mongoose';

import APIError from '../helpers/APIError';
import { hashSecret } from '../../config/config';

const ForgotPasswordTokenSchema = new mongoose.Schema({
  _userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  token: {
    type: String,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
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

ForgotPasswordTokenSchema.statics.getHash = function (token) {
  return crypto.createHmac('sha256', hashSecret).update(token).digest('hex');
};

export default mongoose.model('ForgotPasswordToken', ForgotPasswordTokenSchema);
