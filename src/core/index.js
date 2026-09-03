'use strict';

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { getConfig } = require('../config/config');
const { Logger } = require('../logger/logger');
const { Database } = require('../database/Database');
const { loadCommands } = require('./commandHandler');
const { loadEvents } = require('./eventHandler');
const { attachCrashProtection } = require('../errors/errorHandler');

async function main() {
  const config = getConfig();
  const logger = new Logger('core', config.logLevel);

  attachCrashProtection(logger);

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildModeration,
    ],
    partials: [Partials.GuildMember, Partials.User],
  });

  const db = new Database(logger);
  client.commands = loadCommands();

  const ctx = { client, db, logger, config };

  loadEvents(client, ctx);

  logger.info(`${client.commands.size} komut yüklendi.`);

  await client.login(config.token);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[FATAL] Bot başlatılamadı:', err.message);
  process.exit(1);
});
