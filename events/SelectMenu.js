const { EventBuilder } = require("handler.djs");
const { Interaction, OverwriteResolvable, PermissionsBitField, roleMention, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, userMention, channelMention } = require("discord.js");
const { Log } = require('../src/util');

const prisma = require('../prisma');

module.exports = new EventBuilder()
    .setEvent('SelectMenu')
    .setExecution(Execution);

/**
 *
 * @param {Interaction} interaction
 */
async function Execution(interaction) {
    if (interaction.customId !== 'panals-list') return;

    const id = interaction.values[0];
    const Flags = PermissionsBitField.Flags;
    const userRoles = [...interaction.member.roles.cache.values()];
    let heCanOpenTicket = false;
    let isPermisson = false;

    const Panal = await prisma.panal.findFirst({ where: { id } });
    if (!Panal) return interaction.update({ content: "> **This panal is not found**", components: [] });

    Panal.allowedRoles.forEach((r) => {
        if (userRoles.find(role => role.id === r)) return heCanOpenTicket = true;
    });

    Panal.blackListRoles.forEach((r) => {
        if (userRoles.find(role => role.id === r)) {
            isPermisson = true;
            return heCanOpenTicket = false;
        }

    });

    if ((Panal.allowedRoles[0] === interaction.guild.roles.everyone.id)) heCanOpenTicket = true;
    if (!heCanOpenTicket && isPermisson) return interaction.update({ content: `> **You dont have permissons to open this ticket !**`, components: [] });
    if (!heCanOpenTicket) return interaction.update({ content: `> **You need to have one of these roles [${Panal.allowedRoles.map((r) => roleMention(r)).join(", ")}] To Open this ticket !**`, components: [] });

    let Tickets = await prisma.ticket.findMany({
        where: {
            panalId: Panal.id,
            openedBy: interaction.user.id,
            deleted: false,
        },
    });

    let FilterTickets = Tickets.filter(ticket => ticket.closedBy === null);
    FilterTickets = FilterTickets.filter(ticket => interaction.guild.channels.cache.get(ticket.id));

    console.log(FilterTickets);

    if (FilterTickets.length >= Panal.limit) return interaction.update({ content: `> **You can open only ${Panal.limit} Tickets**`, components: [] });

    await Tickets.forEach(async (ticket) => {
        const channel = await interaction.guild.channels.cache.get(ticket.id);
        if (!channel) {
            await prisma.ticket.update({
                where: { id: ticket.id },
                data: {
                    deleted: true,
                    deletedBy: 'unkown',
                    closedBy: 'unkown',
                    closedAt: new Date(Date.now()),
                }
            });
        };
    });

    /** @type {OverwriteResolvable[]} */
    const permisson = [
        {
            id: interaction.user.id,
            allow: [Flags.ViewChannel, Flags.SendMessages, Flags.ReadMessageHistory, Flags.AddReactions]
        },
        {
            id: interaction.guild.roles.everyone.id,
            deny: [Flags.ViewChannel, Flags.SendMessages, Flags.ReadMessageHistory]
        }
    ];

    if (Panal.addAllBots) {
        const members = await interaction.guild.members.cache.filter(member => member.user.bot);
        members.forEach(member => {
            permisson.push({
                id: member.id,
                allow: [Flags.ViewChannel, Flags.SendMessages, Flags.ReadMessageHistory]
            })
        })
    }

    if (Panal.supportRoles && Panal.supportRoles[0]) {
        Panal.supportRoles.forEach((role) => {
            if (interaction.guild.roles.everyone.id !== role) {
                permisson.push({
                    id: role,
                    allow: [Flags.ViewChannel, Flags.SendMessages, Flags.ReadMessageHistory, Flags.AddReactions]
                });
            }

        });
    };

    const category = await interaction.guild.channels.cache.get(Panal.category);
    if (!category) return interaction.update({ content: "This Ticket panals is disabled for now contact with the support team for help !", components: [] });
    const TicketChannel = await interaction.guild.channels.create({ name: `Ticket-${interaction.user.username}`, permissionOverwrites: permisson, parent: category });

    const Embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('New Ticket')
        .setDescription(`This Ticket is created By ${interaction.user.username}\n(**${Panal.name}**)`)
        .setFooter({ iconURL: interaction.guild.iconURL(), text: interaction.user.username })
        .setTimestamp()
        .setThumbnail(interaction.guild.iconURL({ forceStatic: true }));


    const CloseButton = new ButtonBuilder()
        .setCustomId('close-ticket')
        .setStyle(ButtonStyle.Danger)
        .setLabel('🔐 Close');

    const ClaimButton = new ButtonBuilder()
        .setCustomId('claim-ticket')
        .setStyle(ButtonStyle.Success)
        .setLabel('🙋‍♂️ Claim');

    const Row = new ActionRowBuilder().addComponents(CloseButton);
    if (Panal.claimButton) Row.addComponents(ClaimButton);

    TicketChannel.send({ content: `${userMention(interaction.user.id)}`, embeds: [Embed], components: [Row] })

    await prisma.ticket.create({
        data: {
            id: TicketChannel.id,
            panalId: Panal.id,
            openedBy: interaction.user.id,
            name: TicketChannel.name
        }
    }).then(async (data) => {
        const embed = Log(Panal, data.id, interaction.user.id, 'open');
        if (Panal.openLogChannelMenu) {
            const LogChannel = await interaction.guild.channels.cache.get(Panal.openLogChannelMenu);
            LogChannel?.send({ embeds: [embed] })
        };

        interaction.update({ content: `> **New ticket created for you ${channelMention(TicketChannel.id)}**`, components: [] })
    })

};