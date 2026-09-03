'use strict';

const { PermissionFlagsBits } = require('discord.js');
const { getConfig } = require('../config/config');

/** Discord seviyesinde ihtiyaç duyulan yetkiler, aksiyon anahtarına göre. */
const ACTION_PERMISSIONS = {
  welcomeManage: PermissionFlagsBits.ManageGuild,
  leaveManage: PermissionFlagsBits.ManageGuild,
  boostManage: PermissionFlagsBits.ManageGuild,
  roleManage: PermissionFlagsBits.ManageRoles,
  channelChange: PermissionFlagsBits.ManageChannels,
  criticalReset: PermissionFlagsBits.Administrator,
  backupManage: PermissionFlagsBits.Administrator,
  securityView: PermissionFlagsBits.ManageGuild,
};

function isBotOwner(userId) {
  return getConfig().ownerIds.includes(userId);
}

function memberHasAction(member, actionKey) {
  if (isBotOwner(member.id)) return true;
  const flag = ACTION_PERMISSIONS[actionKey];
  if (!flag) return true; // no specific requirement defined -> allow
  return member.permissions.has(flag);
}

/** Bot'un kendi gerekli izinlerini kontrol eder (ör. rol vermeden önce Manage Roles). */
function botHasPermission(guild, flag) {
  const me = guild.members.me;
  if (!me) return false;
  return me.permissions.has(flag);
}

function actionLabel(actionKey) {
  const labels = {
    welcomeManage: 'Sunucu Yönet',
    leaveManage: 'Sunucu Yönet',
    boostManage: 'Sunucu Yönet',
    roleManage: 'Rolleri Yönet',
    channelChange: 'Kanalları Yönet',
    criticalReset: 'Yönetici',
    backupManage: 'Yönetici',
    securityView: 'Sunucu Yönet',
  };
  return labels[actionKey] || 'Yeterli yetki';
}

module.exports = { memberHasAction, botHasPermission, actionLabel, isBotOwner, ACTION_PERMISSIONS };
