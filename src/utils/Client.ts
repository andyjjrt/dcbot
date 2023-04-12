import { Client, Collection, ClientOptions, REST, Routes } from "discord.js";
import path from "path";
import { readdirSync } from "fs";

export default class MyClient extends Client<true> {
  collection: Collection<string, any>;
  private _clientId: string;
  private _token: string;
  constructor(
    options: ClientOptions,
    clientId = "",
    token = "",
    commandsPath = ""
  ) {
    super(options);
    this.collection = new Collection();
    this._clientId = clientId;
    this._token = token;
    const commandFiles = readdirSync(commandsPath).filter(
      (file) =>
        (file.endsWith(".ts") || file.endsWith(".js")) &&
        !file.includes("disable")
    );
    for (const file of commandFiles) {
      const command = require(path.join(commandsPath, file));
      this.collection.set(command.default.data.name, command.default);
    }
  }

  public async refreshCommands() {
    const rest = new REST({ version: "10" }).setToken(this._token);
    try {
      const data = (await rest.put(Routes.applicationCommands(this._clientId), {
        body: this.collection.map((command) => command.data.toJSON()),
      })) as any;
      return data.length;
    } catch (error) {
      console.error(error);
      return -1;
    }
  }
}
