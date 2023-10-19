import { EmbedBuilder, Client, User, APIUser, ClientUser } from "discord.js";

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
  constructor(user: ClientUser | User | APIUser, name: string, url: string) {
    super();
    this.setColor(0x3ca2cd)
      .setTitle(`:arrow_forward:  Now Playing`)
      .setDescription(`[${name}](${url})`)
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
      .setDescription(description)
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
