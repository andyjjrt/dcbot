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

import { InfoEmbed } from "./Embed";
import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  entersState,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus,
  VoiceConnectionState,
  AudioPlayerState,
} from "@discordjs/voice";
import { TextChannel, ThreadChannel, VoiceChannel } from "discord.js";
import { promisify } from "node:util";

import type { Track } from "./Track";
import { subscriptions, client } from "..";
import { Record } from "./db/schema";
import QueueMessage from "./QueueMessage";
import { logger } from "./log";
import { lobbyIo, queueIo } from "../server/index";
import { v4 as uuidv4 } from "uuid";

const wait = promisify(setTimeout);

/**
 * A MusicSubscription exists for each active VoiceConnection. Each subscription has its own audio player and queue,
 * and it also attaches logic to the audio player and voice connection for error handling and reconnection logic.
 */
export class MusicSubscription {
  public readonly voiceConnection: VoiceConnection;
  public readonly audioPlayer: AudioPlayer;
  public readonly commandChannel: TextChannel;
  public id: string;
  public queueMessage: QueueMessage;
  public logChannel: ThreadChannel | null = null;
  public leaveTimer: NodeJS.Timeout | null;
  public queue: Track[];
  public currentPlaying: Track | null = null;
  public loop: "off" | "one" | "queue" = "off";
  public queueLock = false;
  public readyLock = false;
  public skipFlag = false;

