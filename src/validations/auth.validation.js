import joi from 'joi';

const createUser = {
  body: {
    email: joi.string().email().required(),
    password: joi.string().min(6).max(128).required()
  }
};

const activate = {
  body: {
    token: joi.string().required()
  }
};

const forgotPassword = {
  body: {
    email: joi.string().email().required()
  }
};

const resetPassword = {
  body: {
    email: joi.string().email().required(),
    token: joi.string().required(),
    newPassword: joi.string().min(6).max(128).required()
  }
}

export { createUser, activate, forgotPassword, resetPassword };
