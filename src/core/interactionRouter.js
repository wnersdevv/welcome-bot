'use strict';

const { PermissionFlagsBits } = require('discord.js');
const { buildMainPanel } = require('../components/panelComponents');
const { SECTION_BUILDERS, resetConfirmPanel } = require('../components/subPanels');
const { buildMessageModal, buildColorModal, buildImportModal, HEX_COLOR_REGEX } = require('../modals/messageModals');
const placeholders = require('../services/placeholderService');
const welcomeService = require('../services/welcomeService');
const leaveService = require('../services/leaveService');
const boostService = require('../services/boostService');
const dmService = require('../services/dmService');
const autoRoleService = require('../services/autoRoleService');
const backupService = require('../services/backupService');
const auditService = require('../services/auditService');
const permissionService = require('../services/permissionService');
const rateLimitService = require('../services/rateLimitService');

const OWNERSHIP_DENIED = 'Bu kontrol paneli başka bir kullanıcıya ait.';

function parseCustomId(customId) {
  const parts = customId.split(':');
  const ownerId = parts[parts.length - 1];
  return { ownerId, parts };
}

function checkOwnership(interaction, ownerId) {
  if (interaction.user.id !== ownerId && !permissionService.isBotOwner(interaction.user.id)) {
    interaction.reply({ content: OWNERSHIP_DENIED, ephemeral: true }).catch(() => {});
    return false;
  }
  return true;
}

async function renderSection(interaction, db, section, ownerId) {
  const guildData = db.get(interaction.guild.id);
  if (section === 'main') {
    return interaction.update(buildMainPanel(interaction.guild, guildData, ownerId));
  }
  const builder = SECTION_BUILDERS[section];
  if (!builder) return interaction.update(buildMainPanel(interaction.guild, guildData, ownerId));
  return interaction.update(builder(interaction.guild, guildData, ownerId));
}

