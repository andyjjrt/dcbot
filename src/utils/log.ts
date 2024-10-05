import pino from "pino";
import { multistream } from "pino";
import pinoElastic from "pino-elasticsearch";
import fs from "fs";

const { ELK_INDEX, ELK_HOST, ELK_APIKEY, ELK_CERT } = process.env;

const streamToElastic = pinoElastic({
  index: ELK_INDEX || "dcbot",
  node: ELK_HOST || "http://localhost:9200",
  auth: {
    apiKey: ELK_APIKEY || "",
  },
  tls: {
    ca: ELK_CERT ? fs.readFileSync(ELK_CERT) : undefined,
    rejectUnauthorized: false,
  },
  esVersion: 8,
  flushBytes: 1000,
});

export const logger = pino(
  {
    name: ELK_INDEX || "dcbot",
    nestedKey: "payload",
  },
  multistream([{ stream: process.stdout }, { stream: streamToElastic }])
);
