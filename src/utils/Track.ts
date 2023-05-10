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

import ytdlCore from "ytdl-core";
import { exec } from "child_process";
import fs, { createReadStream } from "fs";
import { createAudioResource, StreamType } from "@discordjs/voice";
import {
  APIUser,
  ChatInputCommandInteraction,
  MessageComponentInteraction,
  User,
} from "discord.js";
import { InfoEmbed } from "./Embed";
import { setInterval } from "timers/promises";
import { client } from "..";
import { getVideoDurationInSeconds } from "get-video-duration";
const { MUSIC_DIR } = process.env;

/**
 * This is the data required to create a Track object.
 */
export interface TrackData {
  url: string;
  title: string;
  thumbnail: string;
  filePath: string;
  user: User | APIUser;
  startTime: number;
  endTime: number;
  onStart: (url: string, title: string, thumbnail: string) => void;
  onError: (error: Error) => void;
}

const noop = () => {};

/**
 * A Track represents information about a YouTube video (in this context) that can be added to a queue.
 * It contains the title and URL of the video, as well as functions onStart, onFinish, onError, that act
 * as callbacks that are triggered at certain points during the track's lifecycle.
 *
 * Rather than creating an AudioResource for each video immediately and then keeping those in a queue,
 * we use tracks as they don't pre-emptively load the videos. Instead, once a Track is taken from the
 * queue, it is converted into an AudioResource just in time for playback.
 */
export class Track implements TrackData {
  public readonly url: string;
  public readonly title: string;
  public readonly thumbnail: string;
  public readonly filePath: string;
  public readonly user: User | APIUser;
  public startTime: number;
  public endTime: number;
  public readonly onStart: (
    url: string,
    title: string,
    thumbnail: string
  ) => void;
  public readonly onError: (error: Error) => void;

  private constructor({
    url,
    title,
    thumbnail,
    filePath,
    onStart,
    onError,
    user,
  }: {
    url: string;
    title: string;
    thumbnail: string;
    filePath: string;
    user: User | APIUser;
    onStart: (url: string, title: string, thumbnail: string) => void;
    onError: (error: Error) => void;
  }) {
    this.url = url;
    this.title = title;
    this.thumbnail = thumbnail;
    this.filePath = filePath;
    this.user = user;
    this.onStart = onStart;
    this.onError = onError;
    this.startTime = new Date().getTime();
    this.endTime = new Date().getTime();
  }

