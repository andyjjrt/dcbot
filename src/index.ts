import * as dotenv from "dotenv";
dotenv.config();

import { ActivityType, Events, GatewayIntentBits, Snowflake, TextChannel } from "discord.js";
import { MusicSubscription } from "./utils/Subscription";
import http from "node:http";
import fs from "node:fs";
import path from "path";

import Client from "./utils/Client";
import { play } from "./commands/play";
import { initDB } from "./utils/db";
import { ErrorEmbed, InfoEmbed } from "./utils/Embed";
import { logger } from "./utils/log";

const { TOKEN, CLIENT_ID, BANNED_LIST, MUSIC_DIR, PORT } = process.env;

logger.info("starting...");

// Create a new client instance
export const client = new Client(
  {
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
    ],
    allowedMentions: { parse: ["roles"], repliedUser: false },
  },
  CLIENT_ID,
  TOKEN,
  path.join(__dirname, "commands")
);

export const subscriptions = new Map<Snowflake, MusicSubscription>();

client.once(Events.ClientReady, (c) => {
  logger.info(`Logged in as ${c.user.tag}`);
  c.user.setPresence({
    activities: [{ name: "/play", type: ActivityType.Listening }],
    status: "online",
  });
  initDB().then((dbs) => logger.info(`${dbs.length} db synced`));
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if ((BANNED_LIST?.split(",") || []).indexOf(interaction.user.id) >= 0) {
      await interaction.reply({
        embeds: [new ErrorEmbed(interaction.client.user, "Error", "You're banned")],
      });
      return;
    }
    const command = client.collection.get(interaction.commandName);
    if (!command) {
      logger.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }
    try {
      await command.execute(interaction);
      logger.info(
        {
          type: "command",
          guild: interaction.guild!.name,
          channel: (interaction.channel as TextChannel)!.name,
          user: interaction.member!.user.username,
        },
        `/${interaction.commandName}`
      );
    } catch (error) {
      logger.error(error, "Unknown error");
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  } else if (interaction.isAutocomplete()) {
    const command = client.collection.get(interaction.commandName);
    if (!command) {
      logger.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }
    try {
      await command.autocomplete(interaction);
    } catch (error) {
      logger.error(error, "Unknown error");
    }
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.globalName && message.content.length > 0) {
    logger.info(
      {
        type: "command",
        guild: message.guild!.name,
        channel: (message.channel as TextChannel).name,
        user: message.author.username,
      },
      message.content
    );
  }
});

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  if (oldState.channelId === null) {
    logger.info(
      {
        type: "join voice",
        guild: newState.guild!.name,
        channel: newState.channel!.name,
        user: newState.member!.user.username,
      },
      `${newState.member!.user.username} joined ${newState.channel!.name} in ${newState.guild!.name}`
    );
    const guildId = oldState.guild.id;
    const subscription = subscriptions.get(guildId);
    if (subscription && newState.member!.user.id !== client.user.id) {
      if (subscription.leaveTimer) {
        clearTimeout(subscription.leaveTimer);
        subscription.commandChannel.send({
          embeds: [
            new InfoEmbed(
              client.user,
              ":partying_face:  Yeah~",
              `**${newState.member!.user.username}** is back with me.`
            ),
          ],
        });
      }
    }
  }
  if (newState.channelId === null) {
    logger.info(
      {
        type: "leave voice",
        guild: oldState.guild!.name,
        channel: oldState.channel!.name,
        user: oldState.member!.user.username,
      },
      `${oldState.member!.user.username} left ${oldState.channel!.name} in ${oldState.guild!.name}`
    );
    const guildId = oldState.guild.id;
    const subscription = subscriptions.get(guildId);
    if (subscription && oldState.member!.user.id !== client.user.id) {
      if (oldState.channel!.members.size <= 1) {
        subscription.commandChannel.send({
          embeds: [
            new InfoEmbed(
              client.user,
              ":face_holding_back_tears:  Feeling alone",
              `I'll leave in 1 minute if no one else is here`
            ),
          ],
        });
        subscription.leaveTimer = setTimeout(() => {
          if (oldState.channel!.members.size <= 1) {
            subscription.commandChannel.send({
              embeds: [new InfoEmbed(client.user, ":wave:  Left", "I'm right.")],
            });
            subscription.queueMessage.destroy();
            subscription.voiceConnection.destroy();
            subscriptions.delete(guildId);
          }
        }, 60000);
      }
    }
  }
});

client.login(TOKEN);

const server = http.createServer((req, res) => {
  const param = (req.url || "").split("/");
  if (param[1] === "song") {
    const filePath = path.join(MUSIC_DIR || "", `${param[2]}.webm`);
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
      readStream.pipe(res);
    }
  } else {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: false, data: "Hello world" }));
  }
});

server.on("clientError", (err, socket) => {
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

server.listen(PORT || 3000);
logger.info("Server Starting...");

export default client;
