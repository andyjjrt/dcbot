import { SlashCommandBuilder, CommandInteraction, time } from "discord.js";
import { SuccessEmbed } from "../utils/Embed";

export default {
  data: new SlashCommandBuilder()
    .setName("hypixel")
    .setDescription("Which gives fun fact"),
  async execute(interaction: CommandInteraction) {
    await interaction.reply({
      embeds: [
        new SuccessEmbed(
          interaction.client.user,
          "Hypixel is a good game",
          `
          andyjjrt: ${time(new Date("2024-09-08T01:29:38.000"), "R")}(${time(new Date("2024-09-08T01:29:38.000"), "F")})
          watamelonnnn: ${time(new Date("2023-09-13T15:39:49.000"), "R")}(${time(new Date("2023-09-13T15:39:49.000"), "F")})
          murasakishionnnn: ${time(new Date("2024-08-12T14:59:45.000"), "R")}(${time(new Date("2024-08-12T14:59:45.000"), "F")})
          `
        ),
      ],
    });
  },
};
