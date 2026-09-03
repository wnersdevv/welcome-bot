'use strict';

/**
 * Bu script Discord'a bağlanmadan çalışır. Amacı: kurulumdan hemen sonra
 * temel yapı taşlarının (config, komutlar, veritabanı, placeholder engine)
 * çalıştığını doğrulamak. Gerçek Discord etkileşim testleri için bot
 * çalışırken /test komutlarını kullanın.
 */

const path = require('path');
const fs = require('fs');

let passed = 0;
let failed = 0;

function check(label, fn) {
  try {
    fn();
    console.log(`✓ ${label}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${label} -> ${err.message}`);
    failed++;
  }
}

check('ayarlar.json okunabiliyor', () => {
  const { getConfig } = require('../config/config');
  const cfg = getConfig();
  if (!cfg.token || !cfg.clientId) throw new Error('token/clientId eksik');
});

check('Komutlar yükleniyor', () => {
  const { loadCommands } = require('./commandHandler');
  const commands = loadCommands();
  if (commands.size === 0) throw new Error('Hiç komut bulunamadı');
});

check('Veritabanı okuma/yazma çalışıyor', () => {
  const { Logger } = require('../logger/logger');
  const { Database } = require('../database/Database');
  const db = new Database(new Logger('test', 'error'));
  const testGuildId = '__selftest__';
  db.update(testGuildId, (d) => {
    d.welcome.enabled = true;
    return d;
  });
  const data = db.get(testGuildId);
  if (!data.welcome.enabled) throw new Error('Yazılan veri okunamadı');
  // temizle
  const filePath = path.join(process.cwd(), 'data', 'guilds', `${testGuildId}.json`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
});

check('Placeholder engine çalışıyor', () => {
  const placeholders = require('../services/placeholderService');
  const fakeMember = {
    guild: { name: 'Test Sunucu', memberCount: 5, iconURL: () => null, premiumSubscriptionCount: 0, premiumTier: 0 },
    user: { tag: 'test#0001', username: 'test', id: '123', createdAt: new Date(), createdTimestamp: Date.now(), displayAvatarURL: () => 'https://example.com/a.png' },
    displayName: 'test',
    joinedAt: new Date(),
  };
  const ctx = placeholders.buildContext(fakeMember);
  const result = placeholders.apply('{username} - {server}', ctx);
  if (result !== 'test - Test Sunucu') throw new Error(`Beklenmeyen sonuç: ${result}`);
});

check('Dosya mimarisi doğru', () => {
  const required = ['src/core/index.js', 'src/config/config.js', 'src/database/Database.js', 'ayarlar.example.json'];
  for (const f of required) {
    if (!fs.existsSync(path.join(process.cwd(), f))) throw new Error(`${f} bulunamadı`);
  }
});

console.log(`\n${passed} başarılı, ${failed} başarısız.`);
process.exit(failed > 0 ? 1 : 0);
