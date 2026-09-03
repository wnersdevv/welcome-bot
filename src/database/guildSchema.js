'use strict';

function defaultGuildData(guildId) {
  return {
    guildId,
    createdAt: Date.now(),
    updatedAt: Date.now(),

    welcome: {
      enabled: false,
      channelId: null,
      template: 'classic',
      useEmbed: true,
      useImage: false,
      title: '👋 Hoş geldin {username}!',
      description: '{mention}, **{server}** sunucusuna hoş geldin!\nSen {membercount}. üyemizsin.',
      color: '#5865F2',
      buttons: [],
      dm: {
        enabled: false,
        useEmbed: true,
        title: 'Hoş geldin!',
        description: '{server} sunucusuna hoş geldin {username}!',
      },
      setupCompleted: false,
    },

    leave: {
      enabled: false,
      channelId: null,
      template: 'classic',
      useEmbed: true,
      useImage: false,
      title: '🚪 Görüşürüz {username}',
      description: '{username} sunucudan ayrıldı. Artık {membercount} kişiyiz.',
      color: '#ED4245',
    },

    boost: {
      enabled: false,
      channelId: null,
      title: '🚀 Yeni Boost!',
      description: '{mention} sunucuyu boostladı! Şu an seviye {boostlevel}, toplam {boostcount} boost.',
      color: '#F47FFF',
    },

    roles: {
      humanRoleIds: [],
      botRoleIds: [],
    },

    design: {
      primaryColor: '#5865F2',
      secondaryColor: '#2C2F33',
      font: 'sans',
      avatarShape: 'circle',
      avatarBorder: true,
      textAlignment: 'center',
      blur: 0,
      opacity: 100,
    },

    templates: {
      custom: [],
    },

    security: {
      rateLimitOverride: null,
    },

    stats: {
      totalWelcomes: 0,
      totalLeaves: 0,
      totalBoosts: 0,
      totalDmSuccess: 0,
      totalDmFail: 0,
      totalRoleSuccess: 0,
      totalRoleFail: 0,
      totalErrors: 0,
      history: [], // { type: 'join'|'leave', ts: number }
    },

    audit: [], // { ts, userId, action, oldValue, newValue }
  };
}

module.exports = { defaultGuildData };
