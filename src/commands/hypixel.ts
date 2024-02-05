import { SlashCommandBuilder, CommandInteraction, time } from "discord.js";
import { SuccessEmbed } from "../utils/Embed";

export default {
  data: new SlashCommandBuilder().setName("hypixel").setDescription("Which gives fun fact"),
  async execute(interaction: CommandInteraction) {
    const banList = [
      { name: "andyjjrt", time: new Date("2024-09-08T01:29:38.000") },
      { name: "murasakishionnnn", time: new Date("2024-08-12T14:59:45.000") },
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
