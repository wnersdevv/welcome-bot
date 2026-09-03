'use strict';

const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

function loadCommands() {
  const commands = new Collection();
  const dir = path.join(__dirname, '..', 'commands');
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const command = require(path.join(dir, file));
    if (!command?.data?.name || typeof command.execute !== 'function') continue;
    commands.set(command.data.name, command);
  }
  return commands;
}

async function dispatch(interaction, ctx) {
  const command = ctx.client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction, ctx);
  } catch (err) {
    ctx.logger.error(`Komut çalıştırılırken hata: ${interaction.commandName}`, err);
    const payload = { content: '❌ Komut çalıştırılırken beklenmeyen bir hata oluştu.', ephemeral: true };
    if (interaction.deferred || interaction.replied) await interaction.followUp(payload).catch(() => {});
    else await interaction.reply(payload).catch(() => {});
  }
}

module.exports = { loadCommands, dispatch };
