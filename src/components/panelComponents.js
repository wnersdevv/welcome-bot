'use strict';

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
} = require('discord.js');
const analytics = require('../services/analyticsService');

const statusIcon = (enabled) => (enabled ? '🟢 AKTİF' : '🔴 KAPALI');

/**
 * Ana /panel görünümünü Components V2 ile oluşturur.
 * Discord.js v14.17+ Components V2: ContainerBuilder + TextDisplayBuilder + SeparatorBuilder,
 * mesaj MessageFlags.IsComponentsV2 bayrağı ile gönderilir.
 */
function buildMainPanel(guild, guildData, ownerId) {
  const summary = analytics.getSummary(guildData);

  const container = new ContainerBuilder().setAccentColor(0x5865f2);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        '## 👑 COMMUNITY CENTER',
        `**${guild.name}**`,
      ].join('\n')
    )
  );

  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `👋 Welcome     ${statusIcon(guildData.welcome.enabled)}`,
        `🚪 Leave       ${statusIcon(guildData.leave.enabled)}`,
        `🚀 Boost       ${statusIcon(guildData.boost.enabled)}`,
        `📩 Welcome DM  ${statusIcon(guildData.welcome.dm.enabled)}`,
      ].join('\n')
    )
  );

  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `👥 Üyeler: **${guild.memberCount.toLocaleString('tr-TR')}**`,
        `📥 Bugünkü giriş: **${summary.today.joins}**`,
        `🚪 Bugünkü çıkış: **${summary.today.leaves}**`,
      ].join('\n')
    )
  );

  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

  const select = new StringSelectMenuBuilder()
    .setCustomId(`panel:nav:${ownerId}`)
    .setPlaceholder('Bir bölüm seç...')
    .addOptions(
      { label: 'Welcome', description: 'Karşılama sistemi ayarları', value: 'welcome', emoji: '👋' },
      { label: 'Leave', description: 'Ayrılma mesajı ayarları', value: 'leave', emoji: '🚪' },
      { label: 'Boost', description: 'Boost mesajı ayarları', value: 'boost', emoji: '🚀' },
      { label: 'Tasarım', description: 'Görsel & renk ayarları', value: 'design', emoji: '🎨' },
      { label: 'Roller', description: 'Otomatik rol ayarları', value: 'roles', emoji: '🎭' },
      { label: 'DM', description: 'Welcome DM ayarları', value: 'dm', emoji: '📩' },
      { label: 'Test Merkezi', description: 'Tüm sistemleri test et', value: 'test', emoji: '🧪' },
      { label: 'İstatistik', description: 'Sunucu analitiği', value: 'stats', emoji: '📊' },
      { label: 'Güvenlik', description: 'İzinler ve rate limit', value: 'security', emoji: '🛡️' },
      { label: 'Yedekler', description: 'Backup oluştur / geri yükle', value: 'backups', emoji: '💾' },
      { label: 'Ayarlar', description: 'Genel ayarlar & sıfırlama', value: 'settings', emoji: '⚙️' },
      { label: 'Yardım', description: 'Komut rehberi', value: 'help', emoji: '❓' }
    );

  const row = new ActionRowBuilder().addComponents(select);

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container, row],
  };
}

module.exports = { buildMainPanel, statusIcon, PANEL_FLAGS: MessageFlags.IsComponentsV2 };
