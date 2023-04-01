// Require the necessary discord.js classes
import { ActivityType, Events, GatewayIntentBits, Snowflake, TextChannel, time } from "discord.js";
import { MusicSubscription } from "./utils/Subscription"
import chalk from "chalk";
import * as dotenv from "dotenv";
dotenv.config();
const { TOKEN, CLIENT_ID } = process.env;

import Client from "./utils/Client"
import { play } from "./commands/play"
import { initDB } from "./utils/db";
import { ErrorEmbed, InfoEmbed } from "./utils/Embed";
import path from "path";

console.log(
  chalk.cyanBright(`[${new Date().toLocaleString()}] [SETUP]`)
  + " Starting..."
)

// Create a new client instance
export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
}, CLIENT_ID, TOKEN, path.join(__dirname, "commands"));

export const subscriptions = new Map<Snowflake, MusicSubscription>();

client.once(Events.ClientReady, (c) => {
  console.log(
    chalk.cyanBright(`[${new Date().toLocaleString()}] [SETUP]`)
    + " Logged in as "
    + chalk.green(c.user.tag)
  )
  c.user.setPresence({
    activities: [{ name: "/play", type: ActivityType.Listening }],
    status: "online",
  });
  initDB().then((dbs) => console.log(chalk.cyanBright(`[${new Date().toLocaleString()}] [SETUP]`) + ` ${dbs.length} db synced`))
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const commandChannel = interaction.channel;
    if (!(commandChannel instanceof TextChannel)) {
      await interaction.reply({ embeds: [new ErrorEmbed(interaction.client, "Error", "Please use command in a **Text Channel**")] });
      return;
    }
    const command = client.collection.get(interaction.commandName);
    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }
    try {
      console.log(
        chalk.cyanBright(`[${new Date().toLocaleString()}]`)
        + " "
        + chalk.cyanBright("[COMMAND]")
        + " "
        + chalk.green(interaction.member!.user.username + "#" + interaction.member!.user.discriminator)
        + " used "
        + chalk.yellow(interaction.commandName)
        + " in "
        + chalk.magenta(interaction.guild!.name)
      )
      await command.execute(interaction);
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
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }
    try {
      await command.autocomplete(interaction);
    } catch (error) {
      console.error(error);
    }
  } else if (interaction.isStringSelectMenu()) {
    if (new Date().getTime() - interaction.message.createdTimestamp > 60000) return;
    if (interaction.customId === "#SearchSelectMenu") {
      await interaction.deferReply();
      play(interaction, `https://www.youtube.com/watch?v=${interaction.values[0]}`, false, false)
    }
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
    console.log(
      chalk.cyanBright(`[${new Date().toLocaleString()}]`)
      + " "
      + chalk.cyanBright("[USER]")
      + " "
      + chalk.green(newState.member!.user.username + "#" + newState.member!.user.discriminator)
      + " joined "
      + chalk.yellow(newState.channel!.name)
      + " in "
      + chalk.magenta(newState.guild!.name)
    )
    const guildId = oldState.guild.id
    const subscription = subscriptions.get(guildId);
    if (subscription && newState.member!.user.id !== client.user.id) {
      if (subscription.leaveTimer) {
        subscription.leaveTimer = null;
        subscription.commandChannel.send({ embeds: [new InfoEmbed(client, ":partying_face:  Yeah~", `**${newState.member!.user.username}** is back with me.`)] })
      }
    }
  }
  if (newState.channelId === null) {
    console.log(
      chalk.cyanBright(`[${new Date().toLocaleString()}]`)
      + " "
      + chalk.cyanBright("[USER]")
      + " "
      + chalk.green(oldState.member!.user.username + "#" + oldState.member!.user.discriminator)
      + " left "
      + chalk.yellow(oldState.channel!.name)
      + " in "
      + chalk.magenta(oldState.guild!.name)
    )
    const guildId = oldState.guild.id
    const subscription = subscriptions.get(guildId);
    if (subscription && oldState.member!.user.id !== client.user.id) {
      if (oldState.channel!.members.size <= 1) {
        subscription.commandChannel.send({ embeds: [new InfoEmbed(client, ":face_holding_back_tears:  Feeling alone", `I'll leave in 1 minute if no one else is here`)] })
        subscription.leaveTimer = setTimeout(() => {
          if (oldState.channel!.members.size <= 1) {
            subscription.commandChannel.send({ embeds: [new InfoEmbed(client, ":wave:  Left", "I'm right.")] })
            subscription.voiceConnection.destroy();
            subscriptions.delete(guildId);
          }
        }, 60000);
      }
    }

  }

})

client.login(TOKEN);
