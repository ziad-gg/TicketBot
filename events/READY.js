const { EventBuilder } = require("handler.djs");
const { Client } = require("discord.js");

module.exports = new EventBuilder()
.setEvent('ready')
.setExecution(Ready);

/**
 *
 * @param {Client} client
 */
async function Ready(client) {
  const guildId = client.Application.getData('guildId');
  const guild = client.guilds.cache.get(guildId);
  console.log(`[LOG]": ${client.user.username} is Ready`);
  guild && console.log(`[INFO]: MAIN GUILD FOUNDED [${guild.name}]`)
  require("../server");
}
