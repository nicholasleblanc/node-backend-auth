import express from 'express';
import validate from 'express-validation';
import passport from 'passport';

import accountController from './account.controller';
import { update, enableTwoFactor, disableTwoFactor } from './account.validation';

const router = express.Router();

router.route('/')
  .patch(validate(update), passport.authenticate('jwt', { session: false, failWithError: true }), accountController.update);

router.route('/resend-activation-email')
  .get(passport.authenticate('jwt', { session: false, failWithError: true }), accountController.resendActivationEmail);

router.route('/enable-two-factor')
  .get(passport.authenticate('jwt', { session: false, failWithError: true }), accountController.enableTwoFactor);

router.route('/enable-two-factor')
  .post(validate(enableTwoFactor), passport.authenticate('jwt', { session: false, failWithError: true }), accountController.confirmEnableTwoFactor);

router.route('/disable-two-factor')
  .post(validate(disableTwoFactor), passport.authenticate('jwt', { session: false, failWithError: true }), accountController.disableTwoFactor);

export default router;
