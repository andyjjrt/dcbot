import { Client, Collection, ClientOptions, REST, Routes } from "discord.js";
import path from "path";
import { readdirSync } from "fs";
import { logger } from "./log";

export default class MyClient extends Client<true> {
  commandCollection: Collection<string, any>;
  contextCollection: Collection<string, any>;
  rest: REST;
  private _clientId: string;
  private _token: string;
  constructor(options: ClientOptions, clientId = "", token = "", commandsPath = "", contextsPath = "") {
    super(options);
    this.commandCollection = new Collection();
    this.contextCollection = new Collection();
    this._clientId = clientId;
    this._token = token;
    this.rest = new REST({ version: "10" }).setToken(this._token);
    const commandFiles = readdirSync(commandsPath).filter(
      (file) => (file.endsWith(".ts") || file.endsWith(".js")) && !file.includes("disable")
    );
    for (const file of commandFiles) {
      const command = require(path.join(commandsPath, file));
      this.commandCollection.set(command.default.data.name, command.default);
    }
    const contextFile = readdirSync(contextsPath).filter(
      (file) => (file.endsWith(".ts") || file.endsWith(".js")) && !file.includes("disable")
    );
    for (const file of contextFile) {
      const context = require(path.join(contextsPath, file));
      this.contextCollection.set(context.default.data.name, context.default);
    }
  }

  public async refreshCommands() {
    try {
      const data = (await this.rest.put(Routes.applicationCommands(this._clientId), {
        body: [
          ...this.commandCollection.map((command) => command.data.toJSON()),
          ...this.contextCollection.map((command) => command.data.toJSON()),
          {
            name: "launch",
            description: "Launch Rosetta Activity",
            type: 4,
            handler: 2,
            integration_types: [0, 1],
            contexts: [0, 1, 2],
          },
        ],
      })) as any;
      logger.info(`Reloaded ${data.filter((c: any) => c.type === 1).length} commands`);
      logger.info(`Reloaded ${data.filter((c: any) => c.type === 3).length} contexts`);
    } catch (error) {
      logger.error(error, "Unknown error");
    }
  }
}
