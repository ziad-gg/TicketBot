const { Client } = require("discord.js");
const { Application } = require("handler.djs");
const { join } = require("node:path");
require("dotenv").config();

const client = new Client({
  intents: 3276799,
});

new Application(client, {
  prefix: '$',
  commandsPath: join(__dirname, "commands"),
  EventsPath: join(__dirname, "events"),
  owners: ['860865950945378325']
});

client.Application.setData(require('./src/config.js'));

client.Application.build();
client.login(process.env.BOT_TOKEN);

module.exports = client;
