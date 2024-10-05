import { SlashCommandBuilder, CommandInteraction, time, ChannelType } from "discord.js";
import { SuccessEmbed } from "../utils/Embed";
import { request } from "undici";

let counter = 0;

const testTimer = setInterval(() => {
  counter++;
}, 1000);

export default {
  data: new SlashCommandBuilder()
    .setName("worm")
    .setDescription("Announce worm price at")
    .addChannelOption((option) =>
      option.setName("channel").setDescription("The channel to echo into").addChannelTypes(ChannelType.GuildText)
    ),
  async execute(interaction: CommandInteraction) {
    const data = await request(`https://api.hypixel.net/v2/skyblock/bazaar`).then((res) => res.body.json());
    await interaction.reply({
      embeds: [
        new SuccessEmbed(interaction.user, "1123", JSON.stringify((data as any).products.WORM_MEMBRANE.quick_status)),
      ],
      ephemeral: true,
    });
  },
};
