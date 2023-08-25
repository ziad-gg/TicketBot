const { EventBuilder } = require("handler.djs");
const { Interaction, EmbedBuilder, inlineCode, userMention, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const { Log } = require("../src/util");

const prisma = require('../prisma');

module.exports = new EventBuilder()
    .setEvent('ButtonClick')
    .setExecution(Execution);

/**
 *
 * @param {Interaction} interaction
 */
async function Execution(interaction) {
    if (interaction.customId !== 'claim-ticket') return;
    const Ticket = await prisma.ticket.findFirst({ where: { id: interaction.channel.id }, include: { panal: true } });
    const userRoles = [...interaction.member.roles.cache.values()];
    let havePermissons = false;

    const CloseButton = new ButtonBuilder()
        .setCustomId('close-ticket')
        .setStyle(ButtonStyle.Danger)
        .setLabel('🔐 Close');

    const ClaimButton = new ButtonBuilder()
        .setCustomId('claim-ticket')
        .setStyle(ButtonStyle.Success)
        .setLabel('🙋‍♂️ Claim');

    const Row = new ActionRowBuilder().addComponents(CloseButton, ClaimButton);

    if (Ticket.closedBy && !Ticket.claimedBy) return interaction.reply({ content: `> **You can^t (claim/unclaim) this ticket after close**`, ephemeral: true });

    if (Ticket.claimedBy === interaction.user.id) {
        await prisma.ticket.update({
            where: { id: interaction.channel.id },
            data: {
                claimedBy: null,
            }
        }).then(async () => {
            interaction.update({ components: [Row] });
            const embed = new EmbedBuilder().setColor('Red').setDescription(`Ticket Unclaimed by ${userMention(interaction.user.id)}`)
            interaction.channel.send({ content: `${userMention(Ticket.openedBy)}`, embeds: [embed] });

            interaction.channel.setTopic(`Ticket was claimed by ${interaction.user.username}`)
            interaction.channel.permissionOverwrites.delete(interaction.user.id);
            Ticket.panal.supportRoles.forEach((roleId) => {
                interaction.channel.permissionOverwrites.edit(roleId, { SendMessages: true });
            });

            if (Ticket.panal.claimLogChannelMenu) {
                const embedLog = Log(Ticket.panal, Ticket.id, interaction.user.id, 'unclaim');
                const LogChannel = await interaction.guild.channels.cache.get(Ticket.panal.claimLogChannelMenu);
                LogChannel?.send({ embeds: [embedLog] })
            };

        }).catch(() => {
            interaction.reply({ content: 'Error while unclaiming the ticket ⚠', ephemeral: true })
        })

        return;
    }

    await Ticket.panal.supportRoles.forEach((roleId) => {
        if (userRoles.find(role => role.id === roleId)) return havePermissons = true;
    });

    if (!havePermissons && !Ticket.claimedBy) return interaction.reply({ content: "> **You dont have permissons to claim this ticket 🟢**", ephemeral: true });
    if (Ticket.claimedBy) return interaction.reply({ content: `> **This ticket is claimed by ${userMention(Ticket.claimedBy)} ⚠**`, ephemeral: true });
    if (interaction.user.id === Ticket.openedBy) return interaction.reply({ content: `> **You cant claim your ticket ⚠**`, ephemeral: true });

    await prisma.ticket.update({
        where: { id: interaction.channel.id },
        data: {
            claimedBy: interaction.user.id,
        }
    }).then(async () => {
        ClaimButton.setLabel('🙋‍♂️ Unclaim').setStyle(ButtonStyle.Secondary)
        interaction.update({ components: [Row] });
        const embed = new EmbedBuilder().setColor('Green').setDescription(`Ticket is claimed by ${userMention(interaction.user.id)}`);
        interaction.channel.send({ content: `${userMention(Ticket.openedBy)}`, embeds: [embed] });
        interaction.channel.setTopic(`Ticket claimed by ${interaction.user.username}`)

        Ticket.panal.supportRoles.forEach(async (roleId) => {
            interaction.channel.permissionOverwrites.edit(roleId, { SendMessages: false });
        });

        interaction.channel.permissionOverwrites.edit(interaction.user.id, { SendMessages: true });

        if (Ticket.panal.claimLogChannelMenu) {
            const embedLog = Log(Ticket.panal, Ticket.id, interaction.user.id, 'claim');
            const LogChannel = await interaction.guild.channels.cache.get(Ticket.panal.claimLogChannelMenu);
            LogChannel?.send({ embeds: [embedLog] })
        };
    }).catch(() => {
        interaction.reply({ content: 'Error while claiming the ticket ⚠', ephemeral: true })
    });

};