import * as dotenv from "dotenv";
dotenv.config();

import { ActivityType, Events, GatewayIntentBits, Snowflake, TextChannel } from "discord.js";
import path from "path";

import { MusicSubscription } from "./utils/Subscription";
import Client from "./utils/Client";
import { initDB } from "./utils/db";
import { ErrorEmbed, InfoEmbed } from "./utils/Embed";
import { logger } from "./utils/log";
const { TOKEN, CLIENT_ID, BANNED_LIST } = process.env;

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
          guildId: interaction.guild!.id,
          channel: (interaction.channel as TextChannel)!.name,
          channelId: (interaction.channel as TextChannel)!.id,
          user: interaction.member!.user.username,
          userId: interaction.member!.user.id,
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
        type: "message",
        guild: message.guild!.name,
        guildId: message.guild!.id,
        channel: (message.channel as TextChannel).name,
        channelId: (message.channel as TextChannel).id,
        user: message.author.username,
        userId: message.author.id,
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
        guildId: newState.guild!.id,
        channel: newState.channel!.name,
        channelId: newState.channel!.id,
        user: newState.member!.user.username,
        userId: newState.member!.user.id,
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
        guildId: oldState.guild!.id,
        channel: oldState.channel!.name,
        channelId: oldState.channel!.id,
        user: oldState.member!.user.username,
        userId: oldState.member!.user.id,
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
            queueIo.to(subscription.id).disconnectSockets();
            subscriptions.delete(guildId);
          }
        }, 60000);
      }
    }
  }
});

client.login(TOKEN).then();

import "./server/index";
import { queueIo } from "./server/index";

export default client;
