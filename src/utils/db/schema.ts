import Sequelize from "sequelize";
import { history, announce, setting, record } from "./index";

export const History = history.define("history", {
  time: Sequelize.TIME,
  userId: Sequelize.STRING,
  title: Sequelize.STRING,
  url: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  list: Sequelize.BOOLEAN,
});

export const Record = record.define("record", {
  time: Sequelize.TIME,
  guildId: Sequelize.STRING,
  userId: Sequelize.STRING,
  title: Sequelize.STRING,
  url: Sequelize.STRING,
});

export const Setting = setting.define("setting", {
  guildId: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  ytKey: Sequelize.STRING,
});

export const Announce = announce.define("announce", {
  guildId: Sequelize.STRING,
  title: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  url: Sequelize.STRING,
});
