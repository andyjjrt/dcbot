import { Client, Collection, ClientOptions, REST, Routes } from "discord.js";
import path from "path";
import { readdirSync } from "fs";
import { logger } from "./log";

export default class MyClient extends Client<true> {
  commandCollection: Collection<string, any>;
  contextCollection: Collection<string, any>;
  guildCommandCollection: Collection<string, Collection<string, any>>;
  guildContextCollection: Collection<string, Collection<string, any>>;
  private _clientId: string;
  private _token: string;
  constructor(options: ClientOptions, clientId = "", token = "", commandsPath = "", contextsPath = "") {
    super(options);
    this.commandCollection = new Collection();
    this.contextCollection = new Collection();
    this.guildCommandCollection = new Collection();
    this.guildContextCollection = new Collection();
    this._clientId = clientId;
    this._token = token;

    [
      { path: commandsPath, collection: this.commandCollection, guildCollection: this.guildCommandCollection },
      { path: contextsPath, collection: this.contextCollection, guildCollection: this.guildContextCollection },
    ].forEach((_path) => {
      const commandFiles = readdirSync(_path.path).filter(
        (file) => (file.endsWith(".ts") || file.endsWith(".js")) && !file.includes("disable")
      );
      for (const file of commandFiles) {
        const command = require(path.join(_path.path, file));
        if (command.default.allowGuilds) {
          command.default.allowGuilds.forEach((guild: string) => {
            if (!_path.guildCollection.get(guild)) {
              _path.guildCollection.set(guild, new Collection());
            }
            _path.guildCollection.get(guild)!.set(command.default.data.name, command.default);
          });
        }
        _path.collection.set(command.default.data.name, command.default);
      }
    });
  }

  public async refreshCommands() {
    const rest = new REST({ version: "10" }).setToken(this._token);
    try {
      const data: any = await rest.put(Routes.applicationCommands(this._clientId), {
        body: [
          ...this.commandCollection.filter((command) => !command.allowGuilds).map((command) => command.data.toJSON()),
          ...this.contextCollection.filter((command) => !command.allowGuilds).map((command) => command.data.toJSON()),
        ],
      });
      logger.info(`Reloaded ${data.length} global commands`);
      for (const colleciton of [this.guildCommandCollection, this.guildContextCollection]) {
        for (const [guildId, collection] of colleciton) {
          const tmp: any = await rest.put(Routes.applicationGuildCommands(this._clientId, guildId), {
            body: collection.map((command) => command.data.toJSON()),
          });
          logger.info(`Reloaded ${tmp.length} guild commands in ${guildId}`);
        }
      }
    } catch (error) {
      logger.error(error, "Unknown error");
    }
  }
}
