import { ErrorEmbed, SuccessEmbed } from './../utils/Embed';
import { AudioPlayerStatus } from "@discordjs/voice";
import { SlashCommandBuilder, CommandInteraction, GuildMember } from "discord.js";
import { subscriptions } from "..";

export default {
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Shuffle current queue"),
  async execute(interaction: CommandInteraction) {
    if (!interaction.isCommand() || !interaction.guildId) return;
    let subscription = subscriptions.get(interaction.guildId);
    if (subscription) {
      if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
        if (subscription.voiceConnection.joinConfig.channelId === interaction.member.voice.channelId) {
          if (subscription.audioPlayer.state.status === AudioPlayerStatus.Idle || !subscription.currentPlaying) {
            await interaction.reply({ embeds: [new ErrorEmbed(interaction.client, "Error", "Nothing is currently playing!")] })
          } else {
            subscription.queue.sort((a, b) => Math.random() - 0.5);
            await interaction.reply({ embeds: [new SuccessEmbed(interaction.client, "Sucess", "Shuffle Completed")] });
          }
        } else {
          await interaction.reply({ embeds: [new ErrorEmbed(interaction.client, "Error", "You're not in the same voice channel with bot!")] });
        }
      } else {
        await interaction.reply({ embeds: [new ErrorEmbed(interaction.client, "Error", "You're not in a voice channel!")] });
      }
    } else {
      await interaction.reply({ embeds: [new ErrorEmbed(interaction.client, "Error", "Not playing in this server!")] });
    }

  },
};
