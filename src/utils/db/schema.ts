import Sequelize from "sequelize";
import { sequelize } from "./index"

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
