import { randomBytes } from 'crypto';
import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LineStrategy } from 'passport-line-auth';
import db from './db';

const getAccountId = async (connection, account) => {
  let query;
  let id = randomBytes(4).toString('hex');
  if (account.email) {
    query = 'SELECT id FROM accounts WHERE email = ?';
    const accounts = await db.queryAsync(query, [account.email]);
    if (accounts[0]) id = accounts[0].id;
  } else {
    query = 'SELECT account FROM connections WHERE provider = ? AND provider_id = ?';
    const connections = await db.queryAsync(query, [connection.provider, connection.provider_id]);
    if (connections[0]) id = connections[0].account;
  }
  connection.account = id;
  account.id = id;
  query = 'INSERT INTO connections SET ? ON DUPLICATE KEY UPDATE refresh_token = ?';
  await db.queryAsync(query, [connection, connection.refresh_token]);
  query = 'INSERT IGNORE INTO accounts SET ?';
  await db.queryAsync(query, [account, new Date().getTime()]);
  return id;
};

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'displayName', 'name', 'email']
    },
    async (accessToken, refreshToken, profile, cb) => {
      const connection = {
        provider: 'facebook',
        provider_id: profile._json.id,
        refresh_token: refreshToken
      };
      const account = {
        email: profile._json.email,
        name: profile._json.name,
        firstname: profile._json.first_name,
        lastname: profile._json.last_name,
        picture_url: `https://graph.facebook.com/${profile.id}/picture?width=240`
      };
      const id = await getAccountId(connection, account);
      cb(null, id);
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, cb) => {
      console.log('Google', profile);
      const connection = {
        provider: 'google',
        provider_id: profile.id,
        refresh_token: refreshToken
      };
      const account = {
        email: profile._json.email_verified ? profile._json.email : undefined,
        name: profile._json.name,
        firstname: profile._json.given_name,
        lastname: profile._json.family_name,
        picture_url: profile._json.picture
      };
      const id = await getAccountId(connection, account);
      cb(null, id);
    }
  )
);

passport.use(
  new LineStrategy(
    {
      channelID: process.env.LINE_CHANNEL_ID,
      channelSecret: process.env.LINE_CHANNEL_SECRET,
      callbackURL: process.env.LINE_CALLBACK_URL,
      scope: ['profile', 'openid', 'email'],
      botPrompt: 'normal'
    },
    async (accessToken, refreshToken, params, profile, cb) => {
      const connection = {
        provider: 'line',
        provider_id: profile.id,
        refresh_token: refreshToken
      };
      const account = {
        name: profile.displayName,
        firstname: profile.displayName,
        picture_url: profile.pictureUrl
      };
      const id = await getAccountId(connection, account);
      cb(null, id);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((id, done) => done(null, id));

export default passport;
