'use strict';

const { getConfig } = require('../config/config');

/**
 * Basit bellek içi sliding-window rate limiter.
 * key: genelde `${guildId}:${userId}:${scope}` (scope = button/modal/command vs.)
 */
class RateLimiter {
  constructor() {
    this.hits = new Map(); // key -> timestamps[]
    setInterval(() => this._cleanup(), 60_000).unref();
  }

  _cleanup() {
    const cutoff = Date.now() - 60_000;
    for (const [key, timestamps] of this.hits.entries()) {
      const kept = timestamps.filter((t) => t > cutoff);
      if (kept.length === 0) this.hits.delete(key);
      else this.hits.set(key, kept);
    }
  }

  hit(key) {
    const { interactionWindowMs, maxInteractions } = getConfig().rateLimit;
    const now = Date.now();
    const timestamps = (this.hits.get(key) || []).filter((t) => now - t < interactionWindowMs);
    timestamps.push(now);
    this.hits.set(key, timestamps);
    return {
      limited: timestamps.length > maxInteractions,
      count: timestamps.length,
      max: maxInteractions,
    };
  }
}

const limiter = new RateLimiter();

function checkRateLimit(guildId, userId, scope) {
  return limiter.hit(`${guildId}:${userId}:${scope}`);
}

module.exports = { checkRateLimit };
