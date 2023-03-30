import { SuccessEmbed } from './../utils/Embed';
import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { client } from "../index";
import { Setting } from '../utils/db/schema';

export default {
  data: new SlashCommandBuilder()
    .setName("setting")
    .setDescription("Setting of this bot")
    .addStringOption(option =>
      option.setName("ytkey").setDescription("Youtube API Key").setRequired(true)
    ),
  async execute(interaction: CommandInteraction) {
    await interaction.deferReply({ephemeral: true});
    const guildId = interaction.guildId || "";
    const ytKey = interaction.options.get("ytkey", true).value as string;
    await Setting.upsert({
      guildId: guildId,
      ytKey: ytKey,
    });
    await interaction.followUp({ embeds: [new SuccessEmbed(interaction.client, "Success", `ytKet changed to \`${ytKey}\``)], ephemeral: true });
  },
};
