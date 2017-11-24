import joi from 'joi';

const update = {
  body: {
    password: joi.string().min(6).max(128),
    newPassword: joi.string().min(6).max(128),
    email: joi.string().email()
  }
};

const enableTwoFactor = {
  body: {
    token: joi.number().required().length(6)
  }
}

const disableTwoFactor = {
  body: {
    token: joi.number().required().length(6)
  }
}

export { update, enableTwoFactor, disableTwoFactor };
