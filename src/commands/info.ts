import { InfoEmbed } from "./../utils/Embed";
import { SlashCommandBuilder, PermissionsBitField, ChatInputCommandInteraction } from "discord.js";
import { exec } from "child_process";
import { request } from "undici";
const { MUSIC_DIR, SERVER_IP } = process.env;

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Info of the bot status")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const res = await new Promise((resolve, reject) => {
      exec(`du --max-depth=0 -h ${MUSIC_DIR}`, (error, stdout, stderr) => {
        resolve(stdout);
      });
    });
    const quota = await request(`http://quota.nccu.edu.tw/Quota?ip=${SERVER_IP}`).then((res) => res.body.json());
    const now = Date.now();
    while (Date.now() - now < 500);
    await interaction.followUp({
      embeds: [
        new InfoEmbed(interaction.client.user, ":man_shrugging:  Bump!", "")
          .addFields({
            name: "Buffer",
            value: `Local music buffer folder size is ${(res as string).split("\t")[0]}`,
          })
          .addFields({
            name: "Memory",
            value: `Heap: ${formatBytes(process.memoryUsage().heapUsed)}/${formatBytes(process.memoryUsage().heapTotal)}
              External: ${formatBytes(process.memoryUsage().external)}
              Resident Set Size: ${formatBytes(process.memoryUsage().rss)}
              Array Buffers: ${formatBytes(process.memoryUsage().arrayBuffers)}
              `,
          })
          .addFields({
            name: "Quota",
            value: `${((quota as any).subscriber[0].outgoingBytes / 1000000000).toFixed(3)} GB`,
          })
          .addFields({
            name: "Version",
            value: require("discord.js/package.json").version,
          })
          .addFields({
            name: "Author",
            value: "[andyjjrt](https://andyjjrt.cc)",
          }),
      ],
      ephemeral: true,
    });
  },
};
