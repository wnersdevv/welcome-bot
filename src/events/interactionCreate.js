'use strict';

const commandHandler = require('../core/commandHandler');
const router = require('../core/interactionRouter');
const rateLimitService = require('../services/rateLimitService');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, ctx) {
    if (!interaction.guild) {
      if (interaction.isRepliable()) {
        await interaction.reply({ content: 'Bu bot sadece sunucular içinde kullanılabilir.', ephemeral: true }).catch(() => {});
      }
      return;
    }

    try {
      if (interaction.isChatInputCommand()) {
        const rl = rateLimitService.checkRateLimit(interaction.guild.id, interaction.user.id, 'command');
        if (rl.limited) {
          return interaction.reply({ content: '⏳ Çok hızlı komut kullanıyorsun, biraz yavaşla.', ephemeral: true }).catch(() => {});
        }
        return commandHandler.dispatch(interaction, ctx);
      }

      if (interaction.isStringSelectMenu()) return router.handleStringSelect(interaction, ctx);
      if (interaction.isChannelSelectMenu()) return router.handleChannelSelect(interaction, ctx);
      if (interaction.isRoleSelectMenu()) return router.handleRoleSelect(interaction, ctx);
      if (interaction.isButton()) return router.handleButton(interaction, ctx);
      if (interaction.isModalSubmit()) return router.handleModalSubmit(interaction, ctx);
    } catch (err) {
      ctx.logger.error('interactionCreate işlenirken hata', err);
      const payload = { content: '❌ Beklenmeyen bir hata oluştu. Bu işlem kaydedildi, sistem çalışmaya devam ediyor.', ephemeral: true };
      if (interaction.deferred || interaction.replied) await interaction.followUp(payload).catch(() => {});
      else if (interaction.isRepliable()) await interaction.reply(payload).catch(() => {});
    }
  },
};
