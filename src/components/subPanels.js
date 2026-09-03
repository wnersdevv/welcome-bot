'use strict';

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelType,
  MessageFlags,
} = require('discord.js');
const { statusIcon } = require('./panelComponents');
const analytics = require('../services/analyticsService');
const backupService = require('../services/backupService');
const configValidator = require('../services/configValidatorService');
const { IMPLEMENTED_TEMPLATES } = require('../services/imageService');

const FLAGS = MessageFlags.IsComponentsV2;

function backButton(ownerId) {
  return new ButtonBuilder().setCustomId(`panel:back:${ownerId}`).setLabel('← Ana Panel').setStyle(ButtonStyle.Secondary);
}

function toggleButton(ownerId, key, enabled) {
  return new ButtonBuilder()
    .setCustomId(`panel:toggle:${key}:${ownerId}`)
    .setLabel(enabled ? 'Kapat' : 'Aç')
    .setStyle(enabled ? ButtonStyle.Danger : ButtonStyle.Success);
}

function welcomePanel(guild, guildData, ownerId) {
  const cfg = guildData.welcome;
  const container = new ContainerBuilder().setAccentColor(0x57f287);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `## 👋 Welcome Ayarları  ${statusIcon(cfg.enabled)}`,
        `**Kanal:** ${cfg.channelId ? `<#${cfg.channelId}>` : 'ayarlanmadı'}`,
        `**Şablon:** ${cfg.template}`,
        `**Embed:** ${cfg.useEmbed ? 'Evet' : 'Hayır'}  •  **Görsel:** ${cfg.useImage ? 'Evet' : 'Hayır'}`,
        '',
        `**Başlık:** ${cfg.title}`,
        `**Açıklama:** ${cfg.description}`,
      ].join('\n')
    )
  );
  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

  const channelRow = new ActionRowBuilder().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(`welcome:channel:${ownerId}`)
      .setPlaceholder('Welcome kanalını seç')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
  );

  const templateRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`welcome:template:${ownerId}`)
      .setPlaceholder('Şablon seç')
      .addOptions(IMPLEMENTED_TEMPLATES.map((t) => ({ label: t, value: t })))
  );

  const buttonRow = new ActionRowBuilder().addComponents(
    toggleButton(ownerId, 'welcome', cfg.enabled),
    new ButtonBuilder().setCustomId(`welcome:editmsg:${ownerId}`).setLabel('Mesajı Düzenle').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`welcome:toggleembed:${ownerId}`).setLabel(cfg.useEmbed ? 'Embed Kapat' : 'Embed Aç').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`welcome:toggleimage:${ownerId}`).setLabel(cfg.useImage ? 'Görsel Kapat' : 'Görsel Aç').setStyle(ButtonStyle.Secondary)
  );

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`test:run:welcome:${ownerId}`).setLabel('🧪 Test Et').setStyle(ButtonStyle.Secondary),
    backButton(ownerId)
  );

  return { flags: FLAGS, components: [container, channelRow, templateRow, buttonRow, navRow] };
}

function leavePanel(guild, guildData, ownerId) {
  const cfg = guildData.leave;
  const container = new ContainerBuilder().setAccentColor(0xed4245);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `## 🚪 Leave Ayarları  ${statusIcon(cfg.enabled)}`,
        `**Kanal:** ${cfg.channelId ? `<#${cfg.channelId}>` : 'ayarlanmadı'}`,
        `**Şablon:** ${cfg.template}`,
        `**Embed:** ${cfg.useEmbed ? 'Evet' : 'Hayır'}  •  **Görsel:** ${cfg.useImage ? 'Evet' : 'Hayır'}`,
      ].join('\n')
    )
  );
  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

  const channelRow = new ActionRowBuilder().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(`leave:channel:${ownerId}`)
      .setPlaceholder('Leave kanalını seç')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
  );

  const buttonRow = new ActionRowBuilder().addComponents(
    toggleButton(ownerId, 'leave', cfg.enabled),
    new ButtonBuilder().setCustomId(`leave:editmsg:${ownerId}`).setLabel('Mesajı Düzenle').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`leave:toggleimage:${ownerId}`).setLabel(cfg.useImage ? 'Görsel Kapat' : 'Görsel Aç').setStyle(ButtonStyle.Secondary)
  );

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`test:run:leave:${ownerId}`).setLabel('🧪 Test Et').setStyle(ButtonStyle.Secondary),
    backButton(ownerId)
  );

  return { flags: FLAGS, components: [container, channelRow, buttonRow, navRow] };
}

