import { ErrorEmbed, SuccessEmbed } from './../utils/Embed';
import { AudioPlayerStatus } from "@discordjs/voice";
import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { subscriptions } from "..";

export default {
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Shuffle whole queue"),
  async execute(interaction: CommandInteraction) {
    if (!interaction.isCommand() || !interaction.guildId) return;
    let subscription = subscriptions.get(interaction.guildId);
    if (subscription) {
      if (subscription.audioPlayer.state.status === AudioPlayerStatus.Idle || !subscription.currentPlaying) {
        await interaction.reply({ embeds: [new ErrorEmbed(interaction, "Error", "Nothing is currently playing!")] })
      } else {
        subscription.queue.sort((a, b) => Math.random() - 0.5);
        await interaction.reply({ embeds: [new SuccessEmbed(interaction, "Sucess", "Shuffle Completed")] });
      }
    } else {
      await interaction.reply({ embeds: [new ErrorEmbed(interaction, "Error", "Not playing in this server!")] });
    }
  },
};
