// Require the necessary discord.js classes
import { ActivityType, CommandInteraction, Events, GatewayIntentBits, Snowflake } from "discord.js";
import { MusicSubscription } from "./utils/Subscription"
import chalk from "chalk";
import * as dotenv from "dotenv";
dotenv.config();
const { TOKEN, CLIENT_ID } = process.env;

import Client from "./utils/Client"
import { play } from "./commands/play"
import { History, Setting, Announce } from "./utils/db/schema";


// Create a new client instance
export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
}, CLIENT_ID, TOKEN);

export const subscriptions = new Map<Snowflake, MusicSubscription>();

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  c.user.setPresence({
    activities: [{ name: "/play", type: ActivityType.Listening }],
    status: "online",
  });
  History.sync().then(() => console.log("History db synced."));
  Setting.sync().then(() => console.log("Setting db synced."));
  Announce.sync().then(() => console.log("Announce db synced."));
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.collection.get(interaction.commandName);
    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }
    try {
      console.log(
        chalk.cyanBright(`[${new Date().toLocaleString()}]`)
        + " "        
        + chalk.green(interaction.member!.user.username + "#" + interaction.member!.user.discriminator)
        + " from "
        + chalk.yellow(interaction.guild!.name)
        + " used "
        + chalk.magenta(interaction.commandName + " " + interaction.options.data.map(option => `${option.name}:${option.value}`).join(" "))
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
        await interaction.reply({
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
      console.warn(error);
    }
  } else if (interaction.isStringSelectMenu()) {
    if (new Date().getTime() - interaction.message.createdTimestamp > 60000) return;
    if (interaction.customId === "#SearchSelectMenu") {
      await interaction.deferReply();
      play(interaction, `https://www.youtube.com/watch?v=${interaction.values[0]}`, false, false)
    }
  }
});

client.login(TOKEN);
