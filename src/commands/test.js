'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const welcomeService = require('../services/welcomeService');
const leaveService = require('../services/leaveService');
const boostService = require('../services/boostService');
const dmService = require('../services/dmService');
const autoRoleService = require('../services/autoRoleService');
const imageService = require('../services/imageService');
const placeholders = require('../services/placeholderService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('Sistemleri test eder.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) => s.setName('welcome').setDescription('Welcome mesajını test eder.'))
    .addSubcommand((s) => s.setName('leave').setDescription('Leave mesajını test eder.'))
    .addSubcommand((s) => s.setName('boost').setDescription('Boost mesajını test eder.'))
    .addSubcommand((s) => s.setName('dm').setDescription('Welcome DM\'i test eder.'))
    .addSubcommand((s) => s.setName('rol').setDescription('Otomatik rol sistemini test eder.'))
    .addSubcommand((s) => s.setName('gorsel').setDescription('Görsel motorunu test eder.'))
    .addSubcommand((s) => s.setName('degisken').setDescription('Placeholder motorunu test eder.'))
    .addSubcommand((s) => s.setName('izin').setDescription('Bot izinlerini test eder.'))
    .addSubcommand((s) => s.setName('sistem').setDescription('Genel sistem sağlığını test eder.')),

  async execute(interaction, { db, logger }) {
    const sub = interaction.options.getSubcommand();
    const guildData = db.get(interaction.guild.id);

    const results = { basarili: '✓ Başarılı', uyari: '⚠️ Uyarı', basarisiz: '❌ Başarısız' };

    if (sub === 'welcome') {
      await interaction.deferReply({ ephemeral: true });
      const payload = await welcomeService.buildWelcomePayload(interaction.member, guildData, logger);
      return interaction.editReply({ content: results.basarili, ...payload });
    }
    if (sub === 'leave') {
      await interaction.deferReply({ ephemeral: true });
      const payload = await leaveService.buildLeavePayload(interaction.member, guildData, logger);
      return interaction.editReply({ content: results.basarili, ...payload });
    }
    if (sub === 'boost') {
      const payload = await boostService.buildBoostPayload(interaction.member, guildData);
      return interaction.reply({ content: results.basarili, ...payload, ephemeral: true });
    }
    if (sub === 'dm') {
      const result = await dmService.sendWelcomeDm(interaction.member, guildData, logger);
      return interaction.reply({ content: result.sent ? results.basarili : `${results.uyari} (${result.reason})`, ephemeral: true });
    }
    if (sub === 'rol') {
      const result = await autoRoleService.applyAutoRoles(interaction.member, guildData, logger);
      const status = result.skipped.length && !result.applied.length ? results.basarisiz : result.skipped.length ? results.uyari : results.basarili;
      return interaction.reply({
        content: [
          status,
          result.applied.length ? `Verilen: ${result.applied.map((r) => `<@&${r}>`).join(', ')}` : null,
          ...result.skipped.map((s) => `Atlandı: <@&${s.roleId}> (${s.reason})`),
        ].filter(Boolean).join('\n'),
        ephemeral: true,
      });
    }
    if (sub === 'gorsel') {
      try {
        await interaction.deferReply({ ephemeral: true });
        const ctx = placeholders.buildContext(interaction.member);
        const buffer = await imageService.renderCard({ template: guildData.welcome.template, avatar: ctx.avatar, title: 'Test Kartı', subtitle: 'Görsel motoru çalışıyor' });
        return interaction.editReply({ content: results.basarili, files: [{ attachment: buffer, name: 'test-card.png' }] });
      } catch (err) {
        return interaction.editReply(`${results.basarisiz}: ${err.message}`);
      }
    }
    if (sub === 'degisken') {
      const ctx = placeholders.buildContext(interaction.member);
      const sample = placeholders.apply('Merhaba {mention}, {server} sunucusuna hoş geldin! Sen {membercount}. üyesin.', ctx);
      return interaction.reply({ content: `${results.basarili}\n${sample}`, ephemeral: true });
    }
    if (sub === 'izin') {
      const me = interaction.guild.members.me;
      const perms = ['ManageGuild', 'ManageRoles', 'ManageChannels', 'SendMessages', 'EmbedLinks', 'AttachFiles'];
      const missing = perms.filter((p) => !me.permissions.has(p));
      return interaction.reply({
        content: missing.length ? `${results.uyari}\nEksik izinler: ${missing.join(', ')}` : `${results.basarili}\nTüm temel izinler mevcut.`,
        ephemeral: true,
      });
    }
    if (sub === 'sistem') {
      return interaction.reply({
        content: [
          results.basarili,
          `Discord API: ${interaction.client.ws.ping}ms`,
          `Welcome: ${guildData.welcome.enabled ? 'aktif' : 'kapalı'}`,
          `Leave: ${guildData.leave.enabled ? 'aktif' : 'kapalı'}`,
          `Boost: ${guildData.boost.enabled ? 'aktif' : 'kapalı'}`,
        ].join('\n'),
        ephemeral: true,
      });
    }
  },
};
