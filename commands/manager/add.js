const { EmbedBuilder, userMention, Message: djsMessage, PermissionsBitField } = require('discord.js');
const { CommandBuilder, Message } = require('handler.djs');

const prisma = require('../../prisma');

module.exports = new CommandBuilder()
    .setName('add')
    .setMessageExecution(Execute);

/**
 * 
 * @param {Message | djsMessage} message 
 */

async function Execute(message) {
    const userId = message[0]?.replace(/[<@!>]/g, '');
    const Ticket = await prisma.ticket.findFirst({ where: { id: message.channel.id }, include: { panal: true } });
    let havePermissons = false;
    const userRoles = [...message.member.roles.cache.values()];

    if (!Ticket) return message.replyNoMention({ content: 'You cann^t use this command out of a ticket channel' });
    if (!userId) return message.replyNoMention({ content: 'Invalid user id' });

    await Ticket.panal.supportRoles.forEach((roleId) => {
        if (userRoles.find(role => role.id === roleId)) return havePermissons = true;
    });

    if (!havePermissons) return message.reply({ content: "> **You dont have permissons to use this command ⚠**", ephemeral: true });

    const user = await message.guild.members.fetch(userId).then(user => user.user).catch(e => null);
    if (!user) return message.replyNoMention({ content: 'Invalid user id' });

    if (user.id === message.author.id) return message.replyNoMention('You can^t (add/remove) yourself from a ticket');

    message.channel.permissionOverwrites.set([
        ...message.channel.permissionOverwrites.cache.values(),
        {
            id: user.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
        }
    ]);

    const Embed = new EmbedBuilder().setColor('Blue').setDescription(`User ${userMention(user.id)} add by ${userMention(message.author.id)}`);
    message.replyNoMention({ embeds: [Embed], content: `${userMention(userId)}` });
}