  public constructor(voiceConnection: VoiceConnection, commandChannel: TextChannel) {
    this.voiceConnection = voiceConnection;
    this.audioPlayer = createAudioPlayer();
    this.id = uuidv4();
    this.commandChannel = commandChannel;
    this.leaveTimer = null;
    this.queue = [];
    this.queueMessage = new QueueMessage(this);

    this.voiceConnection.on("stateChange", async (_: VoiceConnectionState, newState: VoiceConnectionState) => {
      const guildId = voiceConnection.joinConfig.guildId;
      if (newState.status === VoiceConnectionStatus.Disconnected) {
        this.destroy();
      } else if (newState.status === VoiceConnectionStatus.Destroyed) {
        this.stop();
      } else if (
        !this.readyLock &&
        (newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling)
      ) {
        this.readyLock = true;
        try {
          await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 20_000);
        } catch {
          if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) {
            this.destroy();
          }
        } finally {
          this.readyLock = false;
        }
      }
    });

    // Configure audio player
    this.audioPlayer.on("stateChange", (oldState: AudioPlayerState, newState: AudioPlayerState) => {
      if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
        // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
        // The queue is then processed to start playing the next track, if one is available.
        void this.processQueue();
      } else if (newState.status === AudioPlayerStatus.Playing) {
        // If the Playing state has been entered, then a new track has started playback.
        (newState.resource as AudioResource<Track>).metadata.onStart(
          (newState.resource as AudioResource<Track>).metadata.metadata
        );
      }
    });

    this.audioPlayer.on("error", (error: any) =>
      (error.resource as AudioResource<Track>).metadata.onError(new Error(error.message))
    );

    voiceConnection.subscribe(this.audioPlayer);

    this.commandChannel.threads
      .fetch()
      .then((threads) => {
        const channel = threads.threads.find((t) => t.ownerId === client.user.id && t.name === "🎶 Logs");
        return (
          channel ||
          this.commandChannel.threads.create({
            name: `🎶 Logs`,
          })
        );
      })
      .then(async (channel) => {
        this.logChannel = channel;
      })
      .catch((error) => {
        logger.error(error, "Unknown error");
      });
  }

  /**
   * Adds a new Track to the queue.
   *
   * @param track The track to add to the queue
   */
  public enqueue(track: Track) {
    this.queue.push(track);
    this.processQueue();
  }

  /**
   * Adds a new Track to the queue front.
   *
   * @param track The track to add to the queue
   */
  public prependQueue(track: Track[]) {
    this.queue.unshift(...track);
    this.processQueue();
  }

  /**
   * Stops audio playback and empties the queue.
   */
  public stop() {
    this.queueLock = true;
    this.queue = [];
    this.audioPlayer.stop(true);
  }

  /**
   * Generate queue format
   */
  public toQueue() {
    return {
      queue: this.queue.map((t) => t.metadata),
      loop: this.loop,
      currentPlaying: this.currentPlaying ? this.currentPlaying.metadata : null,
      startTime: this.currentPlaying ? this.currentPlaying.startTime : -1,
      endTime: this.currentPlaying ? this.currentPlaying.endTime : -1,
    };
  }

  public async destroy(clearStatus?: boolean) {
    if (clearStatus) {
      // await client.rest.put(`/channels/${this.voiceConnection.joinConfig.channelId}/voice-status`, {
      //   body: {
      //     status: " ",
      //   },
      // });
    }
    queueIo.to(this.id).disconnectSockets();
    this.voiceConnection.destroy();
    subscriptions.delete(this.voiceConnection.joinConfig.guildId);
  }

  /**
   * Attempts to play a Track from the queue.
   */
  private async processQueue(): Promise<void> {
    // If the queue is locked (already being processed), is empty, or the audio player is already playing something, return

    if (!this.currentPlaying && this.queue.length === 0) {
      this.commandChannel.send({
        embeds: [new InfoEmbed(client.user, ":wave:  Leaving", "bye")],
      });
      this.destroy(true);
      return;
    }

    if (
      this.queueLock ||
      this.audioPlayer.state.status !== AudioPlayerStatus.Idle ||
      (this.queue.length === 0 && this.loop === "off" && !this.currentPlaying)
    ) {
      return;
    }
    // Lock the queue to guarantee safe access
    this.queueLock = true;

    // Take the first item from the queue. This is guaranteed to exist due to the non-empty check above.
    if (this.currentPlaying) {
      if (this.loop === "queue") {
        this.queue.push(this.currentPlaying);
      }
    }

    if (!(this.loop === "one" && !this.skipFlag) || this.currentPlaying == null) {
      this.currentPlaying = this.queue.shift()!;
    }
    this.skipFlag = false;
    try {
      // Attempt to convert the Track into an AudioResource (i.e. start streaming the video)
      const resource = await this.currentPlaying.createAudioResource();
      this.audioPlayer.play(resource);
      queueIo.to(this.id).emit("queue", this.toQueue());
      lobbyIo.to(this.voiceConnection.joinConfig.guildId).emit("ping");
      this.queueLock = false;
      await Record.create({
        time: new Date().getTime(),
        guildId: this.voiceConnection.joinConfig.guildId,
        userId: this.currentPlaying.user.id,
        title: this.currentPlaying.metadata.title,
        url: this.currentPlaying.metadata.url,
      });
      const guildName = (await client.guilds.fetch(this.voiceConnection.joinConfig.guildId)).name;
      const channelName = await client.channels
        .fetch(this.voiceConnection.joinConfig.channelId || "")
        .then((channel) => (channel ? (channel as VoiceChannel).name : ""));
      const userName = (await client.users.fetch(this.currentPlaying.user.id)).username;
      logger.info(
        {
          type: "play",
          guild: guildName,
          guildId: this.voiceConnection.joinConfig.guildId,
          channel: channelName,
          channelId: this.voiceConnection.joinConfig.channelId,
          user: userName,
          userId: this.currentPlaying.user.id,
          title: this.currentPlaying.metadata.title,
          url: this.currentPlaying.metadata.url,
        },
        `${userName} played ${this.currentPlaying.metadata.title}`
      );
    } catch (error) {
      // If an error occurred, try the next item of the queue instead
      if (!this.currentPlaying) return this.processQueue();
      this.currentPlaying.onError(error as Error);
      this.queueLock = false;
      return this.processQueue();
    }
  }
}
