import Sequelize from "sequelize";
import { history, permissions, record, mygo } from "./index";

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
  featureId: Sequelize.STRING,
});

export const Mygo = mygo.define(
  "sentence",
  {
    episode: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    frame: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    text: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    diff_from_prev: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    diff_segment: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    diff_score: {
      type: Sequelize.REAL,
      allowNull: true
    },
    timestamp: {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: "00:00:00.000"
    },
    segment_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: -1
    }
  }, {
    tableName: 'sentence',
    timestamps: false,
    indexes: [
      {
        name: "index_text",
        fields: [
          { name: "text" },
        ]
      },
      {
        name: "index_frame",
        fields: [
          { name: "frame" },
        ]
      },
      {
        name: "index_diff_score",
        fields: [
          { name: "diff_score" },
        ]
      },
      {
        name: "index_segment_id",
        fields: [
          { name: "segment_id" },
        ]
      },
    ]
  }
);
