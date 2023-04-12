import { SuccessEmbed, PlayingEmbed, InfoEmbed } from "./../utils/Embed";
import {
  SlashCommandBuilder,
  GuildMember,
  TextChannel,
  ChatInputCommandInteraction,
  MessageComponentInteraction,
  AutocompleteInteraction,
  GuildTextThreadManager,
  Role,
} from "discord.js";
import {
  joinVoiceChannel,
  entersState,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { Track } from "../utils/Track";
import { MusicSubscription } from "../utils/Subscription";
import { subscriptions, client } from "../index";
import { ErrorEmbed } from "../utils/Embed";
import { History } from "../utils/db/schema";

export default {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play song(s) from Youtube")
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("Youtube link")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addBooleanOption((option) =>
      option.setName("top").setDescription("Force play top")
    )
    .addBooleanOption((option) =>
      option.setName("shuffle").setDescription("Shuffle list before queue")
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const url = interaction.options.get("url", true).value as string;
    const shuffle = interaction.options.get("shuffle")?.value ? true : false;
    const top = interaction.options.get("top")?.value ? true : false;
    await play(interaction, url, shuffle, top);
  },
  async autocomplete(interaction: AutocompleteInteraction) {
    const userId = interaction.member!.user.id;
    const history = await History.findAll({
      where: { userId: userId },
      limit: 10,
      order: [["time", "DESC"]],
    });
    const focusedValue = interaction.options.getFocused();
    const choices = history.map((his) => ({
      title: his.get("title") as string,
      url: his.get("url") as string,
      time: new Date(his.get("time") as string).getTime(),
      list: his.get("list") as boolean,
    }));
    const filtered = choices.filter((choice) =>
      choice.title.startsWith(focusedValue)
    );
    await interaction.respond(
      filtered.map((choice) => ({
        name: `${choice.list ? "🎶" : "🎵"} ${choice.title}`,
        value: choice.url,
      }))
    );
  },
};

/**
 * Play a track
 *
 * @param interaction interaction instance
 * @param url The URL of the video
 * @param shuffle Shuffle or not
 * @param top Force play top
 *
 */
export const play = async (
  interaction: ChatInputCommandInteraction | MessageComponentInteraction,
  url: string,
  shuffle: boolean,
  top: boolean
) => {
  let subscription = subscriptions.get(interaction.guildId || "");
  const commandChannel = interaction.channel;
  if (!(commandChannel instanceof TextChannel)) {
    await interaction.followUp({
      embeds: [
        new ErrorEmbed(
          interaction.client.user,
          "Error",
          "Please use this command in a **Text Channel**"
        ),
      ],
    });
    return;
  }
  if (!subscription) {
    if (
      interaction.member instanceof GuildMember &&
      interaction.member.voice.channel
    ) {
      const channel = interaction.member.voice.channel;
      subscription = new MusicSubscription(
        joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guild.id,
          adapterCreator: channel.guild.voiceAdapterCreator,
        }),
        commandChannel
      );
      subscription.voiceConnection.on("error", console.error);
      subscriptions.set(interaction.guildId || "", subscription);
    }
  }

  // If there is no subscription, tell the user they need to join a channel.
  if (!subscription) {
    await interaction.followUp({
      embeds: [
        new ErrorEmbed(
          interaction.client.user,
          "Error",
          "Join a voice channel and then try that again!"
        ),
      ],
    });
    return;
  }

  // Make sure the connection is ready before processing the user's request
  try {
    await entersState(
      subscription.voiceConnection,
      VoiceConnectionStatus.Ready,
      20e3
    );
  } catch (error) {
    console.error(error);
    await interaction.followUp({
      embeds: [
        new ErrorEmbed(
          interaction.client.user,
          "Error",
          "Failed to join voice channel within 20 seconds, please try again later!"
        ),
      ],
    });
    return;
  }

  try {
    // Attempt to create a Track from the user's video URL
    await interaction
      .editReply({
        embeds: [
          new InfoEmbed(interaction.client.user, ":inbox_tray: Processing", ""),
        ],
      })
      .catch(console.error);
    const list = await Track.from(
      url,
      {
        onStart(url, title, thumbnail) {
          subscription!.logChannel?.send({
            embeds: [
              new PlayingEmbed(
                interaction.member!.user,
                title,
                url
              ).setThumbnail(thumbnail),
            ],
          });
        },
        onError(error) {
          console.error(error);
          subscription!.logChannel?.send({
            embeds: [
              new ErrorEmbed(interaction.client.user, "Error", error.message),
            ],
          });
        },
      },
      interaction
    );
    // Enqueue the track and reply a success message to the user
    if (shuffle) list.tracks.sort((a, b) => Math.random() - 0.5);
    if (top) {
      if (subscription) subscription.prependQueue(list.tracks);
    } else {
      list.tracks.forEach((track) => {
        if (subscription) subscription.enqueue(track);
      });
    }
    if (
      list.title === "" ||
      list.url === "" ||
      list.thumbnail === "" ||
      list.tracks.length == 0
    )
      throw new Error();
    subscription.logChannel?.members.add(
      interaction.member!.user.id,
      `${interaction.member!.user.id} queued ${list.title}`
    );
    await History.upsert({
      userId: interaction.member!.user.id,
      title: list.title,
      url: list.url,
      time: new Date(),
      list: list.tracks.length > 1,
    });
    await interaction.editReply({
      embeds: [
        new SuccessEmbed(
          interaction.member!.user,
          "Success",
          `Enqueued **[${list.title}](${list.url})**`
        ).setThumbnail(list.thumbnail),
      ],
    });
  } catch (error) {
    console.error(error);
    await interaction.editReply({
      embeds: [
        new ErrorEmbed(
          interaction.client.user,
          "Error",
          "Failed to play track, please try again later!\n\n" + error
        ),
      ],
    });
  }
};
