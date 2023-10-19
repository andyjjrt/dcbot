import { ErrorEmbed, InfoEmbed } from "./../utils/Embed";
import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { client, subscriptions } from "../index";
import seedrandom from "seedrandom";

export default {
  data: new SlashCommandBuilder()
    .setName("random")
    .setDescription("generate random number")
    .addNumberOption((option) => option.setName("max").setDescription("max number").setRequired(true))
    .addNumberOption((option) => option.setName("min").setDescription("min number"))
    .addNumberOption((option) => option.setName("count").setDescription("number count"))
    .addStringOption((option) => option.setName("seed").setDescription("random seed")),
  async execute(interaction: CommandInteraction) {
    const seed = (interaction.options.get("seed")?.value as string) || new Date().toISOString();
    const count = interaction.options.get("count")?.value || 1;
    const max = interaction.options.get("max", true).value as number;
    const min = interaction.options.get("min")?.value || 0;
    const rng = seedrandom(seed);
    const numbers = Array.from(new Array(parseInt(count.toString())).keys()).map((item) => Math.floor(rng() * max));
    if (numbers.toString().length > 4096) {
      await interaction.reply({
        embeds: [
          new ErrorEmbed(interaction.client.user, `Error`, `Generated random numbers too long. Max count is 4096.`),
        ],
      });
      return;
    }
    await interaction.reply({
      embeds: [new InfoEmbed(interaction.client.user, `:slot_machine:  Random number generated`, `${numbers}`)],
    });
  },
};
