import {QUALITY_DEFS,EQUIPMENT_VALUES,COLLECTION_REWARDS} from './generated/game-data.js';

export const QUALITY_ORDER=['common','rare','epic','legendary'];
export const EQUIPMENT_ENHANCE_MAX=10;
const EQUIPMENT_ENHANCE_COST={common:2,rare:3,epic:5,legendary:8,mythic:12};
const EQUIPMENT_ENHANCE_CHANCE={common:.95,rare:.85,epic:.75,legendary:.65,mythic:.55};
export const ENHANCE_PITY_PER_FAILURE=.01;
export const ENHANCE_PITY_CAP=.20;
export function equipmentEnhanceInfo(item){
  const failures=Math.max(0,Math.min(20,Math.floor(Number(item?.enhanceFailures)||0)));
  const level=Math.min(EQUIPMENT_ENHANCE_MAX,Math.max(0,Math.floor(Number(item?.enhance)||0))),quality=EQUIPMENT_ENHANCE_COST[item?.quality]?item.quality:'common';
  const baseChance=Math.max(.20,EQUIPMENT_ENHANCE_CHANCE[quality]-level*.025);
  return {level,max:EQUIPMENT_ENHANCE_MAX,cost:level>=EQUIPMENT_ENHANCE_MAX?0:EQUIPMENT_ENHANCE_COST[quality]*(level+1),failures,bonusChance:Math.min(ENHANCE_PITY_CAP,failures*ENHANCE_PITY_PER_FAILURE),chance:level>=EQUIPMENT_ENHANCE_MAX?1:Math.min(.95,baseChance+Math.min(ENHANCE_PITY_CAP,failures*ENHANCE_PITY_PER_FAILURE))};
}
export function enhanceEquipment(rpg,itemId,random=Math.random){
  const clean=cleanRpg(rpg),index=clean.inventory.findIndex(item=>item.id===itemId);
  if(index<0)return {rpg:clean,ok:false,reason:'找不到裝備'};
  const item=clean.inventory[index],info=equipmentEnhanceInfo(item);
  if(info.level>=10)return {rpg:clean,ok:false,reason:'已達 +10'};
  if(clean.crystals<info.cost)return {rpg:clean,ok:false,reason:'結晶不足'};
  clean.crystals-=info.cost;
  const roll=Number(random()),success=Number.isFinite(roll)&&roll>=0&&roll<info.chance;
  const next=Math.max(0,info.level+(success?1:-1));
  clean.inventory[index]={...item,enhance:next,enhanceFailures:success?0:Math.min(20,info.failures+1)};
  return {rpg:cleanRpg(clean),ok:true,success,before:info.level,after:next,cost:info.cost,chance:info.chance,bonusChance:info.bonusChance,nextChance:equipmentEnhanceInfo(clean.inventory[index]).chance};
}

export const QUALITY=QUALITY_DEFS;

export const PET_TREES={
  fox:[
    {id:'fox-1',name:'疾風感知',cost:2,desc:'先手第一張牌效果 +5%'},
    {id:'fox-2',name:'赤焰爪痕',cost:4,desc:'紅牌連攜追擊 +10%'},
    {id:'fox-3',name:'獵風本能',cost:6,desc:'紅牌效果 +5%'},
    {id:'fox-4',name:'靈狐敏銳',cost:8,desc:'爆擊率 +4%'},
    {id:'fox-5',name:'九尾先機',cost:10,desc:'先手第一張再 +10%，追擊再 +15%'}
  ],
  owl:[
    {id:'owl-1',name:'夜視洞察',cost:2,desc:'答對 3/5 以上時效果 +5%'},
    {id:'owl-2',name:'守心之羽',cost:4,desc:'綠／藍牌組合回復再 +2%'},
    {id:'owl-3',name:'靜謐護佑',cost:6,desc:'綠／藍牌效果 +5%'},
    {id:'owl-4',name:'智者回響',cost:8,desc:'答對 3/5 以上時效果再 +10%'},
    {id:'owl-5',name:'蒼穹守護',cost:10,desc:'最大生命 +5%，回復再 +4%'}
  ],
  dragon:[
    {id:'dragon-1',name:'元素共鳴',cost:2,desc:'黃牌效果 +4%'},
    {id:'dragon-2',name:'龍息蓄能',cost:4,desc:'黃牌終式爆發 +5%'},
    {id:'dragon-3',name:'幼龍之力',cost:6,desc:'攻擊力 +4%'},
    {id:'dragon-4',name:'元素昇華',cost:8,desc:'黃牌效果再 +6%'},
    {id:'dragon-5',name:'真龍爆發',cost:10,desc:'終式再 +10%，爆擊率 +3%'}
  ]
};


/* Three independent routes per pet. The original five skill IDs remain intact,
   so previously purchased nodes continue to work with existing saves. */
