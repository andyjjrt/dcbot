import { InfoEmbed } from './../utils/Embed';
import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { client } from "../index";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  async execute(interaction: CommandInteraction) {
    await interaction.reply({ embeds: [new InfoEmbed(interaction.client, ":ping_pong:  Pong", `Ball flew back in ${client.ws.ping}ms`)] });
  },
};
