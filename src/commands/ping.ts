import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { client } from "../index";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  async execute(interaction: CommandInteraction) {
    await interaction.reply(`Pong with ${client.ws.ping}ms`);
  },
};
