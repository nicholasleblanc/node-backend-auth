import joi from 'joi';

const createUser = {
  body: {
    email: joi.string().email().required(),
    password: joi.string().min(6).max(128).required(),
  }
}

export { createUser }
