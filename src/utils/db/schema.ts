import Sequelize from "sequelize";
import { history, permissions, record } from "./index";

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

export const Permissions = permissions.define("permissions", {
  guildId: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  featureId: Sequelize.STRING
});
