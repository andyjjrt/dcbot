import { ErrorEmbed, InfoEmbed } from "./../utils/Embed";
import { AudioPlayerStatus } from "@discordjs/voice";
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { subscriptions, client } from "..";

const { WEBSITE_URL } = process.env;

export default {
  data: new SlashCommandBuilder().setName("queue").setDescription("Get current queue").setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isCommand() || !interaction.guildId) return;
    let subscription = subscriptions.get(interaction.guildId);
    if (subscription) {
      // await interaction.deferReply();
      // await subscription.queueMessage.generateQueue(interaction);
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
      await interaction.reply({
        embeds: [
          new InfoEmbed(
            interaction.client.user,
            ":arrow_forward:  Queue",
            `${current}\n\n:clock10:  \`${timeString()}\`\n\n${queue}${remain}\n\n**[Click me](${WEBSITE_URL}/${
              interaction.guildId
            })** to view more!`
          ).setThumbnail(subscription.currentPlaying?.metadata.thumbnail || ""),
        ],
      });
    } else {
      await interaction.reply({
        embeds: [new ErrorEmbed(interaction.client.user, "Error", "Not playing in this server!")],
      });
    }
  },
};
