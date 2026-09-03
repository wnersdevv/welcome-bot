'use strict';

const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildMessageModal({ customId, title, currentTitle, currentDescription }) {
  const modal = new ModalBuilder().setCustomId(customId).setTitle(title);

  const titleInput = new TextInputBuilder()
    .setCustomId('title')
    .setLabel('Başlık')
    .setStyle(TextInputStyle.Short)
    .setValue(currentTitle || '')
    .setMaxLength(256)
    .setRequired(true);

  const descInput = new TextInputBuilder()
    .setCustomId('description')
    .setLabel('Açıklama (placeholder destekler: {user} {server} ...)')
    .setStyle(TextInputStyle.Paragraph)
    .setValue(currentDescription || '')
    .setMaxLength(1500)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descInput)
  );
  return modal;
}

function buildColorModal({ customId, primaryColor, secondaryColor }) {
  const modal = new ModalBuilder().setCustomId(customId).setTitle('Renkleri Düzenle');
  const primary = new TextInputBuilder()
    .setCustomId('primaryColor')
    .setLabel('Ana renk (hex, örn. #5865F2)')
    .setStyle(TextInputStyle.Short)
    .setValue(primaryColor || '#5865F2')
    .setRequired(true);
  const secondary = new TextInputBuilder()
    .setCustomId('secondaryColor')
    .setLabel('İkincil renk (hex)')
    .setStyle(TextInputStyle.Short)
    .setValue(secondaryColor || '#2C2F33')
    .setRequired(true);
  modal.addComponents(
    new ActionRowBuilder().addComponents(primary),
    new ActionRowBuilder().addComponents(secondary)
  );
  return modal;
}

function buildImportModal(customId) {
  const modal = new ModalBuilder().setCustomId(customId).setTitle('Ayarları İçe Aktar');
  const json = new TextInputBuilder()
    .setCustomId('payload')
    .setLabel('JSON içeriği yapıştır')
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(3900)
    .setRequired(true);
  modal.addComponents(new ActionRowBuilder().addComponents(json));
  return modal;
}

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

module.exports = { buildMessageModal, buildColorModal, buildImportModal, HEX_COLOR_REGEX };
