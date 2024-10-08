import { play } from "../commands/play";
import { AIEmbed } from "../utils/Embed";
import { ContextMenuCommandBuilder, MessageContextMenuCommandInteraction, ApplicationCommandType } from "discord.js";
import search from "../commands/search";

export default {
  data: new ContextMenuCommandBuilder().setName("Search in Youtube").setType(ApplicationCommandType.Message),
  featureId: "YTsearch",
  async execute(interaction: MessageContextMenuCommandInteraction) {
    await search.execute(interaction);
  },
};
