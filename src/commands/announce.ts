import { InfoEmbed, SuccessEmbed } from './../utils/Embed';
import { SlashCommandBuilder, CommandInteraction, ChatInputCommandInteraction, Embed } from "discord.js";
import { client } from "../index";
import { Announce } from '../utils/db/schema';

export default {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Announce")
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add Announce')
        .addStringOption(
          option => option.setName("title").setDescription("Announce title").setRequired(true)
        )
        .addStringOption(
          option => option.setName("url").setDescription("Announce title").setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List announce')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('List announce')
        .addStringOption(
          option => option.setName("title").setDescription("Announce title").setRequired(true)
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId || "";
    const subcommand = interaction.options.getSubcommand(true);
    await interaction.deferReply();
    if (subcommand === "add") {
      const title = interaction.options.get("title", true).value as string;
      const url = interaction.options.get("url", true).value as string;
      await Announce.upsert({
        guildId: guildId,
        title: title,
        url: url
      });
      await interaction.followUp({
        embeds: [
          new SuccessEmbed(
            interaction.client,
            "Success",
            `**${title}** ${url}`
          )
        ]
      });
    } else if (subcommand === "list") {
      const list = await Announce.findAll({ where: { guildId: guildId } });
      await interaction.followUp({
        embeds: [
          new InfoEmbed(
            interaction.client,
            ":information_source:  **Announce List**",
            `${list.map(his => `**${his.get("title") as string}** ${his.get("url") as string}`).join("\n")}`
          )
        ]
      })
    } else if (subcommand === "remove") {
      const title = interaction.options.get("title", true).value as string;
      await Announce.destroy({where: {
        guildId: guildId,
        title: title
      }});
      await interaction.followUp({
        embeds: [
          new SuccessEmbed(
            interaction.client,
            "Deleted",
            `${title}`
          )
        ]
      });
    }

  },
};
