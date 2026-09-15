export const QUALITY_ORDER=['common','rare','epic','legendary'];
export const QUALITY={
  common:{name:'普通',rank:0},
  rare:{name:'稀有',rank:1},
  epic:{name:'史詩',rank:2},
  legendary:{name:'傳說',rank:3}
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
    {id:'owl-1',name:'夜視洞察',cost:2,desc:'1 題答對時效果 +5%'},
    {id:'owl-2',name:'守心之羽',cost:4,desc:'綠／藍牌組合回復再 +2%'},
    {id:'owl-3',name:'靜謐護佑',cost:6,desc:'綠／藍牌效果 +5%'},
    {id:'owl-4',name:'智者回響',cost:8,desc:'1 題答對時效果再 +10%'},
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
const VALID_LOOT={gem:new Set(['ruby','thunder']),armor:new Set(['guardian','bloodspirit']),ring:new Set(['warbreaker','battlesoul'])};
const uid=()=>globalThis.crypto?.randomUUID?.()||`loot-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const pick=(arr,r=Math.random)=>arr[Math.floor(r()*arr.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

const QVAL={
  common:{ruby:{atk:.03,def:.03},thunder:{hp:.04,crit:.01},guardian:{def:.08},bloodspirit:{hp:.08},warbreaker:{atk:.04,hp:.04},battlesoul:{def:.04,crit:.01}},
  rare:{ruby:{atk:.045,def:.045},thunder:{hp:.06,crit:.02},guardian:{def:.12},bloodspirit:{hp:.12},warbreaker:{atk:.06,hp:.06},battlesoul:{def:.06,crit:.02}},
  epic:{ruby:{atk:.065,def:.065},thunder:{hp:.09,crit:.03},guardian:{def:.18},bloodspirit:{hp:.18},warbreaker:{atk:.09,hp:.09},battlesoul:{def:.09,crit:.035}},
  legendary:{ruby:{atk:.09,def:.09},thunder:{hp:.13,crit:.05},guardian:{def:.26},bloodspirit:{hp:.26},warbreaker:{atk:.13,hp:.13},battlesoul:{def:.13,crit:.05}}
};

const ITEM_NAME={ruby:'紅曜石',thunder:'雷光石',guardian:'守護甲',bloodspirit:'血靈甲',warbreaker:'破軍戒',battlesoul:'戰魂戒'};
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
  normalized.art=lootImage(normalized);
  return normalized;
}

export function emptyRpg(){return {inventory:[],equipped:{gems:[],armor:null,ring:null},petSkills:{fox:[],owl:[],dragon:[]}};}

export function cleanRpg(raw={}){
  const base=emptyRpg(),src=raw&&typeof raw==='object'?raw:{},inventory=Array.isArray(src.inventory)?src.inventory.map(normalizeItem).filter(Boolean).slice(-60):[];
  const ids=new Set(inventory.map(x=>x.id)),eq=src.equipped&&typeof src.equipped==='object'?src.equipped:{},gems=Array.isArray(eq.gems)?[...new Set(eq.gems.filter(id=>ids.has(id)&&inventory.find(x=>x.id===id)?.type==='gem'))].slice(0,3):[];
  const armor=ids.has(eq.armor)&&inventory.find(x=>x.id===eq.armor)?.type==='armor'?eq.armor:null,ring=ids.has(eq.ring)&&inventory.find(x=>x.id===eq.ring)?.type==='ring'?eq.ring:null;
  const petSkills={};
  for(const pet of PET_IDS){const valid=new Set(PET_TREES[pet].map(x=>x.id)),list=Array.isArray(src.petSkills?.[pet])?src.petSkills[pet].filter(id=>valid.has(id)):[];petSkills[pet]=PET_TREES[pet].filter(x=>list.includes(x.id)).map(x=>x.id);}
  return {...base,inventory,equipped:{gems,armor,ring},petSkills};
}

export function skillPointBudget(level=1){return Math.max(0,clamp(Math.round(Number(level)||1),1,50)-1);}
export function spentSkillPoints(rpg){const clean=cleanRpg(rpg);let sum=0;for(const pet of PET_IDS){const owned=new Set(clean.petSkills[pet]);for(const node of PET_TREES[pet])if(owned.has(node.id))sum+=node.cost;}return sum;}
export function availableSkillPoints(level,rpg){return Math.max(0,skillPointBudget(level)-spentSkillPoints(rpg));}

export function canUnlockPetSkill(pet,nodeId,level,rpg){
  const tree=PET_TREES[pet]||[],at=tree.findIndex(x=>x.id===nodeId);if(at<0)return false;const clean=cleanRpg(rpg),owned=new Set(clean.petSkills[pet]);if(owned.has(nodeId))return false;if(at>0&&!owned.has(tree[at-1].id))return false;return availableSkillPoints(level,clean)>=tree[at].cost;
}

export function unlockPetSkill(pet,nodeId,level,rpg){const clean=cleanRpg(rpg);if(!canUnlockPetSkill(pet,nodeId,level,clean))return clean;clean.petSkills[pet]=[...clean.petSkills[pet],nodeId];return clean;}
export function resetPetSkills(rpg){const clean=cleanRpg(rpg);clean.petSkills={fox:[],owl:[],dragon:[]};return clean;}

export function petSkillEffects(pet,rpg){
  const clean=cleanRpg(rpg),owned=new Set(clean.petSkills?.[pet]||[]),out={firstCardAmp:0,chaseAmp:0,redAmp:0,oneAccuracy:0,guardHeal:0,stableAmp:0,yellowAmp:0,finisherAmp:0,hpPct:0,atkPct:0,defPct:0,crit:0};
  if(pet==='fox'){
    if(owned.has('fox-1'))out.firstCardAmp+=.05;if(owned.has('fox-2'))out.chaseAmp+=.10;if(owned.has('fox-3'))out.redAmp+=.05;if(owned.has('fox-4'))out.crit+=.04;if(owned.has('fox-5')){out.firstCardAmp+=.10;out.chaseAmp+=.15;}
  }
  if(pet==='owl'){
    if(owned.has('owl-1'))out.oneAccuracy+=.05;if(owned.has('owl-2'))out.guardHeal+=.02;if(owned.has('owl-3'))out.stableAmp+=.05;if(owned.has('owl-4'))out.oneAccuracy+=.10;if(owned.has('owl-5')){out.hpPct+=.05;out.guardHeal+=.04;}
  }
  if(pet==='dragon'){
    if(owned.has('dragon-1'))out.yellowAmp+=.04;if(owned.has('dragon-2'))out.finisherAmp+=.05;if(owned.has('dragon-3'))out.atkPct+=.04;if(owned.has('dragon-4'))out.yellowAmp+=.06;if(owned.has('dragon-5')){out.finisherAmp+=.10;out.crit+=.03;}
  }
  return out;
}

export function equipmentBonuses(rpg){
  const clean=cleanRpg(rpg),byId=new Map(clean.inventory.map(x=>[x.id,x])),ids=[...clean.equipped.gems,clean.equipped.armor,clean.equipped.ring].filter(Boolean),out={hpPct:0,atkPct:0,defPct:0,crit:0};
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

export function addLoot(rpg,item){const clean=cleanRpg(rpg),normalized=normalizeItem(item);if(!normalized)return clean;clean.inventory=[...clean.inventory,normalized].slice(-60);return cleanRpg(clean);}
export function equipItem(rpg,itemId){const clean=cleanRpg(rpg),item=clean.inventory.find(x=>x.id===itemId);if(!item)return clean;if(item.type==='gem'){const gems=clean.equipped.gems.filter(id=>id!==itemId);if(gems.length>=3)return clean;clean.equipped.gems=[...gems,itemId];}else if(item.type==='armor')clean.equipped.armor=itemId;else if(item.type==='ring')clean.equipped.ring=itemId;return cleanRpg(clean);}
export function unequipItem(rpg,itemId){const clean=cleanRpg(rpg);clean.equipped.gems=clean.equipped.gems.filter(id=>id!==itemId);if(clean.equipped.armor===itemId)clean.equipped.armor=null;if(clean.equipped.ring===itemId)clean.equipped.ring=null;return cleanRpg(clean);}
export function itemBonusText(item){const b=item?.bonuses||{},parts=[];if(b.hpPct)parts.push(`生命 +${Math.round(b.hpPct*100)}%`);if(b.atkPct)parts.push(`攻擊 +${Math.round(b.atkPct*100)}%`);if(b.defPct)parts.push(`防禦 +${Math.round(b.defPct*100)}%`);if(b.crit)parts.push(`爆擊 +${Math.round(b.crit*100)}%`);return parts.join(' · ');}
