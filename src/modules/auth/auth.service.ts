import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../config/db';
import { env } from '../../config/env';
import { AppError } from '../../middlewares/errorHandler';
import { User, JWTPayload } from '../../types';

const generateTokens = (payload: JWTPayload): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
  return { accessToken, refreshToken };
};

export const registerUser = async (
  name: string,
  email: string,
  password: string
): Promise<{ user: Omit<User, 'password_hash' | 'refresh_token'>; accessToken: string; refreshToken: string }> => {
  // Check if user exists
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new AppError('Email already registered', 409);
  }

  const password_hash = await bcrypt.hash(password, 12);
  const result = await db.query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email, password_hash]
  );

  const user = result.rows[0] as Omit<User, 'password_hash' | 'refresh_token'>;
  const { accessToken, refreshToken } = generateTokens({ userId: user.id, email: user.email });

  // Store hashed refresh token
  const refreshHash = await bcrypt.hash(refreshToken, 10);
  await db.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshHash, user.id]);

  return { user, accessToken, refreshToken };
};

export const loginUser = async (
  email: string,
  password: string
): Promise<{ user: Omit<User, 'password_hash' | 'refresh_token'>; accessToken: string; refreshToken: string }> => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password', 401);
  }

  const user = result.rows[0] as User;
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const { accessToken, refreshToken } = generateTokens({ userId: user.id, email: user.email });

  const refreshHash = await bcrypt.hash(refreshToken, 10);
  await db.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshHash, user.id]);

  const { password_hash, refresh_token, ...safeUser } = user;
  void password_hash; void refresh_token;

  return { user: safeUser, accessToken, refreshToken };
};

export const refreshTokens = async (
  token: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  let payload: JWTPayload;
  try {
    payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTPayload;
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const result = await db.query('SELECT refresh_token FROM users WHERE id = $1', [payload.userId]);
  if (!result.rows[0]?.refresh_token) throw new AppError('Session not found', 401);

  const isValid = await bcrypt.compare(token, result.rows[0].refresh_token);
  if (!isValid) throw new AppError('Invalid refresh token', 401);

  const tokens = generateTokens({ userId: payload.userId, email: payload.email });
  const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);
  await db.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshHash, payload.userId]);

  return tokens;
};

export const logoutUser = async (userId: string): Promise<void> => {
  await db.query('UPDATE users SET refresh_token = NULL WHERE id = $1', [userId]);
};
