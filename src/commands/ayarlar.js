'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const backupService = require('../services/backupService');
const auditService = require('../services/auditService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ayarlar')
    .setDescription('Genel yapılandırma yönetimi.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) => s.setName('goruntule').setDescription('Mevcut yapılandırmayı gösterir.'))
    .addSubcommand((s) => s.setName('disaaktar').setDescription('Yapılandırmayı JSON dosyası olarak dışa aktarır.'))
    .addSubcommand((s) =>
      s
        .setName('iceaktar')
        .setDescription('Bir JSON dosyasından yapılandırma içe aktarır.')
        .addAttachmentOption((o) => o.setName('dosya').setDescription('JSON dosyası').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('sifirla')
        .setDescription('Tüm yapılandırmayı sıfırlar (geri alınamaz).')
        .addBooleanOption((o) => o.setName('onay').setDescription('Emin misin? true seç.').setRequired(true))
    ),

  async execute(interaction, { db, logger }) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'goruntule') {
      const data = db.export(guildId);
      const json = JSON.stringify(data, null, 2);
      const attachment = new AttachmentBuilder(Buffer.from(json, 'utf-8'), { name: 'ayarlar.json' });
      return interaction.reply({ content: 'Mevcut yapılandırma ektedir.', files: [attachment], ephemeral: true });
    }

    if (sub === 'disaaktar') {
      const data = db.export(guildId);
      const attachment = new AttachmentBuilder(Buffer.from(JSON.stringify(data, null, 2), 'utf-8'), { name: `${guildId}-config.json` });
      return interaction.reply({ files: [attachment], ephemeral: true });
    }

    if (sub === 'iceaktar') {
      const file = interaction.options.getAttachment('dosya');
      if (!file.name.endsWith('.json')) {
        return interaction.reply({ content: '❌ Sadece .json dosyaları kabul edilir.', ephemeral: true });
      }
      await interaction.deferReply({ ephemeral: true });
      try {
        const res = await fetch(file.url);
        const text = await res.text();
        const parsed = JSON.parse(text);
        const validation = backupService.validateImportPayload(parsed);
        if (!validation.valid) {
          return interaction.editReply(`❌ Doğrulama başarısız:\n${validation.errors.join('\n')}`);
        }
        db.import(guildId, parsed);
        auditService.recordChange({ db, logger, guildId, userId: interaction.user.id, userTag: interaction.user.tag, action: 'ayarlar içe aktarıldı (dosya)' });
        return interaction.editReply('✅ Yapılandırma başarıyla içe aktarıldı.');
      } catch (err) {
        return interaction.editReply(`❌ İçe aktarma başarısız: ${err.message}`);
      }
    }

    if (sub === 'sifirla') {
      const confirmed = interaction.options.getBoolean('onay');
      if (!confirmed) return interaction.reply({ content: 'İşlem iptal edildi. Onaylamak için `onay: true` seçmelisin.', ephemeral: true });
      if (!interaction.member.permissions.has('Administrator')) {
        return interaction.reply({ content: '⛔ Bu işlem için **Yönetici** yetkisi gerekiyor.', ephemeral: true });
      }
      db.reset(guildId);
      auditService.recordChange({ db, logger, guildId, userId: interaction.user.id, userTag: interaction.user.tag, action: 'tüm ayarlar sıfırlandı (komut)' });
      return interaction.reply('✅ Tüm yapılandırma sıfırlandı.');
    }
  },
};
