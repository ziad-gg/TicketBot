const { Router } = require('express');
const { Client } = require('discord.js');

/** @type {Client} */
const client = require('../../../');
const prisma = require('../../../prisma');
const Route = Router();

Route.get('/metadata', async (req, res) => {
    if (!client.user) return res.status(400).json({ error: true, message: 'Client is not ready yet' });
    const guild = client.guilds.cache.get(client.Application.getData('guildId'));
    if (!guild) return res.status(400).json({ error: true, message: 'Main guild couldnot be found' });
    const id = req.params['id'];
    if (id) {
        const Panal = await prisma.panal.findFirst({ where: { id } });
        if (!Panal) return res.status(400).json({ error: true, message: 'Panal is not found' });
        res.status(200).json(Panal);
    } else {
        const Panals = await prisma.panal.findMany({ where: { guildId: guild.id } });
        res.status(200).json(Panals);
    };
});

Route.get('/get/:id', async (req, res) => {
    if (!client.user) return res.status(400).json({ error: true, message: 'Client is not ready yet' });
    const guild = client.guilds.cache.get(client.Application.getData('guildId'));
    if (!guild) return res.status(400).json({ error: true, message: 'Main guild couldnot be found' });

    const id = req.params['id'];
    if (!id) return res.status(400).json({ error: true, message: 'missing id' });

    const Panal = await prisma.panal.findFirst({ where: { id } });
    if (!Panal) return res.status(400).json({ error: true, message: 'Panal is not found' });
    res.status(200).json(Panal);
});

Route.delete('/:id', async (req, res) => {
    if (!client.user) return res.status(400).json({ error: true, message: 'Client is not ready yet' });
    const guild = client.guilds.cache.get(client.Application.getData('guildId'));
    if (!guild) return res.status(400).json({ error: true, message: 'Main guild couldnot be found' });

    const id = req.params['id'];
    if (!id) return res.status(400).json({ error: true, message: 'missing id' });

    const Embed = await prisma.panal.findFirst({ where: { id } });
    if (!Embed) return res.status(400).json({ error: true, message: 'Panal is not found' });
    await prisma.panal.delete({ where: { id } });

    res.status(200).json({ done: true });
});

Route.post('/enable/:id', async (req, res) => {
    if (!client.user) return res.status(400).json({ error: true, message: 'Client is not ready yet' });
    const guild = client.guilds.cache.get(client.Application.getData('guildId'));
    if (!guild) return res.status(400).json({ error: true, message: 'Main guild couldnot be found' });

    const id = req.params['id'];
    if (!id) return res.status(400).json({ error: true, message: 'missing id' });

    const old = await prisma.panal.findFirst({ where: { id } });
    if (!old) return res.status(400).json({ error: true, message: 'Invalid panal id' });

    await prisma.panal.update({ where: { id }, data: { disabled: false } }).then(() => {
        res.status(200).json({ done: true, update: true, disabled: false });
    })
});

Route.post('/disable/:id', async (req, res) => {
    if (!client.user) return res.status(400).json({ error: true, message: 'Client is not ready yet' });
    const guild = client.guilds.cache.get(client.Application.getData('guildId'));
    if (!guild) return res.status(400).json({ error: true, message: 'Main guild couldnot be found' });

    const id = req.params['id'];
    if (!id) return res.status(400).json({ error: true, message: 'missing id' });

    const old = await prisma.panal.findFirst({ where: { id } });
    if (!old) return res.status(400).json({ error: true, message: 'Invalid panal id' });

    await prisma.panal.update({ where: { id }, data: { disabled: true } }).then(() => {
        res.status(200).json({ done: true, update: true, disabled: true });
    })
});

Route.post('/new', async (req, res) => {
    if (!client.user) return res.status(400).json({ error: true, message: 'Client is not ready yet' });
    const guild = client.guilds.cache.get(client.Application.getData('guildId'));
    if (!guild) return res.status(400).json({ error: true, message: 'Main guild couldnot be found' });

    const id = req.body['id'];
    const name = req.body['name'];
    const description = req.body['description'];
    const category = req.body['category'];
    const limit = req.body['limit'];
    const blackListRoles = req.body['blackListRoles'];
    const allowedRoles = req.body['allowedRoles'];
    const supportRoles = req.body['supportRoles'];
    const closeChannelLogMenu = req.body['closeChannelLogMenu'];
    const openLogChannelMenu = req.body['openLogChannelMenu'];
    const claimLogChannelMenu = req.body['claimLogChannelMenu'];
    const deleteLogChannelMenu = req.body['deleteLogChannelMenu'];
    const claimButton = req.body['claimButton'];
    const addAllBots = req.body['addAllBots'];
    const oneStepClose = req.body['oneStepClose'];

    if (!id) {
        return res.status(400).json({ error: true, message: 'Missing id in body' });
    }

    if (!name) {
        return res.status(400).json({ error: true, message: 'Missing panal name in body' });
    }

    if (!description) {
        return res.status(400).json({ error: true, message: 'Missing panal description in body' });
    }

    if (!limit) {
        return res.status(400).json({ error: true, message: 'Missing panal limit in body' });
    }

    if (!blackListRoles && !allowedRoles) {
        return res.status(400).json({ error: true, message: 'Missing permissons' });
    }

    const old = await prisma.panal.findFirst({ where: { id } });
    if (old) {
        await prisma.panal.update({
            where: { id },
            data: {
                name,
                description,
                category: category.id,
                limit,
                blackListRoles: blackListRoles?.map(role => role.id),
                allowedRoles: allowedRoles?.map(role => role.id),
                supportRoles: supportRoles?.map(role => role.id),
                closeChannelLogMenu: closeChannelLogMenu?.id,
                openLogChannelMenu: openLogChannelMenu?.id,
                claimLogChannelMenu: claimLogChannelMenu?.id,
                deleteLogChannelMenu: deleteLogChannelMenu?.id,
                claimButton,
                addAllBots,
                oneStepClose
            }
        }).then(() => {
            res.status(200).json({ done: true, update: true })
        }).catch(() => {
            res.status(400).json({ error: true, message: 'Error while updating the panal' });
        })
    } else {
        await prisma.panal.create({
            data: {
                id,
                guildId: guild.id,
                name,
                description,
                category: category.id,
                limit,
                blackListRoles: blackListRoles?.map(role => role.id),
                allowedRoles: allowedRoles?.map(role => role.id),
                supportRoles: supportRoles?.map(role => role.id),
                closeChannelLogMenu: closeChannelLogMenu?.id,
                openLogChannelMenu: openLogChannelMenu?.id,
                claimLogChannelMenu: claimLogChannelMenu?.id,
                deleteLogChannelMenu: deleteLogChannelMenu?.id,
                claimButton,
                addAllBots,
                oneStepClose
            }
        }).then(() => {
            res.status(200).json({ done: true, update: false })
        }).catch(e => {
            console.log(e)
            res.status(400).json({ error: true, message: 'Error while saving the panal' });
        })
    };
});

module.exports = Route;