import { ErrorEmbed, SuccessEmbed } from "../utils/Embed";
import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { client, subscriptions } from "../index";
import { pinyin } from "pinyin-pro";
const { HOWHOW_DIR } = process.env;
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";

export default {
  data: new SlashCommandBuilder()
    .setName("howhow")
    .setDescription("Use howhow to say")
    .addStringOption((option) =>
      option.setName("sentence").setDescription("Sentence").setRequired(true)
    ),
  async execute(interaction: CommandInteraction) {
    await interaction.deferReply();
    const sentence = interaction.options.get("sentence", true).value as string;
    sentence.replace(" ", "");
    const pin = pinyin(sentence, { toneType: "num" });
    console.log(pin);
    const promise = new Promise((resolve, reject) => {
      const ffmpegProcess = ffmpeg()
        .on("error", function (err) {
          console.log("An error occurred: " + err.message);
          reject(err);
        })
        .on("end", function () {
          console.log("Merging finished !");
          resolve(true);
        });
      pin.split(" ").forEach((value) => {
        if (!fs.existsSync(`${HOWHOW_DIR}/${value}.mp4`)) {
          ffmpegProcess.input(`${HOWHOW_DIR}/沒有這個音.mp4`);
        } else {
          ffmpegProcess.input(`${HOWHOW_DIR}/${value}.mp4`);
        }
      });
      ffmpegProcess.mergeToFile(
        `${HOWHOW_DIR}/result/${sentence}.mp3`,
        `${HOWHOW_DIR}`
      );
    });
    let subscription = subscriptions.get(interaction.guildId!);

    promise
      .then(() => {
        return interaction.followUp({
          files: [`${HOWHOW_DIR}/result/${sentence}.mp3`],
        });
      })
      .catch(async (err: Error) => {
        return interaction.followUp({
          embeds: [
            new ErrorEmbed(
              interaction.client.user,
              "Error",
              "Failed to parse, please check your input"
            ),
          ],
        });
      });
  },
};
