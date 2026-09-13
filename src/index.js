import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import { VERSION, roles, categories, overwrites } from './blueprint.js';
import { featureCommands, installFeatures } from './features.js';

const required = ['DISCORD_TOKEN'];
for (const key of required) if (!process.env[key]) throw new Error(`Missing secret: ${key}`);
const client = new Client({ intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent] });
const locks = new Set();
let lastSync = null;
const dataDir = path.resolve('data'), stateFile = path.join(dataDir,'state.json');
fs.mkdirSync(dataDir,{recursive:true});
const loadState = () => { try { return JSON.parse(fs.readFileSync(stateFile,'utf8')); } catch { return { guilds:{} }; } };
const saveState = s => fs.writeFileSync(stateFile,JSON.stringify(s,null,2));
const command = new SlashCommandBuilder().setName('updserver').setDescription('Preview or apply the QDucks HQ server blueprint').addBooleanOption(o=>o.setName('confirm').setDescription('Apply changes (default: preview only)'));

async function register() {
  const appId = process.env.DISCORD_CLIENT_ID || client.user.id;
  const rest = new REST({version:'10'}).setToken(process.env.DISCORD_TOKEN);
  const body=[command.toJSON(),...featureCommands.map(c=>c.toJSON())];
  if(process.env.DISCORD_GUILD_ID) await rest.put(Routes.applicationGuildCommands(appId,process.env.DISCORD_GUILD_ID),{body});
  else await rest.put(Routes.applicationCommands(appId),{body});
}
const canRun = i => i.memberPermissions?.has(PermissionFlagsBits.Administrator) || (process.env.OWNER_USER_ID && i.user.id===process.env.OWNER_USER_ID);

const textIcon = name => {
  if (name.includes('・')) return name;
  const rules = [
    [/announcement|news|updates|releases/, '📢'], [/rules/, '📜'], [/calendar|schedule/, '📅'],
    [/roadmap/, '🗺️'], [/directory|employee|staff-management/, '👥'], [/meeting|agenda|notes/, '📝'],
    [/action|tasks|completed/, '✅'], [/vote|poll|analytics|reports/, '📊'], [/document|files|assets|records/, '📁'],
    [/bug|problem|reports/, '🐛'], [/test/, '🧪'], [/idea|suggestion/, '💡'], [/application|inquiries/, '📨'],
    [/github|links/, '🔗'], [/design|thumbnail|creations/, '🎨'], [/media/, '📸'], [/video|editing/, '🎬'],
    [/partner/, '🤝'], [/help|support|appeals/, '🛟'], [/giveaway/, '🎁'], [/welcome|introduction/, '👋'],
    [/role/, '🎭'], [/bot/, '🤖'], [/security|moderation|logs/, '🔐'], [/release/, '🚀'],
    [/chat|discussion|general/, '💬'], [/planning|projects/, '📋']
  ];
  return `${rules.find(([r])=>r.test(name))?.[1] || '💬'}・${name}`;
};
const voiceIcon = name => /AFK/i.test(name) ? `💤 ${name}` : /Meeting|Office|Board|Room/i.test(name) ? `🔊 ${name}` : `🎙️ ${name}`;

