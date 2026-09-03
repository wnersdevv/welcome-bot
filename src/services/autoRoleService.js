'use strict';

const { PermissionFlagsBits } = require('discord.js');

/**
 * Yeni üyeye uygun rolleri verir. Silinmiş/geçersiz rol veya yetki eksikliği
 * durumunda hata fırlatmaz; hangi rollerin verildiğini/atlandığını raporlar.
 */
async function applyAutoRoles(member, guildData, logger) {
  const guild = member.guild;
  const me = guild.members.me;
  const roleIds = member.user.bot ? guildData.roles.botRoleIds : guildData.roles.humanRoleIds;

  if (!roleIds || roleIds.length === 0) return { applied: [], skipped: [], reason: 'no_roles_configured' };

  if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return { applied: [], skipped: roleIds, reason: 'bot_missing_manage_roles' };
  }

  const applied = [];
  const skipped = [];

  for (const roleId of roleIds) {
    const role = guild.roles.cache.get(roleId);
    if (!role) {
      skipped.push({ roleId, reason: 'role_deleted' });
      continue;
    }
    if (role.position >= me.roles.highest.position) {
      skipped.push({ roleId, reason: 'hierarchy' });
      continue;
    }
    try {
      await member.roles.add(role, 'Otomatik rol - katılım');
      applied.push(roleId);
    } catch (err) {
      logger?.warn('Otomatik rol verilemedi', { roleId, error: err.message });
      skipped.push({ roleId, reason: 'api_error' });
    }
  }

  return { applied, skipped };
}

/** Konfigürasyondaki rollerin hâlâ var olup olmadığını kontrol eder, geçersizleri işaretler için kullanılır. */
function findInvalidRoles(guild, roleIds = []) {
  return roleIds.filter((id) => !guild.roles.cache.has(id));
}

module.exports = { applyAutoRoles, findInvalidRoles };
