'use strict';

function countSince(history, type, sinceMs) {
  const cutoff = Date.now() - sinceMs;
  return history.filter((h) => h.type === type && h.ts >= cutoff).length;
}

const DAY = 24 * 60 * 60 * 1000;

function getSummary(guildData) {
  const { stats } = guildData;
  const history = stats.history || [];

  return {
    today: {
      joins: countSince(history, 'join', DAY),
      leaves: countSince(history, 'leave', DAY),
    },
    weekly: {
      joins: countSince(history, 'join', 7 * DAY),
      leaves: countSince(history, 'leave', 7 * DAY),
    },
    monthly: {
      joins: countSince(history, 'join', 30 * DAY),
      leaves: countSince(history, 'leave', 30 * DAY),
    },
    totals: {
      welcomes: stats.totalWelcomes,
      leaves: stats.totalLeaves,
      boosts: stats.totalBoosts,
      dmSuccess: stats.totalDmSuccess,
      dmFail: stats.totalDmFail,
      roleSuccess: stats.totalRoleSuccess,
      roleFail: stats.totalRoleFail,
      errors: stats.totalErrors,
    },
    netGrowth: {
      today: countSince(history, 'join', DAY) - countSince(history, 'leave', DAY),
      weekly: countSince(history, 'join', 7 * DAY) - countSince(history, 'leave', 7 * DAY),
      monthly: countSince(history, 'join', 30 * DAY) - countSince(history, 'leave', 30 * DAY),
    },
  };
}

/** period: 7 | 30 | 90 gün için günlük net üye değişimini hesaplar (basit metin grafiği için). */
function growthSeries(guildData, periodDays) {
  const history = guildData.stats.history || [];
  const buckets = new Array(periodDays).fill(0);
  const now = Date.now();

  for (const entry of history) {
    const dayIndex = Math.floor((now - entry.ts) / DAY);
    if (dayIndex >= 0 && dayIndex < periodDays) {
      buckets[periodDays - 1 - dayIndex] += entry.type === 'join' ? 1 : -1;
    }
  }
  return buckets;
}

module.exports = { getSummary, growthSeries };