async function syncGuild(guild, apply) {
  const report={created:[],updated:[],unchanged:[],skipped:[],warnings:[],errors:[]};
  const state=loadState(); state.guilds[guild.id] ||= {roles:{},categories:{},channels:{}}; const gs=state.guilds[guild.id];
  const me=await guild.members.fetchMe();
  if(!me.permissions.has(PermissionFlagsBits.Administrator)) report.warnings.push('Quackity does not have Administrator permission.');
  const roleMap=new Map();
  for(const spec of [...roles].reverse()) {
    try {
      let role=gs.roles[spec.name] && guild.roles.cache.get(gs.roles[spec.name]);
      role ||= guild.roles.cache.find(r=>!r.managed && r.name===spec.name);
      if(!role) { if(!apply){report.created.push(`role ${spec.name}`);continue;} role=await guild.roles.create({...spec,reason:`Quackity blueprint v${VERSION}`}); report.created.push(`role ${spec.name}`); }
      else { const changed=role.color!==spec.color || role.hoist!==spec.hoist; if(changed&&apply) await role.edit({color:spec.color,hoist:spec.hoist,reason:`Quackity blueprint v${VERSION}`}); (changed?report.updated:report.unchanged).push(`role ${spec.name}`); }
      roleMap.set(spec.name,role); gs.roles[spec.name]=role.id;
    } catch(e){report.errors.push(`role ${spec.name}: ${e.message}`);}
  }
  if(apply){
    let target=Math.max(1,me.roles.highest.position-1);
    for(const spec of roles){const role=roleMap.get(spec.name);if(role&&role.editable){try{await role.setPosition(target--,{reason:`Quackity blueprint v${VERSION} role order`});}catch(e){report.warnings.push(`Could not position role ${spec.name}: ${e.message}`);}}}
    report.updated.push('managed role order');
  } else report.updated.push('managed role order');
  for(const [catIndex,cat] of categories.entries()) {
    try {
      let parent=gs.categories[cat.name] && guild.channels.cache.get(gs.categories[cat.name]);
      parent ||= guild.channels.cache.find(c=>c.type===ChannelType.GuildCategory&&c.name===cat.name);
      if(!parent) { if(!apply){report.created.push(`category ${cat.name}`);} else {parent=await guild.channels.create({name:cat.name,type:ChannelType.GuildCategory,permissionOverwrites:overwrites(guild,roleMap,cat.access),reason:`Quackity blueprint v${VERSION}`});report.created.push(`category ${cat.name}`);} }
      else { if(apply) {await parent.permissionOverwrites.set(overwrites(guild,roleMap,cat.access),`Quackity blueprint v${VERSION}`);await parent.setPosition(catIndex,{reason:`Quackity blueprint v${VERSION} category order`});} report.updated.push(`category permissions/order ${cat.name}`); }
      if(parent) gs.categories[cat.name]=parent.id;
      for(const [kind,names] of [['text',cat.text],['voice',cat.voice]]) for(const [channelIndex,name] of names.entries()){
        const key=`${cat.name}/${kind}/${name}`; const type=kind==='text'?ChannelType.GuildText:ChannelType.GuildVoice;
        const desired=kind==='text'?textIcon(name):voiceIcon(name);
        let ch=gs.channels[key]&&guild.channels.cache.get(gs.channels[key]);
        ch ||= guild.channels.cache.find(c=>c.parentId===parent?.id&&c.type===type&&(c.name===desired||c.name===name));
        if(!ch){if(!apply){report.created.push(`${kind} ${desired}`);continue;} ch=await guild.channels.create({name:desired,type,parent:parent.id,position:channelIndex,reason:`Quackity blueprint v${VERSION}`});report.created.push(`${kind} ${desired}`);}
        else {const changed=ch.name!==desired||ch.parentId!==parent?.id||ch.position!==channelIndex;if(apply&&changed)await ch.edit({name:desired,parent:parent.id,position:channelIndex,reason:`Quackity blueprint v${VERSION} style/order`});(changed?report.updated:report.unchanged).push(`${kind} ${desired}`);}
        gs.channels[key]=ch.id;
      }
    } catch(e){report.errors.push(`${cat.name}: ${e.message}`);}
  }
  gs.version=VERSION; if(apply) saveState(state); return report;
}

client.on('interactionCreate',async i=>{
  if(!i.isChatInputCommand()||i.commandName!=='updserver')return;
  if(!i.inGuild())return i.reply({content:'Use this inside the QDucks server.',ephemeral:true});
  if(!canRun(i))return i.reply({content:'Only a server Administrator can run this.',ephemeral:true});
  if(locks.has(i.guildId))return i.reply({content:'A server update is already running.',ephemeral:true});
  const apply=i.options.getBoolean('confirm')===true; locks.add(i.guildId); await i.deferReply({ephemeral:true});
  try {const r=await syncGuild(i.guild,apply);lastSync={at:new Date().toISOString(),mode:apply?'applied':'preview',counts:Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v.length]))}; const lines=Object.entries(r).map(([k,v])=>`**${k}: ${v.length}**${v.length?`\n${v.slice(0,12).map(x=>`• ${x}`).join('\n')}${v.length>12?`\n• …and ${v.length-12} more`:''}`:''}`); await i.editReply(`${apply?'✅ Update finished':'🔎 Dry run only — nothing changed'}\nBlueprint v${VERSION}\n\n${lines.join('\n\n')}\n\n${apply?'':'Run `/updserver confirm:true` to apply.'}`.slice(0,1950));} catch(e){await i.editReply(`Update failed safely: ${e.message}`);} finally{locks.delete(i.guildId);}
});
installFeatures(client);
client.once('ready',async()=>{console.log(`Quackity online as ${client.user.tag}`);await register();});

const app=express(); app.get('/health',(req,res)=>res.json({ok:true,discord:client.isReady(),blueprintVersion:VERSION,lastSync})); app.get('/',(req,res)=>res.send(`<main style="font-family:system-ui;max-width:650px;margin:60px auto;padding:20px"><h1>🦆 Quackity For QDucks</h1><p>${client.isReady()?'✅ Discord bot online':'⏳ Connecting to Discord'}</p><p>Blueprint version: ${VERSION}</p><p>Use <b>/updserver</b> in QDucks HQ.</p></main>`)); app.listen(process.env.PORT||3000);
client.login(process.env.DISCORD_TOKEN);
