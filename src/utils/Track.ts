/*

Copyright 2023 andyjjrt

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

NOTICE: THIS FILE HAS BEEN MODIFIED BY andyjjrt UNDER COMPLIANCE
WITH THE APACHE 2.0 LICENCE FROM THE ORIGINAL WORK OF Amish Shah.
THE FOLLOWING IS THE COPYRIGHT OF THE ORIGINAL REPOSITORY:

Copyright 2020-2022 Amish Shah

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/

import fs, { createReadStream } from "fs";
import { createAudioResource, StreamType } from "@discordjs/voice";
import { APIUser, ChatInputCommandInteraction, MessageComponentInteraction, MessageContextMenuCommandInteraction, User } from "discord.js";
import { InfoEmbed } from "./Embed";
import { getVideoDurationInSeconds } from "get-video-duration";
import { getPlayListMetaData, getPlayListUrl, getTrackMetaData, getTrackUrl } from "./SpotifyDown";
import YTDlpWrap from "yt-dlp-wrap";
import { v4 as uuidv4 } from "uuid";
const { MUSIC_DIR } = process.env;
import { TrackInterface, TrackMetadata } from "types/Track";
/**
 * A Track represents information about a YouTube video (in this context) that can be added to a queue.
 * It contains the title and URL of the video, as well as functions onStart, onFinish, onError, that act
 * as callbacks that are triggered at certain points during the track's lifecycle.
 *
 * Rather than creating an AudioResource for each video immediately and then keeping those in a queue,
 * we use tracks as they don't pre-emptively load the videos. Instead, once a Track is taken from the
 * queue, it is converted into an AudioResource just in time for playback.
 */
export class Track implements TrackInterface {
  public readonly metadata: TrackMetadata = { url: "", title: "", thumbnail: "", id: uuidv4(), ytId: "" };
  public readonly user: User | APIUser;
  public startTime: number;
  public endTime: number;
  public readonly onStart: (metaData: TrackMetadata) => void;
  public readonly onError: (error: Error) => void;

  private constructor({
    metadata,
    user,
    onStart,
    onError,
  }: {
    metadata: TrackMetadata;
    user: User | APIUser;
    onStart: (metaData: TrackMetadata) => void;
    onError: (error: Error) => void;
  }) {
    this.metadata = metadata;
    this.user = user;
    this.onStart = onStart;
    this.onError = onError;
    this.startTime = new Date().getTime();
    this.endTime = new Date().getTime();
  }

  public async createAudioResource() {
    if (!fs.existsSync(`${MUSIC_DIR}/${this.metadata.ytId}.webm`)) {
      const ytDlpWrap = new YTDlpWrap();
      await ytDlpWrap
        .execPromise([
          `https://www.youtube.com/watch?v=${this.metadata.ytId}`,
          "-o",
          `${MUSIC_DIR}/%(id)s.%(ext)s`,
          "--format",
          "bestaudio",
          "--quiet",
          "--file-access-retries",
          "1",
        ])
        .catch((e) => {
          throw new Error(e.message.split("Stderr:\n")[1]);
        });
    }
    const duration = await getVideoDurationInSeconds(createReadStream(`${MUSIC_DIR}/${this.metadata.ytId}.webm`));
    this.startTime = new Date().getTime();
    this.endTime = new Date().getTime() + duration * 1000;
    return createAudioResource(createReadStream(`${MUSIC_DIR}/${this.metadata.ytId}.webm`), {
      metadata: this,
      inputType: StreamType.WebmOpus,
    });
  }

