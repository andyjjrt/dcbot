import { SlashCommandBuilder, CommandInteraction, time } from "discord.js";
import { SuccessEmbed } from "../utils/Embed";

export default {
  data: new SlashCommandBuilder().setName("hypixel").setDescription("Which gives fun fact"),
  async execute(interaction: CommandInteraction) {
    const banList = [
      { name: "andyjjrt", time: new Date("2024-09-08T01:29:38.000") },
      { name: "murasakishionnnn", time: new Date("2024-08-12T14:59:45.000") },
      { name: "AdeptTea3878393", time: new Date("2023-11-03T16:35:00.000") },
      { name: "bennyjjrt", time: new Date("2023-11-03T02:40:00.000") },
      { name: "Toast_tusi", time: new Date("2023-11-25T09:05:00.000") },
    ];
    await interaction.reply({
      embeds: [
        new SuccessEmbed(
          interaction.client.user,
          "Hypixel is a good game",
          banList
            .sort((a, b) => a.time.getTime() - b.time.getTime())
            .filter((user) => user.time.getTime() > new Date().getTime())
            .map((user) => {
              return `${user.name}: ${time(user.time, "R")} (${time(user.time, "F")})`;
            })
            .join("\n")
        ),
      ],
    });
  },
};
