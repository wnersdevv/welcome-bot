'use strict';

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

function timestamp() {
  return new Date().toISOString();
}

function appendToFile(fileName, line) {
  fs.appendFile(path.join(LOG_DIR, fileName), line + '\n', () => {});
}

function writeLine(level, scope, message, meta) {
  const line = `[${timestamp()}] [${level.toUpperCase()}] [${scope}] ${message}${
    meta ? ' ' + JSON.stringify(meta) : ''
  }`;
  appendToFile('app.log', line);
  if (level === 'error') appendToFile('error.log', line);
  if (scope === 'discord') appendToFile('discord.log', line);
  return line;
}

class Logger {
  constructor(scope = 'core', minLevel = 'info') {
    this.scope = scope;
    this.minLevel = minLevel;
  }

  child(scope) {
    return new Logger(scope, this.minLevel);
  }

  _shouldLog(level) {
    return LEVELS[level] >= LEVELS[this.minLevel];
  }

  debug(message, meta) {
    if (!this._shouldLog('debug')) return;
    writeLine('debug', this.scope, message, meta);
  }

  info(message, meta) {
    if (!this._shouldLog('info')) return;
    const line = writeLine('info', this.scope, message, meta);
    console.log(line);
  }

  warn(message, meta) {
    const line = writeLine('warn', this.scope, message, meta);
    console.warn(line);
  }

  error(message, err) {
    const meta = err instanceof Error ? { message: err.message, stack: err.stack } : err;
    const line = writeLine('error', this.scope, message, meta);
    console.error(line);
  }

  audit(entry) {
    const line = `[${timestamp()}] ${JSON.stringify(entry)}`;
    appendToFile('audit.log', line);
  }
}

module.exports = { Logger };
