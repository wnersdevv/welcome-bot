'use strict';

const boostService = require('../services/boostService');

module.exports = {
  name: 'guildMemberUpdate',
  once: false,
  async execute(oldMember, newMember, ctx) {
    const { db, logger } = ctx;

    // Boost başlangıcı: premiumSince önce null idi, şimdi doluysa yeni bir boost'tur.
    const startedBoosting = !oldMember.premiumSince && newMember.premiumSince;
    if (!startedBoosting) return;

    const guildData = db.get(newMember.guild.id);
    db.recordStat(newMember.guild.id, 'boost');

    const result = await boostService.sendBoost(newMember, guildData, logger).catch((err) => {
      logger.error('Boost gönderimi başarısız', err);
      return { sent: false };
    });

    if (result.reason === 'send_failed') {
      db.update(newMember.guild.id, (d) => {
        d.stats.totalErrors += 1;
        return d;
      });
    }
  },
};
