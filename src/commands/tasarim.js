'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { HEX_COLOR_REGEX } = require('../modals/messageModals');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tasarim')
    .setDescription('Welcome/Leave kart tasarımını yönetir.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) => s.setName('goster').setDescription('Mevcut tasarım ayarlarını gösterir.'))
    .addSubcommand((s) =>
      s
        .setName('renk')
        .setDescription('Ana ve ikincil rengi ayarlar.')
        .addStringOption((o) => o.setName('ana').setDescription('Ana renk (hex, örn. #5865F2)').setRequired(true))
        .addStringOption((o) => o.setName('ikincil').setDescription('İkincil renk (hex)').setRequired(false))
    )
    .addSubcommand((s) =>
      s
        .setName('sekil')
        .setDescription('Avatar şeklini ayarlar.')
        .addStringOption((o) =>
          o.setName('sekil').setDescription('Şekil').setRequired(true).addChoices(
            { name: 'Yuvarlak', value: 'circle' },
            { name: 'Kare', value: 'square' }
          )
        )
    ),

  async execute(interaction, { db }) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const guildData = db.get(guildId);

    if (sub === 'goster') {
      const cfg = guildData.design;
      const embed = new EmbedBuilder()
        .setTitle('🎨 Tasarım Ayarları')
        .setColor(cfg.primaryColor)
        .addFields(
          { name: 'Ana Renk', value: cfg.primaryColor, inline: true },
          { name: 'İkincil Renk', value: cfg.secondaryColor, inline: true },
          { name: 'Avatar Şekli', value: cfg.avatarShape, inline: true }
        );
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'renk') {
      const primary = interaction.options.getString('ana');
      const secondary = interaction.options.getString('ikincil') || guildData.design.secondaryColor;
      if (!HEX_COLOR_REGEX.test(primary) || !HEX_COLOR_REGEX.test(secondary)) {
        return interaction.reply({ content: '❌ Renkler geçerli bir hex kodu olmalı, örn. #5865F2.', ephemeral: true });
      }
      db.update(guildId, (d) => {
        d.design.primaryColor = primary;
        d.design.secondaryColor = secondary;
        d.welcome.color = primary;
        return d;
      });
      return interaction.reply(`✅ Renkler güncellendi: ${primary} / ${secondary}`);
    }

    if (sub === 'sekil') {
      const shape = interaction.options.getString('sekil');
      db.update(guildId, (d) => {
        d.design.avatarShape = shape;
        return d;
      });
      return interaction.reply(`✅ Avatar şekli **${shape}** olarak ayarlandı.`);
    }
  },
};
