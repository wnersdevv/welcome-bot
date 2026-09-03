'use strict';

const { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const placeholders = require('./placeholderService');
const imageService = require('./imageService');

function buildButtonRow(buttons = []) {
  if (!buttons.length) return null;
  const row = new ActionRowBuilder();
  for (const btn of buttons.slice(0, 5)) {
    row.addComponents(
      new ButtonBuilder().setLabel(btn.label || 'Link').setStyle(ButtonStyle.Link).setURL(btn.url)
    );
  }
  return row;
}

async function buildWelcomePayload(member, guildData, logger) {
  const ctx = placeholders.buildContext(member);
  const cfg = guildData.welcome;
  const title = placeholders.apply(cfg.title, ctx);
  const description = placeholders.apply(cfg.description, ctx);

  const payload = { content: null, embeds: [], files: [], components: [] };

  if (cfg.useEmbed) {
    const embed = new EmbedBuilder()
      .setColor(cfg.color || '#5865F2')
      .setTitle(title)
      .setDescription(description)
      .setThumbnail(ctx.avatar)
      .setFooter({ text: ctx.server, iconURL: ctx.servericon || undefined })
      .setTimestamp();
    payload.embeds.push(embed);
  } else {
    payload.content = `${title}\n${description}`;
  }

  if (cfg.useImage) {
    try {
      const buffer = await imageService.renderCard({
        template: cfg.template,
        avatar: ctx.avatar,
        title: `Hoş geldin, ${ctx.username}!`,
        subtitle: `${ctx.membercount}. üye`,
      });
      const attachment = new AttachmentBuilder(buffer, { name: 'welcome-card.png' });
      payload.files.push(attachment);
      if (payload.embeds[0]) payload.embeds[0].setImage('attachment://welcome-card.png');
    } catch (err) {
      logger?.warn('Welcome görseli oluşturulamadı, mesaj görselsiz gönderiliyor', { error: err.message });
    }
  }

  const row = buildButtonRow(cfg.buttons);
  if (row) payload.components.push(row);

  return payload;
}

async function sendWelcome(member, guildData, logger) {
  const cfg = guildData.welcome;
  if (!cfg.enabled || !cfg.channelId) return { sent: false, reason: 'disabled_or_no_channel' };

  const channel = member.guild.channels.cache.get(cfg.channelId);
  if (!channel || !channel.isTextBased()) return { sent: false, reason: 'channel_missing' };

  const me = member.guild.members.me;
  if (!channel.permissionsFor(me)?.has(['ViewChannel', 'SendMessages'])) {
    return { sent: false, reason: 'missing_permissions' };
  }

  try {
    const payload = await buildWelcomePayload(member, guildData, logger);
    await channel.send(payload);
    return { sent: true };
  } catch (err) {
    logger?.error('Welcome mesajı gönderilemedi', err);
    return { sent: false, reason: 'send_failed', error: err.message };
  }
}

module.exports = { buildWelcomePayload, sendWelcome };
