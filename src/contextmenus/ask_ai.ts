import { ContextMenuCommandBuilder, MessageContextMenuCommandInteraction, ApplicationCommandType } from "discord.js";
import ai from "../commands/ai";

export default {
  data: new ContextMenuCommandBuilder().setName("Ask AI").setType(ApplicationCommandType.Message),
  featureId: "ai",
  async execute(interaction: MessageContextMenuCommandInteraction) {
    await ai.execute(interaction);
  },
};