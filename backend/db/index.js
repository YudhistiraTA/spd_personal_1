import { MongoClient } from "mongodb";
import config from "../config/index.js";
const client = new MongoClient(config.mongoDB.connectionString);
let conn;
try {
  conn = await client.connect();
} catch (e) {
  console.error(e);
}
let db = conn.db("personal_1");
export default db;
