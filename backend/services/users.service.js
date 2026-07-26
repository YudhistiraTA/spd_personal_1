import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import users, { User } from "../models/users.model.js";
import config from "../config/index.js";

/**
 * Hashes a refresh token for storage. Refresh tokens are high-entropy random
 * strings (not user-chosen secrets), so a fast cryptographic hash is used
 * instead of bcrypt (which is intentionally slow, for low-entropy passwords).
 * @param {string} token
 * @returns {string}
 */
const hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

/**
 * Signs a new access/refresh token pair for a user and persists the hashed
 * refresh token on the user document so it can be verified/rotated later.
 * @param {User} user
 * @returns {Promise<{accessToken: string, refreshToken: string}>}
 */
const issueTokens = async (user) => {
  const userId = user._id.toString();

  const accessToken = jwt.sign(
    { sub: userId, email: user.email },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiresIn },
  );

  const jti = crypto.randomUUID();
  const refreshToken = jwt.sign(
    { sub: userId, jti },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn },
  );

  const decoded = jwt.decode(refreshToken);
  const expiresAt = new Date(decoded.exp * 1000).toISOString();

  await users.updateOne(
    { _id: user._id },
    {
      $push: {
        refreshTokens: {
          tokenHash: hashRefreshToken(refreshToken),
          expiresAt,
          createdAt: new Date().toISOString(),
        },
      },
    },
  );

  return { accessToken, refreshToken };
};

/**
 * Registers a new user.
 * @param {Object} data
 * @param {string} data.name
 * @param {string} data.email
 * @param {string} data.password - Plaintext password (hashed before storage)
 * @returns {Promise<{user: User, accessToken: string, refreshToken: string}>}
 */
const registerUser = async ({ name, email, password }) => {
  const passwordErrors = User.validatePassword(password);
  if (passwordErrors.length > 0) {
    const err = new Error("Validation failed");
    err.validationErrors = passwordErrors;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);
  const user = new User({ name, email, passwordHash });

  const errors = user.validate();
  if (errors.length > 0) {
    const err = new Error("Validation failed");
    err.validationErrors = errors;
    throw err;
  }

  const existing = await users.findOne({ email: user.email, isDeleted: false });
  if (existing) {
    const err = new Error("Email already registered");
    err.conflict = true;
    throw err;
  }

  const doc = user.sanitize();
  const result = await users.insertOne(doc);
  const created = new User({ ...doc, _id: result.insertedId });

  const tokens = await issueTokens(created);
  return { user: created, ...tokens };
};

/**
 * Authenticates a user by email and password.
 * @param {Object} data
 * @param {string} data.email
 * @param {string} data.password
 * @returns {Promise<{user: User, accessToken: string, refreshToken: string}>}
 */
const loginUser = async ({ email, password }) => {
  if (typeof email !== "string" || typeof password !== "string") {
    const err = new Error("Validation failed");
    err.validationErrors = ['"email" and "password" are required'];
    throw err;
  }

  const doc = await users.findOne({ email, isDeleted: false });
  const passwordHash = doc?.passwordHash ?? "";
  // Always run bcrypt.compare, even when no user was found, so the response
  // time doesn't leak whether the email exists (timing side-channel).
  const passwordMatches = await bcrypt.compare(password, passwordHash || "\0");

  if (!doc || !passwordMatches) {
    const err = new Error("Invalid email or password");
    err.unauthorized = true;
    throw err;
  }

  const user = new User(doc);
  const tokens = await issueTokens(user);
  return { user, ...tokens };
};

/**
 * Verifies a refresh token, rotates it (invalidating the old one), and
 * issues a new access/refresh token pair.
 * @param {string} refreshToken
 * @returns {Promise<{user: User, accessToken: string, refreshToken: string}>}
 */
const refreshSession = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch {
    const err = new Error("Invalid refresh token");
    err.unauthorized = true;
    throw err;
  }

  let userId;
  try {
    userId = new ObjectId(decoded.sub);
  } catch {
    const err = new Error("Invalid refresh token");
    err.unauthorized = true;
    throw err;
  }

  const doc = await users.findOne({ _id: userId, isDeleted: false });
  const tokenHash = hashRefreshToken(refreshToken);
  const stored = doc?.refreshTokens?.find((t) => t.tokenHash === tokenHash);

  if (!doc || !stored || new Date(stored.expiresAt).getTime() < Date.now()) {
    const err = new Error("Invalid refresh token");
    err.unauthorized = true;
    throw err;
  }

  // Rotate: invalidate the token that was just used before issuing a new one.
  await users.updateOne(
    { _id: userId },
    { $pull: { refreshTokens: { tokenHash } } },
  );

  const user = new User(doc);
  const tokens = await issueTokens(user);
  return { user, ...tokens };
};

/**
 * Invalidates a single refresh token for a user (logout). Idempotent.
 * @param {string} userId
 * @param {string} refreshToken
 * @returns {Promise<void>}
 */
const logoutUser = async (userId, refreshToken) => {
  let _id;
  try {
    _id = new ObjectId(userId);
  } catch {
    return;
  }
  const tokenHash = hashRefreshToken(refreshToken ?? "");
  await users.updateOne({ _id }, { $pull: { refreshTokens: { tokenHash } } });
};

/**
 * Fetches a user by ID for the authenticated "me" profile endpoint.
 * @param {string} id
 * @returns {Promise<User|null>}
 */
const getUserById = async (id) => {
  let _id;
  try {
    _id = new ObjectId(id);
  } catch {
    return null;
  }
  const doc = await users.findOne({ _id, isDeleted: false });
  if (!doc) return null;
  return new User(doc);
};

export default {
  registerUser,
  loginUser,
  refreshSession,
  logoutUser,
  getUserById,
};
