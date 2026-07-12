import dotenv from "dotenv";

dotenv.config();

export default {
  port: process.env.PORT || 3000,
  mongoDB: {
    connectionString: process.env.DB_CONNECTIONSTRING,
  },
};
