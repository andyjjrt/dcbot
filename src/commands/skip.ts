import { AudioPlayerStatus, AudioResource } from "@discordjs/voice";
import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { subscriptions } from "..";
import { ErrorEmbed, SuccessEmbed } from "../utils/Embed";
import { Track } from "../utils/Track";

export default {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip current song"),
  async execute(interaction: CommandInteraction) {
    if (!interaction.isCommand() || !interaction.guildId) return;
    let subscription = subscriptions.get(interaction.guildId);
    if (subscription) {
      subscription.skipFlag = true;
      subscription.audioPlayer.stop();
      await interaction.reply({ embeds: [new SuccessEmbed(interaction.client, "Sucess", "Skipped current song")] });
    } else {
      await interaction.reply({ embeds: [new ErrorEmbed(interaction.client, "Error", "Not playing in this server!")] });
    }
  },
};
