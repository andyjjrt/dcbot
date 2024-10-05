import { ContextMenuCommandBuilder, MessageContextMenuCommandInteraction, ApplicationCommandType } from "discord.js";
import ai from "../commands/ai";

export default {
  data: new ContextMenuCommandBuilder().setName("Ask AI").setType(2),
  featureId: "ai",
  async execute(interaction: MessageContextMenuCommandInteraction) {
    await ai.execute(interaction);
  },
};