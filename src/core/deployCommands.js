'use strict';

const { REST, Routes } = require('discord.js');
const { getConfig } = require('../config/config');
const { loadCommands } = require('./commandHandler');
const { Logger } = require('../logger/logger');

async function deploy() {
  const config = getConfig();
  const logger = new Logger('deploy', config.logLevel);
  const commands = loadCommands();
  const body = [...commands.values()].map((c) => c.data.toJSON());

  const rest = new REST({ version: '10' }).setToken(config.token);

  try {
    if (config.guildId) {
      // Guild-scoped: anında yansır, geliştirme için önerilir.
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body });
      logger.info(`${body.length} komut, guild ${config.guildId} için kaydedildi.`);
    } else {
      // Global: tüm sunucularda yayılması ~1 saat sürebilir.
      await rest.put(Routes.applicationCommands(config.clientId), { body });
      logger.info(`${body.length} komut global olarak kaydedildi.`);
    }
  } catch (err) {
    logger.error('Komutlar kaydedilirken hata oluştu', err);
    process.exit(1);
  }
}

deploy();
