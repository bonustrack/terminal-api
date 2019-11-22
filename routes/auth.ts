import express from 'express';
import jwt from 'jsonwebtoken';
import passport from '../helpers/passport';

const router = express.Router();

router.get('/facebook', passport.authenticate('facebook', { session: false, scope: ['email'] }));

const googleOptions = { session: false, scope: ['https://www.googleapis.com/auth/plus.login', 'email'] };
router.get('/google', passport.authenticate('google', googleOptions));

router.get('/line', passport.authenticate('line', { session: false }));

router.get('/:provider/callback', (req, res, next) => {
  passport.authenticate(req.params.provider, (err, user, info) => {
    // @ts-ignore
    const loginUrl = process.env.CALLBACK_URL.replace('callback', 'login');
    if (err && !user) return res.redirect(loginUrl);
    // @ts-ignore
    req.logIn(user, err => {
      if (err) return res.redirect(loginUrl);
      const token = jwt.sign({ id: user }, process.env.JWT_SECRET);
      const url = `${process.env.CALLBACK_URL}?access_token=${token}`;
      return res.redirect(url);
    });
  })(req, res, next);
});

export default router;
