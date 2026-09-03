'use strict';

const { SlashCommandBuilder, EmbedBuilder, version: djsVersion } = require('discord.js');

function formatUptime(ms) {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000) % 24;
  const d = Math.floor(ms / 86400000);
  return `${d}g ${h}s ${m}d ${s}sn`;
}

module.exports = {
  data: new SlashCommandBuilder().setName('status').setDescription('Bot durumunu ve sistem sağlığını gösterir.'),

  async execute(interaction, { client }) {
    const embed = new EmbedBuilder()
      .setTitle('📡 Bot Durumu')
      .setColor(0x5865f2)
      .addFields(
        { name: 'Ping', value: `${client.ws.ping}ms`, inline: true },
        { name: 'Uptime', value: formatUptime(client.uptime), inline: true },
        { name: 'Sunucu Sayısı', value: String(client.guilds.cache.size), inline: true },
        { name: 'Kullanıcı Sayısı', value: String(client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0)), inline: true },
        { name: 'Bellek Kullanımı', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`, inline: true },
        { name: 'Node.js', value: process.version, inline: true },
        { name: 'discord.js', value: `v${djsVersion}`, inline: true }
      );
    return interaction.reply({ embeds: [embed] });
  },
};
