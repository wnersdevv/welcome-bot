'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const boostService = require('../services/boostService');
const auditService = require('../services/auditService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('boost')
    .setDescription('Boost mesaj sistemini yönetir.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) => s.setName('ac').setDescription('Boost sistemini açar.'))
    .addSubcommand((s) => s.setName('kapat').setDescription('Boost sistemini kapatır.'))
    .addSubcommand((s) => s.setName('durum').setDescription('Mevcut Boost ayarlarını gösterir.'))
    .addSubcommand((s) =>
      s
        .setName('kanal')
        .setDescription('Boost mesajının gönderileceği kanalı ayarlar.')
        .addChannelOption((o) =>
          o.setName('kanal').setDescription('Hedef kanal').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true)
        )
    )
    .addSubcommand((s) => s.setName('test').setDescription('Boost mesajını kendi üzerinde test eder.'))
    .addSubcommand((s) => s.setName('sifirla').setDescription('Boost ayarlarını varsayılana sıfırlar.')),

  async execute(interaction, { db, logger }) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const guildData = db.get(guildId);

    if (sub === 'ac' || sub === 'kapat') {
      const enabled = sub === 'ac';
      const old = guildData.boost.enabled;
      db.update(guildId, (d) => {
        d.boost.enabled = enabled;
        return d;
      });
      auditService.recordChange({ db, logger, guildId, userId: interaction.user.id, userTag: interaction.user.tag, action: 'boost durumu değiştirildi', oldValue: old, newValue: enabled });
      return interaction.reply(`✅ Boost sistemi **${enabled ? 'açıldı' : 'kapatıldı'}**.`);
    }

    if (sub === 'durum') {
      const cfg = guildData.boost;
      const embed = new EmbedBuilder()
        .setTitle('🚀 Boost Durumu')
        .setColor(cfg.enabled ? 0x57f287 : 0xed4245)
        .addFields(
          { name: 'Durum', value: cfg.enabled ? '🟢 Aktif' : '🔴 Kapalı', inline: true },
          { name: 'Kanal', value: cfg.channelId ? `<#${cfg.channelId}>` : 'ayarlanmadı', inline: true }
        );
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'kanal') {
      const channel = interaction.options.getChannel('kanal');
      const old = guildData.boost.channelId;
      db.update(guildId, (d) => {
        d.boost.channelId = channel.id;
        return d;
      });
      auditService.recordChange({ db, logger, guildId, userId: interaction.user.id, userTag: interaction.user.tag, action: 'boost kanalı değiştirildi', oldValue: old, newValue: channel.id });
      return interaction.reply(`✅ Boost kanalı ${channel} olarak ayarlandı.`);
    }

    if (sub === 'test') {
      const payload = await boostService.buildBoostPayload(interaction.member, guildData);
      return interaction.reply(payload);
    }

    if (sub === 'sifirla') {
      db.reset(guildId, 'boost');
      auditService.recordChange({ db, logger, guildId, userId: interaction.user.id, userTag: interaction.user.tag, action: 'boost ayarları sıfırlandı' });
      return interaction.reply('✅ Boost ayarları sıfırlandı.');
    }
  },
};
