import * as dotenv from "dotenv";
dotenv.config();

import { ActivityType, Events, GatewayIntentBits, Snowflake, TextChannel, VoiceChannel } from "discord.js";
import path from "path";

import { MusicSubscription } from "./utils/Subscription";
import Client from "./utils/Client";
import { initDB } from "./utils/db";
import { Permissions } from "./utils/db/schema";
import { ErrorEmbed, InfoEmbed } from "./utils/Embed";
import { logger } from "./utils/log";
import { queueIo } from "./server/index";
import { replyConversation } from "./commands/chat";
const { TOKEN, CLIENT_ID, NODE_ENV } = process.env;

logger.info("Starting...");

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
  path.join(__dirname, "commands"),
  path.join(__dirname, "contextmenus")
);

export const subscriptions = new Map<Snowflake, MusicSubscription>();

client.once(Events.ClientReady, (c) => {
  logger.info(`Logged in as ${c.user.tag}`);
  if (NODE_ENV === "development") {
    c.user.setPresence({
      activities: [{ name: "Under Heavy Development", type: ActivityType.Custom }],
      status: "dnd",
    });
  } else {
    c.user.setPresence({
      activities: [{ name: "/play", type: ActivityType.Listening }],
      status: "online",
    });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commandCollection.get(interaction.commandName);
    if (!command) {
      logger.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }
    if (command.featureId) {
      const permission = await Permissions.findOne({
        where: {
          guildId: interaction.guildId,
          featureId: command.featureId,
        },
      });
      if (!permission) {
        await interaction.reply({
          embeds: [
            new ErrorEmbed(
              interaction.client.user,
              "Error",
              "This command is not allowed on this server, please contact bot owner."
            ),
          ],
          ephemeral: true,
        });
        return;
      }
    }
    try {
      await command.execute(interaction);
      logger.info(
        {
          type: "command",
          guild: interaction.guild?.name || null,
          guildId: interaction.guild?.id || null,
          channel: (interaction.channel as TextChannel)?.name || null,
          channelId: (interaction.channel as TextChannel)?.id || null,
          user: interaction.user.username,
          userId: interaction.user.id,
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
    const command = client.commandCollection.get(interaction.commandName);
    if (!command) {
      logger.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }
    try {
      await command.autocomplete(interaction);
    } catch (error) {
      logger.error(error, "Unknown error");
    }
  } else if (interaction.isMessageContextMenuCommand()) {
    const context = client.contextCollection.get(interaction.commandName);
    if (!context) {
      logger.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }
    if (context.featureId) {
      const permission = await Permissions.findOne({
        where: {
          guildId: interaction.guildId,
          featureId: context.featureId,
        },
      });
      if (!permission) {
        await interaction.reply({
          embeds: [
            new ErrorEmbed(
              interaction.client.user,
              "Error",
              "This command is not allowed on this server, please contact bot owner."
            ),
          ],
          ephemeral: true,
        });
        return;
      }
    }
    try {
      await context.execute(interaction);
    } catch (error) {
      logger.error(error, "Unknown error");
    }
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.channel.isThread()) {
    replyConversation(message);
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
  }

  const guildId = oldState.guild.id;
  const subscription = subscriptions.get(guildId);
  if (subscription) {
    if (
      newState.member!.user.id !== client.user.id &&
      newState.channelId === subscription.voiceConnection.joinConfig.channelId
    ) {
      if (subscription.leaveTimer) {
        clearTimeout(subscription.leaveTimer);
        subscription.leaveTimer = null;
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
    if (oldState.member!.user.id !== client.user.id) {
      if (
        (client.channels.cache.get(subscription.voiceConnection.joinConfig.channelId!) as VoiceChannel).members.size <=
          1 &&
        subscription.leaveTimer === null
      ) {
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

client
  .login(TOKEN)
  .then(() => {
    return initDB();
  })
  .then((dbs) => {
    logger.info(`Synced ${dbs.length} dbs`);
    return client.refreshCommands();
  });

import "./server/index";

export default client;