  /**
   * Creates a Track from a video URL and lifecycle callback methods.
   *
   * @param url The URL of the video
   * @param methods Lifecycle callbacks
   *
   * @returns The created Track
   */
  public static async from(
    url: string,
    methods: Pick<Track, "onStart" | "onError">,
    interaction: ChatInputCommandInteraction | MessageComponentInteraction | MessageContextMenuCommandInteraction
  ): Promise<{
    title: string;
    url: string;
    thumbnail: string;
    tracks: Track[];
  }> {
    const defaultHandler = {
      onStart(metaData: TrackMetadata) {
        methods.onStart(metaData);
      },
      onError(error: Error) {
        methods.onError(error);
      },
    };

    await interaction.editReply({
      embeds: [new InfoEmbed(interaction.client.user, ":inbox_tray: Processing", "Fetching data")],
    });

    const urlObj = new URL(url);
    const path = urlObj.pathname.slice(1).split("/");
    let musicUrl: undefined | string = undefined;
    if (urlObj.hostname === "open.spotify.com") {
      if (path.includes("track")) {
        return this.spotifyTrack(url, interaction.member!.user, defaultHandler);
      } else if (path.includes("playlist") || path.includes("album")) {
        return this.spotifyList(url, interaction.member!.user, defaultHandler);
      }
    } else if (
      urlObj.hostname === "www.youtube.com" ||
      urlObj.hostname === "youtube.com" ||
      urlObj.hostname === "music.youtube.com"
    ) {
      if (path.includes("playlist")) {
        const id = urlObj.searchParams.get("list");
        musicUrl = `https://youtube.com/playlist?list=${id}`;
      } else if (path.includes("watch")) {
        const id = urlObj.searchParams.get("v");
        musicUrl = `https://www.youtube.com/watch?v=${id}`;
      }
    } else if (urlObj.hostname === "youtu.be") {
      if (path.length === 1) {
        musicUrl = `https://www.youtube.com/watch?v=${path[0]}`;
      }
    }

    if (musicUrl === undefined) {
      throw new Error("Invalid music url. Please check your input.");
    }

    // Get metadata
    const ytDlpWrap = new YTDlpWrap();
    let stdout = await ytDlpWrap
      .execPromise(["--dump-single-json", "--no-abort-on-error", "--flat-playlist", musicUrl])
      .catch((e) => {
        throw new Error(e.message.split("Stderr:\n")[1]);
      });
    let metadata = JSON.parse(stdout);
    let title = metadata.title;
    let thumbnail = metadata.thumbnails[0].url;
    if (!(metadata.entries instanceof Array)) {
      metadata = [metadata];
    } else {
      metadata = metadata.entries;
    }

    await interaction.editReply({
      embeds: [new InfoEmbed(interaction.client.user, ":inbox_tray: Processing", "Resolving data")],
    });

    // Make track list
    const tracks = metadata.map((track: any) => {
      return new Track({
        metadata: {
          title: track.title,
          thumbnail: track.thumbnails[0].url,
          url: track.url || track.original_url,
          channel: track.channel,
          channelUrl: track.channel_url,
          id: uuidv4(),
          ytId: track.id,
        },
        user: interaction.member!.user,
        ...defaultHandler,
      });
    });

    return {
      title: title,
      url: musicUrl,
      thumbnail: thumbnail,
      tracks: tracks,
    };
  }

  private static async spotifyTrack(
    url: string,
    user: User | APIUser,
    handler: {
      onStart(metaData: TrackMetadata): void;
      onError(error: Error): void;
    }
  ) {
    const urlObj = new URL(url);
    const path = urlObj.pathname.split("/");
    const id = path.slice(-1)[0];
    const ytId = await getTrackUrl(id);
    const metaData = await getTrackMetaData(id);

    return {
      tracks: [
        new Track({
          metadata: {
            title: metaData.title,
            thumbnail: metaData.cover,
            url: `https://open.spotify.com/track/${id}`,
            channel: metaData.artists,
            id: uuidv4(),
            ytId: ytId,
          },
          user: user,
          ...handler,
        }),
      ],
      url: url,
      thumbnail: metaData.cover,
      title: metaData.title,
    };
  }

  private static async spotifyList(
    url: string,
    user: User | APIUser,
    handler: {
      onStart(metaData: TrackMetadata): void;
      onError(error: Error): void;
    }
  ) {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const trackIdList = await getPlayListUrl(path);
    const metaData = await getPlayListMetaData(path);

    const tracks = await new Promise((resolve, reject) => {
      resolve(
        Promise.all<Track>(
          trackIdList.map(async (track: any) => {
            const ytId = await getTrackUrl(track.id);
            const metaData = await getTrackMetaData(track.id);
            return new Track({
              metadata: {
                title: metaData.title,
                thumbnail: metaData.cover,
                url: `https://open.spotify.com/track/${track.id}`,
                channel: metaData.artists,
                id: uuidv4(),
                ytId: ytId,
              },
              user: user,
              ...handler,
            });
          })
        )
      );
    });

    return {
      tracks: tracks as Track[],
      url: url,
      thumbnail: metaData.cover,
      title: metaData.title,
    };
  }
}
