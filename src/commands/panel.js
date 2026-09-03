'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { buildMainPanel } = require('../components/panelComponents');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Ana community control center panelini açar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, { db }) {
    const guildData = db.get(interaction.guild.id);
    await interaction.reply(buildMainPanel(interaction.guild, guildData, interaction.user.id));
  },
};
