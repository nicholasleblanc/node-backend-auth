import express from 'express';
import validate from 'express-validation';
import passport from 'passport';

const router = express.Router();

router.get('/', passport.authenticate('jwt', { session: false, failWithError: true }), (req, res) => {
  res.json({ success: 'yes!' });
});

export default router;
