const { EventBuilder } = require("handler.djs");
const { Interaction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, } = require("discord.js");

const prisma = require('../prisma');

module.exports = new EventBuilder()
    .setEvent('ButtonClick')
    .setExecution(Execution);

/**
 *
 * @param {Interaction} interaction
 */
async function Execution(interaction) {
    if (interaction.customId !== 'ticket-open') return;
    const Panals = await prisma.panal.findMany({ where: { disabled: { equals: false } } });
    if (Panals.length === 0) return interaction.reply({ content: '> **There is no tickets for now 🔔**', ephemeral: true });


    const select = new StringSelectMenuBuilder().setCustomId('panals-list').setPlaceholder('Choose Ticket type here');
    Panals.forEach((panal) => {
        const Option = new StringSelectMenuOptionBuilder()
            .setLabel(panal.name)
            .setDescription(panal.description)
            .setValue(panal.id)

        select.addOptions(Option)
    });


    const Row = new ActionRowBuilder()
        .addComponents(select)

    interaction.reply({ components: [Row], ephemeral: true });
};