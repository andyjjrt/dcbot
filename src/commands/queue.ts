import { ErrorEmbed, SuccessEmbed, InfoEmbed } from './../utils/Embed';
import { AudioPlayerStatus } from "@discordjs/voice";
import {
  SlashCommandBuilder,
  CommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  ChatInputCommandInteraction
} from "discord.js";
import { subscriptions, client } from "..";

export default {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Get current queue"),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isCommand() || !interaction.guildId) return;
    let subscription = subscriptions.get(interaction.guildId);
    if (subscription) {
      if (subscription.audioPlayer.state.status === AudioPlayerStatus.Idle || !subscription.currentPlaying) {
        await interaction.reply({ embeds: [new ErrorEmbed(interaction.client.user, "Error", "Nothing is currently playing!")] })
      } else {
        const { title, url, thumbnail, startTime, endTime } = subscription.currentPlaying
        const current = `**Playing:**\n[${title}](${url})`;
        const queue = subscription.queue.length === 0 ? "" : "**Next: **\n" + subscription.queue
          .slice(0, 10)
          .map((track, index) => `**${index + 1}. ** [${track.title}](${track.url})`)
          .join('\n');
        const remain = subscription.queue.length > 10 ? `\n\n... and **${subscription.queue.length - 10}** more songs` : ""
        const timeString = () => {
          const now = new Date().getTime();
          const estimate =  Math.floor((endTime - startTime) / 1000);
          const played = Math.floor((now - startTime) / 1000);
          return `${(played / 60) < 10 ? "0" : ""}${Math.floor(played / 60)}:${(played % 60) < 10 ? "0" : ""}${played % 60} / ${(estimate / 60) < 10 ? "0" : ""}${Math.floor(estimate / 60)}:${(estimate % 60) < 10 ? "0" : ""}${estimate % 60}`
        }
        await interaction.reply({
          embeds: [
            new InfoEmbed(interaction.client.user, ":arrow_forward:  Queue", `${current}\n\n:clock10:  \`${timeString()}\`\n\n${queue}${remain}`)
              .setThumbnail(thumbnail)
              .addFields(
                { name: 'Loop', value: subscription.loop, inline: true },
              )
          ],
        })
      }
    } else {
      await interaction.reply({ embeds: [new ErrorEmbed(interaction.client.user, "Error", "Not playing in this server!")] });
    }
  },
};
