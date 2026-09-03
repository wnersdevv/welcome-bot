'use strict';

const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');

const CATEGORIES = {
  welcome: { label: 'Welcome', commands: ['/welcome kur', '/welcome ac', '/welcome kapat', '/welcome kanal', '/welcome sablon', '/welcome rol', '/welcome dm', '/welcome test'] },
  leave: { label: 'Leave', commands: ['/leave ac', '/leave kapat', '/leave kanal', '/leave sablon', '/leave test'] },
  boost: { label: 'Boost', commands: ['/boost ac', '/boost kapat', '/boost kanal', '/boost test'] },
  tasarim: { label: 'Tasarım', commands: ['/tasarim goster', '/tasarim renk', '/tasarim sekil'] },
  mesaj: { label: 'Mesaj', commands: ['/mesaj onizle', '/mesaj degiskenler'] },
  rol: { label: 'Roller', commands: ['/rol ekle', '/rol kaldir', '/rol liste', '/rol test'] },
  test: { label: 'Test', commands: ['/test welcome', '/test leave', '/test boost', '/test dm', '/test rol', '/test sistem'] },
  istatistik: { label: 'İstatistik', commands: ['/istatistik genel', '/istatistik buyume'] },
  guvenlik: { label: 'Güvenlik', commands: ['/guvenlik durum', '/guvenlik izinler', '/guvenlik kontrol'] },
  yedek: { label: 'Yedek', commands: ['/yedek olustur', '/yedek liste', '/yedek geriyukle', '/yedek sil'] },
  ayarlar: { label: 'Ayarlar', commands: ['/ayarlar goruntule', '/ayarlar disaaktar', '/ayarlar iceaktar', '/ayarlar sifirla'] },
};

module.exports = {
  data: new SlashCommandBuilder().setName('yardim').setDescription('İnteraktif yardım merkezini açar.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🆘 Yardım Merkezi')
      .setDescription('Bir kategori seç, ilgili komutları göreyim. Ana kontrol paneli için `/panel` kullanabilirsin.')
      .setColor(0x5865f2);

    const select = new StringSelectMenuBuilder()
      .setCustomId(`help:category:${interaction.user.id}`)
      .setPlaceholder('Kategori seç')
      .addOptions(Object.entries(CATEGORIES).map(([value, cat]) => ({ label: cat.label, value })));

    return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
  },

  CATEGORIES,
};
