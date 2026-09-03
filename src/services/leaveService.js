'use strict';

const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const placeholders = require('./placeholderService');
const imageService = require('./imageService');

async function buildLeavePayload(member, guildData, logger) {
  const ctx = placeholders.buildContext(member);
  const cfg = guildData.leave;
  const title = placeholders.apply(cfg.title, ctx);
  const description = placeholders.apply(cfg.description, ctx);

  const payload = { content: null, embeds: [], files: [] };

  if (cfg.useEmbed) {
    const embed = new EmbedBuilder()
      .setColor(cfg.color || '#ED4245')
      .setTitle(title)
      .setDescription(description)
      .setThumbnail(ctx.avatar)
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
        title: `Görüşürüz, ${ctx.username}`,
        subtitle: `${ctx.membercount} üye kaldı`,
      });
      payload.files.push(new AttachmentBuilder(buffer, { name: 'leave-card.png' }));
      if (payload.embeds[0]) payload.embeds[0].setImage('attachment://leave-card.png');
    } catch (err) {
      logger?.warn('Leave görseli oluşturulamadı', { error: err.message });
    }
  }

  return payload;
}

async function sendLeave(member, guildData, logger) {
  const cfg = guildData.leave;
  if (!cfg.enabled || !cfg.channelId) return { sent: false, reason: 'disabled_or_no_channel' };

  const channel = member.guild.channels.cache.get(cfg.channelId);
  if (!channel || !channel.isTextBased()) return { sent: false, reason: 'channel_missing' };

  const me = member.guild.members.me;
  if (!channel.permissionsFor(me)?.has(['ViewChannel', 'SendMessages'])) {
    return { sent: false, reason: 'missing_permissions' };
  }

  try {
    const payload = await buildLeavePayload(member, guildData, logger);
    await channel.send(payload);
    return { sent: true };
  } catch (err) {
    logger?.error('Leave mesajı gönderilemedi', err);
    return { sent: false, reason: 'send_failed', error: err.message };
  }
}

module.exports = { buildLeavePayload, sendLeave };
