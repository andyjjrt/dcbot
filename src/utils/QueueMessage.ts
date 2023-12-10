import { ErrorEmbed, InfoEmbed, SuccessEmbed } from "./Embed";
import { APIUser, ChatInputCommandInteraction, ClientUser, Message, User } from "discord.js";
import { MusicSubscription } from "./Subscription";
import { AudioPlayerStatus } from "@discordjs/voice";

class QueueMessage {
  public readonly subscription: MusicSubscription;
  public timer: NodeJS.Timeout | null = null;
  private interact: Message | null = null;
  constructor(subscription: MusicSubscription) {
    this.subscription = subscription;
  }

  public async destroy() {
    if (this.timer) clearTimeout(this.timer);
    if (this.interact) {
      await this.interact!.edit({
        embeds: [new InfoEmbed(this.interact!.client.user, ":arrow_forward: Queue", "Queue done!")],
      });
    }
  }

  public async generateQueue(interaction: ChatInputCommandInteraction) {
    if (
      (this.subscription.audioPlayer.state.status === AudioPlayerStatus.Idle || !this.subscription.currentPlaying) &&
      this.subscription.queue.length === 0
    ) {
      await interaction.followUp({
        embeds: [new ErrorEmbed(this.interact!.client.user, "Error", "Nothing is currently playing!")],
      });
      return;
    }
    const interact = await interaction.followUp({
      embeds: [this.generateEmbed(this.subscription, interaction.client.user)],
    });
    if (this.timer) clearTimeout(this.timer);
    if (this.interact) {
      this.interact.edit({
        embeds: [new InfoEmbed(this.interact.client.user, ":arrow_forward: New Queue Generated", `${interact.url}`)],
      });
    }
    this.interact = interact;
    console.log(new Date(this.interact!.createdTimestamp).toLocaleString());

    this.timer = setInterval(async () => {
      if (this.interact!.createdTimestamp + ((30 * 60) * 1000) < Date.now()) {
        const message = await this.interact!.reply({
          embeds: [this.generateEmbed(this.subscription, interaction.client.user)],
        });
        await this.interact!.edit({
          embeds: [new InfoEmbed(this.interact!.client.user, ":arrow_forward: New Queue Generated", `${message.url}`)],
        })
        this.interact = message;
      } else if (
        (this.subscription.audioPlayer.state.status === AudioPlayerStatus.Idle || !this.subscription.currentPlaying) &&
        this.subscription.queue.length === 0
      ) {
        if (this.timer) clearTimeout(this.timer);
        this.interact!.edit({
          embeds: [new ErrorEmbed(this.interact!.client.user, "Error", "Nothing is currently playing!")],
        });
      } else {
        this.interact!.edit({
          embeds: [this.generateEmbed(this.subscription, this.interact!.client.user)],
        });
      }
    }, 1000);
  }

  private generateEmbed(subscription: MusicSubscription, user: ClientUser | User | APIUser) {
    if (
      (subscription.audioPlayer.state.status === AudioPlayerStatus.Idle || !subscription.currentPlaying) &&
      subscription.queue.length === 0
    ) {
      return new ErrorEmbed(user, "Error", "Nothing is currently playing!");
    } else {
      const { metadata, startTime, endTime } = subscription.currentPlaying!;
      const current = `**Playing:**\n[${metadata.title}](${metadata.url})`;
      const queue =
        subscription.queue.length === 0
          ? ""
          : "**Next: **\n" +
            subscription.queue
              .slice(0, 10)
              .map((track, index) => `**${index + 1}. ** [${track.metadata.title}](${track.metadata.url})`)
              .join("\n");
      const remain =
        subscription.queue.length > 10 ? `\n\n... and **${subscription.queue.length - 10}** more songs` : "";
      const timeString = () => {
        const now = new Date().getTime();
        const estimate = Math.floor((endTime - startTime) / 1000);
        const played = Math.floor((now - startTime) / 1000);
        return `${played / 60 < 10 ? "0" : ""}${Math.floor(played / 60)}:${played % 60 < 10 ? "0" : ""}${
          played % 60
        } / ${estimate / 60 < 10 ? "0" : ""}${Math.floor(estimate / 60)}:${estimate % 60 < 10 ? "0" : ""}${
          estimate % 60
        }`;
      };
      return new InfoEmbed(
        user,
        ":arrow_forward:  Queue",
        `${current}\n\n:clock10:  \`${timeString()}\`\n\n${queue}${remain}`
      )
        .setThumbnail(metadata.thumbnail)
        .addFields({ name: "Loop", value: subscription.loop, inline: true });
    }
  }
}

export default QueueMessage;
