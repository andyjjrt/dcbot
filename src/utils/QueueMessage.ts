import { ErrorEmbed, InfoEmbed } from "./Embed";
import {
  APIUser,
  ChatInputCommandInteraction,
  ClientUser,
  Message,
  User,
} from "discord.js";
import { MusicSubscription } from "./Subscription";
import { AudioPlayerStatus } from "@discordjs/voice";

class QueueMessage {
  public readonly subscription: MusicSubscription;
  private interaction: ChatInputCommandInteraction | null = null;
  public timer: NodeJS.Timeout | null = null;
  private url: string = "";
  constructor(subscription: MusicSubscription) {
    this.subscription = subscription;
  }

  public async destroy() {
    if (this.timer) clearTimeout(this.timer);
    if (this.interaction) {
      await this.interaction!.editReply({
        embeds: [
          new ErrorEmbed(
            this.interaction!.client.user,
            "Error",
            "Nothing is currently playing!"
          ),
        ],
      });
    }
  }

  public async generateQueue(interaction: ChatInputCommandInteraction) {
    const interact = await interaction.followUp({
      embeds: [this.generateEmbed(this.subscription, interaction.client.user)],
    });
    this.url = interact.url;
    if (this.timer) clearTimeout(this.timer);
    if (this.interaction) {
      await this.interaction!.editReply({
        embeds: [
          new InfoEmbed(
            this.interaction!.client.user,
            ":arrow_forward:  Queue",
            `${this.url}`
          ),
        ],
      });
    }

    this.timer = setInterval(async () => {
      if (new Date().getTime() - this.interaction!.createdTimestamp > 360000) {
        if (this.timer) clearTimeout(this.timer);
        await this.interaction!.editReply({
          embeds: [
            new InfoEmbed(
              this.interaction!.client.user,
              ":arrow_forward:  Queue",
              `${this.url}`
            ),
          ],
        });
      } else if (
        this.subscription.audioPlayer.state.status === AudioPlayerStatus.Idle ||
        !this.subscription.currentPlaying
      ) {
        if (this.timer) clearTimeout(this.timer);
        await this.interaction!.editReply({
          embeds: [
            new ErrorEmbed(
              this.interaction!.client.user,
              "Error",
              "Nothing is currently playing!"
            ),
          ],
        });
      } else {
        await this.interaction!.editReply({
          embeds: [
            this.generateEmbed(this.subscription, interaction.client.user),
          ],
        });
      }
    }, 1000);
    this.interaction = interaction;
  }

  private generateEmbed(
    subscription: MusicSubscription,
    user: ClientUser | User | APIUser
  ) {
    if (
      subscription.audioPlayer.state.status === AudioPlayerStatus.Idle ||
      !subscription.currentPlaying
    ) {
      return new ErrorEmbed(user, "Error", "Nothing is currently playing!");
    } else {
      const { title, url, thumbnail, startTime, endTime } =
        subscription.currentPlaying;
      const current = `**Playing:**\n[${title}](${url})`;
      const queue =
        subscription.queue.length === 0
          ? ""
          : "**Next: **\n" +
            subscription.queue
              .slice(0, 10)
              .map(
                (track, index) =>
                  `**${index + 1}. ** [${track.title}](${track.url})`
              )
              .join("\n");
      const remain =
        subscription.queue.length > 10
          ? `\n\n... and **${subscription.queue.length - 10}** more songs`
          : "";
      const timeString = () => {
        const now = new Date().getTime();
        const estimate = Math.floor((endTime - startTime) / 1000);
        const played = Math.floor((now - startTime) / 1000);
        return `${played / 60 < 10 ? "0" : ""}${Math.floor(played / 60)}:${
          played % 60 < 10 ? "0" : ""
        }${played % 60} / ${estimate / 60 < 10 ? "0" : ""}${Math.floor(
          estimate / 60
        )}:${estimate % 60 < 10 ? "0" : ""}${estimate % 60}`;
      };
      return new InfoEmbed(
        user,
        ":arrow_forward:  Queue",
        `${current}\n\n:clock10:  \`${timeString()}\`\n\n${queue}${remain}`
      )
        .setThumbnail(thumbnail)
        .addFields({ name: "Loop", value: subscription.loop, inline: true });
    }
  }
}

export default QueueMessage;
