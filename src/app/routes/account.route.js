import express from 'express';
import validate from 'express-validation';
import passport from 'passport';

import accountController from '../controllers/account.controller';
import { update } from '../validations/account.validation';

const router = express.Router();

router.route('/')
  .patch(validate(update), passport.authenticate('jwt', { session: false, failWithError: true }), accountController.update);

router.route('/resend-activation-email')
  .get(passport.authenticate('jwt', { session: false, failWithError: true }), accountController.resendActivationEmail);

export default router;
