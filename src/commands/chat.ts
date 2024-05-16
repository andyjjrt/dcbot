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

import ollama, { Message } from "ollama";
const { OLLAMA_MODEL } = process.env;

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
  allowGuilds: ["690741342191616071", "701316013672890408", "582920350506156032", "1189568823498657833"],
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand(true);
    const modelName = (interaction.options.get("model")?.value as string | undefined) || OLLAMA_MODEL || "";
    switch (subcommand) {
      case "start":
        const message = await interaction.reply({
          embeds: [
            new InfoEmbed(
              interaction.user,
              ":calling: Created a thread for you!",
              "Feel free to chat with me. If you have done your conversation, just type `/chat end` to end the chat."
            ),
          ],
          fetchReply: true,
        });
        const thread = await message.startThread({
          name: `Conversation with ${interaction.user.displayName}`,
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
    history.messages.push({ role: "user", content: message.content });
    try {
      const response = await ollama.chat({
        model: history.model,
        messages: history.messages,
        options: {
          stop: ["<|eot_id|>"],
        },
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
