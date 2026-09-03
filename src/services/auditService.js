'use strict';

/**
 * Ayar değişikliklerini hem guild verisine (audit array) hem de logs/audit.log dosyasına yazar.
 */
function recordChange({ db, logger, guildId, userId, userTag, action, oldValue, newValue }) {
  db.addAuditEntry(guildId, {
    userId,
    userTag,
    action,
    oldValue: oldValue ?? null,
    newValue: newValue ?? null,
  });
  logger.audit({ guildId, userId, userTag, action, oldValue, newValue });
}

module.exports = { recordChange };
