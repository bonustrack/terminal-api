import express from 'express';
import frameguard from 'frameguard';
import session from 'express-session';
import { Server } from 'ws';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import db from './server/db';
import passport from './server/passport';
import { sendResponse, sendErrorResponse } from './server/ws';
import pros from './server/pros.json';

const app = express();
app.use(frameguard({ action: 'deny' }));
app.use(session({ secret: process.env.JWT_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/facebook', passport.authenticate('facebook', { session: false, scope: ['email'] }));
app.get(
  '/auth/google',
  passport.authenticate('google', {
    session: false,
    scope: ['https://www.googleapis.com/auth/plus.login', 'email']
  })
);
app.get('/auth/line', passport.authenticate('line', { session: false }));
app.get('/auth/:provider/callback', (req, res, next) => {
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
app.get('*', (req, res) => res.sendFile(`${__dirname}/dist/index.html`));

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

const wss = new Server({ server });

wss.on('connection', ws => {
  console.log('Got connection from new peer');
  ws.on('error', () => console.log('Error on connection with peer'));
  ws.on('close', () => console.log('Connection with peer closed'));
  ws.on('message', async message => {
    console.log('Message', message);
    let call = {};
    try {
      call = JSON.parse(message);
    } catch (e) {
      console.error(e);
    }
    if (call[0] && call[0] === 'request' && call[1] && call[1].command) {
      const command = call[1].command;
      const params = call[1].params ? call[1].params : null;
      const tag = call[1].tag;
      switch (command) {
        case 'login': {
          try {
            const payload = jwt.verify(params.token, process.env.JWT_SECRET);
            ws.token = params.token;
            ws.id = payload.id;
            let query = 'UPDATE accounts SET logged = CURRENT_TIMESTAMP WHERE id = ?';
            await db.queryAsync(query, payload.id);
            query = 'SELECT * FROM accounts WHERE id = ?';
            const account = await db.queryAsync(query, payload.id);
            if (params.visitor) {
              query = 'UPDATE projects SET account = ?, visitor = "" WHERE visitor = ?';
              await db.queryAsync(query, [payload.id, params.visitor]);
            }
            sendResponse(ws, tag, account[0]);
          } catch (e) {
            sendErrorResponse(ws, tag, 'invalid access_token');
          }
          break;
        }
        case 'logout': {
          delete ws.id;
          sendResponse(ws, tag, true);
          break;
        }
        case 'get_services': {
          try {
            const query = 'SELECT * FROM services ORDER BY name';
            const result = await db.queryAsync(query);
            const services = {};
            result.forEach(service => (services[service.slug] = service));
            sendResponse(ws, tag, services);
          } catch (e) {
            sendErrorResponse(ws, tag, 'request failed');
          }
          break;
        }
        case 'add_project': {
          if (params.service && params.options && (ws.id || (params && params.visitor))) {
            const project = {
              id: randomBytes(4).toString('hex'),
              account: ws.id ? ws.id : '',
              visitor: !ws.id && params.visitor ? params.visitor : '',
              service: params.service,
              options: JSON.stringify(params.options),
            };
            const query = 'INSERT INTO projects SET ?';
            await db.queryAsync(query, [project]);
            sendResponse(ws, tag, project.id);
          } else {
            sendErrorResponse(ws, tag, 'invalid request');
          }
          break;
        }
        case 'get_projects': {
          if (ws.id) {
            const query = 'SELECT * FROM projects WHERE account = ? ORDER BY created DESC';
            const result = await db.queryAsync(query, [ws.id]);
            sendResponse(ws, tag, result);
          } else {
            sendErrorResponse(ws, tag, 'require login');
          }
          break;
        }
        case 'edit_profile': {
          if (ws.id) {
            const query = 'UPDATE accounts SET firstname = ?, lastname = ? WHERE id = ?';
            await db.queryAsync(query, [params.firstname, params.lastname, ws.id]);
            sendResponse(ws, tag, true);
          } else {
            sendErrorResponse(ws, tag, 'require login');
          }
          break;
        }
        case 'edit_settings': {
          if (ws.id) {
            const notificationsEmail = params.notifications_email ? 1 : 0;
            const notificationsPhone = params.notifications_phone ? 1 : 0;
            const query =
              'UPDATE accounts SET locale = ?, notifications_email = ?, notifications_phone = ? WHERE id = ?';
            await db.queryAsync(query, [
              params.locale,
              notificationsEmail,
              notificationsPhone,
              ws.id
            ]);
            sendResponse(ws, tag, true);
          } else {
            sendErrorResponse(ws, tag, 'require login');
          }
          break;
        }
        case 'get_pros': {
          sendResponse(ws, tag, pros);
          break;
        }
        case 'get_pro': {
          sendResponse(ws, tag, pros[params]);
          break;
        }
      }
    }
  });
});
