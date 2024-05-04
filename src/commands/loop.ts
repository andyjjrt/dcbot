import { SlashCommandBuilder, CommandInteraction, GuildMember } from "discord.js";
import { subscriptions } from "..";
import { ErrorEmbed, SuccessEmbed } from "../utils/Embed";

export default {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Loop song(s)")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Loop type")
        .addChoices(
          { name: "Off", value: "off" },
          { name: "One song", value: "one" },
          { name: "Whole queue", value: "queue" }
        )
        .setRequired(true)
    )
    .setDMPermission(false),
  async execute(interaction: CommandInteraction) {
    const status = interaction.options.get("type", true).value as string;
    if (!interaction.isCommand() || !interaction.guildId) return;
    let subscription = subscriptions.get(interaction.guildId);
    if (subscription) {
      if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
        if (subscription.voiceConnection.joinConfig.channelId === interaction.member.voice.channelId) {
          subscription.loop = status as "off" | "one" | "queue";
          await interaction.reply({
            embeds: [
              new SuccessEmbed(interaction.client.user, "Current Status", " ").addFields({
                name: "Loop",
                value: subscription.loop,
                inline: true,
              }),
            ],
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
