import { AIEmbed } from "./../utils/Embed";
import { SlashCommandBuilder, CommandInteraction, AutocompleteInteraction } from "discord.js";
import { client, subscriptions } from "../index";

import ollama from "ollama";
const { OLLAMA_MODEL } = process.env;

export default {
  data: new SlashCommandBuilder()
    .setName("ai")
    .setDescription("Ask ai something")
    .addStringOption((option) => option.setName("question").setDescription("Question").setRequired(true))
    .addStringOption((option) => option.setName("model").setDescription("Model Name").setAutocomplete(true)),
  allowGuilds: ["690741342191616071", "701316013672890408", "582920350506156032", "1189568823498657833"],
  async execute(interaction: CommandInteraction) {
    await interaction.deferReply();
    const question = interaction.options.get("question", true).value as string;
    const modelName = interaction.options.get("model")?.value as string | undefined;
    const response = await ollama.chat({
      model: modelName || OLLAMA_MODEL || "",
      messages: [{ role: "user", content: question }],
      options: {
        stop: ["<|eot_id|>"],
      },
    });

    await interaction.followUp({
      embeds: [new AIEmbed(interaction.client.user, question, response)],
    });
    
  },
  async autocomplete(interaction: AutocompleteInteraction) {
    const models = (await ollama.list()).models;
    await interaction.respond(
      models.map((model) => ({
        name: model.name,
        value: model.name,
      }))
    );
  },
};
