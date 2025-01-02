import { Sequelize } from "sequelize";
import path from "path";
const { DB_DIR } = process.env;

export const history = new Sequelize("history", "user", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  // SQLite only
  storage: path.join(DB_DIR as string, "history.sqlite"),
});

export const record = new Sequelize("record", "user", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  // SQLite only
  storage: path.join(DB_DIR as string, "record.sqlite"),
});

export const permissions = new Sequelize("permissions", "user", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  // SQLite only
  storage: path.join(DB_DIR as string, "permissions.sqlite"),
});

export const mygo = new Sequelize({
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  // SQLite only
  storage: path.join(DB_DIR as string, "mygo.sqlite"),
});

export const initDB = () => {
  return Promise.all([history, record, permissions, mygo].map((db) => db.sync()));
};

export default history;
