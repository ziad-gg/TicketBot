const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Client } = require('discord.js');
const cache = require('apicache');

/** @type {Client} */
const client = require('..');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const prisma = require('../prisma');
const Apicache = cache.middleware;

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 15,
//   standardHeaders: true,
//   legacyHeaders: false,
// });

app.use(cors());
// app.use(limiter);
app.set('PORT', 8008);

app.use('/api/panals', require('./routes/panals/route.js'));
app.use('/api/embeds', require('./routes/embeds/route.js'));
app.use('/api/metadata', require('./routes/metadata/route.js'));


app.get('/transcript/:id', Apicache('2m'), async (req, res) => {
  const id = req.params.id;
  const Ticket = await prisma.ticket.findFirst({ where: { id } });
  if (!Ticket || !Ticket.transcript) return res.send('Invalid transcript id');

  res.send(Ticket.transcript);
})

const IP = require('ip');

app.get('/', (req, res) => {
  const ipAddress = IP.address();
  res.send(ipAddress)
});

app.listen(app.get('PORT'), () => {
  console.log('[INFO] Server is listening at port []::%s', app.get('PORT'));
});
