import { ErrorEmbed, InfoEmbed, SuccessEmbed } from './../utils/Embed';
import { SlashCommandBuilder, PermissionsBitField, ChatInputCommandInteraction } from "discord.js";
import { client } from "../index";
import { Record, Setting } from '../utils/db/schema';
import { exec } from 'child_process';
const { MUSIC_DIR } = process.env;

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

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
    )
    .addSubcommand(
      command =>
        command
          .setName("records")
          .setDescription("Get recent records")
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
      const startUsage = process.cpuUsage();
      const now = Date.now();
      while (Date.now() - now < 500);
      console.log(process.cpuUsage(startUsage))
      await interaction.followUp({
        embeds: [
          new InfoEmbed(interaction.client.user, ":man_shrugging:  Bump!", "")
            .addFields({
              name: "Buffer",
              value: `Local music buffer folder size is ${(res as string).split("\t")[0]}`
            })
            .addFields({
              name: "Memory",
              value:
                `Heap: ${formatBytes(process.memoryUsage().heapUsed)}/${formatBytes(process.memoryUsage().heapTotal)}
                External: ${formatBytes(process.memoryUsage().external)}
                Resident Set Size: ${formatBytes(process.memoryUsage().rss)}
                Array Buffers: ${formatBytes(process.memoryUsage().arrayBuffers)}
                `
            })
        ],
        ephemeral: true
      });
    } else if (subcommand === "records") {
      const data = await Record.findAll({
        where: {
          guildId: interaction.guildId
        },
        limit: 10,
        order: [['time', 'DESC']]
      });
      const records = data.map((record, i) => `**${i + 1}**.  [${record.get("title") as string}](${record.get("url") as string})`)
      await interaction.followUp({
        embeds: [new InfoEmbed(interaction.client.user, ":page_facing_up:  Recent Records", `${records.join("\n")}`)],
        ephemeral: true
      });
    }

  },
};
