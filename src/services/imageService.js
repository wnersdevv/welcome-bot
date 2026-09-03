'use strict';

const crypto = require('crypto');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');

// Şu anda tam olarak, gerçekten farklı görünen 5 şablon uygulanmıştır:
// classic, modern, minimal, dark, neon.
// Yeni bir şablon eklemek için TEMPLATE_RENDERERS'a aynı imzada bir fonksiyon eklemek yeterli.
const IMPLEMENTED_TEMPLATES = ['classic', 'modern', 'minimal', 'dark', 'neon'];

const cache = new Map(); // hash -> { buffer, ts }
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;

function hashOf(payload) {
  return crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex');
}

function pruneCache() {
  if (cache.size <= CACHE_MAX_ENTRIES) return;
  const entries = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
  for (let i = 0; i < entries.length - CACHE_MAX_ENTRIES; i++) cache.delete(entries[i][0]);
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function drawAvatar(ctx, avatarUrl, x, y, size, shape = 'circle', border = true, borderColor = '#ffffff') {
  let img;
  try {
    img = await loadImage(avatarUrl);
  } catch {
    return; // avatar indirilemezse kart yine de üretilir (smart fallback)
  }
  ctx.save();
  ctx.beginPath();
  if (shape === 'square') {
    roundedRect(ctx, x, y, size, size, size * 0.12);
  } else {
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  }
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();

  if (border) {
    ctx.beginPath();
    if (shape === 'square') roundedRect(ctx, x, y, size, size, size * 0.12);
    else ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = borderColor;
    ctx.stroke();
  }
}

function drawBackground(ctx, w, h, colors) {
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  colors.forEach((c, i) => gradient.addColorStop(i / (colors.length - 1 || 1), c));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

const TEMPLATE_RENDERERS = {
  async classic(ctx, w, h, ctxData) {
    drawBackground(ctx, w, h, ['#5865F2', '#404EED']);
    await drawAvatar(ctx, ctxData.avatar, w / 2 - 60, 40, 120, 'circle', true, '#ffffff');
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(ctxData.title, w / 2, 210);
    ctx.font = '20px sans-serif';
    ctx.fillText(ctxData.subtitle, w / 2, 245);
  },
  async modern(ctx, w, h, ctxData) {
    drawBackground(ctx, w, h, ['#1f1147', '#3b1e73']);
    roundedRect(ctx, 20, 20, w - 40, h - 40, 24);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();
    await drawAvatar(ctx, ctxData.avatar, 40, h / 2 - 55, 110, 'circle', true, '#a970ff');
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(ctxData.title, 170, h / 2 - 5);
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#d8c8ff';
    ctx.fillText(ctxData.subtitle, 170, h / 2 + 25);
  },
  async minimal(ctx, w, h, ctxData) {
    ctx.fillStyle = '#f5f5f7';
    ctx.fillRect(0, 0, w, h);
    await drawAvatar(ctx, ctxData.avatar, w / 2 - 45, 30, 90, 'circle', false);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '600 26px sans-serif';
    ctx.fillText(ctxData.title, w / 2, 165);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText(ctxData.subtitle, w / 2, 192);
  },
  async dark(ctx, w, h, ctxData) {
    drawBackground(ctx, w, h, ['#0d0d0d', '#1c1c1c']);
    await drawAvatar(ctx, ctxData.avatar, w / 2 - 60, 40, 120, 'square', true, '#3a3a3a');
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f2f2f2';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(ctxData.title, w / 2, 210);
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#9a9a9a';
    ctx.fillText(ctxData.subtitle, w / 2, 240);
  },
  async neon(ctx, w, h, ctxData) {
    drawBackground(ctx, w, h, ['#050014', '#0a0030']);
    ctx.save();
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 25;
    await drawAvatar(ctx, ctxData.avatar, w / 2 - 60, 35, 120, 'circle', true, '#00f0ff');
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff00e0';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(ctxData.title, w / 2, 210);
    ctx.shadowBlur = 0;
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#8be9ff';
    ctx.fillText(ctxData.subtitle, w / 2, 240);
  },
};

/**
 * @param {{template:string, avatar:string, title:string, subtitle:string}} params
 * @returns {Promise<Buffer>} PNG buffer
 */
async function renderCard(params) {
  const template = IMPLEMENTED_TEMPLATES.includes(params.template) ? params.template : 'classic';
  const cacheKey = hashOf({ ...params, template });
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.buffer;

  const width = 800;
  const height = 280;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  await TEMPLATE_RENDERERS[template](ctx, width, height, params);

  const buffer = canvas.toBuffer('image/png');
  cache.set(cacheKey, { buffer, ts: Date.now() });
  pruneCache();
  return buffer;
}

module.exports = { renderCard, IMPLEMENTED_TEMPLATES };
