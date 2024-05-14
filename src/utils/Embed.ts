import { EmbedBuilder, Client, User, APIUser, ClientUser } from "discord.js";
import { TrackMetadata } from "../types/Track";
import { ChatResponse } from "ollama";
const { OLLAMA_MODEL } = process.env;

export class SuccessEmbed extends EmbedBuilder {
  constructor(user: ClientUser | User | APIUser, title: string, description: string) {
    super();
    this.setColor(0x33ff33)
      .setTitle(`:white_check_mark:  ${title}`)
      .setDescription(description)
      .setTimestamp()
      .setFooter({
        text: user.username,
        iconURL: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
      });
  }
}

export class PlayingEmbed extends EmbedBuilder {
  constructor(user: ClientUser | User | APIUser, metaData: TrackMetadata) {
    super();
    this.setColor(0x3ca2cd)
      .setTitle(`:arrow_forward:  Now Playing`)
      .setDescription(
        `**[${metaData.title}](${metaData.url})**\nBy ${
          metaData.channelUrl ? `[${metaData.channel}](${metaData.channelUrl})` : metaData.channel
        }`
      )
      .setTimestamp()
      .setFooter({
        text: user.username,
        iconURL: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
      });
  }
}

export class ErrorEmbed extends EmbedBuilder {
  constructor(user: ClientUser | User | APIUser, title: string, description: string) {
    super();
    this.setColor(0xff0000)
      .setTitle(`:x:  ${title}`)
      .setDescription(description.slice(0, 4096))
      .setTimestamp()
      .setFooter({
        text: user.username,
        iconURL: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
      });
  }
}

export class CatEmbed extends EmbedBuilder {
  constructor(user: ClientUser | User | APIUser, image: string) {
    super();
    this.setColor(0xd6e5fc)
      .setTitle(`:cat:  Random cat`)
      .setImage(image)
      .setTimestamp()
      .setFooter({
        text: user.username,
        iconURL: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
      });
  }
}

export class InfoEmbed extends EmbedBuilder {
  constructor(user: ClientUser | User | APIUser, title: string, description: string) {
    super();
    this.setColor(0x53fafa)
      .setTitle(title)
      .setDescription(description.length === 0 ? null : description)
      .setTimestamp()
      .setFooter({
        text: user.username,
        iconURL: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
      });
  }
}

export class AIEmbed extends EmbedBuilder {
  constructor(user: ClientUser | User | APIUser, question: string, response: ChatResponse) {
    super();
    this.setColor(0x53fafa)
      .setTitle(":llama: AI answer")
      .setDescription(`Q: ${question}\nA: ${response.message.content}`)
      .setTimestamp()
      .setFooter({
        text: `${response.model} | ${((response.eval_count * 1000000000) / response.eval_duration).toFixed(2)} tps`,
      });
  }
}
