'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const configValidator = require('../services/configValidatorService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guvenlik')
    .setDescription('Güvenlik ve izin durumunu gösterir.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) => s.setName('durum').setDescription('Genel güvenlik durumunu gösterir.'))
    .addSubcommand((s) => s.setName('izinler').setDescription('Bot izinlerini listeler.'))
    .addSubcommand((s) => s.setName('kontrol').setDescription('Yapılandırma sorunlarını tarar.')),

  async execute(interaction, { db }) {
    const sub = interaction.options.getSubcommand();
    const guildData = db.get(interaction.guild.id);
    const me = interaction.guild.members.me;

    if (sub === 'izinler') {
      const perms = ['ManageGuild', 'ManageRoles', 'ManageChannels', 'SendMessages', 'EmbedLinks', 'AttachFiles', 'ViewAuditLog'];
      return interaction.reply({
        content: perms.map((p) => `${me.permissions.has(p) ? '✅' : '❌'} ${p}`).join('\n'),
        ephemeral: true,
      });
    }

    if (sub === 'kontrol') {
      const validation = configValidator.validateAll(interaction.guild, guildData);
      const issues = [...validation.welcome, ...validation.leave, ...validation.boost];
      return interaction.reply({
        content: issues.length ? `⚠️ Bulunan sorunlar:\n${issues.map((i) => `• ${i}`).join('\n')}` : '✅ Yapılandırmada sorun tespit edilmedi.',
        ephemeral: true,
      });
    }

    if (sub === 'durum') {
      const embed = new EmbedBuilder()
        .setTitle('🛡️ Güvenlik Durumu')
        .setColor(0xe74c3c)
        .setDescription('Bot izinleri ve yapılandırma sağlığı için `/guvenlik izinler` ve `/guvenlik kontrol` komutlarını kullan.');
      return interaction.reply({ embeds: [embed] });
    }
  },
};
