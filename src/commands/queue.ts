import { ErrorEmbed, InfoEmbed } from "./../utils/Embed";
import { AudioPlayerStatus } from "@discordjs/voice";
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { subscriptions, client } from "..";

const { WEBSITE_URL } = process.env;

export default {
  data: new SlashCommandBuilder().setName("queue").setDescription("Get current queue"),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isCommand() || !interaction.guildId) return;
    let subscription = subscriptions.get(interaction.guildId);
    if (subscription) {
      // await interaction.deferReply();
      // await subscription.queueMessage.generateQueue(interaction);
      await interaction.reply({
        embeds: [
          new InfoEmbed(
            interaction.client.user,
            ":arrow_forward:  Queue",
            ` **[Click me](${WEBSITE_URL}/${interaction.guildId})**`
          ),
        ],
      });
    } else {
      await interaction.reply({
        embeds: [new ErrorEmbed(interaction.client.user, "Error", "Not playing in this server!")],
      });
    }
  },
};
