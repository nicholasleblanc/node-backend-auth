import express from 'express';
import validate from 'express-validation';

import authController from '../controllers/auth.controller';
import { createUser, activate, forgotPassword, resetPassword } from '../validations/auth.validation';

const router = express.Router();

router.route('/register')
  .post(validate(createUser), authController.register);

router.route('/login')
  .post(validate(createUser), authController.login);

router.route('/activate')
  .post(validate(activate), authController.activate);

router.route('/forgot-password')
  .post(validate(forgotPassword), authController.forgotPassword);

router.route('/reset-password')
  .post(validate(resetPassword), authController.resetPassword);

export default router;
