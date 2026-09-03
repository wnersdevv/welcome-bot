'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const leaveService = require('../services/leaveService');
const auditService = require('../services/auditService');
const { IMPLEMENTED_TEMPLATES } = require('../services/imageService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leave (ayrılma) sistemini yönetir.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) => s.setName('ac').setDescription('Leave sistemini açar.'))
    .addSubcommand((s) => s.setName('kapat').setDescription('Leave sistemini kapatır.'))
    .addSubcommand((s) => s.setName('durum').setDescription('Mevcut Leave ayarlarını gösterir.'))
    .addSubcommand((s) =>
      s
        .setName('kanal')
        .setDescription('Leave mesajının gönderileceği kanalı ayarlar.')
        .addChannelOption((o) =>
          o.setName('kanal').setDescription('Hedef kanal').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s
        .setName('sablon')
        .setDescription('Leave görsel şablonunu seçer.')
        .addStringOption((o) =>
          o.setName('sablon').setDescription('Şablon adı').setRequired(true).addChoices(...IMPLEMENTED_TEMPLATES.map((t) => ({ name: t, value: t })))
        )
    )
    .addSubcommand((s) => s.setName('gorsel').setDescription('Leave kartı görselini açar/kapatır.'))
    .addSubcommand((s) => s.setName('test').setDescription('Leave mesajını kendi üzerinde test eder.'))
    .addSubcommand((s) => s.setName('onizleme').setDescription('Leave mesajının önizlemesini gösterir.'))
    .addSubcommand((s) => s.setName('sifirla').setDescription('Leave ayarlarını varsayılana sıfırlar.')),

  async execute(interaction, { db, logger }) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const guildData = db.get(guildId);

    if (sub === 'ac' || sub === 'kapat') {
      const enabled = sub === 'ac';
      const old = guildData.leave.enabled;
      db.update(guildId, (d) => {
        d.leave.enabled = enabled;
        return d;
      });
      auditService.recordChange({ db, logger, guildId, userId: interaction.user.id, userTag: interaction.user.tag, action: 'leave durumu değiştirildi', oldValue: old, newValue: enabled });
      return interaction.reply(`✅ Leave sistemi **${enabled ? 'açıldı' : 'kapatıldı'}**.`);
    }

    if (sub === 'durum') {
      const cfg = guildData.leave;
      const embed = new EmbedBuilder()
        .setTitle('🚪 Leave Durumu')
        .setColor(cfg.enabled ? 0x57f287 : 0xed4245)
        .addFields(
          { name: 'Durum', value: cfg.enabled ? '🟢 Aktif' : '🔴 Kapalı', inline: true },
          { name: 'Kanal', value: cfg.channelId ? `<#${cfg.channelId}>` : 'ayarlanmadı', inline: true },
          { name: 'Şablon', value: cfg.template, inline: true }
        );
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'kanal') {
      const channel = interaction.options.getChannel('kanal');
      const old = guildData.leave.channelId;
      db.update(guildId, (d) => {
        d.leave.channelId = channel.id;
        return d;
      });
      auditService.recordChange({ db, logger, guildId, userId: interaction.user.id, userTag: interaction.user.tag, action: 'leave kanalı değiştirildi', oldValue: old, newValue: channel.id });
      return interaction.reply(`✅ Leave kanalı ${channel} olarak ayarlandı.`);
    }

    if (sub === 'sablon') {
      const template = interaction.options.getString('sablon');
      db.update(guildId, (d) => {
        d.leave.template = template;
        return d;
      });
      return interaction.reply(`✅ Leave şablonu **${template}** olarak ayarlandı.`);
    }

    if (sub === 'gorsel') {
      const next = !guildData.leave.useImage;
      db.update(guildId, (d) => {
        d.leave.useImage = next;
        return d;
      });
      return interaction.reply(`✅ Leave görseli **${next ? 'açıldı' : 'kapatıldı'}**.`);
    }

    if (sub === 'test' || sub === 'onizleme') {
      await interaction.deferReply({ ephemeral: sub === 'onizleme' });
      const payload = await leaveService.buildLeavePayload(interaction.member, guildData, logger);
      return interaction.editReply(payload);
    }

    if (sub === 'sifirla') {
      db.reset(guildId, 'leave');
      auditService.recordChange({ db, logger, guildId, userId: interaction.user.id, userTag: interaction.user.tag, action: 'leave ayarları sıfırlandı' });
      return interaction.reply('✅ Leave ayarları sıfırlandı.');
    }
  },
};
