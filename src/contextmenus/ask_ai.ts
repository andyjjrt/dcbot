import { ContextMenuCommandBuilder, MessageContextMenuCommandInteraction, ApplicationCommandType } from "discord.js";
import ai from "../commands/ai";

export default {
  data: new ContextMenuCommandBuilder().setName("Ask AI").setType(ApplicationCommandType.Message),
  async execute(interaction: MessageContextMenuCommandInteraction) {
    await ai.execute(interaction);
  },
};