import express from 'express';
import validate from 'express-validation';

import authController from './auth.controller';
import { register, login, activate, forgotPassword, resetPassword } from './auth.validation';

const router = express.Router();

router.route('/register')
  .post(validate(register), authController.register);

router.route('/login')
  .post(validate(login), authController.login);

router.route('/activate')
  .post(validate(activate), authController.activate);

router.route('/forgot-password')
  .post(validate(forgotPassword), authController.forgotPassword);

router.route('/reset-password')
  .post(validate(resetPassword), authController.resetPassword);

export default router;
