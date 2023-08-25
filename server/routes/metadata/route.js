const { Router } = require('express');
const { Client, ChannelType } = require('discord.js');
const cache = require('apicache');


/** @type {Client} */
const client = require('../../../');
const prisma = require('../../../prisma');
const Route = Router();
const Apicache = cache.middleware;

Route.get('/', Apicache(5), async (req, res) => {
    if (!client.user) return res.status(201).send({ error: true, message: 'Client is not ready yet' });

    const guild = client.guilds.cache.get(client.Application.getData('guildId'));
    const guildOwner = await guild.fetchOwner();

    const roles = [...guild.roles.cache.values()];
    const channels = [...guild.channels.cache.values()];
    const categories = channels.filter(channel => channel.type == ChannelType.GuildCategory);

    const Tickets = await prisma.ticket.findMany();
    const closed = Tickets.filter(ticket => ticket.deleted);
    const newTickets = Tickets.filter(ticket => !ticket.deleted && !ticket.closedBy)

    /** @type {DashboardContext} */
    const data = {
        username: client.user.username,
        serverName: guild.name,
        serverImage: guild.iconURL(),
        botImage: client.user.displayAvatarURL(),
        userImage: client.user.displayAvatarURL(),
        statics: {
            server: {
                owner: {
                    id: guildOwner.user.id,
                    username: guildOwner.user.username,
                },
                roles: roles,
                channels: channels.filter(channel => channel.type == ChannelType.GuildText),
                categories: categories
            },
            tickets: {
                total: Tickets.length,
                new: newTickets.length,
                closed: closed.length,
            },
        },
    };

    res.json(data);
})

module.exports = Route