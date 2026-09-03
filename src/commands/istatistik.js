'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const analytics = require('../services/analyticsService');

function sparkline(values) {
  const blocks = '▁▂▃▄▅▆▇█';
  const max = Math.max(1, ...values.map((v) => Math.abs(v)));
  return values
    .map((v) => {
      const idx = Math.min(blocks.length - 1, Math.round((Math.abs(v) / max) * (blocks.length - 1)));
      return v < 0 ? `-${blocks[idx]}` : blocks[idx];
    })
    .join(' ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('istatistik')
    .setDescription('Sunucu analitiğini gösterir.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) => s.setName('genel').setDescription('Genel istatistik özeti.'))
    .addSubcommand((s) =>
      s
        .setName('buyume')
        .setDescription('Üye büyüme grafiği.')
        .addIntegerOption((o) =>
          o.setName('gun').setDescription('Kaç günlük').setRequired(false).addChoices(
            { name: '7 gün', value: 7 },
            { name: '30 gün', value: 30 },
            { name: '90 gün', value: 90 }
          )
        )
    ),

  async execute(interaction, { db }) {
    const sub = interaction.options.getSubcommand();
    const guildData = db.get(interaction.guild.id);

    if (sub === 'genel') {
      const s = analytics.getSummary(guildData);
      const embed = new EmbedBuilder()
        .setTitle('📊 Sunucu İstatistikleri')
        .setColor(0x3498db)
        .addFields(
          { name: 'Bugün', value: `Giriş: ${s.today.joins} • Çıkış: ${s.today.leaves} • Net: ${s.netGrowth.today}` },
          { name: 'Haftalık', value: `Giriş: ${s.weekly.joins} • Çıkış: ${s.weekly.leaves} • Net: ${s.netGrowth.weekly}` },
          { name: 'Aylık', value: `Giriş: ${s.monthly.joins} • Çıkış: ${s.monthly.leaves} • Net: ${s.netGrowth.monthly}` },
          { name: 'Toplamlar', value: `Welcome: ${s.totals.welcomes} • Leave: ${s.totals.leaves} • Boost: ${s.totals.boosts}` },
          { name: 'DM / Rol', value: `DM: ✓${s.totals.dmSuccess} ✗${s.totals.dmFail} • Rol: ✓${s.totals.roleSuccess} ✗${s.totals.roleFail}` },
          { name: 'Hatalar', value: String(s.totals.errors) }
        );
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'buyume') {
      const days = interaction.options.getInteger('gun') || 30;
      const series = analytics.growthSeries(guildData, days);
      return interaction.reply({
        content: `**Son ${days} günlük net üye değişimi:**\n\`${sparkline(series)}\``,
      });
    }
  },
};
