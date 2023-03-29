import { EmbedBuilder, CommandInteraction } from "discord.js";

export class SuccessEmbed extends EmbedBuilder {
  constructor(interaction: CommandInteraction, title: string, description: string) {
    super();
    this.setColor(0x33ff33)
      .setTitle(`:white_check_mark: ${title}`)
      .setDescription(description)
      .setTimestamp()
      .setFooter({
        text: interaction.client.user.username,
        iconURL: interaction.client.user.avatarURL() || ""
      });
  }
}

export class PlayingEmbed extends EmbedBuilder {
  constructor(interaction: CommandInteraction, name: string, url: string) {
    super();
    this.setColor(0x3ca2cd)
      .setTitle(`:arrow_forward: Now Playing`)
      .setDescription(`[${name}](${url})`)
      .setTimestamp()
      .setFooter({
        text: interaction.client.user.username,
        iconURL: interaction.client.user.avatarURL() || ""
      });
  }
}

export class PendingEmbed extends EmbedBuilder {
  constructor(interaction: CommandInteraction, description: string) {
    super();
    this.setColor(0x53fafa)
      .setTitle(`:inbox_tray: Processing`)
      .setDescription(description.length === 0 ? null : description)
      .setTimestamp()
      .setFooter({
        text: interaction.client.user.username,
        iconURL: interaction.client.user.avatarURL() || ""
      });
  }
}

export class ErrorEmbed extends EmbedBuilder {
  constructor(interaction: CommandInteraction, title: string, description: string) {
    super();
    this.setColor(0xff0000)
      .setTitle(`:x: ${title}`)
      .setDescription(description)
      .setTimestamp()
      .setFooter({
        text: interaction.client.user.username,
        iconURL: interaction.client.user.avatarURL() || ""
      });
  }
}

export class CatEmbed extends EmbedBuilder {
  constructor(interaction: CommandInteraction, image: string) {
    super();
    this.setColor(0xd6e5fc)
      .setTitle(`:cat: Random cat`)
      .setImage(image)
      .setTimestamp()
      .setFooter({
        text: interaction.client.user.username,
        iconURL: interaction.client.user.avatarURL() || ""
      });
  }
}