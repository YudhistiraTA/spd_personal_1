import jwt from "jsonwebtoken";
import usersService from "../services/users.service.js";
import config from "../config/index.js";

const REFRESH_COOKIE_PATH = "/v1/users";

/** Computes a cookie maxAge (ms) from a JWT's own `exp` claim. */
const maxAgeFromToken = (token) => {
  const decoded = jwt.decode(token);
  return Math.max(0, decoded.exp * 1000 - Date.now());
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    maxAge: maxAgeFromToken(accessToken),
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: maxAgeFromToken(refreshToken),
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
  });
};

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} req.body - { name, email, password }
 * @param {string} req.body.name - User's name
 * @param {string} req.body.email - User's email
 * @param {string} req.body.password - User's plaintext password
 * @param {Object} res - Express response object
 * @returns {void}
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};
    const { user, accessToken, refreshToken } = await usersService.registerUser(
      {
        name,
        email,
        password,
      },
    );
    setAuthCookies(res, accessToken, refreshToken);
    res.status(201).json(user.toPublic());
  } catch (err) {
    if (err.validationErrors) {
      return res
        .status(422)
        .json({ message: "Validation failed", errors: err.validationErrors });
    }
    if (err.conflict) {
      return res.status(409).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Log in an existing user
 * @param {Object} req - Express request object
 * @param {Object} req.body - { email, password }
 * @param {string} req.body.email - User's email
 * @param {string} req.body.password - User's plaintext password
 * @param {Object} res - Express response object
 * @returns {void}
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    const { user, accessToken, refreshToken } = await usersService.loginUser({
      email,
      password,
    });
    setAuthCookies(res, accessToken, refreshToken);
    res.status(200).json(user.toPublic());
  } catch (err) {
    if (err.validationErrors) {
      return res
        .status(422)
        .json({ message: "Validation failed", errors: err.validationErrors });
    }
    if (err.unauthorized) {
      return res.status(401).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Rotate the refresh token and issue a new access token
 * @param {Object} req - Express request object
 * @param {Object} req.cookies - Cookies, including `refreshToken`
 * @param {string} req.cookies.refreshToken - The current refresh token
 * @param {Object} res - Express response object
 * @returns {void}
 */
const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const {
      user,
      accessToken,
      refreshToken: newRefreshToken,
    } = await usersService.refreshSession(refreshToken);
    setAuthCookies(res, accessToken, newRefreshToken);
    res.status(200).json(user.toPublic());
  } catch (err) {
    if (err.unauthorized) {
      clearAuthCookies(res);
      return res.status(401).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Log out the current session by invalidating its refresh token. Does not
 * require a valid (non-expired) access token — only a refresh token cookie,
 * so a user can log out even after their access token has expired.
 * @param {Object} req - Express request object
 * @param {Object} req.cookies - Cookies, including `refreshToken`
 * @param {string} req.cookies.refreshToken - The current refresh token
 * @param {Object} res - Express response object
 * @returns {void}
 */
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const decoded = jwt.decode(refreshToken);
      if (decoded?.sub) {
        await usersService.logoutUser(decoded.sub, refreshToken);
      }
    }
    clearAuthCookies(res);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get the authenticated user's profile
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user attached by requireAuth
 * @param {string} req.user.id - User's ID
 * @param {Object} res - Express response object
 * @returns {void}
 */
const me = async (req, res) => {
  try {
    const user = await usersService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user.toPublic());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default { register, login, refresh, logout, me };
