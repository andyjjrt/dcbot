import ytdlCore from 'ytdl-core';
import { exec } from 'child_process';
import fs, { createReadStream } from "fs";
import { createAudioResource, StreamType } from "@discordjs/voice"
import * as dotenv from "dotenv";
import { ChatInputCommandInteraction, MessageComponentInteraction } from 'discord.js';
import { InfoEmbed } from './Embed';
import { setInterval } from 'timers/promises';
import { getVideoDurationInSeconds } from "get-video-duration"
dotenv.config();
const { MUSIC_DIR } = process.env;

/**
 * This is the data required to create a Track object.
 */
export interface TrackData {
  url: string;
  title: string;
  thumbnail: string;
  filePath: string;
  startTime: number;
  endTime: number;
  onStart: (url: string, title: string, thumbnail: string) => void;
  onError: (error: Error) => void;
}

const noop = () => { };

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
  public startTime: number;
  public endTime: number;
  public readonly onStart: (url: string, title: string, thumbnail: string) => void;
  public readonly onError: (error: Error) => void;

  private constructor(
    { url, title, thumbnail, filePath, onStart, onError }:
      {
        url: string;
        title: string;
        thumbnail: string;
        filePath: string;
        onStart: (url: string, title: string, thumbnail: string) => void;
        onError: (error: Error) => void;
      }) {
    this.url = url;
    this.title = title;
    this.thumbnail = thumbnail;
    this.filePath = filePath;
    this.onStart = onStart;
    this.onError = onError;
    this.startTime = new Date().getTime();
    this.endTime = new Date().getTime();
  }

  public async createAudioResource() {
    if (!fs.existsSync(this.filePath)) {
      await new Promise((resolve, reject) => {
        exec(`yt-dlp -o "${MUSIC_DIR}/%(id)s.%(ext)s" --format "bestaudio" --quiet --file-access-retries 1 ${this.url}`, (error, stdout, stderr) => {
          if (error) {
            console.warn(error);
          }
          resolve(stdout);
        });
      });
    }
    const duration = await getVideoDurationInSeconds(createReadStream(this.filePath))
    this.startTime = new Date().getTime();
    this.endTime = new Date().getTime() + (duration * 1000);
    return createAudioResource(createReadStream(this.filePath), { metadata: this, inputType: StreamType.WebmOpus, });
  };

  /**
   * Creates a Track from a video URL and lifecycle callback methods.
   *
   * @param url The URL of the video
   * @param methods Lifecycle callbacks
   *
   * @returns The created Track
   */
  public static async from(url: string, methods: Pick<Track, 'onStart' | 'onError'>, interaction: ChatInputCommandInteraction | MessageComponentInteraction): Promise<{ title: string, url: string, thumbnail: string, tracks: Track[] }> {
    // single video => plylist => error

    try {
      try {
        const valid = ytdlCore.validateURL(url);
        if (!valid) throw new Error("not a song")
        await interaction.editReply({ embeds: [new InfoEmbed(interaction.client, ":inbox_tray: Processing", "Fetching Song")] }).catch(console.warn);
        const res = await new Promise((resolve, reject) => {
          exec(`yt-dlp --dump-single-json --no-abort-on-error ${url} > ${MUSIC_DIR}/info.json`, (error, stdout, stderr) => {
            resolve(stdout);
          });
        }).then(async () => {
          await interaction.editReply({ embeds: [new InfoEmbed(interaction.client, ":inbox_tray: Processing", "Resolving song")] }).catch(console.warn);
          const file = await JSON.parse(fs.readFileSync(`${MUSIC_DIR}/info.json`).toString());
          const filePath = `${MUSIC_DIR}/${file.id}.webm`

          return {
            title: file.title as string,
            url: file.original_url as string,
            thumbnail: file.thumbnails[0].url,
            tracks: [new Track({
              title: file.title,
              url: file.original_url,
              filePath,
              thumbnail: file.thumbnails[0].url,
              onStart(url: string, title: string, thumbnail: string) {
                methods.onStart(url, title, thumbnail);
              },
              onError(error: Error) {
                methods.onError(error);
              },
            })]
          };
        })

        return res;
      } catch (e) {
        await interaction.editReply({ embeds: [new InfoEmbed(interaction.client, ":inbox_tray: Processing", "Fetching list")] }).catch(console.warn);
        const res = await new Promise((resolve, reject) => {
          exec(`yt-dlp --dump-single-json --no-abort-on-error --flat-playlist ${url} > ${MUSIC_DIR}/info.json`, (error, stdout, stderr) => {
            resolve(stdout);
          });
        }).then(async () => {
          await interaction.editReply({ embeds: [new InfoEmbed(interaction.client, ":inbox_tray: Processing", "Resolving songs")] }).catch(console.warn);
          const file = await JSON.parse(fs.readFileSync(`${MUSIC_DIR}/info.json`).toString());
          const playlist = file.entries;
          let tracks = new Array<Track>();
          const total = playlist.length;
          let count = 0;

          playlist.map((track: any) => {
            const filePath = `${MUSIC_DIR}/${track.id}.webm`
            tracks.push(new Track({
              title: track.title,
              url: track.url,
              filePath,
              thumbnail: track.thumbnails[0].url,
              onStart(url: string, title: string, thumbnail: string) {
                methods.onStart(url, title, thumbnail);
              },
              onError(error: Error) {
                methods.onError(error);
              },
            }));
            count++;
          })

          for await (const startTime of setInterval(2000, Date.now())) {
            const now = Date.now();
            console.log(now, " ", count, "/", total);
            await interaction.editReply({ embeds: [new InfoEmbed(interaction.client, ":inbox_tray: Processing", `Resolving songs ${count} / ${total}`)] }).catch(console.warn);
            if (count >= total)
              break;
          }

          return {
            title: file.title as string,
            url: file.url as string,
            thumbnail: file.thumbnails[0].url,
            tracks: tracks
          };
        })
        return res;
      }
    }
    catch (e) {
      return {
        title: "",
        url: "",
        thumbnail: "",
        tracks: []
      }
    }
  }
}