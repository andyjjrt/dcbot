import { AudioPlayerStatus, AudioResource } from "@discordjs/voice";
import { SlashCommandBuilder, CommandInteraction, GuildMember } from "discord.js";
import { subscriptions } from "..";
import { ErrorEmbed, SuccessEmbed } from "../utils/Embed";
import { Track } from "../utils/Track";

export default {
  data: new SlashCommandBuilder().setName("skip").setDescription("Skip current song"),
  async execute(interaction: CommandInteraction) {
    if (!interaction.isCommand() || !interaction.guildId) return;
    let subscription = subscriptions.get(interaction.guildId);
    if (subscription) {
      if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
        if (subscription.voiceConnection.joinConfig.channelId === interaction.member.voice.channelId) {
          subscription.skipFlag = true;
          subscription.audioPlayer.stop();
          await interaction.reply({
            embeds: [new SuccessEmbed(interaction.client.user, "Sucess", "Skipped current song")],
          });
        } else {
          await interaction.reply({
            embeds: [
              new ErrorEmbed(interaction.client.user, "Error", "You're not in the same voice channel with bot!"),
            ],
          });
        }
      } else {
        await interaction.reply({
          embeds: [new ErrorEmbed(interaction.client.user, "Error", "You're not in a voice channel!")],
        });
      }
    } else {
      await interaction.reply({
        embeds: [new ErrorEmbed(interaction.client.user, "Error", "Not playing in this server!")],
      });
    }
  },
};
