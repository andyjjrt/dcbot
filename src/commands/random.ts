import { InfoEmbed } from "./../utils/Embed";
import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { client, subscriptions } from "../index";

export default {
  data: new SlashCommandBuilder()
    .setName("random")
    .setDescription("generate random number"),
  async execute(interaction: CommandInteraction) {
    let subscription = subscriptions.get(interaction.guildId!);
    await interaction.reply({
      embeds: [
        new InfoEmbed(
          interaction.client.user,
          `:ping_pong:  ${
            subscription?.voiceConnection.ping.ws ? "Voice" : "API"
          } Pong`,
          `Ball flew back in ${
            subscription?.voiceConnection.ping.ws || client.ws.ping
          }ms`
        ),
      ],
    });
  },
};
