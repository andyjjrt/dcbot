import { AIEmbed, ErrorEmbed } from "./../utils/Embed";
import {
  SlashCommandBuilder,
  CommandInteraction,
  AutocompleteInteraction,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import { client, subscriptions } from "../index";

import { Ollama } from "ollama";
const { OLLAMA_URL, OLLAMA_MODEL } = process.env;

export default {
  data: new SlashCommandBuilder()
    .setName("ai")
    .setDescription("Ask ai something")
    .addStringOption((option) => option.setName("question").setDescription("Question").setRequired(true))
    .addStringOption((option) => option.setName("model").setDescription("Model Name").setAutocomplete(true)),
  allowGuilds: ["690741342191616071", "701316013672890408", "582920350506156032", "1189568823498657833"],
  async execute(interaction: CommandInteraction | MessageContextMenuCommandInteraction) {
    await interaction.deferReply();
    const question =
      interaction instanceof MessageContextMenuCommandInteraction
        ? interaction.targetMessage
        : interaction.options.get("question", true).value;
    const modelName =
      interaction instanceof MessageContextMenuCommandInteraction
        ? null
        : (interaction.options.get("model")?.value as string | undefined);
    try {
      const ollama = new Ollama({ host: OLLAMA_URL || "http://127.0.0.1:11434" });
      const response = await ollama.chat({
        model: modelName || OLLAMA_MODEL || "",
        messages: [{ role: "user", content: `${question}` }],
        options: {
          stop: ["<|eot_id|>"],
        },
        keep_alive: 0,
      });

      await interaction.followUp({
        embeds: [new AIEmbed(interaction.client.user, `${question}`, response)],
      });
    } catch (error) {
      await interaction.followUp({
        embeds: [new ErrorEmbed(interaction.client.user, "Error", (error as Error).message)],
      });
    }
  },
  async autocomplete(interaction: AutocompleteInteraction) {
    const ollama = new Ollama({ host: OLLAMA_URL || "http://127.0.0.1:11434" });
    const models = (await ollama.list()).models;
    await interaction.respond(
      models.map((model) => ({
        name: model.name,
        value: model.name,
      }))
    );
  },
};
