const { CommandBuilder, Message } = require("handler.djs");
const { EmbedBuilder, inlineCode, Message: djs } = require("discord.js");

const prisma = require('../../prisma');

module.exports = new CommandBuilder()
    .setName('delete')
    .setMessageExecution(Execute)
    .OwnersOnly();

/**
 * 
 * @param {Message | djs} message 
 */
async function Execute(message) {
    let id = message[0] || message.channel.id;

    const Ticket = await prisma.ticket.findFirst({ where: { id, deleted: false } });
    if (!Ticket || Ticket.closedBy) return message.replyNoMention(`The give id is not a (ticket | invalid) id`);

    const ticket = await message.guild.channels.cache.get(Ticket.id);
    if (!ticket) return message.replyNoMention(`The give id is not a (ticket | invalid) id`);

    ticket.deleted().then(() => {
        message.replyNoMention('Ticket deleted')
    }).catch(e => message.replyNoMention('error'))
};