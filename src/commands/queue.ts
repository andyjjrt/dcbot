import { ErrorEmbed, SuccessEmbed } from './../utils/Embed';
import { AudioPlayerStatus, AudioResource } from "@discordjs/voice";
import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { subscriptions } from "..";
import { Track } from "../utils/Track";

export default {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Get current queue"),
  async execute(interaction: CommandInteraction) {
    if (!interaction.isCommand() || !interaction.guildId) return;
    let subscription = subscriptions.get(interaction.guildId);
    if (subscription) {
      if (subscription.audioPlayer.state.status === AudioPlayerStatus.Idle || !subscription.currentPlaying) {
        await interaction.reply({ embeds: [new ErrorEmbed(interaction, "Error", "Nothing is currently playing!")] })
      } else {
        const { title, url, thumbnail } = subscription.currentPlaying
        const current = `[${title}](${url})`;
        const queue = subscription.queue
          .slice(0, 10)
          .map((track, index) => `**${index + 1}.** [${track.title}](${track.url})`)
          .join('\n');

        await interaction.reply({
          embeds: [
            new SuccessEmbed(interaction, "Current Playing", `**Playing:**\n${current}\n\n**Queue: **\n${queue}`)
              .setThumbnail(thumbnail)
              .addFields(
                { name: 'Loop', value: subscription.loop , inline: true },
              )
          ]
        })
      }
    } else {
      await interaction.reply({ embeds: [new ErrorEmbed(interaction, "Error", "Not playing in this server!")] });
    }
  },
};
