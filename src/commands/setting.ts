import { ErrorEmbed, InfoEmbed, SuccessEmbed } from "../utils/Embed";
import { SlashCommandBuilder, PermissionsBitField, ChatInputCommandInteraction } from "discord.js";
import { client } from "../index";
import { Permissions } from "utils/db/schema";
const { MUSIC_DIR, SERVER_IP } = process.env;

export default {
  data: new SlashCommandBuilder()
    .setName("manage")
    .setDescription("Manage setting of the bot")
    .addSubcommand((command) =>
      command
        .setName("addpermission")
        .setDescription("Add permission of specific feature")
        .addStringOption((option) => option.setName("featureid").setDescription("Feature ID").setRequired(true))
        .addStringOption((option) => option.setName("guildid").setDescription("Guild ID").setRequired(true))
    )
    .addSubcommand((command) =>
      command
        .setName("removepermission")
        .setDescription("Remove permission of specific feature")
        .addStringOption((option) => option.setName("featureid").setDescription("Feature ID").setRequired(true))
        .addStringOption((option) => option.setName("guildid").setDescription("Guild ID").setRequired(true))
    )
    .addSubcommand((command) => command.setName("refresh").setDescription("Refresh commands"))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand(true);
    await interaction.deferReply({ ephemeral: true });
    if (subcommand === "refresh") {
      const commands = await client.refreshCommands();
      await interaction.followUp({
        embeds: [new SuccessEmbed(interaction.client.user, "Success", `${commands} commands refreshed`)],
        ephemeral: true,
      });
    } else if (subcommand === "addpermission") {
      const featureId = interaction.options.get("featureid", true).value as string;
      const guildId = interaction.options.get("guildid", true).value as string;
      await Permissions.upsert({
        guildId: guildId,
        featureId: featureId,
      });
      await interaction.followUp({
        embeds: [new SuccessEmbed(interaction.client.user, "Success", `**${guildId}** has granted **${featureId}**`)],
        ephemeral: true,
      });
    } else if (subcommand === "removepermission") {
      const featureId = interaction.options.get("featureid", true).value as string;
      const guildId = interaction.options.get("guildid", true).value as string;
      await Permissions.destroy({
        where: {
          guildId: guildId,
          featureId: featureId,
        },
      });
      await interaction.followUp({
        embeds: [new SuccessEmbed(interaction.client.user, "Success", `**${guildId}** has removed **${featureId}**`)],
        ephemeral: true,
      });
    }
  },
};
