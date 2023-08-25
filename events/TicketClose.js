const { EventBuilder } = require("handler.djs");
const { Interaction, EmbedBuilder, inlineCode, userMention, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const discordTranscripts = require('discord-html-transcripts');
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
    if (interaction.customId !== 'close-ticket') return;
    const Ticket = await prisma.ticket.findFirst({ where: { id: interaction.channel.id }, include: { panal: true } });
    const id = interaction.channel.id;

    if (Ticket.claimedBy) {
        if ((Ticket.claimedBy !== interaction.user.id) && (Ticket.openedBy !== interaction.user.id) && (!interaction.member.permissions.serialize().Administrator)) return interaction.reply({ content: `${userMention(interaction.user.id)} You dont have permissons to close this ticket` });
    }

    if (Ticket.closedBy) {
        const Html = await discordTranscripts.createTranscript(interaction.channel, {
            limit: -1,
            poweredBy: false,
            returnType: discordTranscripts.ExportReturnType.String,
        });

        await interaction.channel.delete().then(async () => {

            await prisma.ticket.update({
                where: { id }, data: {
                    deleted: true,
                    deletedBy: interaction.user.id,
                    transcript: Html
                }
            });

            if (Ticket.panal.deleteLogChannelMenu) {
                const embed = Log(Ticket.panal, Ticket.id, interaction.user.id, 'delete');
                const LogChannel = await interaction.guild.channels.cache.get(Ticket.panal.deleteLogChannelMenu);
                LogChannel?.send({ embeds: [embed] })
            };
        }).catch((e) => {
            console.log(e)
            interaction.channel.send({ content: 'There was an error while deleting this ticket' })
        });
        return
    };

    if (Ticket.panal.oneStepClose) {
        await interaction.channel.delete().then(async () => {
            await prisma.ticket.update({
                where: { id }, data: {
                    deletedBy: interaction.user.id,
                    closedBy: interaction.user.id,
                    deleted: true,
                    closedAt: new Date(Date.now()),
                }
            });

            if (Ticket.panal.deleteLogChannelMenu) {
                const embed = Log(Ticket.panal, Ticket.id, interaction.user.id, 'delete');
                const LogChannel = await interaction.guild.channels.cache.get(Ticket.panal.deleteLogChannelMenu);
                LogChannel?.send({ embeds: [embed] })
            };

        }).catch(() => {
            interaction.channel.send({ content: 'There was an error while deleting this ticket' })
        });
    } else {
        await prisma.ticket.update({
            where: { id }, data: {
                closedBy: interaction.user.id,
                closedAt: new Date(Date.now())
            }
        });

        Ticket.users.forEach((userId) => {
            interaction.channel.permissionOverwrites.delete(userId)?.catch?.(e => null);
        });
        interaction.channel.permissionOverwrites.delete(Ticket.openedBy)?.catch?.(e => null);

        const Embed = new EmbedBuilder()
            .setColor('Red')
            .setDescription(inlineCode(`Ticket was Closed by ${interaction.user.username}`))

        const Close = new ButtonBuilder().setCustomId('close-ticket').setLabel('🗑 delete').setStyle(ButtonStyle.Danger);
        const Reopen = new ButtonBuilder().setCustomId('reopen-ticket').setLabel('🔓 open').setStyle(ButtonStyle.Success);
        const Transcript = new ButtonBuilder().setCustomId('transcript-ticket').setLabel('📎 Transcript').setStyle(ButtonStyle.Secondary);
        const Row = new ActionRowBuilder().addComponents(Close, Reopen, Transcript);

        if (Ticket.panal.closeChannelLogMenu) {
            const embed = Log(Ticket.panal, Ticket.id, interaction.user.id, 'close');
            const LogChannel = await interaction.guild.channels.cache.get(Ticket.panal.closeChannelLogMenu);
            LogChannel?.send({ embeds: [embed] })
        };

        interaction.reply({ embeds: [Embed], components: [Row] });
    };

};