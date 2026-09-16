export const QUALITY_ORDER=['common','rare','epic','legendary'];
export const QUALITY={
  common:{name:'普通',rank:0},
  rare:{name:'稀有',rank:1},
  epic:{name:'史詩',rank:2},
  legendary:{name:'傳說',rank:3},
  mythic:{name:'神話',rank:4}
};

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

const PET_IDS=['fox','owl','dragon'];
export const CRYSTAL_VALUE={common:1,rare:3,epic:8,legendary:20,mythic:60};
export const PET_ENHANCE_COST=[5,10,20,40];
export const PET_AWAKENING={
  fox:{name:'九尾覺醒',desc:'先手第一張牌再 +15%，紅牌追擊再 +10%'},
  owl:{name:'星夜覺醒',desc:'答對 3/5 以上效果再 +10%，綠／藍牌續航再 +5%'},
  dragon:{name:'真龍覺醒',desc:'黃牌效果再 +10%，終式爆發再 +10%'}
};
const VALID_LOOT={gem:new Set(['ruby','thunder']),armor:new Set(['guardian','bloodspirit']),ring:new Set(['warbreaker','battlesoul'])};
const uid=()=>globalThis.crypto?.randomUUID?.()||`loot-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const pick=(arr,r=Math.random)=>arr[Math.floor(r()*arr.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

const QVAL={
  common:{ruby:{atk:.03,def:.03},thunder:{hp:.04,crit:.01},guardian:{def:.08},bloodspirit:{hp:.08},warbreaker:{atk:.04,hp:.04},battlesoul:{def:.04,crit:.01}},
  rare:{ruby:{atk:.045,def:.045},thunder:{hp:.06,crit:.02},guardian:{def:.12},bloodspirit:{hp:.12},warbreaker:{atk:.06,hp:.06},battlesoul:{def:.06,crit:.02}},
  epic:{ruby:{atk:.065,def:.065},thunder:{hp:.09,crit:.03},guardian:{def:.18},bloodspirit:{hp:.18},warbreaker:{atk:.09,hp:.09},battlesoul:{def:.09,crit:.035}},
  legendary:{ruby:{atk:.09,def:.09},thunder:{hp:.13,crit:.05},guardian:{def:.26},bloodspirit:{hp:.26},warbreaker:{atk:.13,hp:.13},battlesoul:{def:.13,crit:.05}},
  mythic:{ruby:{atk:.14,def:.14},thunder:{hp:.20,crit:.08},guardian:{def:.40},bloodspirit:{hp:.40},warbreaker:{atk:.20,hp:.20},battlesoul:{def:.20,crit:.08}}
};

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
const MYTHIC_DEFAULT_BY_SUBTYPE={ruby:'lifesteal',thunder:'sunder',guardian:'thorns',bloodspirit:'berserk',warbreaker:'critburst',battlesoul:'flurry'};
const LEGACY_MAP={
  gem:{ruby:'ruby',emerald:'thunder',sapphire:'ruby',topaz:'thunder',thunder:'thunder'},
  armor:{guardian:'guardian',fortress:'guardian',vital:'bloodspirit',bloodspirit:'bloodspirit'},
  ring:{assault:'warbreaker',guard:'battlesoul',swift:'battlesoul',warbreaker:'warbreaker',battlesoul:'battlesoul'}
};

export function lootImage(item){
  const type=item?.type,subtype=item?.subtype,quality=item?.quality;
  if(!VALID_LOOT[type]?.has(subtype)||!QUALITY[quality])return '';
  return `/images/loot-${type}-${subtype}-${quality}.png`;
}

function bonusesFor(type,subtype,quality){
  const v=QVAL[quality]?.[subtype];if(!v)return {};
  if(type==='gem'&&subtype==='ruby')return {atkPct:v.atk,defPct:v.def};
  if(type==='gem'&&subtype==='thunder')return {hpPct:v.hp,crit:v.crit};
  if(type==='armor'&&subtype==='guardian')return {defPct:v.def};
  if(type==='armor'&&subtype==='bloodspirit')return {hpPct:v.hp};
  if(type==='ring'&&subtype==='warbreaker')return {atkPct:v.atk,hpPct:v.hp};
  if(type==='ring'&&subtype==='battlesoul')return {defPct:v.def,crit:v.crit};
  return {};
}

function normalizeItem(item){
  if(!item||typeof item!=='object'||typeof item.id!=='string')return null;
  const type=['gem','armor','ring'].includes(item.type)?item.type:null;if(!type)return null;
  const quality=QUALITY[item.quality]?item.quality:'common';
  const subtype=LEGACY_MAP[type]?.[item.subtype]||null;if(!subtype||!VALID_LOOT[type].has(subtype))return null;
  const normalized={...item,type,subtype,quality,name:`${QUALITY[quality].name}${ITEM_NAME[subtype]}`,bonuses:bonusesFor(type,subtype,quality)};
  if(quality==='mythic'){
    const power=String(item.mythicPower||'');
    normalized.mythicPower=MYTHIC_POWERS[power]?.type===type?power:MYTHIC_DEFAULT_BY_SUBTYPE[subtype];
  }else delete normalized.mythicPower;
  normalized.art=lootImage(normalized);
  return normalized;
}

export function collectionKey(item){return item?.type&&item?.subtype&&item?.quality?`${item.type}:${item.subtype}:${item.quality}`:'';}
function validCollectionKey(key){const [type,subtype,quality]=String(key||'').split(':');return !!(VALID_LOOT[type]?.has(subtype)&&QUALITY[quality]);}
export function collectionEntries(){const defs={gem:['ruby','thunder'],armor:['guardian','bloodspirit'],ring:['warbreaker','battlesoul']},qualities=[...QUALITY_ORDER,'mythic'],out=[];for(const [type,subs] of Object.entries(defs))for(const subtype of subs)for(const quality of qualities){const item={type,subtype,quality,name:`${QUALITY[quality].name}${ITEM_NAME[subtype]}`,bonuses:bonusesFor(type,subtype,quality)};out.push({...item,key:collectionKey(item),art:lootImage(item)})}return out;}
export function collectionProgress(rpg){const clean=cleanRpg(rpg),total=collectionEntries().length;return {owned:clean.collection.length,total};}

export function emptyRpg(){return {inventory:[],equipped:{gems:[],armor:null,rings:[]},crystals:0,petEnhance:{fox:0,owl:0,dragon:0},petSkills:{fox:[],owl:[],dragon:[]},collection:[],towerBest:0};}

export function cleanRpg(raw={}){
  const base=emptyRpg(),src=raw&&typeof raw==='object'?raw:{},rawItems=Array.isArray(src.inventory)?src.inventory.map(normalizeItem).filter(Boolean):[];
  const seen=new Set(),deduped=[];for(let i=rawItems.length-1;i>=0;i--){const item=rawItems[i];if(seen.has(item.id))continue;seen.add(item.id);deduped.push(item)}deduped.reverse();
  const byId=new Map(deduped.map(x=>[x.id,x])),eq=src.equipped&&typeof src.equipped==='object'?src.equipped:{},gems=Array.isArray(eq.gems)?[...new Set(eq.gems.filter(id=>byId.get(id)?.type==='gem'))].slice(0,3):[];
  const armor=byId.get(eq.armor)?.type==='armor'?eq.armor:null;
  const legacyRing=byId.get(eq.ring)?.type==='ring'?eq.ring:null,rawRings=Array.isArray(eq.rings)?eq.rings:(legacyRing?[legacyRing]:[]),rings=[...new Set(rawRings.filter(id=>byId.get(id)?.type==='ring'))].slice(0,2);
  const protectedIds=new Set([...gems,armor,...rings].filter(Boolean));let inventory=deduped;
  if(inventory.length>60){const recentFree=inventory.filter(x=>!protectedIds.has(x.id)).slice(-(60-protectedIds.size)),keep=new Set([...protectedIds,...recentFree.map(x=>x.id)]);inventory=inventory.filter(x=>keep.has(x.id));}
  const crystals=Math.max(0,Math.round(Number(src.crystals)||0)),petEnhance={};
  for(const pet of PET_IDS)petEnhance[pet]=clamp(Math.round(Number(src.petEnhance?.[pet])||0),0,4);
  const petSkills={};
  for(const pet of PET_IDS){const valid=new Set(PET_TREES[pet].map(x=>x.id)),list=Array.isArray(src.petSkills?.[pet])?src.petSkills[pet].filter(id=>valid.has(id)):[];petSkills[pet]=PET_TREES[pet].filter(x=>list.includes(x.id)).map(x=>x.id);}
  const collectionSet=new Set((Array.isArray(src.collection)?src.collection:[]).filter(validCollectionKey));
  for(const item of inventory){const key=collectionKey(item);if(key)collectionSet.add(key);}
  const collection=[...collectionSet],towerBest=clamp(Math.round(Number(src.towerBest)||0),0,10);
  return {...base,inventory,equipped:{gems,armor,rings},crystals,petEnhance,petSkills,collection,towerBest};
}

export function skillPointBudget(level=1){return Math.max(0,clamp(Math.round(Number(level)||1),1,50)-1);}
export function spentSkillPoints(rpg){const clean=cleanRpg(rpg);let sum=0;for(const pet of PET_IDS){const owned=new Set(clean.petSkills[pet]);for(const node of PET_TREES[pet])if(owned.has(node.id))sum+=node.cost;}return sum;}
export function availableSkillPoints(level,rpg){return Math.max(0,skillPointBudget(level)-spentSkillPoints(rpg));}

export function canUnlockPetSkill(pet,nodeId,level,rpg){
  const tree=PET_TREES[pet]||[],at=tree.findIndex(x=>x.id===nodeId);if(at<0)return false;const clean=cleanRpg(rpg),owned=new Set(clean.petSkills[pet]);if(owned.has(nodeId))return false;if(at>0&&!owned.has(tree[at-1].id))return false;return availableSkillPoints(level,clean)>=tree[at].cost;
}

export function unlockPetSkill(pet,nodeId,level,rpg){const clean=cleanRpg(rpg);if(!canUnlockPetSkill(pet,nodeId,level,clean))return clean;clean.petSkills[pet]=[...clean.petSkills[pet],nodeId];return clean;}
export function resetPetSkills(rpg){const clean=cleanRpg(rpg);clean.petSkills={fox:[],owl:[],dragon:[]};return clean;}
export function petEnhanceLevel(pet,rpg){return cleanRpg(rpg).petEnhance?.[pet]||0;}
export function petEnhanceCost(pet,rpg){const level=petEnhanceLevel(pet,rpg);return level>=4?0:PET_ENHANCE_COST[level];}
export function enhancePet(pet,rpg){const clean=cleanRpg(rpg);if(!PET_IDS.includes(pet))return clean;const level=clean.petEnhance[pet]||0;if(level>=4)return clean;const cost=PET_ENHANCE_COST[level];if(clean.crystals<cost)return clean;clean.crystals-=cost;clean.petEnhance[pet]=level+1;return cleanRpg(clean);}
export function crystalValue(item){return CRYSTAL_VALUE[item?.quality]||0;}
export function crystallizeItem(rpg,itemId){const clean=cleanRpg(rpg),equipped=new Set([...clean.equipped.gems,clean.equipped.armor,...clean.equipped.rings].filter(Boolean));if(equipped.has(itemId))return clean;const item=clean.inventory.find(x=>x.id===itemId);if(!item)return clean;const gain=crystalValue(item);if(!gain)return clean;clean.inventory=clean.inventory.filter(x=>x.id!==itemId);clean.crystals+=gain;return cleanRpg(clean);}
export function synthesisInfo(rpg,itemId){const clean=cleanRpg(rpg),item=clean.inventory.find(x=>x.id===itemId),equipped=new Set([...clean.equipped.gems,clean.equipped.armor,...clean.equipped.rings].filter(Boolean));if(!item)return {can:false,count:0,nextQuality:null};const qi=QUALITY_ORDER.indexOf(item.quality);if(qi<0||qi>=QUALITY_ORDER.length-1)return {can:false,count:0,nextQuality:null};const matches=clean.inventory.filter(x=>!equipped.has(x.id)&&x.type===item.type&&x.subtype===item.subtype&&x.quality===item.quality);return {can:matches.length>=3,count:matches.length,nextQuality:QUALITY_ORDER[qi+1],consumeIds:matches.slice(0,3).map(x=>x.id)};}
export function synthesizeItem(rpg,itemId){const clean=cleanRpg(rpg),info=synthesisInfo(clean,itemId),item=clean.inventory.find(x=>x.id===itemId);if(!item||!info.can)return clean;const consume=new Set(info.consumeIds);clean.inventory=clean.inventory.filter(x=>!consume.has(x.id));const made={...makeItem(item.type,item.subtype,info.nextQuality),crafted:true,foundAt:Date.now()};clean.inventory.push(made);const key=collectionKey(made);if(key&&!clean.collection.includes(key))clean.collection.push(key);return cleanRpg(clean);}
export function recordTowerFloor(rpg,floor){const clean=cleanRpg(rpg);clean.towerBest=Math.max(clean.towerBest,clamp(Math.round(Number(floor)||0),0,10));return cleanRpg(clean);}



export function petSkillEffects(pet,rpg){
  const clean=cleanRpg(rpg),owned=new Set(clean.petSkills?.[pet]||[]),out={firstCardAmp:0,chaseAmp:0,redAmp:0,highAccuracy:0,guardHeal:0,stableAmp:0,yellowAmp:0,finisherAmp:0,hpPct:0,atkPct:0,defPct:0,crit:0};
  if(pet==='fox'){
    if(owned.has('fox-1'))out.firstCardAmp+=.05;if(owned.has('fox-2'))out.chaseAmp+=.10;if(owned.has('fox-3'))out.redAmp+=.05;if(owned.has('fox-4'))out.crit+=.04;if(owned.has('fox-5')){out.firstCardAmp+=.10;out.chaseAmp+=.15;}
  }
  if(pet==='owl'){
    if(owned.has('owl-1'))out.highAccuracy+=.05;if(owned.has('owl-2'))out.guardHeal+=.02;if(owned.has('owl-3'))out.stableAmp+=.05;if(owned.has('owl-4'))out.highAccuracy+=.10;if(owned.has('owl-5')){out.hpPct+=.05;out.guardHeal+=.04;}
  }
  if(pet==='dragon'){
    if(owned.has('dragon-1'))out.yellowAmp+=.04;if(owned.has('dragon-2'))out.finisherAmp+=.05;if(owned.has('dragon-3'))out.atkPct+=.04;if(owned.has('dragon-4'))out.yellowAmp+=.06;if(owned.has('dragon-5')){out.finisherAmp+=.10;out.crit+=.03;}
  }
  if((clean.petEnhance?.[pet]||0)>=4){out.awakened=true;if(pet==='fox'){out.firstCardAmp+=.15;out.chaseAmp+=.10}if(pet==='owl'){out.highAccuracy+=.10;out.guardHeal+=.05}if(pet==='dragon'){out.yellowAmp+=.10;out.finisherAmp+=.10}}
  return out;
}

export function mythicAbilityText(item){
  if(item?.quality!=='mythic')return '';
  const a=MYTHIC_POWERS[item?.mythicPower];
  return a?`${a.name}｜${a.desc}`:'神話能力｜掉落時隨機附加';
}
export function mythicEquipmentEffects(rpg){
  const clean=cleanRpg(rpg),byId=new Map(clean.inventory.map(x=>[x.id,x])),ids=[...clean.equipped.gems,clean.equipped.armor,...clean.equipped.rings].filter(Boolean),items=ids.map(id=>byId.get(id)).filter(x=>x?.quality==='mythic'),powers=new Set(items.map(x=>x.mythicPower).filter(x=>MYTHIC_POWERS[x]));
  const out={lifesteal:0,sunderPct:0,sunderTurns:3,sunderMax:3,stunChance:0,reflect:0,berserk:false,blockChance:0,critBonusMin:0,critBonusMax:0,flurry2Chance:0,flurry3Chance:0,fatalChance:0,fatalPct:0,trueDamage:false,antiHealPct:0,antiHealMinTurns:2,antiHealMaxTurns:3,active:[]};
  for(const power of powers){const a=MYTHIC_POWERS[power];out.active.push({id:power,name:a.name,desc:a.desc});}
  if(powers.has('lifesteal'))out.lifesteal=.18;
  if(powers.has('sunder'))out.sunderPct=.08;
  if(powers.has('stun'))out.stunChance=.12;
  if(powers.has('thorns'))out.reflect=.18;
  if(powers.has('berserk'))out.berserk=true;
  if(powers.has('ward'))out.blockChance=.18;
  if(powers.has('critburst')){out.critBonusMin=.50;out.critBonusMax=1.00;}
  if(powers.has('flurry')){out.flurry2Chance=.20;out.flurry3Chance=.08;}
  if(powers.has('fatal')){out.fatalChance=.03;out.fatalPct=.70;}
  if(powers.has('truehit'))out.trueDamage=true;
  if(powers.has('antiheal'))out.antiHealPct=.70;
  return out;
}

export function equipmentResonance(rpg){
  const clean=cleanRpg(rpg),byId=new Map(clean.inventory.map(x=>[x.id,x])),ids=[...clean.equipped.gems,clean.equipped.armor,...clean.equipped.rings].filter(Boolean),items=ids.map(id=>byId.get(id)).filter(Boolean),count=sub=>items.filter(x=>x.subtype===sub).length;
  const recipes=[
    {id:'war',name:'烈戰共鳴',desc:'2 紅曜石＋破軍戒｜每回合第一張牌 +12%',active:count('ruby')>=2&&count('warbreaker')>=1},
    {id:'blood',name:'血靈共鳴',desc:'2 雷光石＋血靈甲｜綠牌效果 +15%',active:count('thunder')>=2&&count('bloodspirit')>=1},
    {id:'guard',name:'鐵壁共鳴',desc:'守護甲＋戰魂戒｜藍牌效果 +15%',active:count('guardian')>=1&&count('battlesoul')>=1}
  ];
  const out={recipes,active:recipes.filter(x=>x.active),firstCardAmp:0,greenAmp:0,blueAmp:0};
  if(recipes[0].active)out.firstCardAmp=.12;if(recipes[1].active)out.greenAmp=.15;if(recipes[2].active)out.blueAmp=.15;return out;
}

export function equipmentBonuses(rpg){
  const clean=cleanRpg(rpg),byId=new Map(clean.inventory.map(x=>[x.id,x])),ids=[...clean.equipped.gems,clean.equipped.armor,...clean.equipped.rings].filter(Boolean),out={hpPct:0,atkPct:0,defPct:0,crit:0};
  for(const id of ids){const item=byId.get(id);if(!item?.bonuses)continue;out.hpPct+=Number(item.bonuses.hpPct)||0;out.atkPct+=Number(item.bonuses.atkPct)||0;out.defPct+=Number(item.bonuses.defPct)||0;out.crit+=Number(item.bonuses.crit)||0;}
  return out;
}

function weightedQuality(stageIndex,r=Math.random){
  const tables=[[70,25,4,1],[60,30,8,2],[50,34,12,4],[35,40,18,7]],weights=tables[clamp(stageIndex,0,3)],roll=r()*100;let acc=0;for(let i=0;i<weights.length;i++){acc+=weights[i];if(roll<acc)return QUALITY_ORDER[i];}return 'common';
}

function makeItem(type,subtype,quality){
  const item={id:uid(),type,subtype,quality,name:`${QUALITY[quality].name}${ITEM_NAME[subtype]}`,bonuses:bonusesFor(type,subtype,quality)};
  return {...item,art:lootImage(item)};
}
function makeGem(quality,r){return makeItem('gem',pick(['ruby','thunder'],r),quality);}
function makeArmor(quality,r){return makeItem('armor',pick(['guardian','bloodspirit'],r),quality);}
function makeRing(quality,r){return makeItem('ring',pick(['warbreaker','battlesoul'],r),quality);}

export function rollLoot(stageIndex=0,level=1,r=Math.random){
  const chances=[.45,.55,.68,1],idx=clamp(Math.round(stageIndex)||0,0,3);if(r()>chances[idx])return null;const quality=weightedQuality(idx,r),typeRoll=r();let item=typeRoll<.55?makeGem(quality,r):typeRoll<.80?makeArmor(quality,r):makeRing(quality,r);return {...item,stage:idx+1,level:clamp(Math.round(Number(level)||1),1,50),foundAt:Date.now()};
}

export function rollMythicLoot({boss=false,towerFloor=0,level=1}={},r=Math.random){
  const floor=clamp(Math.round(Number(towerFloor)||0),0,10),chance=boss?.03:floor>=10?.12:floor>=8?.04:0;if(chance<=0||r()>=chance)return null;
  const pool=[['gem','ruby'],['gem','thunder'],['armor','guardian'],['armor','bloodspirit'],['ring','warbreaker'],['ring','battlesoul']],pair=pick(pool,r),power=pick(MYTHIC_POWER_POOLS[pair[0]],r),item=makeItem(pair[0],pair[1],'mythic');
  return {...item,mythicPower:power,source:boss?'boss':'tower',towerFloor:floor,level:clamp(Math.round(Number(level)||1),1,50),foundAt:Date.now()};
}

export function addLoot(rpg,item){const clean=cleanRpg(rpg),normalized=normalizeItem(item);if(!normalized)return clean;clean.inventory=[...clean.inventory,normalized];return cleanRpg(clean);}
export function equipItem(rpg,itemId){const clean=cleanRpg(rpg),item=clean.inventory.find(x=>x.id===itemId);if(!item)return clean;if(item.type==='gem'){const gems=clean.equipped.gems.filter(id=>id!==itemId);if(gems.length>=3)return clean;clean.equipped.gems=[...gems,itemId];}else if(item.type==='armor')clean.equipped.armor=itemId;else if(item.type==='ring'){const rings=clean.equipped.rings.filter(id=>id!==itemId);if(rings.length>=2)return clean;clean.equipped.rings=[...rings,itemId];}return cleanRpg(clean);}
export function unequipItem(rpg,itemId){const clean=cleanRpg(rpg);clean.equipped.gems=clean.equipped.gems.filter(id=>id!==itemId);if(clean.equipped.armor===itemId)clean.equipped.armor=null;clean.equipped.rings=clean.equipped.rings.filter(id=>id!==itemId);return cleanRpg(clean);}
export function itemBonusText(item){const b=item?.bonuses||{},parts=[];if(b.hpPct)parts.push(`生命 +${Math.round(b.hpPct*100)}%`);if(b.atkPct)parts.push(`攻擊 +${Math.round(b.atkPct*100)}%`);if(b.defPct)parts.push(`防禦 +${Math.round(b.defPct*100)}%`);if(b.crit)parts.push(`爆擊 +${Math.round(b.crit*100)}%`);const mythic=mythicAbilityText(item);if(mythic)parts.push(`✦ ${mythic}`);return parts.join(' · ');}