async function handleStringSelect(interaction, ctx) {
  const { db, logger } = ctx;
  const { ownerId, parts } = parseCustomId(interaction.customId);
  if (!checkOwnership(interaction, ownerId)) return;

  const [scope, action] = parts;

  if (scope === 'panel' && action === 'nav') {
    return renderSection(interaction, db, interaction.values[0], ownerId);
  }

  if (scope === 'welcome' && action === 'template') {
    db.update(interaction.guild.id, (d) => {
      d.welcome.template = interaction.values[0];
      return d;
    });
    return renderSection(interaction, db, 'welcome', ownerId);
  }

  if (scope === 'design' && action === 'avatarshape') {
    db.update(interaction.guild.id, (d) => {
      d.design.avatarShape = interaction.values[0];
      return d;
    });
    return renderSection(interaction, db, 'design', ownerId);
  }

  if (scope === 'help' && action === 'category') {
    const { CATEGORIES } = require('../commands/yardim');
    const cat = CATEGORIES[interaction.values[0]];
    if (!cat) return interaction.reply({ content: 'Kategori bulunamadı.', ephemeral: true });
    return interaction.reply({
      content: `**${cat.label} Komutları:**\n${cat.commands.map((c) => `\`${c}\``).join('\n')}`,
      ephemeral: true,
    });
  }

  if (scope === 'backup' && action === 'restore') {
    if (!permissionService.memberHasAction(interaction.member, 'backupManage')) {
      return interaction.reply({ content: `⛔ Bu işlem için **${permissionService.actionLabel('backupManage')}** yetkisi gerekiyor.`, ephemeral: true });
    }
    try {
      backupService.restoreBackup(db, interaction.guild.id, interaction.values[0]);
      auditService.recordChange({
        db, logger, guildId: interaction.guild.id, userId: interaction.user.id, userTag: interaction.user.tag,
        action: 'Yedek geri yüklendi', newValue: interaction.values[0],
      });
    } catch (err) {
      return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
    }
    return renderSection(interaction, db, 'backups', ownerId);
  }
}

async function handleChannelSelect(interaction, ctx) {
  const { db, logger } = ctx;
  const { ownerId, parts } = parseCustomId(interaction.customId);
  if (!checkOwnership(interaction, ownerId)) return;
  const [scope] = parts;
  const actionKey = `${scope}Manage`;

  if (!permissionService.memberHasAction(interaction.member, actionKey)) {
    return interaction.reply({ content: `⛔ Bu işlem için **${permissionService.actionLabel(actionKey)}** yetkisi gerekiyor.`, ephemeral: true });
  }

  const channelId = interaction.values[0];
  const guildData = db.get(interaction.guild.id);
  const oldChannel = guildData[scope]?.channelId;

  db.update(interaction.guild.id, (d) => {
    d[scope].channelId = channelId;
    return d;
  });

  auditService.recordChange({
    db, logger, guildId: interaction.guild.id, userId: interaction.user.id, userTag: interaction.user.tag,
    action: `${scope} kanalı değiştirildi`, oldValue: oldChannel, newValue: channelId,
  });

  return renderSection(interaction, db, scope, ownerId);
}

async function handleRoleSelect(interaction, ctx) {
  const { db } = ctx;
  const { ownerId, parts } = parseCustomId(interaction.customId);
  if (!checkOwnership(interaction, ownerId)) return;
  const [, kind] = parts; // human | bot

  if (!permissionService.memberHasAction(interaction.member, 'roleManage')) {
    return interaction.reply({ content: `⛔ Bu işlem için **${permissionService.actionLabel('roleManage')}** yetkisi gerekiyor.`, ephemeral: true });
  }

  const roleIds = interaction.values;
  db.update(interaction.guild.id, (d) => {
    if (kind === 'human') d.roles.humanRoleIds = roleIds;
    else d.roles.botRoleIds = roleIds;
    return d;
  });

  return renderSection(interaction, db, 'roles', ownerId);
}

async function handleButton(interaction, ctx) {
  const { db, logger, client } = ctx;
  const { ownerId, parts } = parseCustomId(interaction.customId);
  if (!checkOwnership(interaction, ownerId)) return;

  const rl = rateLimitService.checkRateLimit(interaction.guild.id, interaction.user.id, 'button');
  if (rl.limited) {
    return interaction.reply({ content: '⏳ Çok hızlı tıklıyorsun, biraz yavaşla.', ephemeral: true });
  }

  const [scope, action, extra] = parts;

  if (scope === 'panel' && action === 'back') {
    return renderSection(interaction, db, 'main', ownerId);
  }

  if (scope === 'panel' && action === 'toggle') {
    const key = extra; // welcome | leave | boost | dm
    const actionKey = `${key === 'dm' ? 'welcome' : key}Manage`;
    if (!permissionService.memberHasAction(interaction.member, actionKey)) {
      return interaction.reply({ content: `⛔ Bu işlem için **${permissionService.actionLabel(actionKey)}** yetkisi gerekiyor.`, ephemeral: true });
    }
    const guildData = db.get(interaction.guild.id);
    const target = key === 'dm' ? guildData.welcome.dm : guildData[key];
    const oldValue = target.enabled;
    db.update(interaction.guild.id, (d) => {
      const t = key === 'dm' ? d.welcome.dm : d[key];
      t.enabled = !t.enabled;
      return d;
    });
    auditService.recordChange({
      db, logger, guildId: interaction.guild.id, userId: interaction.user.id, userTag: interaction.user.tag,
      action: `${key} durumu değiştirildi`, oldValue, newValue: !oldValue,
    });
    return renderSection(interaction, db, key === 'dm' ? 'dm' : key, ownerId);
  }

  if ((scope === 'welcome' || scope === 'leave') && action === 'toggleimage') {
    db.update(interaction.guild.id, (d) => {
      d[scope].useImage = !d[scope].useImage;
      return d;
    });
    return renderSection(interaction, db, scope, ownerId);
  }

  if (scope === 'welcome' && action === 'toggleembed') {
    db.update(interaction.guild.id, (d) => {
      d.welcome.useEmbed = !d.welcome.useEmbed;
      return d;
    });
    return renderSection(interaction, db, 'welcome', ownerId);
  }

  if (scope === 'design' && action === 'toggleborder') {
    db.update(interaction.guild.id, (d) => {
      d.design.avatarBorder = !d.design.avatarBorder;
      return d;
    });
    return renderSection(interaction, db, 'design', ownerId);
  }

  if (action === 'editmsg') {
    const guildData = db.get(interaction.guild.id);
    const cfg = scope === 'dm' ? guildData.welcome.dm : guildData[scope];
    const modal = buildMessageModal({
      customId: `modal:${scope}:msg:${ownerId}`,
      title: `${scope} mesajını düzenle`,
      currentTitle: cfg.title,
      currentDescription: cfg.description,
    });
    return interaction.showModal(modal);
  }

  if (scope === 'design' && action === 'editcolors') {
    const guildData = db.get(interaction.guild.id);
    const modal = buildColorModal({
      customId: `modal:design:colors:${ownerId}`,
      primaryColor: guildData.design.primaryColor,
      secondaryColor: guildData.design.secondaryColor,
    });
    return interaction.showModal(modal);
  }

  if (scope === 'test' && action === 'run') {
    return runTest(interaction, ctx, extra, ownerId);
  }

  if (scope === 'backup' && action === 'create') {
    if (!permissionService.memberHasAction(interaction.member, 'backupManage')) {
      return interaction.reply({ content: `⛔ Bu işlem için **${permissionService.actionLabel('backupManage')}** yetkisi gerekiyor.`, ephemeral: true });
    }
    backupService.createBackup(db, interaction.guild.id);
    return renderSection(interaction, db, 'backups', ownerId);
  }

  if (scope === 'settings') {
    if (action === 'export') {
      const data = JSON.stringify(db.export(interaction.guild.id), null, 2);
      const trimmed = data.length > 1900 ? data.slice(0, 1900) + '\n... (kısaltıldı, tam dosya için /ayarlar dışaaktar kullanın)' : data;
      return interaction.reply({ content: `\`\`\`json\n${trimmed}\n\`\`\``, ephemeral: true });
    }
    if (action === 'import') {
      return interaction.showModal(buildImportModal(`modal:settings:import:${ownerId}`));
    }
    if (action === 'resetconfirm') {
      return interaction.update(resetConfirmPanel(ownerId));
    }
    if (action === 'resetcancel') {
      return renderSection(interaction, db, 'settings', ownerId);
    }
    if (action === 'resetdo') {
      if (!permissionService.memberHasAction(interaction.member, 'criticalReset')) {
        return interaction.reply({ content: `⛔ Bu işlem için **${permissionService.actionLabel('criticalReset')}** yetkisi gerekiyor.`, ephemeral: true });
      }
      db.reset(interaction.guild.id);
      auditService.recordChange({
        db, logger, guildId: interaction.guild.id, userId: interaction.user.id, userTag: interaction.user.tag,
        action: 'Tüm ayarlar sıfırlandı',
      });
      return renderSection(interaction, db, 'main', ownerId);
    }
  }
}

