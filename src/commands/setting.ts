import { ErrorEmbed, SuccessEmbed } from './../utils/Embed';
import { SlashCommandBuilder, PermissionsBitField, ChatInputCommandInteraction } from "discord.js";
import { client } from "../index";
import { Setting } from '../utils/db/schema';

export default {
  data: new SlashCommandBuilder()
    .setName("setting")
    .setDescription("Setting of this bot")
    .addSubcommand(
      command =>
        command
          .setName("ytkey")
          .setDescription("Set Youtube API key")
          .addStringOption(option =>
            option.setName("key").setDescription("Key").setRequired(true)
          )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand(true);
    await interaction.deferReply({ ephemeral: true });
    if (subcommand === "ytkey") {
      const isAdmin = (interaction.member!.permissions as PermissionsBitField).has(PermissionsBitField.Flags.Administrator);
      if (!isAdmin) {
        await interaction.followUp({ embeds: [new ErrorEmbed(interaction.client, "Error", "You don't have permission to do so.")], ephemeral: true });
        return;
      }
      const guildId = interaction.guildId || "";
      const key = interaction.options.get("key", true).value as string;
      await Setting.upsert({
        guildId: guildId,
        ytKey: key,
      });
      await interaction.followUp({ embeds: [new SuccessEmbed(interaction.client, "Success", `ytKet changed to || \`${key}\` ||`)], ephemeral: true });
    }

  },
};