export const PET_PATHS={
  fox:[
    {id:'wind',name:'迅影突襲',subtitle:'速度・先手・爆擊',description:'搶先出手，讓開場優勢與爆擊爆發成形。',nodes:['fox-1','fox-4','fox-5']},
    {id:'flame',name:'赤焰獵手',subtitle:'紅牌・連擊・攻擊',description:'強化紅牌追擊，以連續進攻壓制對手。',nodes:['fox-2','fox-3','fox-6']},
    {id:'moon',name:'月影守護',subtitle:'生命・防禦・續航',description:'增加生存能力，讓靈狐也能走穩健路線。',nodes:['fox-7','fox-8','fox-9']}
  ],
  owl:[
    {id:'wisdom',name:'星夜智識',subtitle:'答題・洞察・爆擊',description:'答題越穩定，技能與爆擊收益越明顯。',nodes:['owl-1','owl-4','owl-6']},
    {id:'ward',name:'蒼穹壁壘',subtitle:'綠藍牌・防禦・生命',description:'加強綠藍牌組合與隊伍防禦。',nodes:['owl-3','owl-7','owl-8']},
    {id:'renewal',name:'聖羽療癒',subtitle:'回復・續航・守心',description:'以綠藍牌連攜換取穩定的回合回復。',nodes:['owl-2','owl-5','owl-9']}
  ],
  dragon:[
    {id:'element',name:'元素術式',subtitle:'黃牌・共鳴・增幅',description:'堆疊黃牌增幅，打造持續的元素輸出。',nodes:['dragon-1','dragon-4','dragon-6']},
    {id:'burst',name:'真龍滅擊',subtitle:'終式・爆擊・爆發',description:'藉由雙黃牌終式打出高強度爆發。',nodes:['dragon-2','dragon-5','dragon-7']},
    {id:'scale',name:'龍鱗護體',subtitle:'攻擊・生命・防禦',description:'兼顧攻擊基礎與承傷能力。',nodes:['dragon-3','dragon-8','dragon-9']}
  ]
};
const NEW_PET_SKILLS={
  fox:[
    {id:'fox-6',name:'焰影撕裂',cost:5,desc:'攻擊力 +4%',effect:{atkPct:.04}},
    {id:'fox-7',name:'月華生息',cost:2,desc:'最大生命 +4%',effect:{hpPct:.04}},
    {id:'fox-8',name:'靈尾屏障',cost:4,desc:'防禦力 +5%',effect:{defPct:.05}},
    {id:'fox-9',name:'月影回春',cost:6,desc:'每回合使用至少 2 張綠／藍牌時，回復最大生命 4%',effect:{guardHeal:.04}}
  ],
  owl:[
    {id:'owl-6',name:'星瞳定策',cost:5,desc:'爆擊率 +3%',effect:{crit:.03}},
    {id:'owl-7',name:'羽翼壁壘',cost:3,desc:'防禦力 +4%',effect:{defPct:.04}},
    {id:'owl-8',name:'蒼穹庇護',cost:5,desc:'最大生命 +5%',effect:{hpPct:.05}},
    {id:'owl-9',name:'聖羽甘霖',cost:6,desc:'綠／藍牌組合回復再 +4%',effect:{guardHeal:.04}}
  ],
  dragon:[
    {id:'dragon-6',name:'極光共鳴',cost:5,desc:'黃牌效果再 +5%',effect:{yellowAmp:.05}},
    {id:'dragon-7',name:'滅星龍瞳',cost:5,desc:'爆擊率 +4%',effect:{crit:.04}},
    {id:'dragon-8',name:'龍鱗再生',cost:3,desc:'最大生命 +5%',effect:{hpPct:.05}},
    {id:'dragon-9',name:'蒼鋼龍甲',cost:5,desc:'防禦力 +4%',effect:{defPct:.04}}
  ]
};
for(const pet of ['fox','owl','dragon'])PET_TREES[pet].push(...NEW_PET_SKILLS[pet]);
// Each primary pet path can develop into one of two mutually exclusive
// specializations. Each specialization itself continues into an advanced skill.
const PET_FORK_CHOICES={
 fox:[[['迅風','firstCardAmp'],['獵魂','crit']],[['焰爪','redAmp'],['猛攻','atkPct']],[['生息','hpPct'],['鐵尾','defPct']]],
 owl:[[['睿智','highAccuracy'],['星眼','crit']],[['守心','defPct'],['護羽','hpPct']],[['聖療','guardHeal'],['持久','hpPct']]],
 dragon:[[['元素','yellowAmp'],['龍威','atkPct']],[['終焰','finisherAmp'],['龍瞳','crit']],[['龍鱗','defPct'],['龍息','hpPct']]]
};
const PET_BONUS_NAMES={firstCardAmp:'先手第一張牌效果',crit:'爆擊率',redAmp:'紅牌效果',atkPct:'攻擊力',hpPct:'最大生命',defPct:'防禦力',highAccuracy:'高答對率牌效果',guardHeal:'綠藍牌連攜回復',yellowAmp:'黃牌效果',finisherAmp:'終式效果'};
for(const [pet,paths] of Object.entries(PET_PATHS)){
  paths.forEach((path,index)=>{
    path.forks=PET_FORK_CHOICES[pet][index].map(([name,effectKey],choiceIndex)=>{
      const ids=[1,2].map(tier=>pet+'-'+path.id+'-'+(choiceIndex+1)+'-'+tier);
      const bonus=choiceIndex===0?.03:.025;
      ids.forEach((id,tier)=>{const value=bonus+(tier?.015:0);PET_TREES[pet].push({id,name:name+(tier?'·進階':'·專精'),cost:tier?6:4,desc:PET_BONUS_NAMES[effectKey]+' +'+Math.round(value*1000)/10+'%',effect:{[effectKey]:value}})});
      return {id:path.id+'-'+(choiceIndex+1),name,subtitle:PET_BONUS_NAMES[effectKey],nodes:ids};
    });
  });
}
// Nine visible skill tiers: 1,1,1 → 2,2,2 → 4,4,4.
// Historical nodes remain in PET_TREES and saved profiles; new tier IDs never overwrite them.
const PET_FLOW_THEMES={
  fox:{root:['靈狐直覺','firstCardAmp'],branches:[
    {name:'迅影',effect:'redAmp',leaves:[['疾風','firstCardAmp'],['獵魂','crit']]},
    {name:'月影',effect:'hpPct',leaves:[['生息','guardHeal'],['鐵尾','defPct']]}
  ]},
  owl:{root:['星夜感知','highAccuracy'],branches:[
    {name:'星瞳',effect:'highAccuracy',leaves:[['睿智','highAccuracy'],['星眼','crit']]},
    {name:'聖羽',effect:'guardHeal',leaves:[['守心','defPct'],['治癒','guardHeal']]}
  ]},
  dragon:{root:['元素感知','yellowAmp'],branches:[
    {name:'炎龍',effect:'yellowAmp',leaves:[['元素','yellowAmp'],['終焰','finisherAmp']]},
    {name:'龍鱗',effect:'hpPct',leaves:[['龍威','atkPct'],['護鱗','defPct']]}
  ]}
};
const FLOW_TIERS=['初醒','進階','極意'];
function flowNode(pet,id,name,key,tier,depth){
  const bonus=[.02,.025,.03][tier]+depth*.005,cost=[2,3,4][tier]+depth;
  const node={id,name:name+FLOW_TIERS[tier],cost,desc:PET_BONUS_NAMES[key]+' +'+Math.round(bonus*1000)/10+'%',effect:{[key]:bonus}};
  PET_TREES[pet].push(node);return id;
}
export const PET_FLOW=Object.fromEntries(Object.entries(PET_FLOW_THEMES).map(([pet,theme])=>{
  const root=FLOW_TIERS.map((_,tier)=>flowNode(pet,pet+'-flow-root-'+(tier+1),theme.root[0],theme.root[1],tier,0));
  const branches=theme.branches.map((branch,branchIndex)=>{
    const nodes=FLOW_TIERS.map((_,tier)=>flowNode(pet,pet+'-flow-mid-'+(branchIndex+1)+'-'+(tier+1),branch.name,branch.effect,tier,1));
    const leaves=branch.leaves.map(([name,key],leafIndex)=>({
      nodes:FLOW_TIERS.map((_,tier)=>flowNode(pet,pet+'-flow-end-'+(branchIndex+1)+'-'+(leafIndex+1)+'-'+(tier+1),name,key,tier,2))
    }));
    return {nodes,leaves};
  });
  return [pet,{root,branches}];
}));
function flowPosition(pet,nodeId){
  const flow=PET_FLOW[pet];if(!flow)return null;
  const rootTier=flow.root.indexOf(nodeId);if(rootTier>=0)return {kind:'root',tier:rootTier};
  for(const [branchIndex,branch] of flow.branches.entries()){
    const middleTier=branch.nodes.indexOf(nodeId);
    if(middleTier>=0)return {kind:'middle',tier:middleTier,branch:branchIndex};
    for(const [leafIndex,leaf] of branch.leaves.entries()){
      const finalTier=leaf.nodes.indexOf(nodeId);
      if(finalTier>=0)return {kind:'final',tier:finalTier,branch:branchIndex,leaf:leafIndex};
    }
  }
  return null;
}
export function petSkillPath(pet,nodeId){return (PET_PATHS[pet]||[]).find(path=>path.nodes.includes(nodeId)||path.forks?.some(fork=>fork.nodes.includes(nodeId)))||null;}
export function petSkillPrerequisite(pet,nodeId){
  const flow=PET_FLOW[pet],position=flowPosition(pet,nodeId);
  if(position){
    if(position.kind==='root')return position.tier?flow.root[position.tier-1]:null;
    const branch=flow.branches[position.branch];
    if(position.kind==='middle')return position.tier?branch.nodes[position.tier-1]:flow.root.at(-1);
    const leaf=branch.leaves[position.leaf];
    return position.tier?leaf.nodes[position.tier-1]:branch.nodes.at(-1);
  }
  const path=petSkillPath(pet,nodeId),at=path?.nodes.indexOf(nodeId)??-1;
  if(at>0)return path.nodes[at-1];
  const fork=path?.forks?.find(choice=>choice.nodes.includes(nodeId));
  if(!fork)return null;
  const forkTier=fork.nodes.indexOf(nodeId);
  return forkTier>0?fork.nodes[forkTier-1]:path.nodes[path.nodes.length-1];
}

