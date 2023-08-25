const { EmbedBuilder, userMention, inlineCode, hyperlink } = require('discord.js');
const prisma = require('../prisma');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports.isImage = function (url) {
    return new Promise((res) => {
        fetch(url)
            .then(response => {
                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.startsWith('image/')) {
                        res(true); // Response is an image
                    } else {
                        res(false); // Response is not an image
                    }
                } else {
                    res(false); // Request was not successful
                }
            })
            .catch(error => {
                res(false); // Error occurred during fetch
            });
    });
};
/**
 * 
 * @param {{ id: String, name: String, guildId: String, closeChannelLogMenu: String, openLogChannelMenu: String, claimLogChannelMenu: String, deleteLogChannelMenu: String }} data \
 * @param {String} id
 * @param {String} by
 * @param {'open' | 'close' | 'delete' | 'claim' | 'unclaim' | 'transcript' | 'reopen'} type 
 * @returns {EmbedBuilder}
 */

module.exports.Log = function (data, id, by, type) {
    type = type.toLowerCase();

    const Embed = new EmbedBuilder()
        .addFields([
            { name: '**Action Type**', value: inlineCode(type), inline: true },
            { name: '**Panal Name**', value: inlineCode(data.name), inline: true },
            { name: '**Ticket Id**', value: inlineCode(id), inline: true },
        ])

    if (type === 'open') {
        return Embed.setColor('Green').setDescription(`**New Ticket By ${userMention(by)} ${hyperlink('Ticket', `https://discord.com/channels/${data.guildId}/${id}`)}**`)
    };

    if (type === 'close') {
        return Embed.setColor('Yellow').setDescription(`**Ticket Closed By ${userMention(by)} ${hyperlink('Ticket', `https://discord.com/channels/${data.guildId}/${id}`)}**`)
    };

    if (type === 'delete') {
        return Embed.setColor('Red').setDescription(`**Ticket Deleted By ${userMention(by)} ${hyperlink('Ticket', `https://discord.com/channels/${data.guildId}/${id}`)}**`)
    };

    if (type === 'claim' || type === 'unclaim') {
        return Embed.setColor('Orange').setDescription(`**Ticket ${type === 'claim' ? 'claimed' : 'unclaimed'} By ${userMention(by)} ${hyperlink('Ticket', `https://discord.com/channels/${data.guildId}/${id}`)}**`)
    };

    if (type === 'reopen') {
        return Embed.setColor('DarkGreen').setDescription(`**Ticket Reopened By ${userMention(by)} ${hyperlink('Ticket', `https://discord.com/channels/${data.guildId}/${id}`)}**`)
    };
}

/**
 * 
 * @param {'day' | 'week' | 'month' | 'year'} range 
 */

module.exports.getTicketsByDateRange = async function (range) {
    const year = new Date().getFullYear();
    const today = new Date();

    switch (range) {
        case 'day':
            return await prisma.ticket.findMany({
                where: {
                    createdAt: {
                        gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                    },
                },
            });

        case 'week':
            const startOfWeek = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate() - today.getDay()
            );
            return await prisma.ticket.findMany({
                where: {
                    createdAt: {
                        gte: startOfWeek,
                    },
                },
            });

        case 'month':
            return await prisma.ticket.findMany({
                where: {
                    createdAt: {
                        gte: new Date(today.getFullYear(), today.getMonth(), 1),
                    },
                },
            });

        case 'year':
            return await prisma.ticket.findMany({
                where: {
                    createdAt: {
                        gte: new Date(year, 0, 1),
                        lt: new Date(year + 1, 0, 1),
                    },
                },
            });

        default:
            throw new Error('Invalid date range parameter');
    }
};