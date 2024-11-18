import {
  SlashCommandBuilder,
  AutocompleteInteraction,
  ThreadAutoArchiveDuration,
  Collection,
  Message as DiscordMessage,
  ChatInputCommandInteraction,
} from "discord.js";
import client from "../index";
import { ErrorEmbed, InfoEmbed } from "../utils/Embed";

import { Ollama, Message } from "ollama";
const { OLLAMA_URL, OLLAMA_MODEL } = process.env;

const conversation = new Collection<string, { model: string; creater: string; messages: Array<Message> }>();

export default {
  data: new SlashCommandBuilder()
    .setName("chat")
    .setDescription("Chat with AI")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("start")
        .setDescription("Start a chat")
        .addStringOption((option) => option.setName("model").setDescription("Model Name").setAutocomplete(true))
    )
    .addSubcommand((subcommand) => subcommand.setName("end").setDescription("End a chat")),
  featureId: "ai",
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand(true);
    const modelName = (interaction.options.get("model")?.value as string | undefined) || OLLAMA_MODEL || "";
    switch (subcommand) {
      case "start":
        const message = await interaction.reply({
          embeds: [
            new InfoEmbed(
              interaction.user,
              `:calling: Created a thread for you!`,
              "Feel free to chat with me. If you have done your conversation, just type `/chat end` to end the chat."
            ),
          ],
          fetchReply: true,
        });
        const thread = await message.startThread({
          name: `🦙 ${modelName.split(":")[0]} - Conversation with ${interaction.user.displayName}`,
          autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
        });
        conversation.set(thread.id, { model: modelName, creater: interaction.user.id, messages: [] });
        break;
      case "end":
        if (!interaction.channel?.isThread()) {
          await interaction.reply({
            embeds: [new ErrorEmbed(interaction.user, "Error", "Please end in a thread")],
          });
          break;
        }
        let history = conversation.get(interaction.channelId);
        if (history) {
          if (history.creater !== interaction.user.id) {
            await interaction.reply({
              embeds: [new ErrorEmbed(interaction.user, "Error", "You can't end other's chat.")],
            });
            break;
          } else {
            conversation.delete(interaction.channelId);
            await interaction.reply({
              embeds: [new InfoEmbed(interaction.user, "Ends your chat", "Glad to chat with you")],
            });
          }
        }
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

export const replyConversation = async (message: DiscordMessage<boolean>) => {
  let history = conversation.get(message.channelId);
  if (history && message.content && message.author.id != client.user.id) {
    let images: string[] = [];
    if (message.attachments.size) {
      images = await Promise.all(
        message.attachments.toJSON().map((attachment) =>
          fetch(attachment.url)
            .then((res) => res.arrayBuffer())
            .then((res) => Buffer.from(res).toString("base64"))
        )
      );
    }
    history.messages.push({ role: "user", content: message.content, images: images });
    try {
      const ollama = new Ollama({ host: OLLAMA_URL || "http://127.0.0.1:11434" });
      const response = await ollama.chat({
        model: history.model,
        messages: history.messages,
        keep_alive: 0,
      });
      history.messages.push({ role: "assistant", content: response.message.content });
      message.reply({ content: response.message.content });
      conversation.set(message.channelId, history);
    } catch (error) {
      message.reply({ content: (error as Error).message });
    }
  }
};
