import jwt from 'jsonwebtoken';
import db from './db';

export const verify = async (req, res, next) => {
  let authorization = req.get('authorization');
  if (authorization) authorization = authorization.replace(/^(Bearer|Basic)\s/, '').trim();
  const token = authorization
    || req.query.access_token
    || req.body.access_token
    || req.query.code
    || req.body.code
    || req.query.refresh_token
    || req.body.refresh_token;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    let query = 'UPDATE accounts SET logged = CURRENT_TIMESTAMP WHERE id = ?';
    await db.queryAsync(query, payload.id);
    res.locals.token = token;
    res.locals.id = payload.id;
    res.locals.authenticated = true;
    next();
  } catch (e) {
    res.status(500).json({ error: 'invalid access_token' });
  }
};
