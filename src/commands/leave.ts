import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { subscriptions } from "..";
import { ErrorEmbed, InfoEmbed } from "../utils/Embed";

export default {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Force bot to leave"),
  async execute(interaction: CommandInteraction) {
    if (!interaction.isCommand() || !interaction.guildId) return;
    let subscription = subscriptions.get(interaction.guildId);
    if (subscription) {
      subscription.voiceConnection.destroy();
      subscriptions.delete(interaction.guildId);
      await interaction.reply({ embeds: [new InfoEmbed(interaction.client, ":wave:  Left",  "I'm right.")] });
    } else {
      await interaction.reply({ embeds: [new ErrorEmbed(interaction.client, "Error", "Not playing in this server!")] });
    }

  },
};