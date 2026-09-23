import fs from 'node:fs';

const path='src/game-core.js';
let source=fs.readFileSync(path,'utf8');

function replaceOne(pattern,replacement,label){
  const matches=source.match(new RegExp(pattern.source,pattern.flags.includes('g')?pattern.flags:pattern.flags+'g'))||[];
  if(matches.length!==1)throw new Error(`${label}: expected exactly one match, found ${matches.length}`);
  source=source.replace(pattern,replacement);
}

replaceOne(
  /function loadMeta\(\)\{.*?\}\nasync function startLineLogin/s,
`function loadMeta(){const base={playerName:'',role:'warrior',pet:'fox',level:1,xp:0,authMode:'none',lineUserId:'',linePicture:'',cloudRevision:0,syncConflict:false,cloudConflictRevision:0,rpg:emptyRpg()};try{const x={...base,...JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')};x.level=clamp(Math.round(Number(x.level)||1),1,50);x.xp=x.level>=50?0:Math.max(0,Math.round(Number(x.xp)||0));x.cloudRevision=Math.max(0,Math.round(Number(x.cloudRevision)||0));x.cloudConflictRevision=Math.max(0,Math.round(Number(x.cloudConflictRevision)||0));x.syncConflict=!!x.syncConflict;x.rpg=cleanRpg(x.rpg);return x}catch{return base}}
function persistLocal(){localStorage.setItem(SAVE_KEY,JSON.stringify(meta))}
async function syncLineProgress(){if(meta.syncConflict)return false;try{const body=JSON.stringify({role:meta.role,pet:meta.pet,level:meta.level,xp:meta.xp,rpg:meta.rpg,baseRevision:meta.cloudRevision}),r=await fetch('/api/progress',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body}),data=await r.json().catch(()=>({}));if(r.status===409){meta.syncConflict=true;meta.cloudConflictRevision=Math.max(0,Math.round(Number(data?.progress?.revision)||0));persistLocal();render();return false}if(!r.ok)return false;meta.cloudRevision=Math.max(0,Math.round(Number(data?.progress?.revision)||meta.cloudRevision));meta.cloudConflictRevision=0;meta.syncConflict=false;persistLocal();return true}catch{return false}}
function saveMeta(){persistLocal();if(meta.authMode==='line'&&!meta.syncConflict)progressSyncQueue=progressSyncQueue.catch(()=>{}).then(()=>syncLineProgress())}
function applyLineSession(data){const p=data?.progress||{},profile=data?.profile||{},serverRevision=Math.max(0,Math.round(Number(p.revision)||0));if(meta.syncConflict){meta={...meta,authMode:'line',lineUserId:profile.userId||meta.lineUserId||'',linePicture:profile.picture||meta.linePicture||'',playerName:String(profile.name||meta.playerName||'LINE 玩家').slice(0,16),cloudConflictRevision:serverRevision};persistLocal();return false}meta={...meta,authMode:'line',lineUserId:profile.userId||'',linePicture:profile.picture||'',playerName:String(profile.name||'LINE 玩家').slice(0,16),role:ROLES[p.role]?p.role:meta.role,pet:PETS[p.pet]?p.pet:meta.pet,level:clamp(Math.round(Number(p.level)||1),1,50),xp:Math.max(0,Math.round(Number(p.xp)||0)),cloudRevision:serverRevision,syncConflict:false,cloudConflictRevision:0,rpg:cleanRpg(p.rpg)};if(meta.level>=50)meta.xp=0;persistLocal();return true}
function startGuest(){clearFlow();meta={...meta,authMode:'guest',lineUserId:'',linePicture:'',playerName:'訪客',level:1,xp:0,cloudRevision:0,syncConflict:false,cloudConflictRevision:0,rpg:emptyRpg()};persistLocal();screen='setup';render()}
async function startLineLogin`,
  'cloud progress entry functions'
);

replaceOne(
  /function growthPanel\(stats,kind='role'\)\{.*?\}\nasync function fetchDailyQuestionBatch/s,
`function growthPanel(stats,kind='role'){const guest=meta.authMode==='guest',statHtml=\`${'${growthItem(ASSETS.ui.hp,stats.maxHp,\'生命\')}${growthItem(ASSETS.ui.atk,stats.atk,\'攻擊\')}${growthItem(ASSETS.ui.def,stats.def,\'防禦\')}'}\`;if(kind==='pet')return \`<div class="growth-panel pet-growth-panel"><div class="growth-stats">${'${statHtml}'}</div></div>\`;const cosmetics=collectionCosmetics(collectionProgress(meta.rpg).owned),levelText=guest?'Lv.1':meta.level>=50?'Lv.50 · 滿級':\`Lv.${'${meta.level}'}\`,name=meta.playerName||'訪客',title=cosmetics.title||titleFor(),syncWarning=meta.syncConflict?' <span class="growth-title" style="color:#9b4f45;font-weight:700">雲端同步暫停</span>':'';return \`<div class="growth-panel role-growth-panel"><div class="growth-level"><span class="growth-player-name">${'${esc(name)}'}</span><b>${'${levelText}'}</b><span class="growth-title">${'${esc(title)}'}</span>${'${syncWarning}'}</div><div class="growth-stats">${'${statHtml}'}</div></div>\`}
async function fetchDailyQuestionBatch`,
  'cloud conflict setup warning'
);

fs.writeFileSync(path,source);
console.log('Web progress revision migration applied');
