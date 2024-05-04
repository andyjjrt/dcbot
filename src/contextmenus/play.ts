import { play } from "../commands/play";
import { AIEmbed } from "../utils/Embed";
import { ContextMenuCommandBuilder, MessageContextMenuCommandInteraction, ApplicationCommandType } from "discord.js";

export default {
  data: new ContextMenuCommandBuilder()
    .setName("Play")
    .setType(ApplicationCommandType.Message),
  async execute(interaction: MessageContextMenuCommandInteraction) {
    await interaction.deferReply();
    const url = interaction.targetMessage;
    await play(interaction, `${url}`)
  }
};
