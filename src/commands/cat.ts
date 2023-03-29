import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { CatEmbed } from "../utils/Embed";

export default {
  data: new SlashCommandBuilder()
    .setName("cat")
    .setDescription("Sends a random cat"),
  async execute(interaction: CommandInteraction) {
    await interaction.reply({embeds: [new CatEmbed(interaction.client, `https://cataas.com/cat?t=${new Date().getTime()}`)]});
  },
};