function boostPanel(guild, guildData, ownerId) {
  const cfg = guildData.boost;
  const container = new ContainerBuilder().setAccentColor(0xf47fff);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [`## 🚀 Boost Ayarları  ${statusIcon(cfg.enabled)}`, `**Kanal:** ${cfg.channelId ? `<#${cfg.channelId}>` : 'ayarlanmadı'}`].join('\n')
    )
  );
  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

  const channelRow = new ActionRowBuilder().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(`boost:channel:${ownerId}`)
      .setPlaceholder('Boost kanalını seç')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
  );

  const buttonRow = new ActionRowBuilder().addComponents(
    toggleButton(ownerId, 'boost', cfg.enabled),
    new ButtonBuilder().setCustomId(`boost:editmsg:${ownerId}`).setLabel('Mesajı Düzenle').setStyle(ButtonStyle.Primary)
  );

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`test:run:boost:${ownerId}`).setLabel('🧪 Test Et').setStyle(ButtonStyle.Secondary),
    backButton(ownerId)
  );

  return { flags: FLAGS, components: [container, channelRow, buttonRow, navRow] };
}

function designPanel(guild, guildData, ownerId) {
  const cfg = guildData.design;
  const container = new ContainerBuilder().setAccentColor(0x9b59b6);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        '## 🎨 Tasarım Ayarları',
        `**Ana Renk:** ${cfg.primaryColor}`,
        `**İkincil Renk:** ${cfg.secondaryColor}`,
        `**Avatar Şekli:** ${cfg.avatarShape}`,
        `**Avatar Çerçevesi:** ${cfg.avatarBorder ? 'Açık' : 'Kapalı'}`,
      ].join('\n')
    )
  );
  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

  const shapeRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`design:avatarshape:${ownerId}`)
      .setPlaceholder('Avatar şekli seç')
      .addOptions(
        { label: 'Yuvarlak', value: 'circle' },
        { label: 'Kare (yuvarlatılmış)', value: 'square' }
      )
  );

  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`design:editcolors:${ownerId}`).setLabel('Renkleri Düzenle').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`design:toggleborder:${ownerId}`).setLabel(cfg.avatarBorder ? 'Çerçeve Kapat' : 'Çerçeve Aç').setStyle(ButtonStyle.Secondary)
  );

  return { flags: FLAGS, components: [container, shapeRow, buttonRow, new ActionRowBuilder().addComponents(backButton(ownerId))] };
}

function rolesPanel(guild, guildData, ownerId) {
  const { humanRoleIds, botRoleIds } = guildData.roles;
  const container = new ContainerBuilder().setAccentColor(0xfaa61a);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        '## 🎭 Otomatik Rol Ayarları',
        `**İnsan rolleri:** ${humanRoleIds.length ? humanRoleIds.map((r) => `<@&${r}>`).join(', ') : 'yok'}`,
        `**Bot rolleri:** ${botRoleIds.length ? botRoleIds.map((r) => `<@&${r}>`).join(', ') : 'yok'}`,
      ].join('\n')
    )
  );
  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

  const humanRow = new ActionRowBuilder().addComponents(
    new RoleSelectMenuBuilder().setCustomId(`roles:human:${ownerId}`).setPlaceholder('İnsanlar için roller (çoklu seçim)').setMinValues(0).setMaxValues(5)
  );
  const botRow = new ActionRowBuilder().addComponents(
    new RoleSelectMenuBuilder().setCustomId(`roles:bot:${ownerId}`).setPlaceholder('Botlar için roller (çoklu seçim)').setMinValues(0).setMaxValues(5)
  );

  return { flags: FLAGS, components: [container, humanRow, botRow, new ActionRowBuilder().addComponents(backButton(ownerId))] };
}

