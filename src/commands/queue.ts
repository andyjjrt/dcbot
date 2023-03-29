import { ErrorEmbed, SuccessEmbed, InfoEmbed } from './../utils/Embed';
import { AudioPlayerStatus } from "@discordjs/voice";
import {
  SlashCommandBuilder,
  CommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} from "discord.js";
import { subscriptions, client } from "..";

export default {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Get current queue"),
  async execute(interaction: CommandInteraction) {
    if (!interaction.isCommand() || !interaction.guildId) return;
    let subscription = subscriptions.get(interaction.guildId);
    if (subscription) {
      if (subscription.audioPlayer.state.status === AudioPlayerStatus.Idle || !subscription.currentPlaying) {
        await interaction.reply({ embeds: [new ErrorEmbed(interaction.client, "Error", "Nothing is currently playing!")] })
      } else {
        const { title, url, thumbnail } = subscription.currentPlaying
        const current = `[${title}](${url})`;
        const queue = subscription.queue
          .slice(0, 10)
          .map((track, index) => `**${index + 1}. ** [${track.title}](${track.url})`)
          .join('\n');
        const remain = subscription.queue.length > 10 ? `\n\n... and **${subscription.queue.length - 10}** more songs` : ""

        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('primary')
              .setLabel('Click me!')
              .setStyle(ButtonStyle.Primary),
          );

        await interaction.reply({
          embeds: [
            new InfoEmbed(interaction.client, "Current Playing", `**Playing:**\n${current}\n\n**Queue: **\n${queue}${remain}`)
              .setThumbnail(thumbnail)
              .addFields(
                { name: 'Loop', value: subscription.loop, inline: true },
              )
          ],
          components: [row]
        })
      }
    } else {
      await interaction.reply({ embeds: [new ErrorEmbed(interaction.client, "Error", "Not playing in this server!")] });
    }
  },
};
