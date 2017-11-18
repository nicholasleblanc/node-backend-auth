import express from 'express';

import accountRoutes from './account.route';
import authRoutes from './auth.route';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/account', accountRoutes);

router.get('/health-check', (req, res) =>
  res.send('OK')
);

export default router;