function dmPanel(guild, guildData, ownerId) {
  const cfg = guildData.welcome.dm;
  const container = new ContainerBuilder().setAccentColor(0x5865f2);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `## 📩 Welcome DM  ${statusIcon(cfg.enabled)}`,
        `**Başlık:** ${cfg.title}`,
        `**Açıklama:** ${cfg.description}`,
        "_Not: kullanıcı DM'lerini kapatmışsa bot bunu sessizce atlar, hata vermez._",
      ].join('\n')
    )
  );
  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

  const buttonRow = new ActionRowBuilder().addComponents(
    toggleButton(ownerId, 'dm', cfg.enabled),
    new ButtonBuilder().setCustomId(`dm:editmsg:${ownerId}`).setLabel('Mesajı Düzenle').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`test:run:dm:${ownerId}`).setLabel('🧪 Test Et').setStyle(ButtonStyle.Secondary)
  );

  return { flags: FLAGS, components: [container, buttonRow, new ActionRowBuilder().addComponents(backButton(ownerId))] };
}

function testPanel(guild, guildData, ownerId) {
  const container = new ContainerBuilder().setAccentColor(0x2ecc71);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent('## 🧪 Test Merkezi\nBir sistemi seçip kendi hesabınla test et.')
  );
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`test:run:welcome:${ownerId}`).setLabel('Welcome').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`test:run:leave:${ownerId}`).setLabel('Leave').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`test:run:boost:${ownerId}`).setLabel('Boost').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`test:run:dm:${ownerId}`).setLabel('DM').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`test:run:rol:${ownerId}`).setLabel('Rol').setStyle(ButtonStyle.Primary)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`test:run:izin:${ownerId}`).setLabel('İzin').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`test:run:sistem:${ownerId}`).setLabel('Sistem').setStyle(ButtonStyle.Secondary),
    backButton(ownerId)
  );
  return { flags: FLAGS, components: [container, row1, row2] };
}

function statsPanel(guild, guildData, ownerId) {
  const s = analytics.getSummary(guildData);
  const container = new ContainerBuilder().setAccentColor(0x3498db);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        '## 📊 İstatistikler',
        `**Bugün:** giriş ${s.today.joins} • çıkış ${s.today.leaves} • net ${s.netGrowth.today}`,
        `**Haftalık:** giriş ${s.weekly.joins} • çıkış ${s.weekly.leaves} • net ${s.netGrowth.weekly}`,
        `**Aylık:** giriş ${s.monthly.joins} • çıkış ${s.monthly.leaves} • net ${s.netGrowth.monthly}`,
        '',
        `**Toplam Welcome:** ${s.totals.welcomes}   **Toplam Leave:** ${s.totals.leaves}   **Boost:** ${s.totals.boosts}`,
        `**DM:** ✓${s.totals.dmSuccess} / ✗${s.totals.dmFail}   **Rol:** ✓${s.totals.roleSuccess} / ✗${s.totals.roleFail}`,
        `**Hatalar:** ${s.totals.errors}`,
      ].join('\n')
    )
  );
  return { flags: FLAGS, components: [container, new ActionRowBuilder().addComponents(backButton(ownerId))] };
}

function securityPanel(guild, guildData, ownerId) {
  const me = guild.members.me;
  const perms = ['ManageGuild', 'ManageRoles', 'ManageChannels', 'SendMessages', 'EmbedLinks', 'AttachFiles'];
  const container = new ContainerBuilder().setAccentColor(0xe74c3c);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        '## 🛡️ Güvenlik Merkezi',
        '**Bot İzinleri:**',
        ...perms.map((p) => `${me.permissions.has(p) ? '✅' : '❌'} ${p}`),
      ].join('\n')
    )
  );
  const validation = configValidator.validateAll(guild, guildData);
  const issues = [...validation.welcome, ...validation.leave, ...validation.boost];
  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      issues.length ? `**⚠️ Sorunlar:**\n${issues.map((i) => `• ${i}`).join('\n')}` : '**✅ Tespit edilen sorun yok.**'
    )
  );
  return { flags: FLAGS, components: [container, new ActionRowBuilder().addComponents(backButton(ownerId))] };
}

