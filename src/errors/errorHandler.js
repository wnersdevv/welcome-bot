'use strict';

/**
 * Tek bir Welcome/Leave/Boost hatası bütün botu çökertmemeli.
 * process seviyesinde yakalanmayan hataları loglar, botu ayakta tutar.
 */
function attachCrashProtection(logger) {
  process.on('unhandledRejection', (reason) => {
    logger.error('Yakalanmayan Promise reddi (unhandledRejection)', reason instanceof Error ? reason : new Error(String(reason)));
  });

  process.on('uncaughtException', (err) => {
    logger.error('Yakalanmayan hata (uncaughtException)', err);
  });

  process.on('uncaughtExceptionMonitor', (err) => {
    logger.error('uncaughtExceptionMonitor tetiklendi', err);
  });
}

module.exports = { attachCrashProtection };
