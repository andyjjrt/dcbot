import { SlashCommandBuilder, CommandInteraction, GuildMember } from "discord.js";
import { subscriptions, client } from "..";
import { ErrorEmbed, InfoEmbed } from "../utils/Embed";
import { queueIo } from "../server/index";

export default {
  data: new SlashCommandBuilder().setName("leave").setDescription("Leave and clear queue").setDMPermission(false),
  async execute(interaction: CommandInteraction) {
    if (!interaction.isCommand() || !interaction.guildId) return;
    let subscription = subscriptions.get(interaction.guildId);
    if (subscription) {
      if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
        if (subscription.voiceConnection.joinConfig.channelId === interaction.member.voice.channelId) {
          subscription.destroy(true);
          await interaction.reply({
            embeds: [new InfoEmbed(interaction.client.user, ":wave:  Left", "I'm right.")],
          });
        } else {
          await interaction.reply({
            embeds: [
              new ErrorEmbed(interaction.client.user, "Error", "You're not in the same voice channel with bot!"),
            ],
          });
        }
      } else {
        await interaction.reply({
          embeds: [new ErrorEmbed(interaction.client.user, "Error", "You're not in a voice channel!")],
        });
      }
    } else {
      await interaction.reply({
        embeds: [new ErrorEmbed(interaction.client.user, "Error", "Not playing in this server!")],
      });
    }
  },
};
