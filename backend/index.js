import express from "express";
import cookieParser from "cookie-parser";
import router from "./routes/index.js";
import config from "./config/index.js";

const app = express();

app.use((req, res, next) => {
  // Reflect the request's Origin instead of using a bare "*". The auth
  // endpoints rely on httpOnly cookies, and browsers reject credentialed
  // requests (`credentials: "include"`) when the response uses a wildcard
  // origin — the Access-Control-Allow-Origin header must name the exact
  // origin, and Access-Control-Allow-Credentials must be "true".
  const origin = req.headers.origin;
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());
app.use(cookieParser());
app.use("/", router);

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});