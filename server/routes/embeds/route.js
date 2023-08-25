const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
const { Client, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { isImage } = require('../../../src/util.js');

/** @type {Client} */
const client = require('../../../');
const prisma = new PrismaClient();
const Route = Router();

Route.get('/metadata', async (req, res) => {
    if (!client.user) return res.status(400).json({ error: true, message: 'Client is not ready yet' });
    const guild = client.guilds.cache.get(client.Application.getData('guildId'));
    if (!guild) return res.status(400).json({ error: true, message: 'Main guild couldnot be found' });
    const Embeds = await prisma.embeds.findMany({ where: { guildId: guild.id } });
    res.status(200).json(Embeds);
});

Route.post('/new', async (req, res) => {
    if (!client.user) return res.status(400).json({ error: true, message: 'Client is not ready yet' });
    const guild = client.guilds.cache.get(client.Application.getData('guildId'));
    if (!guild) return res.status(400).json({ error: true, message: 'Main guild couldnot be found' });

    const id = req.body['id'];
    const name = req.body['name'];
    const title = req.body['title'];
    const description = req.body['description'];
    const Footer = req.body['footer'];
    const imageURL = req.body['imageUrl'];
    const buttonStyle = req.body['buttonStyle'];
    const buttonText = req.body['buttonText'];
    const buttonEmoji = req.body['buttonEmoji'];
    const useGuildThumbnail = req.body['useGuildThumbnail'];
    const useGuildIconInFooter = req.body['useGuildIconInFooter'];
    const embedColor = req.body['embedColor'];

    if (!name) return res.status(400).json({ error: true, message: 'missing embed name in body' });
    if (!id) return res.status(400).json({ error: true, message: 'missing id in body' });
    if (!title && !description && !Footer && !imageURL) return res.status(400).json({ error: true, message: 'You cannot Send an empty embed' });


    if (imageURL) {
        const isAImage = await isImage(imageURL);
        if (!isAImage) return res.status(400).json({ error: true, message: 'Invaid image url' });
    };

    await prisma.embeds.create({
        data: {
            id,
            name,
            guildId: guild.id,
            title,
            description,
            Footer,
            imageURL,
            buttonStyle,
            buttonText,
            buttonEmoji,
            GuildIcon: useGuildThumbnail,
            GuildIconInFooter: useGuildIconInFooter,
            embedColor
        }
    })
    .then(() => {
        res.status(200).json({ done: true })

    }).catch(() => {
        res.status(400).json({ error: true, message: 'Error while save this embed please refresh the page and try again' });
    })

});

Route.delete('/:id', async (req, res) => {
    if (!client.user) return res.status(400).json({ error: true, message: 'Client is not ready yet' });
    const guild = client.guilds.cache.get(client.Application.getData('guildId'));
    if (!guild) return res.status(400).json({ error: true, message: 'Main guild couldnot be found' });

    const id = req.params['id'];
    if (!id) return res.status(400).json({ error: true, message: 'missing id' });

    const Embed = await prisma.embeds.findFirst({ where: { id } });
    if (!Embed) return res.status(400).json({ error: true, message: 'Embed is not found' });
    await prisma.embeds.delete({ where: { id } });

    res.status(200).json({ done: true });
});

Route.post('/', async (req, res) => {
    if (!client.user) return res.status(400).json({ error: true, message: 'Client is not ready yet' });
    const guild = client.guilds.cache.get(client.Application.getData('guildId'));
    if (!guild) return res.status(400).json({ error: true, message: 'Main guild couldnot be found' });

    const id = req.body['id'];
    const channelId = req.body['channelId'];

    if (!id) return res.status(400).json({ error: true, message: 'missing id in body' });
    if (!channelId) return res.status(400).json({ error: true, message: 'missing channelId id in body' });

    const Embed = await prisma.embeds.findFirst({ where: { id } });
    if (!Embed) return res.status(400).json({ error: true, message: 'Embed is not found' });

    const channel = await guild.channels.cache.get(channelId);
    if (!channel) return res.status(400).json({ error: true, message: 'channel is not found' });

    const EmbedPayload = {
        title: null,
        description: null,
        image: {
            url: null
        },
        thumbnail: {
            url: null
        },
        footer: {
            text: null,
            icon_url: null
        }
    };

    if (Embed.title) EmbedPayload.title = Embed.title;
    if (Embed.description) EmbedPayload.description = Embed.description;
    if (Embed.Footer) EmbedPayload.footer.text = Embed.Footer;
    if (Embed.imageURL) EmbedPayload.image.url = Embed.imageURL;
    if (Embed.GuildIconInFooter) EmbedPayload.footer.icon_url = guild.iconURL();
    if (Embed.GuildIcon) EmbedPayload.thumbnail.url = guild.iconURL();

    const Row = new ActionRowBuilder();
    const embed = EmbedBuilder.from(EmbedPayload);
    const Button = new ButtonBuilder();
    Button.setLabel(Embed.buttonText);
    Button.setCustomId('ticket-open');

    if (Embed.buttonStyle.toLowerCase() === 'primary') Button.setStyle(ButtonStyle.Primary);
    if (Embed.buttonStyle.toLowerCase() === 'danger') Button.setStyle(ButtonStyle.Danger);
    if (Embed.buttonStyle.toLowerCase() === 'secondary') Button.setStyle(ButtonStyle.Secondary);
    if (Embed.buttonStyle.toLowerCase() === 'success') Button.setStyle(ButtonStyle.Success);

    Row.addComponents(Button);

    channel.send({ embeds: [embed], components: [Row] });

    res.status(200).json({ done: true });
});

module.exports = Route;