async function runTest(interaction, ctx, type, ownerId) {
  const { db, logger } = ctx;
  const guildData = db.get(interaction.guild.id);
  const member = interaction.member;
  const results = [];

  try {
    if (type === 'welcome') {
      const payload = await welcomeService.buildWelcomePayload(member, guildData, logger);
      await interaction.reply({ content: '**Welcome önizlemesi:**', ...payload, ephemeral: true });
      return;
    }
    if (type === 'leave') {
      const payload = await leaveService.buildLeavePayload(member, guildData, logger);
      await interaction.reply({ content: '**Leave önizlemesi:**', ...payload, ephemeral: true });
      return;
    }
    if (type === 'boost') {
      const payload = await boostService.buildBoostPayload(member, guildData);
      await interaction.reply({ content: '**Boost önizlemesi:**', ...payload, ephemeral: true });
      return;
    }
    if (type === 'dm') {
      const result = await dmService.sendWelcomeDm(member, guildData, logger);
      await interaction.reply({ content: result.sent ? '✓ Test DM gönderildi.' : `⚠️ DM gönderilemedi (${result.reason}).`, ephemeral: true });
      return;
    }
    if (type === 'rol') {
      const result = await autoRoleService.applyAutoRoles(member, guildData, logger);
      const lines = [
        result.applied.length ? `✓ Verilen roller: ${result.applied.map((r) => `<@&${r}>`).join(', ')}` : '⚠️ Hiç rol verilmedi.',
        ...result.skipped.map((s) => `❌ <@&${s.roleId || s}> atlandı (${s.reason || s})`),
      ];
      await interaction.reply({ content: lines.join('\n'), ephemeral: true });
      return;
    }
    if (type === 'izin') {
      const checks = ['ManageGuild', 'ManageRoles', 'ManageChannels', 'SendMessages', 'EmbedLinks', 'AttachFiles'].map(
        (p) => `${interaction.guild.members.me.permissions.has(p) ? '✓' : '❌'} ${p}`
      );
      await interaction.reply({ content: checks.join('\n'), ephemeral: true });
      return;
    }
    if (type === 'sistem') {
      await interaction.reply({
        content: [
          `Discord API 🟢 (ping ${interaction.client.ws.ping}ms)`,
          'Database 🟢',
          'Cache 🟢',
          `Welcome ${guildData.welcome.enabled ? '🟢' : '⚪'}`,
          `Leave ${guildData.leave.enabled ? '🟢' : '⚪'}`,
          `Boost ${guildData.boost.enabled ? '🟢' : '⚪'}`,
        ].join('\n'),
        ephemeral: true,
      });
      return;
    }
    await interaction.reply({ content: `Bilinmeyen test türü: ${type}`, ephemeral: true });
  } catch (err) {
    logger.error('Test sırasında hata', err);
    db.update(interaction.guild.id, (d) => {
      d.stats.totalErrors += 1;
      return d;
    });
    await interaction.reply({ content: `❌ Test başarısız: ${err.message}`, ephemeral: true }).catch(() => {});
  }
}

