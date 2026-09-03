'use strict';

const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

function guildBackupDir(guildId) {
  const dir = path.join(BACKUP_DIR, guildId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function createBackup(db, guildId) {
  const dir = guildBackupDir(guildId);
  const data = db.export(guildId);
  const fileName = `${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(path.join(dir, fileName), JSON.stringify(data, null, 2), 'utf-8');
  return fileName;
}

function listBackups(guildId) {
  const dir = guildBackupDir(guildId);
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort((a, b) => (a < b ? 1 : -1)); // newest first
}

function restoreBackup(db, guildId, fileName) {
  const filePath = path.join(guildBackupDir(guildId), fileName);
  if (!fs.existsSync(filePath)) throw new Error('Yedek dosyası bulunamadı.');
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return db.import(guildId, payload);
}

function deleteBackup(guildId, fileName) {
  const filePath = path.join(guildBackupDir(guildId), fileName);
  if (!fs.existsSync(filePath)) throw new Error('Yedek dosyası bulunamadı.');
  fs.unlinkSync(filePath);
}

/** Basit şema/izin doğrulaması: config import edilirken bozuk veri kaydedilmesini engeller. */
function validateImportPayload(payload) {
  const errors = [];
  if (typeof payload !== 'object' || payload === null) {
    errors.push('Kök eleman bir JSON nesnesi olmalı.');
    return { valid: false, errors };
  }
  const allowedTopLevel = [
    'welcome', 'leave', 'boost', 'roles', 'design', 'templates', 'security',
  ];
  const unknownKeys = Object.keys(payload).filter(
    (k) => !allowedTopLevel.includes(k) && !['guildId', 'stats', 'audit', 'createdAt', 'updatedAt'].includes(k)
  );
  if (unknownKeys.length > 0) {
    errors.push(`Bilinmeyen alanlar: ${unknownKeys.join(', ')}`);
  }
  if (payload.welcome && typeof payload.welcome !== 'object') errors.push('"welcome" bir nesne olmalı.');
  if (payload.leave && typeof payload.leave !== 'object') errors.push('"leave" bir nesne olmalı.');
  if (payload.boost && typeof payload.boost !== 'object') errors.push('"boost" bir nesne olmalı.');
  return { valid: errors.length === 0, errors };
}

module.exports = { createBackup, listBackups, restoreBackup, deleteBackup, validateImportPayload, BACKUP_DIR };
