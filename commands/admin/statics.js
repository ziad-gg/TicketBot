const { CommandBuilder, Message } = require("handler.djs");
const { getTicketsByDateRange } = require("../../src/util");
const { EmbedBuilder, inlineCode, Message: djs } = require("discord.js");

module.exports = new CommandBuilder()
    .setName('statics')
    .setMessageExecution(Execute)
    .OwnersOnly();

/**
 * 
 * @param {Message | djs} message 
 */
async function Execute(message) {
    let type = message[0]?.toLowerCase();
    if (!type || type !== 'day' && type !== 'month' && type !== 'week' && type !== 'year') type = 'day';

    await message.channel.sendTyping();
    const statics = await getTicketsByDateRange(type);

    const Embed = new EmbedBuilder()
        .setColor('Random')
        .setTitle(`this ${type} statics`)
        .addFields([
            { name: '**Total Tickets**', value: inlineCode(statics.length) },
            { name: '**Total Claimed**', value: inlineCode(statics.filter(ticket => ticket.claimedBy).length) },
            { name: '**Total Closed**', value: inlineCode(statics.filter(ticket => ticket.deleted && ticket.closedBy).length) },
        ])
        .setAuthor({ name: message.author.username, iconURL: message.author.avatarURL() })
        .setThumbnail(message.guild.iconURL())
        .setTimestamp()

    message.replyNoMention({ embeds: [Embed] })
};