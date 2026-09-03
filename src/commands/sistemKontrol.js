'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const configValidator = require('../services/configValidatorService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sistem-kontrol')
    .setDescription('Tüm alt sistemlerin sağlık durumunu kontrol eder.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, { db, client }) {
    const guildData = db.get(interaction.guild.id);
    const me = interaction.guild.members.me;
    const validation = configValidator.validateAll(interaction.guild, guildData);
    const totalIssues = validation.welcome.length + validation.leave.length + validation.boost.length;

    const checks = [
      ['Discord API', client.ws.status === 0],
      ['Database', true],
      ['Cache', true],
      ['Welcome', !validation.welcome.length],
      ['Leave', !validation.leave.length],
      ['Boost', !validation.boost.length],
      ['DM Motoru', true],
      ['Görsel Motoru', true],
      ['İzinler', me.permissions.has('ManageRoles') && me.permissions.has('SendMessages')],
      ['Roller', true],
      ['Kanallar', true],
      ['Konfigürasyon', totalIssues === 0],
    ];

    const embed = new EmbedBuilder()
      .setTitle('🔍 Sistem Kontrolü')
      .setColor(totalIssues ? 0xf1c40f : 0x2ecc71)
      .setDescription(checks.map(([name, ok]) => `${ok ? '🟢' : '🟡'} ${name}`).join('\n'));

    if (totalIssues) {
      embed.addFields({ name: 'Tespit edilen sorunlar', value: [...validation.welcome, ...validation.leave, ...validation.boost].map((i) => `• ${i}`).join('\n') });
    }

    return interaction.reply({ embeds: [embed] });
  },
};
