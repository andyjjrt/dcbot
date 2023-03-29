import { EmbedBuilder, CommandInteraction, Client } from "discord.js";

export class SuccessEmbed extends EmbedBuilder {
  constructor(client: Client<true>, title: string, description: string) {
    super();
    this.setColor(0x33ff33)
      .setTitle(`:white_check_mark: ${title}`)
      .setDescription(description)
      .setTimestamp()
      .setFooter({
        text: client.user.username,
        iconURL: client.user.avatarURL() || ""
      });
  }
}

export class PlayingEmbed extends EmbedBuilder {
  constructor(client: Client<true>, name: string, url: string) {
    super();
    this.setColor(0x3ca2cd)
      .setTitle(`:arrow_forward: Now Playing`)
      .setDescription(`[${name}](${url})`)
      .setTimestamp()
      .setFooter({
        text: client.user.username,
        iconURL: client.user.avatarURL() || ""
      });
  }
}

export class ErrorEmbed extends EmbedBuilder {
  constructor(client: Client<true>, title: string, description: string) {
    super();
    this.setColor(0xff0000)
      .setTitle(`:x: ${title}`)
      .setDescription(description)
      .setTimestamp()
      .setFooter({
        text: client.user.username,
        iconURL: client.user.avatarURL() || ""
      });
  }
}

export class CatEmbed extends EmbedBuilder {
  constructor(client: Client<true>, image: string) {
    super();
    this.setColor(0xd6e5fc)
      .setTitle(`:cat: Random cat`)
      .setImage(image)
      .setTimestamp()
      .setFooter({
        text: client.user.username,
        iconURL: client.user.avatarURL() || ""
      });
  }
}

export class InfoEmbed extends EmbedBuilder {
  constructor(client: Client<true>, title: string, description: string) {
    super();
    this.setColor(0x53fafa)
      .setTitle(title)
      .setDescription(description.length === 0 ? null : description)
      .setTimestamp()
      .setFooter({
        text: client.user.username,
        iconURL: client.user.avatarURL() || ""
      });
  }
}