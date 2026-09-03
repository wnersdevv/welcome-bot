'use strict';

const { EmbedBuilder } = require('discord.js');
const placeholders = require('./placeholderService');

async function buildBoostPayload(member, guildData) {
  const ctx = placeholders.buildContext(member, {
    boostCount: member.guild.premiumSubscriptionCount,
    boostLevel: member.guild.premiumTier,
  });
  const cfg = guildData.boost;
  const title = placeholders.apply(cfg.title, ctx);
  const description = placeholders.apply(cfg.description, ctx);

  const embed = new EmbedBuilder()
    .setColor(cfg.color || '#F47FFF')
    .setTitle(title)
    .setDescription(description)
    .setThumbnail(ctx.avatar)
    .setTimestamp();

  return { embeds: [embed] };
}

async function sendBoost(member, guildData, logger) {
  const cfg = guildData.boost;
  if (!cfg.enabled || !cfg.channelId) return { sent: false, reason: 'disabled_or_no_channel' };

  const channel = member.guild.channels.cache.get(cfg.channelId);
  if (!channel || !channel.isTextBased()) return { sent: false, reason: 'channel_missing' };

  const me = member.guild.members.me;
  if (!channel.permissionsFor(me)?.has(['ViewChannel', 'SendMessages'])) {
    return { sent: false, reason: 'missing_permissions' };
  }

  try {
    const payload = await buildBoostPayload(member, guildData);
    await channel.send(payload);
    return { sent: true };
  } catch (err) {
    logger?.error('Boost mesajı gönderilemedi', err);
    return { sent: false, reason: 'send_failed', error: err.message };
  }
}

module.exports = { buildBoostPayload, sendBoost };
