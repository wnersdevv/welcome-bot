'use strict';

const leaveService = require('../services/leaveService');

module.exports = {
  name: 'guildMemberRemove',
  once: false,
  async execute(member, ctx) {
    const { db, logger } = ctx;
    const guildData = db.get(member.guild.id);

    db.recordStat(member.guild.id, 'leave');

    const result = await leaveService.sendLeave(member, guildData, logger).catch((err) => {
      logger.error('Leave gönderimi başarısız', err);
      return { sent: false };
    });

    if (result.reason === 'send_failed') {
      db.update(member.guild.id, (d) => {
        d.stats.totalErrors += 1;
        return d;
      });
    }
  },
};
