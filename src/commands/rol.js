'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const autoRoleService = require('../services/autoRoleService');
const auditService = require('../services/auditService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rol')
    .setDescription('Otomatik rol sistemini yönetir.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((s) =>
      s
        .setName('ekle')
        .setDescription('Otomatik rol ekler.')
        .addRoleOption((o) => o.setName('rol').setDescription('Eklenecek rol').setRequired(true))
        .addStringOption((o) =>
          o.setName('hedef').setDescription('Kime uygulanacak').setRequired(true).addChoices(
            { name: 'İnsan', value: 'human' },
            { name: 'Bot', value: 'bot' }
          )
        )
    )
    .addSubcommand((s) =>
      s
        .setName('kaldir')
        .setDescription('Otomatik rolü kaldırır.')
        .addRoleOption((o) => o.setName('rol').setDescription('Kaldırılacak rol').setRequired(true))
        .addStringOption((o) =>
          o.setName('hedef').setDescription('Hangi listeden').setRequired(true).addChoices(
            { name: 'İnsan', value: 'human' },
            { name: 'Bot', value: 'bot' }
          )
        )
    )
    .addSubcommand((s) => s.setName('liste').setDescription('Otomatik rolleri listeler.'))
    .addSubcommand((s) => s.setName('test').setDescription('Otomatik rol sistemini kendi üzerinde test eder.'))
    .addSubcommand((s) => s.setName('sifirla').setDescription('Otomatik rol listelerini sıfırlar.')),

  async execute(interaction, { db, logger }) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const guildData = db.get(guildId);
    const key = (target) => (target === 'bot' ? 'botRoleIds' : 'humanRoleIds');

    if (sub === 'ekle') {
      const role = interaction.options.getRole('rol');
      const target = interaction.options.getString('hedef');
      if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({ content: '❌ Bu rol, botun en yüksek rolünden daha yüksek veya eşit. Önce rol hiyerarşisini düzenle.', ephemeral: true });
      }
      db.update(guildId, (d) => {
        const list = d.roles[key(target)];
        if (!list.includes(role.id)) list.push(role.id);
        return d;
      });
      auditService.recordChange({ db, logger, guildId, userId: interaction.user.id, userTag: interaction.user.tag, action: `otomatik rol eklendi (${target})`, newValue: role.id });
      return interaction.reply(`✅ ${role} artık **${target === 'bot' ? 'botlara' : 'insanlara'}** otomatik veriliyor.`);
    }

    if (sub === 'kaldir') {
      const role = interaction.options.getRole('rol');
      const target = interaction.options.getString('hedef');
      db.update(guildId, (d) => {
        d.roles[key(target)] = d.roles[key(target)].filter((id) => id !== role.id);
        return d;
      });
      auditService.recordChange({ db, logger, guildId, userId: interaction.user.id, userTag: interaction.user.tag, action: `otomatik rol kaldırıldı (${target})`, oldValue: role.id });
      return interaction.reply(`✅ ${role} otomatik rol listesinden çıkarıldı.`);
    }

    if (sub === 'liste') {
      const { humanRoleIds, botRoleIds } = guildData.roles;
      return interaction.reply({
        content: [
          `**İnsan rolleri:** ${humanRoleIds.length ? humanRoleIds.map((r) => `<@&${r}>`).join(', ') : 'yok'}`,
          `**Bot rolleri:** ${botRoleIds.length ? botRoleIds.map((r) => `<@&${r}>`).join(', ') : 'yok'}`,
        ].join('\n'),
      });
    }

    if (sub === 'test') {
      const result = await autoRoleService.applyAutoRoles(interaction.member, guildData, logger);
      const lines = [
        result.applied.length ? `✓ Verilen roller: ${result.applied.map((r) => `<@&${r}>`).join(', ')}` : '⚠️ Verilecek rol yok veya hiçbiri uygulanamadı.',
        ...result.skipped.map((s) => `❌ <@&${s.roleId}> atlandı (${s.reason})`),
      ];
      return interaction.reply({ content: lines.join('\n'), ephemeral: true });
    }

    if (sub === 'sifirla') {
      db.update(guildId, (d) => {
        d.roles.humanRoleIds = [];
        d.roles.botRoleIds = [];
        return d;
      });
      return interaction.reply('✅ Otomatik rol listeleri sıfırlandı.');
    }
  },
};
