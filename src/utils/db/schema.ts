import Sequelize from "sequelize";
import { sequelize, announce } from "./index"

export const History = sequelize.define('history', {
  time: Sequelize.TIME,
  userId: Sequelize.STRING,
  title: Sequelize.STRING,
  url: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  list: Sequelize.BOOLEAN
});

export const Setting = sequelize.define('setting', {
  guildId: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  ytKey: Sequelize.STRING
});

export const Announce = announce.define('announce', {
  guildId: Sequelize.STRING,
  title: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  url: Sequelize.STRING
});