'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.cwd(), 'ayarlar.json');
const EXAMPLE_PATH = path.join(process.cwd(), 'ayarlar.example.json');

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(
      `"ayarlar.json" bulunamadı. "${path.basename(EXAMPLE_PATH)}" dosyasını "ayarlar.json" olarak kopyalayıp doldurun.`
    );
  }

  let raw;
  try {
    raw = readJson(CONFIG_PATH);
  } catch (err) {
    throw new Error(`"ayarlar.json" geçerli bir JSON değil: ${err.message}`);
  }

  const required = ['token', 'clientId'];
  const missing = required.filter((key) => !raw[key] || String(raw[key]).includes('BURAYA'));
  if (missing.length > 0) {
    throw new Error(
      `"ayarlar.json" dosyasında eksik/doldurulmamış alanlar var: ${missing.join(', ')}`
    );
  }

  const config = {
    token: raw.token,
    clientId: raw.clientId,
    guildId: raw.guildId || null,
    ownerIds: Array.isArray(raw.ownerIds) ? raw.ownerIds : [],
    logLevel: raw.logLevel || 'info',
    rateLimit: {
      interactionWindowMs: raw.rateLimit?.interactionWindowMs ?? 5000,
      maxInteractions: raw.rateLimit?.maxInteractions ?? 8,
    },
  };

  return Object.freeze(config);
}

let cached = null;

function getConfig() {
  if (!cached) {
    cached = loadConfig();
  }
  return cached;
}

function reloadConfig() {
  cached = loadConfig();
  return cached;
}

module.exports = { getConfig, reloadConfig, CONFIG_PATH };
