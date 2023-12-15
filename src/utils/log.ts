import pino from "pino";
import { multistream } from "pino";
import pinoElastic from "pino-elasticsearch";
import fs from "fs";

const { ELK_HOST, ELK_USER, ELK_PWD, LOG_PATH } = process.env;

const streamToElastic = pinoElastic({
  index: "dcbot",
  node: ELK_HOST || "",
  auth: {
    username: ELK_USER || "",
    password: ELK_PWD || "",
  },
  esVersion: 8,
  flushBytes: 1000,
});

export const logger = pino(
  {
    name: "dcbot",
    nestedKey: "payload",
  },
  multistream([{ stream: fs.createWriteStream(LOG_PATH || "log.txt") }, { stream: streamToElastic }])
);
