// Require the necessary discord.js classes
import { ActivityType, CommandInteraction, Events, GatewayIntentBits, Snowflake } from "discord.js";
import Client from "./utils/Client"
import { MusicSubscription } from "./utils/Subscription"
import * as dotenv from "dotenv";
dotenv.config();
const { TOKEN, CLIENT_ID } = process.env;

import { play } from "./commands/play"

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
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.collection.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
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
});


client.on(Events.InteractionCreate, interaction => {
  if (!interaction.isButton()) return;
  console.log(interaction);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isStringSelectMenu()) return;
  if (new Date().getTime() - interaction.message.createdTimestamp > 60000) return;
  if (interaction.customId === "#SearchSelectMenu") {
    await interaction.deferReply();
    play(interaction, `https://www.youtube.com/watch?v=${interaction.values[0]}`, false, false)
  }
});

client.login(TOKEN);
