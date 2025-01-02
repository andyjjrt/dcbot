import { ErrorEmbed, InfoEmbed } from "./../utils/Embed";
import { SlashCommandBuilder, CommandInteraction, AutocompleteInteraction, AttachmentBuilder } from "discord.js";
import { client, subscriptions } from "../index";
import { Database, RunResult } from "sqlite3";
import { resolve } from "node:path";
import { Mygo } from "utils/db/schema";
import { col, fn, Op } from "sequelize";
import streamBuffers from "stream-buffers";
import Ffmpeg from "fluent-ffmpeg";

const { DB_DIR } = process.env;

export default {
  data: new SlashCommandBuilder()
    .setName("mygo")
    .setDescription("Get MyGO!!!!! picture")
    .addStringOption((option) => option.setName("text").setDescription("text").setRequired(true).setAutocomplete(true)),
  async execute(interaction: CommandInteraction) {
    let subscription = subscriptions.get(interaction.guildId!);
    const query = interaction.options.get("text", true).value as string;

    const res = await Mygo.findOne({
      attributes: [
        "text",
        "episode",
        [fn("MIN", col("frame")), "min_frame"],
        [fn("MAX", col("frame")), "max_frame"],
        "segment_id",
      ],
      where: {
        text: query,
      },
      group: ["segment_id"],
    });

    console.log(res);

    if (!res) {
      return;
    }

    const writableStreamBuffer = new streamBuffers.WritableStreamBuffer({
      initialSize: 1024 * 1024, // Initial size (1MB)
      incrementAmount: 1024 * 1024, // Growth size (1MB)
    });

    Ffmpeg(`video/${res.getDataValue("episode")}.mp4`)
      .seekInput((res.getDataValue("max_frame") + res.getDataValue("min_frame")) / 2 / 23.98)
      .outputOptions([
        "-vframes",
        "1"
      ])
      .toFormat("image2") // Set the output format to GIF
      .on("start", (commandLine) => {
        console.log("FFmpeg command: ", commandLine);
      })
      .on("error", async (err) => {
        await interaction.reply({
          embeds: [
            new ErrorEmbed(
              interaction.client.user,
              `Error`,
              JSON.stringify(err)
            ),
          ],
        });
        return;
      })
      .on("end", async () => {
        console.log("GIF created successfully!");
        const gif = writableStreamBuffer.getContents();
        if (!gif) return;
        const attachment = new AttachmentBuilder(gif);
        await interaction.reply({
          files: [attachment],
        });
      })
      .pipe(writableStreamBuffer, { end: true }); // Pipe output to the buffer
  },
  async autocomplete(interaction: AutocompleteInteraction) {
    const query = interaction.options.get("text", true).value as string;

    const res = await Mygo.findAll({
      attributes: ["text"],
      where: {
        text: {
          [Op.like]: `%${query}%`,
        },
      },
      group: ["segment_id"],
      limit: 10,
    });

    await interaction.respond(
      res.map((r) => {
        return {
          name: r.getDataValue("text"),
          value: r.getDataValue("text"),
        };
      })
    );
  },
};