  public async createAudioResource() {
    if (!fs.existsSync(this.filePath)) {
      await new Promise((resolve, reject) => {
        exec(
          `yt-dlp -o "${MUSIC_DIR}/%(id)s.%(ext)s" --format "bestaudio" --quiet --file-access-retries 1 ${this.url}`,
          (error, stdout, stderr) => {
            if (error) {
              console.error(error);
            }
            resolve(stdout);
          }
        );
      });
    }
    const duration = await getVideoDurationInSeconds(
      createReadStream(this.filePath)
    );
    this.startTime = new Date().getTime();
    this.endTime = new Date().getTime() + duration * 1000;
    return createAudioResource(createReadStream(this.filePath), {
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
    interaction: ChatInputCommandInteraction | MessageComponentInteraction
  ): Promise<{
    title: string;
    url: string;
    thumbnail: string;
    user: User | APIUser;
    tracks: Track[];
  }> {
    const defaultHandler = {
      onStart(url: string, title: string, thumbnail: string) {
        methods.onStart(url, title, thumbnail);
      },
      onError(error: Error) {
        methods.onError(error);
      },
    };

    try {
      await interaction
        .editReply({
          embeds: [
            new InfoEmbed(
              interaction.client.user,
              ":inbox_tray: Processing",
              "Fetching data"
            ),
          ],
        })
        .catch(console.error);

      let _url = url;
      if (url.match("https://open.spotify.com/track/")) {
        const id = url
          .split("https://open.spotify.com/track/")[1]
          .split("?")[0];
        const response = await fetch(
          `https://api.spotifydown.com/getId/${id}`,
          {
            headers: {
              authority: "api.spotifydown.com",
              origin: "api.spotifydown.com",
              referer: "api.spotifydown.com",
            },
          }
        );
        const { id: ytId } = await response.json();
        _url = `https://www.youtube.com/watch?v=${ytId}`;
      } else if (url.match("https://open.spotify.com/playlist/")) {
        return this.generateFromSpotifyList(interaction, url, defaultHandler);
      }

      const res = await new Promise((resolve, reject) => {
        console.log(_url);
        exec(
          `yt-dlp --dump-single-json --no-abort-on-error ${_url} > ${MUSIC_DIR}/info.json`,
          (error, stdout, stderr) => {
            resolve(stdout);
          }
        );
      }).then(async () => {
        await interaction
          .editReply({
            embeds: [
              new InfoEmbed(
                interaction.client.user,
                ":inbox_tray: Processing",
                "Resolving data"
              ),
            ],
          })
          .catch(console.error);
        const file = await JSON.parse(
          fs.readFileSync(`${MUSIC_DIR}/info.json`).toString()
        );
        const filePath = `${MUSIC_DIR}/${file.id}.webm`;
        let tracks: Track[] = [];
        const total = file.entries?.length || 1;
        let count = 0;
        if (file.entries instanceof Array) {
          file.entries.map((track: any) => {
            const filePath = `${MUSIC_DIR}/${track.id}.webm`;
            tracks.push(
              new Track({
                title: track.title,
                url: track.original_url,
                filePath,
                thumbnail: track.thumbnails[0].url,
                user: interaction.member!.user,
                ...defaultHandler,
              })
            );
            count++;
          });
        } else {
          tracks.push(
            new Track({
              title: file.title,
              url: file.original_url,
              filePath,
              thumbnail: file.thumbnails[0].url,
              user: interaction.member!.user,
              ...defaultHandler,
            })
          );
          count++;
        }

        if (count < total) {
          for await (const startTime of setInterval(2000, Date.now())) {
            await interaction
              .editReply({
                embeds: [
                  new InfoEmbed(
                    interaction.client.user,
                    ":inbox_tray: Processing",
                    `Resolving songs ${count} / ${total}`
                  ),
                ],
              })
              .catch(console.error);
            if (count >= total) break;
          }
        }

        return {
          title: file.title as string,
          url: file.original_url as string,
          thumbnail: file.thumbnails[0].url,
          user: interaction.member!.user,
          tracks: tracks,
        };
      });

      return res;
    } catch (e) {
      console.error(e);
      return {
        title: url,
        url: url,
        thumbnail:
          "https://memeprod.ap-south-1.linodeobjects.com/user-template/63e160366afc7f7a7a1e5de55fd0e38f.png",
        user: interaction.member!.user,
        tracks: [],
      };
    }
  }

  private static async generateFromSpotifyList(
    interaction: ChatInputCommandInteraction | MessageComponentInteraction,
    url: string,
    defaultHandler: {
      onStart(url: string, title: string, thumbnail: string): void;
      onError(error: Error): void;
    }
  ): Promise<{
    title: string;
    url: string;
    thumbnail: string;
    user: User | APIUser;
    tracks: Track[];
  }> {
    const id = url.split("https://open.spotify.com/playlist/")[1].split("?")[0];
    const listResponse = await fetch(
      `https://api.spotifydown.com/trackList/playlist/${id}`,
      {
        headers: {
          authority: "api.spotifydown.com",
          origin: "api.spotifydown.com",
          referer: "api.spotifydown.com",
        },
      }
    );
    const metaResponse = await fetch(
      `https://api.spotifydown.com/metadata/playlist/${id}`,
      {
        headers: {
          authority: "api.spotifydown.com",
          origin: "api.spotifydown.com",
          referer: "api.spotifydown.com",
        },
      }
    );
    const { trackList } = await listResponse.json();
    const { cover, title } = await metaResponse.json();
    let count = 0;
    const total = trackList.length;
    const tracks = trackList.map(async (track: any) => {
      return fetch(`https://api.spotifydown.com/getId/${track.id}`, {
        headers: {
          authority: "api.spotifydown.com",
          origin: "api.spotifydown.com",
          referer: "api.spotifydown.com",
        },
      }).then(async (response) => {
        const { id: ytId } = await response.json();
        count++;
        return new Track({
          title: track.title,
          url: `https://www.youtube.com/watch?v=${ytId}`,
          filePath: `${MUSIC_DIR}/${ytId}.webm`,
          thumbnail: track.cover,
          user: interaction.member!.user,
          ...defaultHandler,
        });
      });
    });

    // if (count < total) {
    //   for await (const startTime of setInterval(2000, Date.now())) {
    //     await interaction
    //       .editReply({
    //         embeds: [
    //           new InfoEmbed(
    //             interaction.client.user,
    //             ":inbox_tray: Processing",
    //             `Resolving songs ${count} / ${total}`
    //           ),
    //         ],
    //       })
    //       .catch(console.error);
    //     if (count >= total) break;
    //   }
    // }

    const res = await new Promise((resolve, reject) => {
      resolve(Promise.all(tracks));
    }).then((t) => {
      return {
        title: title,
        url: url,
        thumbnail: cover,
        user: interaction.member!.user,
        tracks: t as Track[],
      };
    });

    console.log(res);

    return res;
  }
}
