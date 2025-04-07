import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';

import handlebars from 'handlebars';
import path from 'node:path';
import fs from 'node:fs/promises';

import { SMTP, TEMPLATES_DIR } from '../constants/index.js';
import getEnvVar from '../utils/getEnvVar.js';
import { sendEmail } from '../utils/sendMail.js';
import { User } from '../db/models/user.js';
import { Session } from '../db/models/session.js';

export async function registerUser(payload) {
  const user = await User.findOne({ email: payload.email });

  if (user !== null) {
    throw createHttpError.Conflict('Email in use');
  }

  payload.password = await bcrypt.hash(payload.password, 10);

  return User.create(payload);
}

export async function loginUser(email, password) {
  const user = await User.findOne({ email });

  if (user === null) {
    throw createHttpError.Unauthorized('Email or password is incorrect!');
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (isMatch !== true) {
    throw createHttpError.Unauthorized('Email or password is incorrect!');
  }

  await Session.deleteOne({ userId: user._id });

  return Session.create({
    userId: user._id,
    accessToken: crypto.randomBytes(30).toString('base64'),
    refreshToken: crypto.randomBytes(30).toString('base64'),
    accessTokenValidUntil: new Date(Date.now() + 150 * 60 * 1000),
    refreshTokenValidUntil: new Date(Date.now() + 720 * 60 * 60 * 1000),
  });
}

export async function logoutUser(sessionId, refreshToken) {
  await Session.deleteOne({ _id: sessionId, refreshToken });

  return undefined;
}

export async function refreshSession(sessionId, refreshToken) {
  const currentSession = await Session.findOne({
    _id: sessionId,
    refreshToken,
  });

  if (currentSession === null) {
    throw createHttpError.Unauthorized('Session not found!');
  }

  if (currentSession.refreshTokenValidUntil < new Date()) {
    throw createHttpError.Unauthorized('Refresh token is expired!');
  }

  await Session.deleteOne({
    _id: currentSession._id,
    refreshToken: currentSession.refreshToken,
  });

  return Session.create({
    userId: currentSession.userId,
    accessToken: crypto.randomBytes(30).toString('base64'),
    refreshToken: crypto.randomBytes(30).toString('base64'),
    accessTokenValidUntil: new Date(Date.now() + 10 * 60 * 1000),
    refreshTokenValidUntil: new Date(Date.now() + 720 * 60 * 60 * 1000),
  });
}

export const requestResetToken = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw createHttpError(404, 'User not found');
  }
  const resetToken = jwt.sign(
    { sub: user._id, email },
    getEnvVar('JWT_SECRET'),
    { expiresIn: '5m' },
  );

  const resetPasswordTemplatePath = path.join(
    TEMPLATES_DIR,
    'reset-password-email.html',
  );

  const templateSource = (
    await fs.readFile(resetPasswordTemplatePath)
  ).toString();

  const template = handlebars.compile(templateSource);
  const html = template({
    name: user.name,
    link: `${getEnvVar('APP_DOMAIN')}/reset-password?token=${resetToken}`,
  });

  await sendEmail({
    from: getEnvVar(SMTP.SMTP_FROM),
    to: email,
    subject: 'Reset your password',
    html,
  });
};

export const resetPassword = async (payload) => {
  let entries;

  try {
    entries = jwt.verify(payload.token, getEnvVar('JWT_SECRET'));
  } catch (err) {
    if (err instanceof Error) throw createHttpError(401, err.message);
    throw err;
  }

  const user = await User.findOne({ email: entries.email, _id: entries.sub });

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  const encryptedPassword = await bcrypt.hash(payload.password, 10);

  await User.updateOne({ _id: user._id }, { password: encryptedPassword });
};

export async function loginOrRegister(email, name) {
  const user = await User.findOne({ email });

  if (user === null) {
    const password = await bcrypt.hash(
      crypto.randomBytes(30).toString('base64'),
      10,
    );

    const createdUser = await User.create({
      email,
      name,
      password,
    });

    return Session.create({
      userId: createdUser._id,
      accessToken: crypto.randomBytes(30).toString('base64'),
      refreshToken: crypto.randomBytes(30).toString('base64'),
      accessTokenValidUntil: new Date(Date.now() + 10 * 60 * 1000),
      refreshTokenValidUntil: new Date(Date.now() + 720 * 60 * 60 * 1000),
    });
  }

  await Session.deleteOne({ userId: user._id });

  return Session.create({
    userId: user._id,
    accessToken: crypto.randomBytes(30).toString('base64'),
    refreshToken: crypto.randomBytes(30).toString('base64'),
    accessTokenValidUntil: new Date(Date.now() + 10 * 60 * 1000),
    refreshTokenValidUntil: new Date(Date.now() + 720 * 60 * 60 * 1000),
  });
}
