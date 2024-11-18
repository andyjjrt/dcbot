import { AIEmbed, ErrorEmbed } from "./../utils/Embed";
import {
  SlashCommandBuilder,
  CommandInteraction,
  AutocompleteInteraction,
  MessageContextMenuCommandInteraction,
  Attachment,
} from "discord.js";
import { fetch } from "undici";

import { Ollama } from "ollama";
const { OLLAMA_URL, OLLAMA_MODEL, OLLAMA_VISION_MODEL } = process.env;

export default {
  data: new SlashCommandBuilder()
    .setName("ai")
    .setDescription("Ask ai something")
    .addStringOption((option) => option.setName("question").setDescription("Question").setRequired(true))
    .addAttachmentOption((option) => option.setName("attachment").setDescription("Attachment"))
    .addStringOption((option) => option.setName("model").setDescription("Model Name").setAutocomplete(true)),
  featureId: "ai",
  async execute(interaction: CommandInteraction | MessageContextMenuCommandInteraction) {
    await interaction.deferReply();
    const question =
      interaction instanceof MessageContextMenuCommandInteraction
        ? interaction.targetMessage.content.length
          ? interaction.targetMessage.content
          : "Describe this picture."
        : interaction.options.get("question", true).value;
    const attachments =
      interaction instanceof MessageContextMenuCommandInteraction
        ? interaction.targetMessage.attachments.size
          ? interaction.targetMessage.attachments.toJSON()
          : []
        : interaction.options.get("attachment", false)
        ? [interaction.options.get("attachment")!.attachment as Attachment]
        : [];
    const images = await Promise.all(
      attachments.map((attachment) =>
        fetch(attachment.url)
          .then((res) => res.arrayBuffer())
          .then((res) => Buffer.from(res).toString("base64"))
      )
    );
    const modelName =
      interaction instanceof MessageContextMenuCommandInteraction
        ? null
        : (interaction.options.get("model")?.value as string | undefined);
    try {
      const ollama = new Ollama({
        host: OLLAMA_URL || "http://127.0.0.1:11434",
      });
      const response = await ollama.chat({
        model: modelName || (images.length ? OLLAMA_VISION_MODEL : OLLAMA_MODEL) || "",
        messages: [{ role: "user", content: `${question}`, images: images }],
        keep_alive: 0,
      });

      await interaction.followUp({
        embeds: [new AIEmbed(interaction.client.user, `${question}`, response, attachments)],
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
