'use strict';

function accountAgeText(createdTimestamp) {
  const days = Math.floor((Date.now() - createdTimestamp) / (1000 * 60 * 60 * 24));
  if (days < 1) return 'bugün oluşturuldu';
  if (days < 30) return `${days} gün önce oluşturuldu`;
  if (days < 365) return `${Math.floor(days / 30)} ay önce oluşturuldu`;
  return `${Math.floor(days / 365)} yıl önce oluşturuldu`;
}

/**
 * Builds the placeholder map for a given member/guild context.
 * member: GuildMember (required)
 * extra: { boostCount, boostLevel } optional overrides for boost events
 */
function buildContext(member, extra = {}) {
  const guild = member.guild;
  const user = member.user;
  const now = new Date();

  return {
    user: user.tag,
    mention: `<@${user.id}>`,
    username: user.username,
    displayname: member.displayName,
    id: user.id,
    avatar: user.displayAvatarURL({ size: 512, extension: 'png' }),
    server: guild.name,
    servericon: guild.iconURL({ size: 512, extension: 'png' }) || '',
    membercount: guild.memberCount.toLocaleString('tr-TR'),
    createdat: user.createdAt.toLocaleDateString('tr-TR'),
    joinedat: member.joinedAt ? member.joinedAt.toLocaleDateString('tr-TR') : '-',
    accountage: accountAgeText(user.createdTimestamp),
    boostcount: String(extra.boostCount ?? guild.premiumSubscriptionCount ?? 0),
    boostlevel: String(extra.boostLevel ?? guild.premiumTier ?? 0),
    date: now.toLocaleDateString('tr-TR'),
    time: now.toLocaleTimeString('tr-TR'),
    random: String(Math.floor(Math.random() * 10000)),
  };
}

/**
 * Replaces {placeholder} tokens in a string. Unknown placeholders are left untouched
 * so a typo doesn't silently eat text, but never throws.
 */
function apply(text, context) {
  if (typeof text !== 'string' || !text) return text;
  return text.replace(/\{([a-z]+)\}/gi, (match, key) => {
    const lower = key.toLowerCase();
    return Object.prototype.hasOwnProperty.call(context, lower) ? context[lower] : match;
  });
}

/** Applies placeholders across every string field of an object (shallow, one level of nesting). */
function applyDeep(obj, context) {
  if (typeof obj === 'string') return apply(obj, context);
  if (Array.isArray(obj)) return obj.map((v) => applyDeep(v, context));
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = applyDeep(v, context);
    return out;
  }
  return obj;
}

const AVAILABLE_PLACEHOLDERS = [
  'user', 'mention', 'username', 'displayname', 'id', 'avatar', 'server', 'servericon',
  'membercount', 'createdat', 'joinedat', 'accountage', 'boostcount', 'boostlevel',
  'date', 'time', 'random',
];

module.exports = { buildContext, apply, applyDeep, AVAILABLE_PLACEHOLDERS };
