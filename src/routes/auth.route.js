import express from 'express';
import validate from 'express-validation';

import authController from '../controllers/auth.controller';
import { createUser } from '../validations/user.validation';

const router = express.Router();

router.route('/register')
  .post(validate(createUser), authController.register);

router.route('/login')
  .post(validate(createUser), authController.login);

export default router;
