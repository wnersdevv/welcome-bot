'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const placeholders = require('../services/placeholderService');
const welcomeService = require('../services/welcomeService');
const leaveService = require('../services/leaveService');
const boostService = require('../services/boostService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mesaj')
    .setDescription('Mesaj önizleme ve placeholder yardımcıları.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName('onizle')
        .setDescription('Bir mesaj türünün önizlemesini gösterir.')
        .addStringOption((o) =>
          o.setName('tur').setDescription('Mesaj türü').setRequired(true).addChoices(
            { name: 'Welcome', value: 'welcome' },
            { name: 'Leave', value: 'leave' },
            { name: 'Boost', value: 'boost' }
          )
        )
    )
    .addSubcommand((s) => s.setName('degiskenler').setDescription('Kullanılabilir placeholder listesini gösterir.')),

  async execute(interaction, { db, logger }) {
    const sub = interaction.options.getSubcommand();
    const guildData = db.get(interaction.guild.id);

    if (sub === 'onizle') {
      const type = interaction.options.getString('tur');
      await interaction.deferReply({ ephemeral: true });
      let payload;
      if (type === 'welcome') payload = await welcomeService.buildWelcomePayload(interaction.member, guildData, logger);
      if (type === 'leave') payload = await leaveService.buildLeavePayload(interaction.member, guildData, logger);
      if (type === 'boost') payload = await boostService.buildBoostPayload(interaction.member, guildData);
      return interaction.editReply(payload);
    }

    if (sub === 'degiskenler') {
      return interaction.reply({
        content: `**Kullanılabilir placeholderlar:**\n${placeholders.AVAILABLE_PLACEHOLDERS.map((p) => `\`{${p}}\``).join(', ')}`,
        ephemeral: true,
      });
    }
  },
};