function backupsPanel(guildId, ownerId) {
  const backups = backupService.listBackups(guildId).slice(0, 10);
  const container = new ContainerBuilder().setAccentColor(0x95a5a6);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      ['## 💾 Yedekler', backups.length ? backups.map((b) => `• ${b}`).join('\n') : 'Henüz yedek yok.'].join('\n')
    )
  );
  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`backup:create:${ownerId}`).setLabel('Yedek Oluştur').setStyle(ButtonStyle.Success)
  );
  const rows = [container, buttonRow];
  if (backups.length) {
    rows.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`backup:restore:${ownerId}`)
          .setPlaceholder('Geri yüklenecek yedeği seç')
          .addOptions(backups.map((b) => ({ label: b, value: b })))
      )
    );
  }
  rows.push(new ActionRowBuilder().addComponents(backButton(ownerId)));
  return { flags: FLAGS, components: rows };
}

function settingsPanel(guild, guildData, ownerId) {
  const container = new ContainerBuilder().setAccentColor(0x607d8b);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent('## ⚙️ Genel Ayarlar\nDışa/içe aktarma ve sıfırlama işlemleri.')
  );
  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`settings:export:${ownerId}`).setLabel('Dışa Aktar').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`settings:import:${ownerId}`).setLabel('İçe Aktar').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`settings:resetconfirm:${ownerId}`).setLabel('Her Şeyi Sıfırla').setStyle(ButtonStyle.Danger)
  );
  return { flags: FLAGS, components: [container, buttonRow, new ActionRowBuilder().addComponents(backButton(ownerId))] };
}

function resetConfirmPanel(ownerId) {
  const container = new ContainerBuilder().setAccentColor(0xe74c3c);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent('## ⚠️ Emin misin?\nTüm Welcome/Leave/Boost/Rol/Tasarım ayarları sıfırlanacak. Bu işlem geri alınamaz.')
  );
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`settings:resetcancel:${ownerId}`).setLabel('İptal').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`settings:resetdo:${ownerId}`).setLabel('Sıfırla').setStyle(ButtonStyle.Danger)
  );
  return { flags: FLAGS, components: [container, row] };
}

function helpPanel(ownerId) {
  const container = new ContainerBuilder().setAccentColor(0x5865f2);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        '## ❓ Yardım Merkezi',
        '**/panel** — Ana kontrol merkezini açar',
        '**/welcome** — Welcome alt komutları (kanal, mesaj, rol, dm, test, sıfırla...)',
        '**/leave**, **/boost**, **/rol**, **/tasarım**, **/mesaj** — ilgili modülleri yönetir',
        '**/test** — tüm sistemleri test eder',
        '**/istatistik** — sunucu analitiği',
        '**/yedek**, **/ayarlar** — yedekleme ve dışa/içe aktarma',
        '**/güvenlik**, **/sistem-kontrol**, **/status** — sağlık ve güvenlik bilgisi',
      ].join('\n')
    )
  );
  return { flags: FLAGS, components: [container, new ActionRowBuilder().addComponents(backButton(ownerId))] };
}

const SECTION_BUILDERS = {
  welcome: welcomePanel,
  leave: leavePanel,
  boost: boostPanel,
  design: designPanel,
  roles: rolesPanel,
  dm: dmPanel,
  test: testPanel,
  stats: statsPanel,
  security: securityPanel,
  settings: settingsPanel,
  help: (guild, guildData, ownerId) => helpPanel(ownerId),
  backups: (guild, guildData, ownerId) => backupsPanel(guild.id, ownerId),
};

module.exports = { SECTION_BUILDERS, resetConfirmPanel, backButton };
