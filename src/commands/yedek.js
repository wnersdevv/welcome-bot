'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const backupService = require('../services/backupService');
const auditService = require('../services/auditService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yedek')
    .setDescription('Yapılandırma yedeklerini yönetir.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName('olustur').setDescription('Yeni bir yedek oluşturur.'))
    .addSubcommand((s) => s.setName('liste').setDescription('Mevcut yedekleri listeler.'))
    .addSubcommand((s) =>
      s
        .setName('geriyukle')
        .setDescription('Bir yedeği geri yükler.')
        .addStringOption((o) => o.setName('dosya').setDescription('Yedek dosya adı (/yedek liste ile görebilirsin)').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('sil')
        .setDescription('Bir yedeği siler.')
        .addStringOption((o) => o.setName('dosya').setDescription('Silinecek yedek dosya adı').setRequired(true))
    ),

  async execute(interaction, { db, logger }) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'olustur') {
      const fileName = backupService.createBackup(db, guildId);
      auditService.recordChange({ db, logger, guildId, userId: interaction.user.id, userTag: interaction.user.tag, action: 'yedek oluşturuldu', newValue: fileName });
      return interaction.reply(`✅ Yedek oluşturuldu: \`${fileName}\``);
    }

    if (sub === 'liste') {
      const backups = backupService.listBackups(guildId);
      return interaction.reply({
        content: backups.length ? backups.map((b) => `• \`${b}\``).join('\n') : 'Henüz yedek yok.',
        ephemeral: true,
      });
    }

    if (sub === 'geriyukle') {
      const fileName = interaction.options.getString('dosya');
      try {
        backupService.restoreBackup(db, guildId, fileName);
        auditService.recordChange({ db, logger, guildId, userId: interaction.user.id, userTag: interaction.user.tag, action: 'yedek geri yüklendi', newValue: fileName });
        return interaction.reply(`✅ \`${fileName}\` geri yüklendi.`);
      } catch (err) {
        return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
      }
    }

    if (sub === 'sil') {
      const fileName = interaction.options.getString('dosya');
      try {
        backupService.deleteBackup(guildId, fileName);
        return interaction.reply(`✅ \`${fileName}\` silindi.`);
      } catch (err) {
        return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
      }
    }
  },
};
