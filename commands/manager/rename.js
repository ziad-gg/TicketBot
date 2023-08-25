const { CommandBuilder, Message } = require("handler.djs");
const { Message: djs } = require("discord.js");

const prisma = require('../../prisma');

module.exports = new CommandBuilder()
    .setName('rename')
    .setMessageExecution(Execute);

/**
 * 
 * @param {Message | djs} message 
 */
async function Execute(message) {
    const name = message.slice(0, 6)?.join("-");
    const Ticket = await prisma.ticket.findFirst({ where: { id: message.channel.id } });

    if (!Ticket) return message.replyNoMention({ content: 'You cann^t use this command out of a ticket channel' });
    if (!Ticket.claimedBy || Ticket.claimedBy !== message.author.id) return message.replyNoMention({ content: 'You must claim the channel to rename id' });
    message.delete().catch(e => null);

    if (name?.[0]) {
        message.channel.setName(name);
    } else {
        const member = await message.guild.members.cache.get(Ticket.openedBy);
        message.channel.setName(`ticket-${member?.user?.username || 'member'}`);
    }
};