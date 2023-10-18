// Require the necessary discord.js classes
import {
  ActivityType,
  Events,
  GatewayIntentBits,
  Snowflake,
  TextChannel,
} from "discord.js";
import { MusicSubscription } from "./utils/Subscription";
import chalk from "chalk";
import * as dotenv from "dotenv";
import http from "node:http";
import fs from "node:fs";
dotenv.config();
const { TOKEN, CLIENT_ID, BANNED_LIST, MUSIC_DIR, PORT } = process.env;

import Client from "./utils/Client";
import { play } from "./commands/play";
import { initDB } from "./utils/db";
import { ErrorEmbed, InfoEmbed } from "./utils/Embed";
import path from "path";
import { log } from "./utils/log";

log("SETUP", " Starting...");

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
  log("SETUP", "Logged in as " + chalk.green(c.user.tag));
  c.user.setPresence({
    activities: [{ name: "/play", type: ActivityType.Listening }],
    status: "online",
  });
  initDB().then((dbs) => log("SETUP", `${dbs.length} db synced`));
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const commandChannel = interaction.channel;
    if (!(commandChannel instanceof TextChannel)) {
      await interaction.reply({
        embeds: [
          new ErrorEmbed(
            interaction.client.user,
            "Error",
            "Please use command in a **Text Channel**"
          ),
        ],
      });
      return;
    }
    if ((BANNED_LIST?.split(",") || []).indexOf(interaction.user.id) >= 0) {
      await interaction.reply({
        embeds: [
          new ErrorEmbed(interaction.client.user, "Error", "You're banned"),
        ],
      });
      return;
    }
    const command = client.collection.get(interaction.commandName);
    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }
    try {
      await command.execute(interaction);
      log(
        "COMMAND",
        chalk.green(interaction.member!.user.username) +
          " used " +
          chalk.yellow(interaction.commandName) +
          " in " +
          chalk.magenta(interaction.guild!.name)
      );
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  } else if (interaction.isAutocomplete()) {
    const command = client.collection.get(interaction.commandName);
    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }
    try {
      await command.autocomplete(interaction);
    } catch (error) {
      console.error(error);
    }
  } else if (interaction.isStringSelectMenu()) {
    if (new Date().getTime() - interaction.message.createdTimestamp > 60000)
      return;
    if (interaction.customId === "#SearchSelectMenu") {
      await interaction.deferReply();
      play(
        interaction,
        `https://www.youtube.com/watch?v=${interaction.values[0]}`,
        false,
        false
      );
    }
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.globalName && message.content.length > 0) {
    log("LOG", chalk.green(message.author.globalName + ": ") + message.content);
  }
});

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  // if (oldState.channelId === newState.channelId) {
  //   console.log('a user has not moved!')
  // }
  // if (oldState.channelId != null && newState.channelId != null && newState.channelId != oldState.channelId) {
  //   console.log('a user switched channels')
  // }
  if (oldState.channelId === null) {
    log(
      "USER",
      chalk.green(newState.member!.user.username) +
        " joined " +
        chalk.yellow(newState.channel!.name) +
        " in " +
        chalk.magenta(newState.guild!.name)
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
    log(
      "USER",
      chalk.green(oldState.member!.user.username) +
        " left " +
        chalk.yellow(oldState.channel!.name) +
        " in " +
        chalk.magenta(oldState.guild!.name)
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
              embeds: [
                new InfoEmbed(client.user, ":wave:  Left", "I'm right."),
              ],
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
log("SETUP", "Server Starting...");
