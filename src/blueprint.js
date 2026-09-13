import { PermissionFlagsBits } from 'discord.js';

export const VERSION = 1;
export const roles = [
  ['CEO', 0xF1C40F], ['Co-CEO', 0xF7DC6F], ['COO', 0xE67E22],
  ['CTO', 0x3498DB], ['CMO', 0xE91E63], ['Chief of Staff', 0x9B59B6],
  ['Board of Directors', 0x922B21], ['Department Director', 0xE74C3C],
  ['Team Lead', 0xF4D03F], ['Developer', 0x00BCD4], ['Designer', 0xE056FD],
  ['Media Team', 0x8E44AD], ['Marketing', 0x27AE60], ['Human Resources', 0xFF6B81],
  ['Finance', 0x2ECC71], ['Support', 0x5DADE2], ['Employee', 0x85C1E9],
  ['Intern', 0x82E0AA], ['Partner', 0xB7950B], ['QDucks Bots', 0x95A5A6],
  ['Verified', 0xBDC3C7]
].map(([name, color]) => ({ name, color, hoist: ['CEO','Co-CEO','COO','CTO','CMO'].includes(name) }));

const C = (name, text = [], voice = [], access = 'staff') => ({ name, text, voice, access });
export const categories = [
  C('📢 QDUCKS INFORMATION',['company-announcements','company-news','company-rules','company-roadmap','company-calendar','team-directory'],[],'info'),
  C('👑 EXECUTIVE HQ',['executive-chat','executive-decisions','executive-documents','executive-ideas','company-planning'],['Executive Office','CEO Office','Board Room'],'executive'),
  C('📅 MEETINGS',['meeting-announcements','meeting-schedule','meeting-agendas','meeting-notes','action-items','meeting-votes'],['Company Meeting','Executive Meeting','Management Meeting','Department Meeting 1','Department Meeting 2','Waiting Room'],'staff'),
  C('🧠 PROJECT MANAGEMENT',['active-projects','project-ideas','project-updates','completed-projects','testing','bug-reports']),
  C('💻 DEVELOPMENT',['dev-chat','dev-tasks','dev-ideas','bugs','testing','releases','github-updates'],['Dev Room'],'development'),
  C('🎨 DESIGN',['design-chat','designs','design-ideas','design-review','finished-assets'],['Design Room'],'design'),
  C('📹 MEDIA',['media-chat','video-planning','editing','thumbnails','social-media','campaigns'],['Media Room'],'media'),
  C('📣 MARKETING',['marketing-chat','analytics','campaign-ideas','partnerships','promotions'],['Marketing Room'],'marketing'),
  C('👥 HUMAN RESOURCES',['hr-announcements','applications','application-reviews','employee-management','leave-requests','staff-reports','hr-records'],['HR Office','Interview Room'],'hr'),
  C('🏛️ MANAGEMENT',['management-chat','management-tasks','department-reports','staff-management','management-ideas'],['Management Room'],'management'),
  C('💼 STAFF HQ',['staff-chat','staff-memes','staff-media','suggestions','help','achievements'],['Staff Lounge','Work Together','AFK']),
  C('🤝 PARTNERS & CLIENTS',['partner-news','partner-chat','business-inquiries','shared-files'],['Business Meeting'],'partners'),
  C('🤖 SYSTEM',['bot-commands','server-logs','join-leave-logs','moderation-logs','security-logs'],[],'management')
];

const groups = {
  executive:['CEO','Co-CEO','COO','CTO','CMO','Chief of Staff','Board of Directors'],
  management:['CEO','Co-CEO','COO','CTO','CMO','Chief of Staff','Board of Directors','Department Director','Team Lead'],
  hr:['CEO','Co-CEO','Chief of Staff','Human Resources'],
  development:['CEO','Co-CEO','CTO','Developer'], design:['CEO','Co-CEO','Designer'],
  media:['CEO','Co-CEO','CMO','Media Team'], marketing:['CEO','Co-CEO','CMO','Marketing'],
  partners:['CEO','Co-CEO','COO','Chief of Staff','Partner'],
  staff:['CEO','Co-CEO','COO','CTO','CMO','Chief of Staff','Board of Directors','Department Director','Team Lead','Developer','Designer','Media Team','Marketing','Human Resources','Finance','Support','Employee','Intern'],
  info:['Verified','Employee','Intern','Partner']
};
export function overwrites(guild, roleMap, access) {
  const allowed = groups[access] || groups.staff;
  return [
    { id:guild.roles.everyone.id, deny:[PermissionFlagsBits.ViewChannel] },
    ...allowed.flatMap(n => roleMap.get(n) ? [{ id:roleMap.get(n).id, allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.Connect] }] : []),
    { id:guild.members.me.id, allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.ManageChannels,PermissionFlagsBits.SendMessages,PermissionFlagsBits.Connect] }
  ];
}
