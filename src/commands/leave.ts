import { SlashCommandBuilder, CommandInteraction, GuildMember } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import { subscriptions } from "..";
import { ErrorEmbed, SuccessEmbed } from "../utils/Embed";

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
      await interaction.reply({ embeds: [new SuccessEmbed(interaction.client, "Left", "I'm right.")] });
    } else {
      await interaction.reply({ embeds: [new ErrorEmbed(interaction.client, "Error", "Not playing in this server!")] });
    }

  },
};