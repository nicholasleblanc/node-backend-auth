import mongoose from 'mongoose';

const LoginAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    required: true,
  },
  successful: {
    type: String,
    default: false
  },
  twoFactorEnabled: {
    type: String,
    default: false
  },
}, {
  timestamps: true
});

export default mongoose.model('LoginAttempt', LoginAttemptSchema);
