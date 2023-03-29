import { SuccessEmbed, PlayingEmbed, PendingEmbed } from './../utils/Embed';
import { CommandInteraction, SlashCommandBuilder, GuildMember } from "discord.js";
import {
  joinVoiceChannel,
  entersState,
  VoiceConnectionStatus
} from "@discordjs/voice";
import { Track } from "../utils/Track";
import { MusicSubscription } from "../utils/Subscription"
import { subscriptions } from '../index';
import { ErrorEmbed } from "../utils/Embed";

export default {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song from youtube")
    .addStringOption(option =>
      option.setName("url").setDescription("YT link").setRequired(true)
    )
    .addBooleanOption(option =>
      option.setName("top").setDescription("Force play top")
    )
    .addBooleanOption(option =>
      option.setName("shuffle").setDescription("Shuffle list when queue")
    ),
  async execute(interaction: CommandInteraction) {
    await interaction.deferReply();
    let subscription = subscriptions.get(interaction.guildId || "");
    const url = interaction.options.get("url", true).value as string;
    const shuffle = interaction.options.get("shuffle")?.value ? true : false;
    const top = interaction.options.get("top")?.value ? true : false;
    if (!subscription) {
      if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
        const channel = interaction.member.voice.channel;
        subscription = new MusicSubscription(
          joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
          }),
        );
        subscription.voiceConnection.on('error', console.warn);
        subscriptions.set(interaction.guildId || "", subscription);
      }
    }

    // If there is no subscription, tell the user they need to join a channel.
    if (!subscription) {
      await interaction.followUp({ embeds: [new ErrorEmbed(interaction, "Error", "Join a voice channel and then try that again!")] });
      return;
    }

    // Make sure the connection is ready before processing the user's request
    try {
      await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20e3);
    } catch (error) {
      console.warn(error);
      await interaction.followUp({ embeds: [new ErrorEmbed(interaction, "Error", "Failed to join voice channel within 20 seconds, please try again later!")] });
      return;
    }

    try {
      // Attempt to create a Track from the user's video URL
      await interaction.editReply({ embeds: [new PendingEmbed(interaction, "")] }).catch(console.warn);
      const list = await Track.from(url, {
        onStart(url, title, thumbnail) {
          interaction.followUp({ embeds: [new PlayingEmbed(interaction, title, url).setThumbnail(thumbnail)] }).catch(console.warn);
        },
        onError(error) {
          console.warn(error);
          interaction.followUp({ embeds: [new ErrorEmbed(interaction, "Error", error.message)] }).catch(console.warn);
        },
      }, interaction);
      // Enqueue the track and reply a success message to the user
      if (shuffle) list.tracks.sort((a, b) => Math.random() - 0.5);
      if (top) {
        if (subscription.currentPlaying) subscription.prependQueue([subscription.currentPlaying]);
        if (subscription) subscription.prependQueue(list.tracks);
        subscription.audioPlayer.stop(true);
      } else {
        list.tracks.forEach(track => {
          if (subscription) subscription.enqueue(track);
        })
      }
      await interaction.editReply({ embeds: [new SuccessEmbed(interaction, "Success", `Enqueued **[${list.title}](${list.url})**`).setThumbnail(list.thumbnail)] });
    } catch (error) {
      console.warn(error);
      await interaction.editReply({ embeds: [new ErrorEmbed(interaction, "Error", "Failed to play track, please try again later!\n\n" + error)] });
    }
  },
};
