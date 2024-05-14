import { ContextMenuCommandBuilder, MessageContextMenuCommandInteraction, ApplicationCommandType } from "discord.js";
import ai from "../commands/ai";

export default {
  data: new ContextMenuCommandBuilder().setName("Ask AI").setType(ApplicationCommandType.Message),
  allowGuilds: ["690741342191616071", "701316013672890408", "582920350506156032", "1189568823498657833"],
  async execute(interaction: MessageContextMenuCommandInteraction) {
    await ai.execute(interaction);
  },
};
