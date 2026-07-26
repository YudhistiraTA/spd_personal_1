import jwt from "jsonwebtoken";
import config from "../config/index.js";

/**
 * Express middleware that requires a valid access token, either from the
 * `accessToken` httpOnly cookie (used by the browser frontend) or an
 * `Authorization: Bearer <token>` header (used by non-browser API clients).
 * On success, attaches `req.user = { id, email }`. Otherwise responds 401.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const requireAuth = (req, res, next) => {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice("Bearer ".length)
    : undefined;
  const token = req.cookies?.accessToken || bearer;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default requireAuth;
