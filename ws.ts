import { Server } from 'ws';
import jwt from 'jsonwebtoken';
import db from './helpers/db';
import { sendResponse, sendErrorResponse } from './helpers/ws';

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
      }
    }
  });
});
