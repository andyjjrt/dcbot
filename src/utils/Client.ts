import { Client, Collection, ClientOptions, REST, Routes } from "discord.js"
import commands from "../commands";

export default class MyClient extends Client<true> {
  collection: Collection<string, any> // use correct type :)
  private _clientId: string
  private _token: string
  constructor(options: ClientOptions, clientId = "", token = "") {
    super(options)
    this.collection = new Collection();
    this._clientId = clientId;
    this._token = token;
    this.refreshCommands();
    this.loadCommands();
  }

  loadCommands() {
    commands.forEach((command) => {
      this.collection.set(command.data.name, command);
    });
  }

  refreshCommands() {
    const rest = new REST({ version: '10' }).setToken(this._token);
    (async () => {
      try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
          Routes.applicationCommands(this._clientId),
          { body: commands.map(command => command.data.toJSON()) },
        ) as any;

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
      } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
      }
    })();
  }
}