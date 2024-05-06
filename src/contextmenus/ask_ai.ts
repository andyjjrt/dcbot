import { AIEmbed } from "../utils/Embed";
import { ContextMenuCommandBuilder, MessageContextMenuCommandInteraction, ApplicationCommandType } from "discord.js";
import { client, subscriptions } from "../index";

import ollama from "ollama";
const { OLLAMA_MODEL } = process.env;

export default {
  data: new ContextMenuCommandBuilder().setName("Ask AI").setType(ApplicationCommandType.Message),
  allowGuilds: ["690741342191616071", "701316013672890408", "582920350506156032", "1189568823498657833"],
  async execute(interaction: MessageContextMenuCommandInteraction) {
    await interaction.deferReply();
    const question = interaction.targetMessage;
    const response = await ollama.chat({
      model: OLLAMA_MODEL || "",
      messages: [{ role: "user", content: `${question}` }],
      options: {
        stop: ["<|eot_id|>"],
      },
    });

    await interaction.followUp({
      embeds: [new AIEmbed(interaction.client.user, `${question}`, response)],
    });
  },
};
