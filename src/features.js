import fs from 'node:fs';
import path from 'node:path';
import {
  SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle
} from 'discord.js';

const dataFile=path.resolve('data/features.json');
const read=()=>{try{return JSON.parse(fs.readFileSync(dataFile,'utf8'));}catch{return {warnings:{},polls:{}};}};
const write=d=>{fs.mkdirSync(path.dirname(dataFile),{recursive:true});fs.writeFileSync(dataFile,JSON.stringify(d,null,2));};
const role=(g,n)=>g.roles.cache.find(r=>r.name===n);
const channel=(g,n)=>g.channels.cache.find(c=>c.name===n||c.name.endsWith(`・${n}`));
const staffRoles=['CEO','Co-CEO','COO','CTO','CMO','Chief of Staff','Board of Directors','Department Director','Team Lead','Human Resources','Support'];
const isStaff=m=>m.permissions.has(PermissionFlagsBits.Administrator)||staffRoles.some(n=>m.roles.cache.has(role(m.guild,n)?.id));
const ephemeral={ephemeral:true};
const commands=[
 new SlashCommandBuilder().setName('verify').setDescription('Join the QDucks community'),
 new SlashCommandBuilder().setName('ticket').setDescription('Open a private QDucks ticket').addStringOption(o=>o.setName('type').setDescription('Ticket type').setRequired(true).addChoices({name:'Support',value:'support'},{name:'Staff application',value:'application'},{name:'Partnership',value:'partnership'},{name:'Report',value:'report'})).addStringOption(o=>o.setName('reason').setDescription('What do you need help with?').setRequired(true)),
 new SlashCommandBuilder().setName('suggest').setDescription('Suggest something for QDucks').addStringOption(o=>o.setName('idea').setDescription('Your suggestion').setRequired(true)),
 new SlashCommandBuilder().setName('poll').setDescription('Create a community poll').addStringOption(o=>o.setName('question').setDescription('Poll question').setRequired(true)).addStringOption(o=>o.setName('options').setDescription('Options separated by | (2-5)').setRequired(true)),
 new SlashCommandBuilder().setName('announce').setDescription('Send a QDucks announcement').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addChannelOption(o=>o.setName('channel').setDescription('Destination').setRequired(true).addChannelTypes(ChannelType.GuildText)).addStringOption(o=>o.setName('message').setDescription('Announcement text').setRequired(true)).addStringOption(o=>o.setName('ping').setDescription('Optional notification role').addChoices({name:'Announcements',value:'Announcements Ping'},{name:'Updates',value:'Updates Ping'},{name:'Events',value:'Events Ping'},{name:'Giveaways',value:'Giveaways Ping'})),
 new SlashCommandBuilder().setName('meeting').setDescription('Schedule a QDucks meeting').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addStringOption(o=>o.setName('title').setDescription('Meeting title').setRequired(true)).addStringOption(o=>o.setName('time').setDescription('Date/time including timezone').setRequired(true)).addStringOption(o=>o.setName('team').setDescription('Who should attend?').setRequired(true)),
 new SlashCommandBuilder().setName('warn').setDescription('Warn a member').setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption(o=>o.setName('member').setDescription('Member').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Reason').setRequired(true)),
 new SlashCommandBuilder().setName('mute').setDescription('Temporarily mute a member').setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption(o=>o.setName('member').setDescription('Member').setRequired(true)).addIntegerOption(o=>o.setName('minutes').setDescription('1-40320 minutes').setRequired(true).setMinValue(1).setMaxValue(40320)).addStringOption(o=>o.setName('reason').setDescription('Reason')),
 new SlashCommandBuilder().setName('kick').setDescription('Kick a member').setDefaultMemberPermissions(PermissionFlagsBits.KickMembers).addUserOption(o=>o.setName('member').setDescription('Member').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Reason')),
 new SlashCommandBuilder().setName('ban').setDescription('Ban a member').setDefaultMemberPermissions(PermissionFlagsBits.BanMembers).addUserOption(o=>o.setName('member').setDescription('Member').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Reason')),
 new SlashCommandBuilder().setName('rolepanel').setDescription('Post notification-role buttons').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
 new SlashCommandBuilder().setName('serverstatus').setDescription('Show QDucks server and bot status'),
 new SlashCommandBuilder().setName('help').setDescription('Show Quackity commands')
];
export const featureCommands=commands;

const rows=()=>[
 new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId('role:Announcements Ping').setLabel('Announcements').setEmoji('📢').setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId('role:Updates Ping').setLabel('Updates').setEmoji('🚀').setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId('role:Events Ping').setLabel('Events').setEmoji('🎉').setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId('role:Giveaways Ping').setLabel('Giveaways').setEmoji('🎁').setStyle(ButtonStyle.Primary))];

export function installFeatures(client){
 client.on('guildMemberAdd',async m=>{try{for(const n of ['QDucks Community','Verified']){const r=role(m.guild,n);if(r&&r.editable)await m.roles.add(r,'QDucks community auto-role');}const c=channel(m.guild,'welcome');if(c?.isTextBased())await c.send(`🦆 Welcome to **QDucks**, ${m}! Read the rules and choose your notification roles.`);}catch(e){console.error('welcome',e);}});
 client.on('guildMemberRemove',async m=>{const c=channel(m.guild,'join-leave-logs');if(c?.isTextBased())await c.send(`👋 **${m.user.tag}** left QDucks.`).catch(()=>{});});
 client.on('messageDelete',async m=>{if(!m.guild||m.author?.bot)return;const c=channel(m.guild,'moderation-logs');if(c?.isTextBased())await c.send({embeds:[new EmbedBuilder().setColor(0xED4245).setTitle('🗑️ Message deleted').setDescription((m.content||'*Content unavailable*').slice(0,4000)).addFields({name:'Member',value:`${m.author}`},{name:'Channel',value:`${m.channel}`}).setTimestamp()]}).catch(()=>{});});
 client.on('messageUpdate',async(a,b)=>{if(!b.guild||b.author?.bot||a.content===b.content)return;const c=channel(b.guild,'moderation-logs');if(c?.isTextBased())await c.send({embeds:[new EmbedBuilder().setColor(0xFEE75C).setTitle('✏️ Message edited').addFields({name:'Before',value:(a.content||'*Unavailable*').slice(0,1000)},{name:'After',value:(b.content||'*Unavailable*').slice(0,1000)},{name:'Channel',value:`${b.channel}`}).setTimestamp()]}).catch(()=>{});});
 client.on('interactionCreate',async i=>{
  if(i.isButton()){
   if(i.customId.startsWith('role:')){const n=i.customId.slice(5),r=role(i.guild,n);if(!r)return i.reply({content:`Role ${n} is missing. Run /updserver.`,...ephemeral});const has=i.member.roles.cache.has(r.id);await i.member.roles[has?'remove':'add'](r);return i.reply({content:`${has?'Removed':'Added'} **${n}**.`,...ephemeral});}
   if(i.customId==='ticket:close'){if(!isStaff(i.member)&&!i.channel.name.includes(i.user.id))return i.reply({content:'Only the ticket owner or staff can close this.',...ephemeral});await i.reply({content:'🔒 Closing ticket in 5 seconds.',...ephemeral});return setTimeout(()=>i.channel.delete('Ticket closed').catch(()=>{}),5000);}
  }
  if(!i.isChatInputCommand()||!commands.some(c=>c.name===i.commandName))return;
  const g=i.guild;
  if(i.commandName==='verify'){for(const n of ['QDucks Community','Verified']){const r=role(g,n);if(r)await i.member.roles.add(r);}return i.reply({content:'✅ You are verified—welcome to QDucks!',...ephemeral});}
  if(i.commandName==='ticket'){const type=i.options.getString('type'),reason=i.options.getString('reason'),cat=channel(g,'🛟 HELP & SUPPORT');const ch=await g.channels.create({name:`🎫・${type}-${i.user.username}-${i.user.id}`,type:ChannelType.GuildText,parent:cat?.id,permissionOverwrites:[{id:g.roles.everyone.id,deny:[PermissionFlagsBits.ViewChannel]},{id:i.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory]},...staffRoles.flatMap(n=>role(g,n)?[{id:role(g,n).id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages]}]:[])]});await ch.send({content:`${i.user} Staff will help you here.`,embeds:[new EmbedBuilder().setColor(0x5865F2).setTitle(`🎫 ${type}`).setDescription(reason)],components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket:close').setLabel('Close ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger))]});return i.reply({content:`✅ Ticket created: ${ch}`,...ephemeral});}
  if(i.commandName==='suggest'){const c=channel(g,'suggestions')||i.channel;const msg=await c.send({embeds:[new EmbedBuilder().setColor(0x57F287).setTitle('💡 QDucks Suggestion').setDescription(i.options.getString('idea')).setFooter({text:`Suggested by ${i.user.tag}`}).setTimestamp()]});await msg.react('👍');await msg.react('👎');return i.reply({content:`✅ Suggestion posted in ${c}.`,...ephemeral});}
  if(i.commandName==='poll'){const opts=i.options.getString('options').split('|').map(x=>x.trim()).filter(Boolean).slice(0,5);if(opts.length<2)return i.reply({content:'Use at least 2 options separated by |',...ephemeral});const nums=['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣'];const msg=await i.channel.send({embeds:[new EmbedBuilder().setColor(0x5865F2).setTitle(`📊 ${i.options.getString('question')}`).setDescription(opts.map((x,j)=>`${nums[j]} ${x}`).join('\n')).setFooter({text:`Poll by ${i.user.tag}`})]});for(let j=0;j<opts.length;j++)await msg.react(nums[j]);return i.reply({content:'✅ Poll created.',...ephemeral});}
  if(i.commandName==='announce'){const c=i.options.getChannel('channel'),message=i.options.getString('message'),ping=i.options.getString('ping'),r=ping&&role(g,ping);await c.send({content:r?`${r}`:undefined,embeds:[new EmbedBuilder().setColor(0xF1C40F).setTitle('📢 QDucks Announcement').setDescription(message).setFooter({text:`Posted by ${i.user.tag}`}).setTimestamp()],allowedMentions:{roles:r?[r.id]:[]}});return i.reply({content:`✅ Announcement sent to ${c}.`,...ephemeral});}
  if(i.commandName==='meeting'){const c=channel(g,'meeting-announcements')||i.channel;await c.send({embeds:[new EmbedBuilder().setColor(0x9B59B6).setTitle(`📅 ${i.options.getString('title')}`).addFields({name:'When',value:i.options.getString('time')},{name:'Attending',value:i.options.getString('team')},{name:'Scheduled by',value:`${i.user}`}).setTimestamp()]});return i.reply({content:`✅ Meeting posted in ${c}.`,...ephemeral});}
  if(['warn','mute','kick','ban'].includes(i.commandName)){const u=i.options.getUser('member'),m=await g.members.fetch(u.id).catch(()=>null),reason=i.options.getString('reason')||'No reason provided';if(!m)return i.reply({content:'Member not found.',...ephemeral});if(i.commandName==='warn'){const d=read();d.warnings[u.id]||=[];d.warnings[u.id].push({reason,by:i.user.id,at:new Date().toISOString()});write(d);await u.send(`⚠️ You were warned in QDucks: ${reason}`).catch(()=>{});}if(i.commandName==='mute')await m.timeout(i.options.getInteger('minutes')*60000,reason);if(i.commandName==='kick')await m.kick(reason);if(i.commandName==='ban')await m.ban({reason});const log=channel(g,'moderation-logs');if(log?.isTextBased())await log.send(`🛡️ **${i.commandName.toUpperCase()}** • ${u.tag} • ${reason} • by ${i.user}`);return i.reply({content:`✅ ${i.commandName} completed for ${u.tag}.`,...ephemeral});}
  if(i.commandName==='rolepanel'){await i.channel.send({embeds:[new EmbedBuilder().setColor(0x5865F2).setTitle('🦆 QDucks Notifications').setDescription('Choose what you want QDucks to notify you about. Tap again to remove a role.')],components:rows()});return i.reply({content:'✅ Role panel posted.',...ephemeral});}
  if(i.commandName==='serverstatus')return i.reply({embeds:[new EmbedBuilder().setColor(0x57F287).setTitle('🦆 QDucks Status').addFields({name:'Quackity',value:'✅ Online',inline:true},{name:'Community',value:`👥 ${g.memberCount} members`,inline:true},{name:'Server',value:'✅ Operational',inline:true}).setTimestamp()]});
  if(i.commandName==='help')return i.reply({embeds:[new EmbedBuilder().setColor(0xFEE75C).setTitle('🦆 Quackity Help').setDescription('**Community**\n`/verify` `/ticket` `/suggest` `/poll` `/serverstatus`\n\n**Staff**\n`/announce` `/meeting` `/warn` `/mute` `/kick` `/ban` `/rolepanel` `/updserver`')] ,...ephemeral});
 });
}
