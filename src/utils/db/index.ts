import { Sequelize } from "sequelize";
import path from "path";
const { DB_DIR } = process.env

export const history = new Sequelize('history', 'user', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  logging: false,
  // SQLite only
  storage: path.join(DB_DIR as string, "history.sqlite"),
});

export const record = new Sequelize('record', 'user', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  logging: false,
  // SQLite only
  storage: path.join(DB_DIR as string, "record.sqlite"),
});

export const setting = new Sequelize('settting', 'user', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  logging: false,
  // SQLite only
  storage: path.join(DB_DIR as string, "setting.sqlite"),
});

export const announce = new Sequelize('announce', 'user', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  logging: false,
  // SQLite only
  storage: path.join(DB_DIR as string, "announce.sqlite"),
});

export const initDB = () => {
  return Promise.all([history, record, announce, setting].map(db => db.sync()));
}

export default history;