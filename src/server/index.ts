import express from "express";
import { createServer } from "node:http";
import fs from "node:fs";
import { join } from "node:path";
import { Server } from "socket.io";
import { request } from "undici";

import { logger } from "../utils/log";
import { subscriptions, client } from "../index";
import { PermissionsBitField, VoiceChannel } from "discord.js";

const { MUSIC_DIR, PORT } = process.env;

const app = express();
app.use(express.json());
const server = createServer(app);
const io = new Server(server);

export const lobbyIo = io.of("/lobby");
export const queueIo = io.of("/queue");

app.get("/api/song/:id", (req, res) => {
  const filePath = join(MUSIC_DIR || "", `${req.params["id"]}.webm`);
  const isFileExist = fs.existsSync(filePath);
  if (!isFileExist) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: true, data: "Not found" }));
  } else {
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      "Content-Type": "audio/mpeg",
      "Content-Length": stat.size,
      "Accept-Ranges": "bytes",
    });
    const readStream = fs.createReadStream(filePath);
    // @ts-ignore
    readStream.pipe(res);
  }
});

app.get("/api/user", async (req, res) => {
  if (!req.headers["authorization"]) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  try {
    const guilds: any = await request("https://discord.com/api/users/@me/guilds", {
      method: "GET",
      headers: {
        Authorization: req.headers["authorization"],
      },
    }).then((res) => res.body.json());

    const user: any = await request("https://discord.com/api/users/@me", {
      method: "GET",
      headers: {
        Authorization: req.headers["authorization"],
      },
    }).then((res) => res.body.json());

    const botGuilds = client.guilds.cache.map((guild) => guild.id);

    const resGuilds = guilds.map((guild: any) => {
      return {
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        botExist: botGuilds.includes(guild.id),
      };
    });

    res.json({
      user: user,
      guilds: resGuilds,
    });
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

app.post("/api/verify", (req, res) => {
  const guildId = req.body.guildId;
  const token = req.headers.authorization;
  const subscription = subscriptions.get(guildId);

  request("https://discord.com/api/users/@me", {
    method: "GET",
    headers: {
      Authorization: token,
    },
  })
    .then((res) => res.body.json())
    .then(async (user: any) => {
      if (subscription) {
        client.channels.fetch(subscription.voiceConnection.joinConfig.channelId || "").then(async (channel) => {
          const userObj = await client.users.fetch(user.id);
          const permissions = (channel as VoiceChannel).permissionsFor(userObj);
          if (permissions && permissions.has(PermissionsBitField.Flags.Connect)) {
            res.json({ error: false, data: { queueId: subscription.id } });
          } else {
            res.status(401).json({ error: true, msg: "Not playing" });
          }
        });
      } else {
        res.status(401).json({ error: true, msg: "Not playing" });
      }
    })
    .catch(() => res.status(401).json({ error: true, msg: "unauthorized" }));
});

lobbyIo.on("connection", (socket) => {

  socket.on("enter", (param) => {
    socket.join(param.guildId);
    const subscription = subscriptions.get(param.guildId);
    if (subscription) {
      lobbyIo.to(param.guildId).emit("ping");
    }
  });

  socket.on("leave", (param) => {
    socket.leave(param.guildId);
  });

});

queueIo.on("connection", (socket) => {

  socket.on("enter", (param) => {
    socket.join(param.queueId);
    const subscription = subscriptions.get(param.guildId);
    if (subscription) {
      queueIo.to(param.queueId).emit("queue", subscription.toQueue());
    }
  });

  socket.on("leave", (param) => {
    socket.leave(param.queueId);
  });

  socket.on("queue", (param) => {
    const subscription = subscriptions.get(param.guildId);
    if (subscription) {
      queueIo.to(param.queueId).emit("queue", subscription.toQueue());
    }
  });
});

server.listen(PORT || 3000, () => {
  logger.info(`Server Started at port ${PORT || 3000}`);
});
