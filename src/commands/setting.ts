import { ErrorEmbed, InfoEmbed, SuccessEmbed } from './../utils/Embed';
import { SlashCommandBuilder, PermissionsBitField, ChatInputCommandInteraction } from "discord.js";
import { client } from "../index";
import { Setting } from '../utils/db/schema';
import { exec } from 'child_process';
const { MUSIC_DIR } = process.env;

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
    )
    .addSubcommand(
      command =>
        command
          .setName("refresh")
          .setDescription("Refresh commands")
    )
    .addSubcommand(
      command =>
        command
          .setName("buffer")
          .setDescription("Get current buffer")
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand(true);
    await interaction.deferReply({ ephemeral: true });
    const isAdmin = (interaction.member!.permissions as PermissionsBitField).has(PermissionsBitField.Flags.Administrator);
    if (!isAdmin) {
      await interaction.followUp({ embeds: [new ErrorEmbed(interaction.client.user, "Error", "You don't have permission to do so.")], ephemeral: true });
      return;
    }
    if (subcommand === "ytkey") {
      const guildId = interaction.guildId || "";
      const key = interaction.options.get("key", true).value as string;
      await Setting.upsert({
        guildId: guildId,
        ytKey: key,
      });
      await interaction.followUp({ embeds: [new SuccessEmbed(interaction.client.user, "Success", `ytKet changed to || \`${key}\` ||`)], ephemeral: true });
    } else if (subcommand === "refresh") {
      const commands = await client.refreshCommands();
      await interaction.followUp({ embeds: [new SuccessEmbed(interaction.client.user, "Success", `${commands} commands refreshed`)], ephemeral: true });
    } else if (subcommand === "buffer") {
      const res = await new Promise((resolve, reject) => {
        exec(`du --max-depth=0 -h ${MUSIC_DIR}`, (error, stdout, stderr) => {
          resolve(stdout);
        });
      });
      await interaction.followUp({
        embeds: [new InfoEmbed(interaction.client.user, ":man_shrugging:  Bump!", `Local music buffer folder size is ${(res as string).split("\t")[0]}`)],
        ephemeral: true
      });
    }

  },
};
