import crypto from 'crypto';
import httpStatus from 'http-status';
import mongoose from 'mongoose';

import APIError from '../helpers/APIError';
import config from '../../config/config';

const VerificationTokenSchema = new mongoose.Schema({
  _userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  token: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400
  }
});

VerificationTokenSchema.pre('save', function (next) {
  const verificationToken = this;

  if (this.isModified('token') || this.isNew) {
    const hash = VerificationTokenSchema.statics.getHash(verificationToken.token);

    verificationToken.token = hash;
    return next();
  } else {
    return next();
  }
});

VerificationTokenSchema.statics.getHash = function (token) {
  return crypto.createHmac('sha256', config.hashSecret).update(token).digest('hex');
};

export default mongoose.model('VerificationToken', VerificationTokenSchema);
