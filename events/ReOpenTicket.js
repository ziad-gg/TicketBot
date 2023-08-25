const { EventBuilder } = require("handler.djs");
const { Interaction, EmbedBuilder, userMention, PermissionsBitField } = require("discord.js");
const { Log } = require('../src/util');

const prisma = require('../prisma');

module.exports = new EventBuilder()
    .setEvent('ButtonClick')
    .setExecution(Execution);

/**
 *
 * @param {Interaction} interaction
 */
async function Execution(interaction) {
    if (interaction.customId !== 'reopen-ticket') return;
    const Ticket = await prisma.ticket.findFirst({ where: { id: interaction.channel.id }, include: { panal: true } });

    if (Ticket.claimedBy) {
        if ((Ticket.claimedBy !== interaction.user.id) && (Ticket.openedBy !== interaction.user.id) && (!interaction.member.permissions.serialize().Administrator)) return interaction.reply({ content: `${userMention(interaction.user.id)} You dont have permissons to close this ticket` });
    };

    await prisma.ticket.update({
        where: { id: interaction.channel.id },
        data: {
            closedBy: null,
            closedAt: null,
        }
    }).then(async () => {

        interaction.channel.permissionOverwrites.set([
            ...interaction.channel.permissionOverwrites.cache.values(),
            {
                id: Ticket.openedBy,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
            }
        ])
        const embed = new EmbedBuilder().setColor('Green').setDescription(`Ticket Reopened by ${userMention(interaction.user.id)}`)
        interaction.update({ components: [], embeds: [embed] });

        if (Ticket.panal.openLogChannelMenu) {
            const embedLog = Log(Ticket.panal, Ticket.id, interaction.user.id, 'reopen');
            const LogChannel = await interaction.guild.channels.cache.get(Ticket.panal.openLogChannelMenu);
            LogChannel?.send({ embeds: [embedLog] })
        };
    }).catch((e) => {
        console.log(e)
        interaction.reply({ content: `There was an error while reopening this ticket` })
    })

};