import joi from 'joi';

const update = {
  body: {
    password: joi.string().min(6).max(128),
    newPassword: joi.string().min(6).max(128),
    email: joi.string().email()
  }
};

export { update };
