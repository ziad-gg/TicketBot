const { EventBuilder } = require('handler.djs');
const { Interaction, hyperlink } = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');
const { projectURL } = require('../src/config.js');

const prisma = require('../prisma');

module.exports = new EventBuilder()
    .setEvent('ButtonClick')
    .setExecution(Execution);

/**
 *
 * @param {Interaction} interaction
 */
async function Execution(interaction) {
    if (interaction.customId !== 'transcript-ticket') return;

    const Html = await discordTranscripts.createTranscript(interaction.channel, {
        limit: -1,
        poweredBy: false,
        returnType: discordTranscripts.ExportReturnType.String,
    });

    await prisma.ticket.update({
        where: { id: interaction.channel.id },
        data: { transcript: Html }
    }).then(async () => {
       interaction.reply({ content: `You can view this transcript ${hyperlink('Here', `${projectURL}/${interaction.channel.id}`)}` })
    })
}