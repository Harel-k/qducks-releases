import { PermissionFlagsBits } from 'discord.js';

export const VERSION = 3;
export const roles = [
  ['CEO', 0xF1C40F], ['Co-CEO', 0xF7DC6F], ['COO', 0xE67E22],
  ['CTO', 0x3498DB], ['CMO', 0xE91E63], ['Chief of Staff', 0x9B59B6],
  ['Board of Directors', 0x922B21], ['Department Director', 0xE74C3C],
  ['Team Lead', 0xF4D03F], ['Developer', 0x00BCD4], ['Designer', 0xE056FD],
  ['Media Team', 0x8E44AD], ['Marketing', 0x27AE60], ['Human Resources', 0xFF6B81],
  ['Finance', 0x2ECC71], ['Support', 0x5DADE2], ['Employee', 0x85C1E9],
  ['Intern', 0x82E0AA], ['Partner', 0xB7950B], ['QDucks Bots', 0x95A5A6],
  ['QDucks Community', 0x57F287], ['Verified', 0xBDC3C7],
  ['Creator', 0xEB459E], ['Supporter', 0xFEE75C],
  ['Announcements Ping', 0x5865F2], ['Updates Ping', 0x3498DB],
  ['Events Ping', 0x9B59B6], ['Giveaways Ping', 0xE91E63], ['Muted', 0x4F545C]
].map(([name, color]) => ({ name, color, hoist: ['CEO','Co-CEO','COO','CTO','CMO'].includes(name) }));

const C = (name, text = [], voice = [], access = 'staff') => ({ name, text, voice, access });
export const categories = [
  C('👋 START HERE',['👋・welcome','📜・rules','📢・announcements','🎮・how-to-join','🎭・roles','❓・faq'],[],'public-readonly'),
  C('🦆 QDUCKS COMMUNITY',['💬・general','👋・introductions','📸・media','😂・memes','🎨・creations','📊・polls','🤖・bot-commands'],['🔊 General','🎮 Gaming','💤 AFK'],'community'),
  C('🚀 QDUCKS PROJECTS',['📢・project-announcements','📦・releases','👀・sneak-peeks','💬・project-discussion','🐛・bug-reports','💡・suggestions'],[],'community'),
  C('🎉 EVENTS',['📢・event-announcements','📅・event-schedule','🎁・giveaways','💬・event-chat'],['🎤 Event Stage','🎉 Event VC'],'community'),
  C('🛟 HELP & SUPPORT',['❓・help','🎫・support','🐛・report-a-problem','⚖️・appeals'],[],'community'),
  C('🤝 COMMUNITY PARTNERS',['🤝・partners','📨・partnership-applications','💼・business-inquiries'],[],'public-readonly'),
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
  info:['Verified','QDucks Community','Employee','Intern','Partner'],
  community:['Verified','QDucks Community','Creator','Supporter','Partner']
};
export function overwrites(guild, roleMap, access) {
  if (access === 'public-readonly') return [
    { id:guild.roles.everyone.id, allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.ReadMessageHistory], deny:[PermissionFlagsBits.SendMessages] },
    { id:guild.members.me.id, allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ManageChannels] },
    ...['CEO','Co-CEO','COO','Chief of Staff'].flatMap(n=>roleMap.get(n)?[{id:roleMap.get(n).id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages]}]:[])
  ];
  const allowed = groups[access] || groups.staff;
  const result = [
    { id:guild.roles.everyone.id, deny:[PermissionFlagsBits.ViewChannel] },
    ...allowed.flatMap(n => roleMap.get(n) ? [{ id:roleMap.get(n).id, allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.Connect] }] : []),
    { id:guild.members.me.id, allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.ManageChannels,PermissionFlagsBits.SendMessages,PermissionFlagsBits.Connect] }
  ];
  if(access==='community' && roleMap.get('Muted')) result.push({id:roleMap.get('Muted').id,deny:[PermissionFlagsBits.SendMessages,PermissionFlagsBits.AddReactions,PermissionFlagsBits.Speak,PermissionFlagsBits.Stream,PermissionFlagsBits.Connect]});
  return result;
}
