import { ErrorEmbed, InfoEmbed, SuccessEmbed } from "./../utils/Embed";
import { AudioPlayerStatus } from "@discordjs/voice";
import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from "discord.js";
import { subscriptions, client } from "..";

export default {
  data: new SlashCommandBuilder()
    .setName("top")
    .setDescription("Make a song to the top of the queue")
    .addStringOption((option) =>
      option.setName("name").setDescription("Song name").setRequired(true).setAutocomplete(true)
    )
    .setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isCommand() || !interaction.guildId) return;
    let subscription = subscriptions.get(interaction.guildId);
    if (!subscription) {
      await interaction.reply({
        embeds: [new ErrorEmbed(interaction.client.user, "Error", "Not playing in this server!")],
      });
      return;
    }
    const query = interaction.options.get("name", true).value as string;
    const track = subscription.queue.find((t) => t.metadata.url === query);
    if (!track) {
      await interaction.reply({
        embeds: [new ErrorEmbed(interaction.client.user, "Error", "No such song in this queue")],
      });
      return;
    }
    subscription.queue.sort((a, b) => (a.metadata.url === query ? -1 : b.metadata.url === query ? 1 : 0));
    await interaction.reply({
      embeds: [
        new SuccessEmbed(
          interaction.client.user,
          "Success",
          `Skipped to **[${track.metadata.title}](${track.metadata.url})**`
        ).setThumbnail(track.metadata.thumbnail),
      ],
    });
  },
  async autocomplete(interaction: AutocompleteInteraction) {
    if (!interaction.guildId) return;
    const subscription = subscriptions.get(interaction.guildId);
    const query = interaction.options.get("name", true).value as string;
    if (!subscription) return;
    await interaction.respond(
      subscription.queue
        .filter((track) => {
          if (!query || query == "") return true;
          return track.metadata.title.toLowerCase().includes(query.toLowerCase());
        })
        .filter((_, index) => index < 25)
        .map((track) => ({
          name: `${track.metadata.title}`,
          value: track.metadata.url,
        }))
    );
  },
};
