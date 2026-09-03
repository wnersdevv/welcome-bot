'use strict';

const welcomeService = require('../services/welcomeService');
const autoRoleService = require('../services/autoRoleService');
const dmService = require('../services/dmService');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(member, ctx) {
    const { db, logger } = ctx;
    const guildData = db.get(member.guild.id);

    db.recordStat(member.guild.id, 'join');

    // Tek bir modülün hatası diğerlerini durdurmasın - hepsi bağımsız try/catch içinde.
    const roleResult = await autoRoleService.applyAutoRoles(member, guildData, logger).catch((err) => {
      logger.error('Auto role işlemi başarısız', err);
      return { applied: [], skipped: [] };
    });
    db.update(member.guild.id, (d) => {
      if (roleResult.applied.length) d.stats.totalRoleSuccess += roleResult.applied.length;
      if (roleResult.skipped.length) d.stats.totalRoleFail += roleResult.skipped.length;
      return d;
    });

    const welcomeResult = await welcomeService.sendWelcome(member, guildData, logger).catch((err) => {
      logger.error('Welcome gönderimi başarısız', err);
      return { sent: false };
    });
    if (welcomeResult.sent) db.recordStat(member.guild.id, 'welcome');
    else if (welcomeResult.reason === 'send_failed') {
      db.update(member.guild.id, (d) => {
        d.stats.totalErrors += 1;
        return d;
      });
    }

    if (guildData.welcome.dm.enabled) {
      const dmResult = await dmService.sendWelcomeDm(member, guildData, logger).catch(() => ({ sent: false }));
      db.update(member.guild.id, (d) => {
        if (dmResult.sent) d.stats.totalDmSuccess += 1;
        else d.stats.totalDmFail += 1;
        return d;
      });
    }
  },
};
