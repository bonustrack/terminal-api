import jwt from 'jsonwebtoken';

export const issueToken = (user, expiresIn = '7d') =>
  jwt.sign({ id: user }, process.env.JWT_SECRET, { expiresIn });