async function handleModalSubmit(interaction, ctx) {
  const { db, logger } = ctx;
  const { ownerId, parts } = parseCustomId(interaction.customId);
  if (!checkOwnership(interaction, ownerId)) return;
  const [, scope, kind] = parts;

  if (kind === 'msg') {
    const title = interaction.fields.getTextInputValue('title');
    const description = interaction.fields.getTextInputValue('description');
    db.update(interaction.guild.id, (d) => {
      const target = scope === 'dm' ? d.welcome.dm : d[scope];
      target.title = title;
      target.description = description;
      return d;
    });
    auditService.recordChange({
      db, logger, guildId: interaction.guild.id, userId: interaction.user.id, userTag: interaction.user.tag,
      action: `${scope} mesajı güncellendi`,
    });
    return renderSection(interaction, db, scope === 'dm' ? 'dm' : scope, ownerId);
  }

  if (scope === 'design' && kind === 'colors') {
    const primary = interaction.fields.getTextInputValue('primaryColor').trim();
    const secondary = interaction.fields.getTextInputValue('secondaryColor').trim();
    if (!HEX_COLOR_REGEX.test(primary) || !HEX_COLOR_REGEX.test(secondary)) {
      return interaction.reply({ content: '❌ Renkler geçerli bir hex kodu olmalı, örn. #5865F2.', ephemeral: true });
    }
    db.update(interaction.guild.id, (d) => {
      d.design.primaryColor = primary;
      d.design.secondaryColor = secondary;
      d.welcome.color = primary;
      return d;
    });
    return renderSection(interaction, db, 'design', ownerId);
  }

  if (scope === 'settings' && kind === 'import') {
    const raw = interaction.fields.getTextInputValue('payload');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return interaction.reply({ content: '❌ Geçersiz JSON.', ephemeral: true });
    }
    const validation = backupService.validateImportPayload(parsed);
    if (!validation.valid) {
      return interaction.reply({ content: `❌ Doğrulama başarısız:\n${validation.errors.join('\n')}`, ephemeral: true });
    }
    db.import(interaction.guild.id, parsed);
    auditService.recordChange({
      db, logger, guildId: interaction.guild.id, userId: interaction.user.id, userTag: interaction.user.tag,
      action: 'Ayarlar içe aktarıldı',
    });
    return renderSection(interaction, db, 'main', ownerId);
  }
}

module.exports = {
  handleStringSelect,
  handleChannelSelect,
  handleRoleSelect,
  handleButton,
  handleModalSubmit,
  runTest,
  checkOwnership,
};
