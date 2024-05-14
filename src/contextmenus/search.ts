import { play } from "../commands/play";
import { AIEmbed } from "../utils/Embed";
import { ContextMenuCommandBuilder, MessageContextMenuCommandInteraction, ApplicationCommandType } from "discord.js";
import search from "../commands/search";

export default {
  data: new ContextMenuCommandBuilder().setName("Search in Youtube").setType(ApplicationCommandType.Message),
  allowGuilds: ["690741342191616071", "701316013672890408", "582920350506156032", "1189568823498657833"],
  async execute(interaction: MessageContextMenuCommandInteraction) {
    await search.execute(interaction);
  },
};
