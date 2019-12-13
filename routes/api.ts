import express from 'express';
import { randomBytes } from 'crypto';
import db from '../helpers/db';
import { issueToken } from '../helpers/token';
import { verify } from '../helpers/middleware';
import schemas from '../helpers/validator';

const router = express.Router();

router.all('/services', (req, res) => {
  const query = 'SELECT * FROM services ORDER BY name';
  db.queryAsync(query).then(result => {
    const items = {};
    result.forEach(item => (items[item.id] = item));
    res.json(items);
  }).catch(() => res.status(500).json({ error: 'request failed' }));
});

router.all('/pros', (req, res) => {
  const query = 'SELECT id, name, picture_url, about FROM accounts WHERE is_pro = 1';
  db.queryAsync(query).then(result => res.json(result))
    .catch(() => res.status(500).json({ error: 'request failed' }));
});

router.all('/pros/:id', (req, res) => {
  const id = req.params.id;
  const query = 'SELECT id, name, picture_url, about FROM accounts WHERE is_pro = 1 AND id = ?';
  db.queryAsync(query, [id]).then(result => res.json(result[0]))
    .catch(() => res.status(500).json({ error: 'request failed' }));
});

router.all('/verify', verify, (req, res) => {
  const query = 'SELECT * FROM accounts WHERE id = ? LIMIT 1';
  db.queryAsync(query, [res.locals.id]).then(result => res.json(result[0]));
});

router.post('/signup', (req, res) => {
  const body = req.body;
  const { error, value } = schemas.signup.validate(body);
  if (!error) {
    const account = {
      id: randomBytes(4).toString('hex'),
      name: value.name,
      email: value.email,
      phone: value.phone
    };
    const query = 'INSERT INTO accounts SET ?';
    db.queryAsync(query, [account]).then(() => {
      const token = issueToken(account.id);
      res.json({ access_token: token });
    });
  } else {
    res.status(500).json({ error: 'request failed' });
  }
});

router.post('/project', verify, (req, res) => {
  const body = req.body;
  const project = {
    id: randomBytes(4).toString('hex'),
    account: res.locals.id,
    service: body.service,
    options: JSON.stringify(body.options)
  };
  const query = 'INSERT INTO projects SET ?';
  db.queryAsync(query, [project]).then(() => res.json(project.id));
});

router.all('/projects', verify, (req, res) => {
  const query = 'SELECT * FROM projects WHERE account = ? ORDER BY created DESC';
  db.queryAsync(query, [res.locals.id]).then(result => res.json(result));
});

router.all('/projects/:id', verify, (req, res) => {
  const id = req.params.id;
  const query = 'SELECT * FROM projects WHERE id = ? AND account = ? ORDER BY created DESC';
  db.queryAsync(query, [id, res.locals.id]).then(result => res.json(result[0]));
});

router.post('/profile', verify, (req, res, next) => {
  const body = req.body;
  const query = 'UPDATE accounts SET firstname = ?, lastname = ? WHERE id = ?';
  db.queryAsync(query, [body.firstname, body.lastname, res.locals.id]).then(() => res.json(true));
});

router.post('/settings', verify, (req, res) => {
  const body = req.body;
  const notificationsEmail = body.notifications_email ? 1 : 0;
  const notificationsPhone = body.notifications_phone ? 1 : 0;
  const query = 'UPDATE accounts SET locale = ?, notifications_email = ?, notifications_phone = ? WHERE id = ?';
  const params = [body.locale, notificationsEmail, notificationsPhone, res.locals.id];
  db.queryAsync(query, params).then(() => res.json(true));
});

export default router;
