import express from 'express';
import bodyParser from 'body-parser';
import frameguard from 'frameguard';
import cors from 'cors';
import session from 'express-session';
import passport from './helpers/passport';
import api from './routes/api';
import auth from './routes/auth';

const app = express();
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ limit: '20mb', extended: false }));
app.use(frameguard({ action: 'deny' }));
app.use(cors());
app.use(session({ secret: process.env.JWT_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', api);
app.use('/auth', auth);
app.get('*', (req, res) => res.json({ active: true }));

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