const PET_IDS=['fox','owl','dragon'];
export const CRYSTAL_VALUE={common:1,rare:3,epic:8,legendary:20,mythic:60};
export const PET_ENHANCE_MAX=10;
export const PET_ENHANCE_COST=[5,10,20,40,40,50,60,70,80,90];
export const PET_AWAKENING={
  fox:{name:'九尾覺醒',desc:'先手第一張牌再 +15%，紅牌追擊再 +10%'},
  owl:{name:'星夜覺醒',desc:'答對 3/5 以上效果再 +10%，綠／藍牌續航再 +5%'},
  dragon:{name:'真龍覺醒',desc:'黃牌效果再 +10%，終式爆發再 +10%'}
};
const VALID_LOOT={gem:new Set(['ruby','thunder']),armor:new Set(['guardian','bloodspirit']),ring:new Set(['warbreaker','battlesoul'])};
const uid=()=>globalThis.crypto?.randomUUID?.()||`loot-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const pick=(arr,r=Math.random)=>arr[Math.floor(r()*arr.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const QVAL=EQUIPMENT_VALUES;

const ITEM_NAME={ruby:'紅曜石',thunder:'雷光石',guardian:'守護甲',bloodspirit:'血靈甲',warbreaker:'破軍戒',battlesoul:'戰魂戒'};
export const MYTHIC_POWERS={
  lifesteal:{type:'gem',name:'血契汲取',desc:'造成傷害時吸取實際傷害 18% 生命'},
  sunder:{type:'gem',name:'蝕甲魔晶',desc:'攻擊命中使防禦 -8%・3回合，最多 3 層'},
  stun:{type:'gem',name:'雷縛震擊',desc:'攻擊命中有 12% 機率暈眩，跳過 1 次行動'},
  thorns:{type:'armor',name:'荊棘反噬',desc:'受到攻擊時反彈實際傷害 18%'},
  berserk:{type:'armor',name:'血怒狂戰',desc:'生命低於 50% 時，造成傷害 ×2'},
  ward:{type:'armor',name:'神佑格擋',desc:'受到攻擊時有 18% 機率完全抵擋該次攻擊'},
  critburst:{type:'ring',name:'弒神暴擊',desc:'爆擊時額外增傷 50%～100%'},
  flurry:{type:'ring',name:'無盡連斬',desc:'普通攻擊 20% 機率 2 連擊、8% 機率 3 連擊'},
  fatal:{type:'ring',name:'死神判決',desc:'攻擊有 3% 機率追加目標最大生命 70% 的致命傷害'},
  truehit:{type:'ring',name:'破界真傷',desc:'攻擊無視防禦，直接以攻擊傷害計算'},
  antiheal:{type:'ring',name:'禁療烙印',desc:'攻擊命中使治療效果 -70%，持續 2～3回合'}
};
const MYTHIC_POWER_POOLS={gem:['lifesteal','sunder','stun'],armor:['thorns','berserk','ward'],ring:['critburst','flurry','fatal','truehit','antiheal']};
// One genuine, lower-powered combat affix per legendary item; legacy drops receive a fixed subtype affix.
const LEGENDARY_POWERS={
  ember:{type:'gem',name:'餘燼汲取',desc:'造成傷害時回復實際傷害 6% 生命'},
  thunderbolt:{type:'gem',name:'雷霆束縛',desc:'攻擊命中有 4% 機率使敵人暈眩'},
  ironward:{type:'armor',name:'鐵壁庇護',desc:'受攻擊時有 7% 機率完全格擋'},
  bloodthorn:{type:'armor',name:'血荊反噬',desc:'受到攻擊時反彈實際傷害 7%'},
  keenedge:{type:'ring',name:'銳鋒追擊',desc:'爆擊時追加 15%～25% 傷害'},
  quickblade:{type:'ring',name:'迅刃連斬',desc:'普通攻擊有 8% 機率二連擊、2% 機率三連擊'}
};
const LEGENDARY_DEFAULT_BY_SUBTYPE={ruby:'ember',thunder:'thunderbolt',guardian:'ironward',bloodspirit:'bloodthorn',warbreaker:'keenedge',battlesoul:'quickblade'};
const MYTHIC_DEFAULT_BY_SUBTYPE={ruby:'lifesteal',thunder:'sunder',guardian:'thorns',bloodspirit:'berserk',warbreaker:'critburst',battlesoul:'flurry'};
const LEGACY_MAP={gem:{ruby:'ruby',emerald:'thunder',sapphire:'ruby',topaz:'thunder',thunder:'thunder'},armor:{guardian:'guardian',fortress:'guardian',vital:'bloodspirit',bloodspirit:'bloodspirit'},ring:{assault:'warbreaker',guard:'battlesoul',swift:'battlesoul',warbreaker:'warbreaker',battlesoul:'battlesoul'}};

export function lootImage(item){const type=item?.type,subtype=item?.subtype,quality=item?.quality;if(!VALID_LOOT[type]?.has(subtype)||!QUALITY[quality])return '';return `/images/loot-${type}-${subtype}-${quality}.png`;}
function bonusesFor(type,subtype,quality){const v=QVAL[quality]?.[subtype];if(!v)return {};if(type==='gem'&&subtype==='ruby')return {atkPct:v.atk,defPct:v.def};if(type==='gem'&&subtype==='thunder')return {hpPct:v.hp,crit:v.crit};if(type==='armor'&&subtype==='guardian')return {defPct:v.def};if(type==='armor'&&subtype==='bloodspirit')return {hpPct:v.hp};if(type==='ring'&&subtype==='warbreaker')return {atkPct:v.atk,hpPct:v.hp};if(type==='ring'&&subtype==='battlesoul')return {defPct:v.def,crit:v.crit};return {};}
function normalizeItem(item){if(!item||typeof item!=='object'||typeof item.id!=='string')return null;const type=['gem','armor','ring'].includes(item.type)?item.type:null;if(!type)return null;const quality=QUALITY[item.quality]?item.quality:'common';const subtype=LEGACY_MAP[type]?.[item.subtype]||null;if(!subtype||!VALID_LOOT[type].has(subtype))return null;const enhance=clamp(Math.floor(Number(item.enhance)||0),0,EQUIPMENT_ENHANCE_MAX),enhanceFailures=clamp(Math.floor(Number(item.enhanceFailures)||0),0,20),bonuses=bonusesFor(type,subtype,quality),scale=1+enhance*.10;const normalized={...item,type,subtype,quality,enhance,enhanceFailures,name:`${QUALITY[quality].name}${ITEM_NAME[subtype]}`,bonuses:Object.fromEntries(Object.entries(bonuses).map(([key,val])=>[key,Math.round(val*scale*1000000)/1000000]))};if(quality==='mythic'){const power=String(item.mythicPower||'');normalized.mythicPower=MYTHIC_POWERS[power]?.type===type?power:MYTHIC_DEFAULT_BY_SUBTYPE[subtype];}else delete normalized.mythicPower;
if(quality==='legendary'){const power=String(item.legendaryPower||'');normalized.legendaryPower=LEGENDARY_POWERS[power]?.type===type?power:LEGENDARY_DEFAULT_BY_SUBTYPE[subtype];}else delete normalized.legendaryPower;
normalized.art=lootImage(normalized);return normalized;}

export function collectionKey(item){return item?.type&&item?.subtype&&item?.quality?`${item.type}:${item.subtype}:${item.quality}`:'';}
function validCollectionKey(key){const [type,subtype,quality]=String(key||'').split(':');return !!(VALID_LOOT[type]?.has(subtype)&&QUALITY[quality]);}
export function collectionEntries(){const defs={gem:['ruby','thunder'],armor:['guardian','bloodspirit'],ring:['warbreaker','battlesoul']},qualities=[...QUALITY_ORDER,'mythic'],out=[];for(const [type,subs] of Object.entries(defs))for(const subtype of subs)for(const quality of qualities){const item={type,subtype,quality,name:`${QUALITY[quality].name}${ITEM_NAME[subtype]}`,bonuses:bonusesFor(type,subtype,quality)};out.push({...item,key:collectionKey(item),art:lootImage(item)})}return out;}
export function collectionProgress(rpg){const clean=cleanRpg(rpg),total=collectionEntries().length;return {owned:clean.collection.length,total};}
export function collectionRewardState(rpg){const owned=collectionProgress(rpg).owned,rewards=COLLECTION_REWARDS.map(x=>({...x,unlocked:owned>=x.count}));return {owned,rewards,frame:owned>=10,background:owned>=20,title:owned>=30};}

function cleanWeakWords(raw){const out={};if(!raw||typeof raw!=='object')return out;for(const [key,value] of Object.entries(raw)){const index=clamp(Math.round(Number(value?.index??key)),-1,1199);if(index<0)continue;out[String(index)]={index,streak:clamp(Math.round(Number(value?.streak)||0),0,2),misses:clamp(Math.round(Number(value?.misses)||1),1,999),lastWrong:Math.max(0,Math.round(Number(value?.lastWrong)||0))};if(Object.keys(out).length>=120)break;}return out;}
export function emptyRpg(){return {inventory:[],equipped:{gems:[],armor:null,rings:[]},crystals:0,petEnhance:{fox:0,owl:0,dragon:0},petSkills:{fox:[],owl:[],dragon:[]},collection:[],towerBest:0,weakWords:{}};}
export function cleanRpg(raw={}){
  const base=emptyRpg(),src=raw&&typeof raw==='object'?raw:{},rawItems=Array.isArray(src.inventory)?src.inventory.map(normalizeItem).filter(Boolean):[];
  const seen=new Set(),deduped=[];for(let i=rawItems.length-1;i>=0;i--){const item=rawItems[i];if(seen.has(item.id))continue;seen.add(item.id);deduped.push(item)}deduped.reverse();
  const byId=new Map(deduped.map(x=>[x.id,x])),eq=src.equipped&&typeof src.equipped==='object'?src.equipped:{},gems=Array.isArray(eq.gems)?[...new Set(eq.gems.filter(id=>byId.get(id)?.type==='gem'))].slice(0,3):[];
  const armor=byId.get(eq.armor)?.type==='armor'?eq.armor:null;
  const legacyRing=byId.get(eq.ring)?.type==='ring'?eq.ring:null,rawRings=Array.isArray(eq.rings)?eq.rings:(legacyRing?[legacyRing]:[]),rings=[...new Set(rawRings.filter(id=>byId.get(id)?.type==='ring'))].slice(0,2);
  const protectedIds=new Set([...gems,armor,...rings].filter(Boolean));let inventory=deduped;
  if(inventory.length>60){const recentFree=inventory.filter(x=>!protectedIds.has(x.id)).slice(-(60-protectedIds.size)),keep=new Set([...protectedIds,...recentFree.map(x=>x.id)]);inventory=inventory.filter(x=>keep.has(x.id));}
  const crystals=Math.max(0,Math.round(Number(src.crystals)||0)),petEnhance={};for(const pet of PET_IDS)petEnhance[pet]=clamp(Math.round(Number(src.petEnhance?.[pet])||0),0,PET_ENHANCE_MAX);
  const petSkills={};for(const pet of PET_IDS){const valid=new Set(PET_TREES[pet].map(x=>x.id)),list=Array.isArray(src.petSkills?.[pet])?src.petSkills[pet].filter(id=>valid.has(id)):[];petSkills[pet]=PET_TREES[pet].filter(x=>list.includes(x.id)).map(x=>x.id);}
  const collectionSet=new Set((Array.isArray(src.collection)?src.collection:[]).filter(validCollectionKey));for(const item of inventory){const key=collectionKey(item);if(key)collectionSet.add(key);}
  const collection=[...collectionSet],towerBest=clamp(Math.round(Number(src.towerBest)||0),0,20),weakWords=cleanWeakWords(src.weakWords);
  return {...base,inventory,equipped:{gems,armor,rings},crystals,petEnhance,petSkills,collection,towerBest,weakWords};
}
export function maxedPkRpg(){
  const rawItems=[
    {id:'pk-gem-ruby-1',type:'gem',subtype:'ruby',quality:'mythic',mythicPower:'lifesteal'},
    {id:'pk-gem-thunder',type:'gem',subtype:'thunder',quality:'mythic',mythicPower:'sunder'},
    {id:'pk-gem-ruby-2',type:'gem',subtype:'ruby',quality:'mythic',mythicPower:'stun'},
    {id:'pk-armor-guardian',type:'armor',subtype:'guardian',quality:'mythic',mythicPower:'ward'},
    {id:'pk-ring-warbreaker',type:'ring',subtype:'warbreaker',quality:'mythic',mythicPower:'critburst'},
    {id:'pk-ring-battlesoul',type:'ring',subtype:'battlesoul',quality:'mythic',mythicPower:'truehit'}
  ];
  const inventory=rawItems.map(item=>normalizeItem({...item,enhance:EQUIPMENT_ENHANCE_MAX})).filter(Boolean);
  return cleanRpg({
    inventory,
    equipped:{
      gems:['pk-gem-ruby-1','pk-gem-thunder','pk-gem-ruby-2'],
      armor:'pk-armor-guardian',
      rings:['pk-ring-warbreaker','pk-ring-battlesoul']
    },
    crystals:999999,
    petEnhance:{fox:PET_ENHANCE_MAX,owl:PET_ENHANCE_MAX,dragon:PET_ENHANCE_MAX},
    petSkills:Object.fromEntries(PET_IDS.map(id=>[id,[...PET_PATHS[id].flatMap(path=>[...path.nodes,...path.forks[0].nodes]),...PET_FLOW[id].root,...PET_FLOW[id].branches[0].nodes,...PET_FLOW[id].branches[0].leaves[0].nodes]])),
    collection:collectionEntries().map(item=>item.key),
    towerBest:20,
    weakWords:{}
  });
}

export function recordWordResult(rpg,index,correct){const clean=cleanRpg(rpg),i=clamp(Math.round(Number(index)),-1,1199);if(i<0)return clean;const key=String(i),old=clean.weakWords[key];if(correct){if(old){const streak=(old.streak||0)+1;if(streak>=3)delete clean.weakWords[key];else clean.weakWords[key]={...old,streak};}}else clean.weakWords[key]={index:i,streak:0,misses:Math.min(999,(old?.misses||0)+1),lastWrong:Date.now()};return cleanRpg(clean);}
export function weakQuestionIndices(rpg,limit=20){const clean=cleanRpg(rpg);return Object.values(clean.weakWords).sort((a,b)=>(b.misses-a.misses)||(b.lastWrong-a.lastWrong)).slice(0,clamp(Math.round(Number(limit)||20),1,60)).map(x=>x.index);}
export function weakWordProgress(rpg){const clean=cleanRpg(rpg),items=Object.values(clean.weakWords);return {count:items.length,mastering:items.filter(x=>x.streak>0).length};}

export function skillPointBudget(level=1){return Math.max(0,clamp(Math.round(Number(level)||1),1,80)-1);}
export function spentSkillPoints(rpg){const clean=cleanRpg(rpg);let sum=0;for(const pet of PET_IDS){const owned=new Set(clean.petSkills[pet]);for(const node of PET_TREES[pet])if(owned.has(node.id))sum+=node.cost;}return sum;}
export function availableSkillPoints(level,rpg){return Math.max(0,skillPointBudget(level)-spentSkillPoints(rpg));}
export function canUnlockPetSkill(pet,nodeId,level,rpg){
  const tree=PET_TREES[pet]||[],node=tree.find(x=>x.id===nodeId);if(!node)return false;
  const clean=cleanRpg(rpg),owned=new Set(clean.petSkills[pet]);if(owned.has(nodeId))return false;
  const prerequisite=petSkillPrerequisite(pet,nodeId);if(prerequisite&&!owned.has(prerequisite))return false;
  const position=flowPosition(pet,nodeId);
  if(position?.kind==='middle'&&PET_FLOW[pet].branches.some((branch,index)=>index!==position.branch&&(branch.nodes.some(id=>owned.has(id))||branch.leaves.some(leaf=>leaf.nodes.some(id=>owned.has(id))))))return false;
  if(position?.kind==='final'){
    const branch=PET_FLOW[pet].branches[position.branch];
    if(branch.leaves.some((leaf,index)=>index!==position.leaf&&leaf.nodes.some(id=>owned.has(id))))return false;
  }
  const path=petSkillPath(pet,nodeId),fork=path?.forks?.find(choice=>choice.nodes.includes(nodeId));
  if(fork&&!position&&path.forks.some(choice=>choice!==fork&&choice.nodes.some(id=>owned.has(id))))return false;
  return availableSkillPoints(level,clean)>=node.cost;
}
export function unlockPetSkill(pet,nodeId,level,rpg){const clean=cleanRpg(rpg);if(!canUnlockPetSkill(pet,nodeId,level,clean))return clean;clean.petSkills[pet]=[...clean.petSkills[pet],nodeId];return clean;}
export function resetPetSkills(rpg){const clean=cleanRpg(rpg);clean.petSkills={fox:[],owl:[],dragon:[]};return clean;}
export function petEnhanceLevel(pet,rpg){return cleanRpg(rpg).petEnhance?.[pet]||0;}
export function petAwakened(pet,rpg){return petEnhanceLevel(pet,rpg)>=4;}
export function petEnhanceCost(pet,rpg){const level=petEnhanceLevel(pet,rpg);return level>=PET_ENHANCE_MAX?0:PET_ENHANCE_COST[level];}
export function enhancePet(pet,rpg){const clean=cleanRpg(rpg);if(!PET_IDS.includes(pet))return clean;const level=clean.petEnhance[pet]||0;if(level>=PET_ENHANCE_MAX)return clean;const cost=PET_ENHANCE_COST[level];if(clean.crystals<cost)return clean;clean.crystals-=cost;clean.petEnhance[pet]=level+1;return cleanRpg(clean);}
export function crystalValue(item){return CRYSTAL_VALUE[item?.quality]||0;}
export function crystallizeItem(rpg,itemId){const clean=cleanRpg(rpg),equipped=new Set([...clean.equipped.gems,clean.equipped.armor,...clean.equipped.rings].filter(Boolean));if(equipped.has(itemId))return clean;const item=clean.inventory.find(x=>x.id===itemId);if(!item)return clean;const gain=crystalValue(item);if(!gain)return clean;clean.inventory=clean.inventory.filter(x=>x.id!==itemId);clean.crystals+=gain;return cleanRpg(clean);}
export function synthesisInfo(rpg,itemId){const clean=cleanRpg(rpg),item=clean.inventory.find(x=>x.id===itemId),equipped=new Set([...clean.equipped.gems,clean.equipped.armor,...clean.equipped.rings].filter(Boolean));if(!item)return {can:false,count:0,nextQuality:null};const qi=QUALITY_ORDER.indexOf(item.quality);if(qi<0||qi>=QUALITY_ORDER.length-1)return {can:false,count:0,nextQuality:null};const matches=clean.inventory.filter(x=>!equipped.has(x.id)&&x.type===item.type&&x.subtype===item.subtype&&x.quality===item.quality);return {can:matches.length>=3,count:matches.length,nextQuality:QUALITY_ORDER[qi+1],consumeIds:matches.slice(0,3).map(x=>x.id)};}
export function synthesizeItem(rpg,itemId){const clean=cleanRpg(rpg),info=synthesisInfo(clean,itemId),item=clean.inventory.find(x=>x.id===itemId);if(!item||!info.can)return clean;const consume=new Set(info.consumeIds);clean.inventory=clean.inventory.filter(x=>!consume.has(x.id));const made={...makeItem(item.type,item.subtype,info.nextQuality),crafted:true,foundAt:Date.now()};clean.inventory.push(made);const key=collectionKey(made);if(key&&!clean.collection.includes(key))clean.collection.push(key);return cleanRpg(clean);}
export function recordTowerFloor(rpg,floor){const clean=cleanRpg(rpg);clean.towerBest=Math.max(clean.towerBest,clamp(Math.round(Number(floor)||0),0,20));return cleanRpg(clean);}

export function petSkillEffects(pet,rpg){
  const clean=cleanRpg(rpg),owned=new Set(clean.petSkills?.[pet]||[]),out={firstCardAmp:0,chaseAmp:0,redAmp:0,highAccuracy:0,guardHeal:0,stableAmp:0,yellowAmp:0,finisherAmp:0,hpPct:0,atkPct:0,defPct:0,crit:0};
  if(pet==='fox'){if(owned.has('fox-1'))out.firstCardAmp+=.05;if(owned.has('fox-2'))out.chaseAmp+=.10;if(owned.has('fox-3'))out.redAmp+=.05;if(owned.has('fox-4'))out.crit+=.04;if(owned.has('fox-5')){out.firstCardAmp+=.10;out.chaseAmp+=.15;}}
  if(pet==='owl'){if(owned.has('owl-1'))out.highAccuracy+=.05;if(owned.has('owl-2'))out.guardHeal+=.02;if(owned.has('owl-3'))out.stableAmp+=.05;if(owned.has('owl-4'))out.highAccuracy+=.10;if(owned.has('owl-5')){out.hpPct+=.05;out.guardHeal+=.04;}}
  if(pet==='dragon'){if(owned.has('dragon-1'))out.yellowAmp+=.04;if(owned.has('dragon-2'))out.finisherAmp+=.05;if(owned.has('dragon-3'))out.atkPct+=.04;if(owned.has('dragon-4'))out.yellowAmp+=.06;if(owned.has('dragon-5')){out.finisherAmp+=.10;out.crit+=.03;}}
  for(const node of PET_TREES[pet]||[])if(node.effect&&owned.has(node.id))for(const [key,bonus] of Object.entries(node.effect))out[key]+=bonus;
  if((clean.petEnhance?.[pet]||0)>=4){out.awakened=true;if(pet==='fox'){out.firstCardAmp+=.15;out.chaseAmp+=.10}if(pet==='owl'){out.highAccuracy+=.10;out.guardHeal+=.05}if(pet==='dragon'){out.yellowAmp+=.10;out.finisherAmp+=.10}}
  return out;
}
export function mythicAbilityText(item){
  if(item?.quality==='legendary'){const a=LEGENDARY_POWERS[item?.legendaryPower]||LEGENDARY_POWERS[LEGENDARY_DEFAULT_BY_SUBTYPE[item.subtype]];return a?`${a.name}｜${a.desc}`:'';}
  if(item?.quality!=='mythic')return '';
  const a=MYTHIC_POWERS[item?.mythicPower];return a?`${a.name}｜${a.desc}`:'神話能力｜掉落時隨機附加';
}
export function mythicEquipmentEffects(rpg){
  const clean=cleanRpg(rpg),byId=new Map(clean.inventory.map(x=>[x.id,x])),ids=[...clean.equipped.gems,clean.equipped.armor,...clean.equipped.rings].filter(Boolean),items=ids.map(id=>byId.get(id)).filter(x=>x?.quality==='mythic'),powers=new Set(items.map(x=>x.mythicPower).filter(x=>MYTHIC_POWERS[x]));
  const out={lifesteal:0,sunderPct:0,sunderTurns:3,sunderMax:3,stunChance:0,reflect:0,berserk:false,blockChance:0,critBonusMin:0,critBonusMax:0,flurry2Chance:0,flurry3Chance:0,fatalChance:0,fatalPct:0,trueDamage:false,antiHealPct:0,antiHealMinTurns:2,antiHealMaxTurns:3,startShieldPct:0,active:[]};
  for(const power of powers){const a=MYTHIC_POWERS[power];out.active.push({id:power,name:a.name,desc:a.desc});}
  if(powers.has('lifesteal'))out.lifesteal=.18;if(powers.has('sunder'))out.sunderPct=.08;if(powers.has('stun'))out.stunChance=.12;if(powers.has('thorns'))out.reflect=.18;if(powers.has('berserk'))out.berserk=true;if(powers.has('ward'))out.blockChance=.18;if(powers.has('critburst')){out.critBonusMin=.50;out.critBonusMax=1.00;}if(powers.has('flurry')){out.flurry2Chance=.20;out.flurry3Chance=.08;}if(powers.has('fatal')){out.fatalChance=.03;out.fatalPct=.70;}if(powers.has('truehit'))out.trueDamage=true;if(powers.has('antiheal'))out.antiHealPct=.70;
  // Legendary affixes grant a smaller functional bonus and never grant mythic-only powers.
  const legendary=ids.map(id=>byId.get(id)).filter(item=>item?.quality==='legendary');
  for(const item of legendary){const power=item.legendaryPower,affix=LEGENDARY_POWERS[power];if(!affix||affix.type!==item.type)continue;
    out.active.push({id:power,name:affix.name,desc:affix.desc});
    if(power==='ember')out.lifesteal+=.06;
    if(power==='thunderbolt')out.stunChance+=.04;
    if(power==='ironward')out.blockChance+=.07;
    if(power==='bloodthorn')out.reflect+=.07;
    if(power==='keenedge'){out.critBonusMin+=.15;out.critBonusMax+=.25;}
    if(power==='quickblade'){out.flurry2Chance+=.08;out.flurry3Chance+=.02;}
  }
  out.lifesteal=Math.min(.55,out.lifesteal);out.stunChance=Math.min(.45,out.stunChance);out.blockChance=Math.min(.60,out.blockChance);out.reflect=Math.min(.55,out.reflect);
  out.flurry2Chance=Math.min(.50,out.flurry2Chance);out.flurry3Chance=Math.min(.25,out.flurry3Chance);
  return out;
}
export function equipmentResonance(rpg){const clean=cleanRpg(rpg),byId=new Map(clean.inventory.map(x=>[x.id,x])),ids=[...clean.equipped.gems,clean.equipped.armor,...clean.equipped.rings].filter(Boolean),items=ids.map(id=>byId.get(id)).filter(Boolean),count=sub=>items.filter(x=>x.subtype===sub).length;const recipes=[{id:'war',name:'烈戰共鳴',desc:'2 紅曜石＋破軍戒｜每回合第一張牌 +12%',active:count('ruby')>=2&&count('warbreaker')>=1},{id:'blood',name:'血靈共鳴',desc:'2 雷光石＋血靈甲｜綠牌效果 +15%',active:count('thunder')>=2&&count('bloodspirit')>=1},{id:'guard',name:'鐵壁共鳴',desc:'守護甲＋戰魂戒｜藍牌效果 +15%',active:count('guardian')>=1&&count('battlesoul')>=1}];const out={recipes,active:recipes.filter(x=>x.active),firstCardAmp:0,greenAmp:0,blueAmp:0};if(recipes[0].active)out.firstCardAmp=.12;if(recipes[1].active)out.greenAmp=.15;if(recipes[2].active)out.blueAmp=.15;return out;}
export function equipmentBonuses(rpg){const clean=cleanRpg(rpg),byId=new Map(clean.inventory.map(x=>[x.id,x])),ids=[...clean.equipped.gems,clean.equipped.armor,...clean.equipped.rings].filter(Boolean),out={hpPct:0,atkPct:0,defPct:0,crit:0};for(const id of ids){const item=byId.get(id);if(!item?.bonuses)continue;out.hpPct+=Number(item.bonuses.hpPct)||0;out.atkPct+=Number(item.bonuses.atkPct)||0;out.defPct+=Number(item.bonuses.defPct)||0;out.crit+=Number(item.bonuses.crit)||0;}return out;}
function weightedQuality(stageIndex,r=Math.random){const tables=[[70,25,4,1],[60,30,8,2],[50,34,12,4],[35,40,18,7]],weights=tables[clamp(stageIndex,0,3)],roll=r()*100;let acc=0;for(let i=0;i<weights.length;i++){acc+=weights[i];if(roll<acc)return QUALITY_ORDER[i];}return 'common';}
function makeItem(type,subtype,quality){const item={id:uid(),type,subtype,quality,name:`${QUALITY[quality].name}${ITEM_NAME[subtype]}`,bonuses:bonusesFor(type,subtype,quality)};return {...item,art:lootImage(item)};}
function makeGem(quality,r){return makeItem('gem',pick(['ruby','thunder'],r),quality);}function makeArmor(quality,r){return makeItem('armor',pick(['guardian','bloodspirit'],r),quality);}function makeRing(quality,r){return makeItem('ring',pick(['warbreaker','battlesoul'],r),quality);}
export function rollLoot(stageIndex=0,level=1,r=Math.random){const chances=[.45,.55,.68,1],idx=clamp(Math.round(stageIndex)||0,0,3);if(r()>chances[idx])return null;const quality=weightedQuality(idx,r),typeRoll=r();let item=typeRoll<.55?makeGem(quality,r):typeRoll<.80?makeArmor(quality,r):makeRing(quality,r);return {...item,stage:idx+1,level:clamp(Math.round(Number(level)||1),1,80),foundAt:Date.now()};}
export function rollMythicLoot({boss=false,towerFloor=0,level=1}={},r=Math.random){const floor=clamp(Math.round(Number(towerFloor)||0),0,20),chance=boss?.03:floor>=20?.30:floor>=15?.18:floor>=10?.12:floor>=8?.04:0;if(chance<=0||r()>=chance)return null;const pool=[['gem','ruby'],['gem','thunder'],['armor','guardian'],['armor','bloodspirit'],['ring','warbreaker'],['ring','battlesoul']],pair=pick(pool,r),power=pick(MYTHIC_POWER_POOLS[pair[0]],r),item=makeItem(pair[0],pair[1],'mythic');return {...item,mythicPower:power,source:boss?'boss':'tower',towerFloor:floor,level:clamp(Math.round(Number(level)||1),1,80),foundAt:Date.now()};}
export function addLoot(rpg,item){const clean=cleanRpg(rpg),normalized=normalizeItem(item);if(!normalized)return clean;clean.inventory=[...clean.inventory,normalized];return cleanRpg(clean);}
export function equipItem(rpg,itemId){const clean=cleanRpg(rpg),item=clean.inventory.find(x=>x.id===itemId);if(!item)return clean;if(item.type==='gem'){const gems=clean.equipped.gems.filter(id=>id!==itemId);if(gems.length>=3)return clean;clean.equipped.gems=[...gems,itemId];}else if(item.type==='armor')clean.equipped.armor=itemId;else if(item.type==='ring'){const rings=clean.equipped.rings.filter(id=>id!==itemId);if(rings.length>=2)return clean;clean.equipped.rings=[...rings,itemId];}return cleanRpg(clean);}
export function unequipItem(rpg,itemId){const clean=cleanRpg(rpg);clean.equipped.gems=clean.equipped.gems.filter(id=>id!==itemId);if(clean.equipped.armor===itemId)clean.equipped.armor=null;clean.equipped.rings=clean.equipped.rings.filter(id=>id!==itemId);return cleanRpg(clean);}
export function itemBonusText(item){const b=item?.bonuses||{},parts=[];if(item?.enhance>0)parts.push(`+${Math.min(10,Math.floor(Number(item.enhance)))}`);if(b.hpPct)parts.push(`生命 +${Math.round(b.hpPct*100)}%`);if(b.atkPct)parts.push(`攻擊 +${Math.round(b.atkPct*100)}%`);if(b.defPct)parts.push(`防禦 +${Math.round(b.defPct*100)}%`);if(b.crit)parts.push(`爆擊 +${Math.round(b.crit*100)}%`);const mythic=mythicAbilityText(item);if(mythic)parts.push(`✦ ${mythic}`);return parts.join(' · ');}
