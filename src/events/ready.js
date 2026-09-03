'use strict';

const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  execute(client, ctx) {
    ctx.logger.info(`Bot giriş yaptı: ${client.user.tag} (${client.guilds.cache.size} sunucu)`);
    client.user.setPresence({
      activities: [{ name: '/panel | Community Center', type: ActivityType.Watching }],
      status: 'online',
    });
  },
};
