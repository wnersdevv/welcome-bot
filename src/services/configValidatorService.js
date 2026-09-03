'use strict';

function validateWelcome(guild, guildData) {
  const issues = [];
  const cfg = guildData.welcome;
  if (cfg.enabled) {
    if (!cfg.channelId || !guild.channels.cache.has(cfg.channelId)) {
      issues.push('Welcome kanalı ayarlanmamış veya silinmiş.');
    }
    if (!cfg.title || !cfg.description) issues.push('Welcome mesajı eksik.');
    if (guildData.roles.humanRoleIds.some((id) => !guild.roles.cache.has(id))) {
      issues.push('Otomatik rollerden biri artık mevcut değil.');
    }
  }
  return issues;
}

function validateLeave(guild, guildData) {
  const issues = [];
  const cfg = guildData.leave;
  if (cfg.enabled) {
    if (!cfg.channelId || !guild.channels.cache.has(cfg.channelId)) {
      issues.push('Leave kanalı ayarlanmamış veya silinmiş.');
    }
  }
  return issues;
}

function validateBoost(guild, guildData) {
  const issues = [];
  const cfg = guildData.boost;
  if (cfg.enabled && (!cfg.channelId || !guild.channels.cache.has(cfg.channelId))) {
    issues.push('Boost kanalı ayarlanmamış veya silinmiş.');
  }
  return issues;
}

function validateAll(guild, guildData) {
  return {
    welcome: validateWelcome(guild, guildData),
    leave: validateLeave(guild, guildData),
    boost: validateBoost(guild, guildData),
  };
}

module.exports = { validateAll, validateWelcome, validateLeave, validateBoost };
