import { ErrorEmbed, SuccessEmbed, InfoEmbed } from "./../utils/Embed";
import { AudioPlayerStatus } from "@discordjs/voice";
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { subscriptions, client } from "..";

export default {
  data: new SlashCommandBuilder().setName("queue").setDescription("Get current queue"),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isCommand() || !interaction.guildId) return;
    let subscription = subscriptions.get(interaction.guildId);
    if (subscription) {
      await interaction.deferReply();
      await subscription.queueMessage.generateQueue(interaction);
    } else {
      await interaction.reply({
        embeds: [new ErrorEmbed(interaction.client.user, "Error", "Not playing in this server!")],
      });
    }
  },
};
