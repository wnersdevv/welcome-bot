'use strict';

const { EmbedBuilder } = require('discord.js');
const placeholders = require('./placeholderService');

async function sendWelcomeDm(member, guildData, logger) {
  const cfg = guildData.welcome.dm;
  if (!cfg.enabled) return { sent: false, reason: 'disabled' };

  const ctx = placeholders.buildContext(member);
  const title = placeholders.apply(cfg.title, ctx);
  const description = placeholders.apply(cfg.description, ctx);

  try {
    if (cfg.useEmbed) {
      const embed = new EmbedBuilder().setTitle(title).setDescription(description).setColor('#5865F2');
      await member.send({ embeds: [embed] });
    } else {
      await member.send(`${title}\n${description}`);
    }
    return { sent: true };
  } catch (err) {
    // Kullanıcı DM'leri kapatmış olabilir - bu normal bir durumdur, sistemi durdurmaz.
    logger?.debug('Welcome DM gönderilemedi (muhtemelen DM kapalı)', { userId: member.id, error: err.message });
    return { sent: false, reason: 'dm_closed_or_error' };
  }
}

module.exports = { sendWelcomeDm };
