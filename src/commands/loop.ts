import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { subscriptions } from "..";
import { ErrorEmbed, SuccessEmbed } from "../utils/Embed";

export default {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Loop song(s)")
    .addStringOption(
      option => option.setName("type")
        .setDescription("Loop type")
        .addChoices(
          { name: 'Off', value: 'off' },
          { name: 'One song', value: 'one' },
          { name: 'Whole queue', value: 'queue' }
        )
        .setRequired(true)
    ),
  async execute(interaction: CommandInteraction) {
    const status = interaction.options.get("type", true).value as string;
    if (!interaction.isCommand() || !interaction.guildId) return;
    let subscription = subscriptions.get(interaction.guildId);
    if (subscription) {
      subscription.loop = status as "off" | "one" | "queue";
      await interaction.reply({
        embeds: [
          new SuccessEmbed(interaction.client, "Current Status", " ")
            .addFields(
              { name: 'Loop', value: subscription.loop, inline: true }
            )
        ]
      });
    } else {
      await interaction.reply({ embeds: [new ErrorEmbed(interaction.client, "Error", "Not playing in this server!")] });
    }
  },
};
