import { ErrorEmbed, InfoEmbed } from "../utils/Embed";
import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  TextChannel,
  ComponentType,
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import { play } from "./play";
import ytsearch from "yt-search"

const { YT_API_KEY } = process.env;

export default {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Search with Youtube API")
    .addStringOption((option) => option.setName("keyword").setDescription("Keyword").setRequired(true))
    .setDMPermission(false),
  featureId: "YTsearch",
  async execute(interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction) {
    const commandChannel = interaction.channel;
    await interaction.deferReply();
    if (!(commandChannel instanceof TextChannel)) {
      await interaction.reply({
        embeds: [new ErrorEmbed(interaction.client.user, "Error", "Please use command in a **Text Channel**")],
      });
      return;
    }
    const guildId = interaction.guildId!;
    const keyword =
      interaction instanceof MessageContextMenuCommandInteraction
        ? interaction.targetMessage
        : (interaction.options.get("keyword", true).value as string);
    const result = await ytsearch({query: `${keyword}`, })
    console.log(result)
    const items = result.videos.map((item, i) => {
      return `**${i + 1}**.  [${item.title}](https://www.youtube.com/watch?v=${item.videoId}) \n`;
    }) as string[];
    const embed = new InfoEmbed(
      interaction.client.user,
      `:mag:  **Search results for "${keyword}"**`,
      `${items.join("")}`
    );
    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("#SearchSelectMenu")
        .setPlaceholder("Nothing selected")
        .addOptions(
          result.videos.map((item, i) => {
            return {
              label: item.title.slice(0, 50) + (item.title.length > 50 ? "..." : ""),
              description: item.author.name.slice(0, 50) + (item.author.name.length > 50 ? "..." : ""),
              value: item.videoId,
            };
          })
        )
    );
    const interactionResponse = await interaction.followUp({
      embeds: [embed],
      components: [row],
    });

    const collector = interactionResponse.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60_000,
    });

    collector.on("collect", async (i) => {
      interaction.editReply({
        embeds: [embed],
        components: [],
      });
      const selection = i.values[0];
      await i.deferReply();
      play(i, `https://www.youtube.com/watch?v=${selection}`, false, false);
    });
  },
};
