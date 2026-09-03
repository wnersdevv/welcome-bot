'use strict';

const fs = require('fs');
const path = require('path');
const { defaultGuildData } = require('./guildSchema');

const DATA_DIR = path.join(process.cwd(), 'data', 'guilds');

/**
 * Guild-scoped JSON persistence with an in-memory cache.
 * Flow: read -> cache. write -> disk (atomic) -> cache update.
 * Each guild's data lives in its own file so guilds are fully independent.
 */
class Database {
  constructor(logger) {
    this.logger = logger.child('database');
    this.cache = new Map();
    this.writeQueue = new Map(); // guildId -> debounce timer
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  _filePath(guildId) {
    return path.join(DATA_DIR, `${guildId}.json`);
  }

  _readFromDisk(guildId) {
    const file = this._filePath(guildId);
    if (!fs.existsSync(file)) {
      const fresh = defaultGuildData(guildId);
      this._writeToDisk(guildId, fresh);
      return fresh;
    }
    try {
      const raw = fs.readFileSync(file, 'utf-8');
      const parsed = JSON.parse(raw);
      // merge with defaults so new fields introduced later don't break old data
      return this._mergeDeep(defaultGuildData(guildId), parsed);
    } catch (err) {
      this.logger.error(`Guild verisi okunamadı (${guildId}), varsayılana dönülüyor`, err);
      return defaultGuildData(guildId);
    }
  }

  _mergeDeep(base, override) {
    if (Array.isArray(base)) return Array.isArray(override) ? override : base;
    if (typeof base === 'object' && base !== null) {
      const result = { ...base };
      for (const key of Object.keys(override || {})) {
        result[key] = key in base ? this._mergeDeep(base[key], override[key]) : override[key];
      }
      return result;
    }
    return override === undefined ? base : override;
  }

  _writeToDisk(guildId, data) {
    const file = this._filePath(guildId);
    const tmp = `${file}.tmp`;
    try {
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmp, file);
    } catch (err) {
      this.logger.error(`Guild verisi yazılamadı (${guildId})`, err);
    }
  }

  get(guildId) {
    if (!this.cache.has(guildId)) {
      this.cache.set(guildId, this._readFromDisk(guildId));
    }
    return this.cache.get(guildId);
  }

  /**
   * mutator receives the current data object and mutates it in place (or returns a new object).
   * Persists to disk immediately and refreshes the cache - callers (panel/commands) always
   * read the same cache, so command <-> panel state stays in sync.
   */
  update(guildId, mutator) {
    const current = this.get(guildId);
    const next = mutator(current) || current;
    next.updatedAt = Date.now();
    this.cache.set(guildId, next);
    this._writeToDisk(guildId, next);
    return next;
  }

  addAuditEntry(guildId, entry) {
    return this.update(guildId, (data) => {
      data.audit.unshift({ ts: Date.now(), ...entry });
      data.audit = data.audit.slice(0, 200);
      return data;
    });
  }

  recordStat(guildId, type) {
    return this.update(guildId, (data) => {
      const key = `total${type[0].toUpperCase()}${type.slice(1)}s`;
      if (typeof data.stats[key] === 'number') data.stats[key] += 1;
      if (type === 'join' || type === 'leave') {
        data.stats.history.push({ type, ts: Date.now() });
        // keep last 90 days worth of raw events, trim aggressively to avoid unbounded growth
        const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
        data.stats.history = data.stats.history.filter((h) => h.ts >= cutoff);
      }
      return data;
    });
  }

  reset(guildId, section) {
    return this.update(guildId, (data) => {
      const fresh = defaultGuildData(guildId);
      if (section && data[section] !== undefined) {
        data[section] = fresh[section];
      } else {
        Object.assign(data, fresh, { audit: data.audit });
      }
      return data;
    });
  }

  export(guildId) {
    return JSON.parse(JSON.stringify(this.get(guildId)));
  }

  import(guildId, payload) {
    return this.update(guildId, () => this._mergeDeep(defaultGuildData(guildId), payload));
  }
}

module.exports = { Database, DATA_DIR };
