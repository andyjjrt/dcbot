import { ErrorEmbed, InfoEmbed } from "../utils/Embed";
import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { client, subscriptions } from "../index";

const reactions = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

export default {
  data: new SlashCommandBuilder()
    .setName("vote")
    .setDescription("Simple vote")
    .addStringOption((option) => option.setName("title").setDescription("Vote title").setRequired(true))
    .addStringOption((option) =>
      option.setName("options").setDescription("Vote options, seperated by comma(,)").setRequired(true)
    )
    .addRoleOption((option) => option.setName("role").setDescription("Role to mention").setRequired(true)),
  async execute(interaction: CommandInteraction) {
    const role = interaction.options.get("role", true).value;
    const title = interaction.options.get("title", true).value;
    const options = interaction.options.get("options", true).value;
    let _options: string[] = [];
    try {
      _options = options!.toString().split(",");
      if (_options.length > 10) throw new Error("Options should less then 10");
    } catch (e) {
      await interaction.reply({
        embeds: [new ErrorEmbed(interaction.client.user, "Error", (e as Error).message)],
      });
      return;
    }
    const message = await interaction.reply({
      content: `<@&${role}>`,
      embeds: [
        new InfoEmbed(
          interaction.member!.user,
          `:man_raising_hand:  Vote`,
          `**${title}**\n\n${_options.map((str, i) => `${reactions[i]}  ${str}`).join("\n")}`
        ),
      ],
      fetchReply: true,
    });
    reactions
      .filter((str, i) => i < _options.length)
      .forEach((str, i) => {
        message.react(reactions[i]);
      });
  },
};
