import { ErrorEmbed, InfoEmbed, SuccessEmbed } from "../utils/Embed";
import {
  SlashCommandBuilder,
  CommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  time,
  TextChannel,
  CacheType,
  StringSelectMenuInteraction,
  ComponentType,
  ChatInputCommandInteraction,
} from "discord.js";
import { client } from "../index";
import { Setting } from "../utils/db/schema";
import { play } from "./play";

export default {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Search with Youtube API")
    .addStringOption((option) => option.setName("keyword").setDescription("Keyword").setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const commandChannel = interaction.channel;
    await interaction.deferReply()
    if (!(commandChannel instanceof TextChannel)) {
      await interaction.reply({
        embeds: [new ErrorEmbed(interaction.client.user, "Error", "Please use command in a **Text Channel**")],
      });
      return;
    }
    const guildId = interaction.guildId!;
    const setting = await Setting.findOne({ where: { guildId: guildId } });
    if (!setting) throw new Error("Please setup your server first");
    const YT_API_KEY = setting?.get("ytKey") as string;
    const keyword = interaction.options.get("keyword", true).value as string;
    const response = await fetch(
      `https://youtube.googleapis.com/youtube/v3/search?q=${keyword}&key=${YT_API_KEY}&type=video&part=snippet&maxResults=10`
    );
    const data = await response.json();
    if (response.status !== 200) throw new Error(data.error.message);
    const items = data.items.map((item: any, i: number) => {
      return `**${i + 1}**.  [${item.snippet.title}](https://www.youtube.com/watch?v=${item.id.videoId}) \n`;
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
          data.items.map((item: any, i: number) => {
            const { title, channelTitle } = item.snippet;
            return {
              label: (title as string).slice(0, 50) + ((title as string).length > 50 ? "..." : ""),
              description: (channelTitle as string).slice(0, 50) + ((channelTitle as string).length > 50 ? "..." : ""),
              value: item.id.videoId,
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
