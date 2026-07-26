import dotenv from "dotenv";

dotenv.config();

export default {
  port: process.env.PORT || 3000,
  isProduction: process.env.NODE_ENV === "production",
  mongoDB: {
    connectionString: process.env.DB_CONNECTIONSTRING,
  },
  jwt: {
    accessSecret: process.env.ACCESS_TOKEN_SECRET,
    accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
  },
};
