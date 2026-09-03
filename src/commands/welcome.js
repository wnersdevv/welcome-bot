'use strict';

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require('discord.js');
const { buildMainPanel } = require('../components/panelComponents');
const placeholders = require('../services/placeholderService');
const welcomeService = require('../services/welcomeService');
const autoRoleService = require('../services/autoRoleService');
const dmService = require('../services/dmService');
const auditService = require('../services/auditService');
const { IMPLEMENTED_TEMPLATES } = require('../services/imageService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Welcome (karşılama) sistemini yönetir.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) => s.setName('kur').setDescription('Kurulum sihirbazını açar (panel üzerinden).'))
    .addSubcommand((s) => s.setName('ac').setDescription('Welcome sistemini açar.'))
    .addSubcommand((s) => s.setName('kapat').setDescription('Welcome sistemini kapatır.'))
    .addSubcommand((s) => s.setName('durum').setDescription('Mevcut Welcome ayarlarını gösterir.'))
    .addSubcommand((s) =>
      s
        .setName('kanal')
        .setDescription('Welcome mesajının gönderileceği kanalı ayarlar.')
        .addChannelOption((o) =>
          o.setName('kanal').setDescription('Hedef kanal').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s
        .setName('sablon')
        .setDescription('Welcome görsel şablonunu seçer.')
        .addStringOption((o) =>
          o.setName('sablon').setDescription('Şablon adı').setRequired(true).addChoices(...IMPLEMENTED_TEMPLATES.map((t) => ({ name: t, value: t })))
        )
    )
    .addSubcommand((s) => s.setName('gorsel').setDescription('Welcome kartı görselini açar/kapatır.'))
    .addSubcommand((s) => s.setName('dm').setDescription('Welcome DM özelliğini açar/kapatır.'))
    .addSubcommand((s) =>
      s
        .setName('rol')
        .setDescription('Yeni insan üyelere otomatik verilecek rolü ekler.')
        .addRoleOption((o) => o.setName('rol').setDescription('Otomatik verilecek rol').setRequired(true))
    )
    .addSubcommand((s) => s.setName('test').setDescription('Welcome mesajını kendi üzerinde test eder.'))
    .addSubcommand((s) => s.setName('onizleme').setDescription('Welcome mesajının önizlemesini gösterir.'))
    .addSubcommand((s) => s.setName('degiskenler').setDescription('Kullanılabilir placeholder listesini gösterir.'))
    .addSubcommand((s) => s.setName('sifirla').setDescription('Welcome ayarlarını varsayılana sıfırlar.')),

  async execute(interaction, { db, logger }) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const guildData = db.get(guildId);

    if (sub === 'kur') {
      db.update(guildId, (d) => {
        d.welcome.setupCompleted = true;
        return d;
      });
      await interaction.reply({
        content: [
          '**🧙 Welcome Kurulum Sihirbazı**',
          'Kurulumu Discord içi panel üzerinden tamamlaman en pratik yol:',
          '1️⃣ Kanal ve mesajı `/panel` → 👋 Welcome bölümünden ayarla',
          '2️⃣ Rol için `/welcome rol` komutunu kullan',
          '3️⃣ `/welcome test` ile sonucu gör',
        ].join('\n'),
      });
      return interaction.followUp(buildMainPanel(interaction.guild, db.get(guildId), interaction.user.id));
    }

    if (sub === 'ac' || sub === 'kapat') {
      const enabled = sub === 'ac';
      const old = guildData.welcome.enabled;
      db.update(guildId, (d) => {
        d.welcome.enabled = enabled;
        return d;
      });
      auditService.recordChange({ db, logger, guildId, userId: interaction.user.id, userTag: interaction.user.tag, action: 'welcome durumu değiştirildi', oldValue: old, newValue: enabled });
      return interaction.reply(`✅ Welcome sistemi **${enabled ? 'açıldı' : 'kapatıldı'}**.`);
    }

    if (sub === 'durum') {
      const cfg = guildData.welcome;
      const embed = new EmbedBuilder()
        .setTitle('👋 Welcome Durumu')
        .setColor(cfg.enabled ? 0x57f287 : 0xed4245)
        .addFields(
          { name: 'Durum', value: cfg.enabled ? '🟢 Aktif' : '🔴 Kapalı', inline: true },
          { name: 'Kanal', value: cfg.channelId ? `<#${cfg.channelId}>` : 'ayarlanmadı', inline: true },
          { name: 'Şablon', value: cfg.template, inline: true },
          { name: 'DM', value: cfg.dm.enabled ? 'Açık' : 'Kapalı', inline: true }
        );
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'kanal') {
      const channel = interaction.options.getChannel('kanal');
      const old = guildData.welcome.channelId;
      db.update(guildId, (d) => {
        d.welcome.channelId = channel.id;
        return d;
      });
      auditService.recordChange({ db, logger, guildId, userId: interaction.user.id, userTag: interaction.user.tag, action: 'welcome kanalı değiştirildi', oldValue: old, newValue: channel.id });
      return interaction.reply(`✅ Welcome kanalı ${channel} olarak ayarlandı.`);
    }

    if (sub === 'sablon') {
      const template = interaction.options.getString('sablon');
      db.update(guildId, (d) => {
        d.welcome.template = template;
        return d;
      });
      return interaction.reply(`✅ Welcome şablonu **${template}** olarak ayarlandı.`);
    }

    if (sub === 'gorsel') {
      const next = !guildData.welcome.useImage;
      db.update(guildId, (d) => {
        d.welcome.useImage = next;
        return d;
      });
      return interaction.reply(`✅ Welcome görseli **${next ? 'açıldı' : 'kapatıldı'}**.`);
    }

    if (sub === 'dm') {
      const next = !guildData.welcome.dm.enabled;
      db.update(guildId, (d) => {
        d.welcome.dm.enabled = next;
        return d;
      });
      return interaction.reply(`✅ Welcome DM **${next ? 'açıldı' : 'kapatıldı'}**.`);
    }

    if (sub === 'rol') {
      const role = interaction.options.getRole('rol');
      if (role.managed) {
        return interaction.reply({ content: '❌ Bu rol bir bota/entegrasyona ait, elle atanamaz.', ephemeral: true });
      }
      db.update(guildId, (d) => {
        if (!d.roles.humanRoleIds.includes(role.id)) d.roles.humanRoleIds.push(role.id);
        return d;
      });
      return interaction.reply(`✅ ${role} artık yeni üyelere otomatik veriliyor.`);
    }

    if (sub === 'test' || sub === 'onizleme') {
      await interaction.deferReply({ ephemeral: sub === 'onizleme' });
      const payload = await welcomeService.buildWelcomePayload(interaction.member, guildData, logger);
      return interaction.editReply(payload);
    }

    if (sub === 'degiskenler') {
      return interaction.reply({
        content: `**Kullanılabilir placeholderlar:**\n${placeholders.AVAILABLE_PLACEHOLDERS.map((p) => `\`{${p}}\``).join(', ')}`,
        ephemeral: true,
      });
    }

    if (sub === 'sifirla') {
      db.reset(guildId, 'welcome');
      auditService.recordChange({ db, logger, guildId, userId: interaction.user.id, userTag: interaction.user.tag, action: 'welcome ayarları sıfırlandı' });
      return interaction.reply('✅ Welcome ayarları sıfırlandı.');
    }
  },
};
