import {COLLECTION_REWARDS,SEASON_TIERS,TOWER_RULES} from './generated/game-data.js';

const WEAKNESS_KEY='word-rpg-weakness-v1';
const SEASON_KEY='word-rpg-season-v1';
const dayKey=()=>new Date(Date.now()+8*60*60*1000).toISOString().slice(0,10);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function load(key,fallback){try{return {...fallback,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{return {...fallback}}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}

export function weaknessState(){const raw=load(WEAKNESS_KEY,{items:{}}),items=raw.items&&typeof raw.items==='object'?raw.items:{};return {items};}
export function recordQuestionResult(question,correct){if(!question||!Number.isInteger(question.wordIndex))return;const state=weaknessState(),key=String(question.wordIndex),old=state.items[key]||{index:question.wordIndex,word:question.word||'',answer:question.answer||'',wrong:0,streak:0,lastWrong:'',lastSeen:''};old.word=question.word||old.word;old.answer=question.answer||old.answer;old.lastSeen=dayKey();if(correct){old.streak=(old.streak||0)+1;if(old.streak>=3)delete state.items[key];else state.items[key]=old}else{old.wrong=(old.wrong||0)+1;old.streak=0;old.lastWrong=dayKey();state.items[key]=old}save(WEAKNESS_KEY,state)}
export function weaknessCandidates(limit=2){const today=dayKey(),items=Object.values(weaknessState().items).filter(x=>x.lastWrong&&x.lastWrong<today);items.sort((a,b)=>(b.wrong-a.wrong)||String(a.lastSeen).localeCompare(String(b.lastSeen)));return items.slice(0,Math.max(0,limit)).map(x=>x.index).filter(Number.isInteger)}
export function weaknessSummary(limit=8){return Object.values(weaknessState().items).sort((a,b)=>(b.wrong-a.wrong)||(a.streak-b.streak)).slice(0,limit)}

export function collectionUnlocks(owned=0){return (COLLECTION_REWARDS||[]).map(x=>({...x,unlocked:owned>=x.count}))}
export function collectionCosmetics(owned=0){const unlocked=collectionUnlocks(owned).filter(x=>x.unlocked),ids=new Set(unlocked.map(x=>x.id));return {frame:ids.has('frame')?'收藏家角色框':null,background:ids.has('background')?'秘藏戰鬥背景':null,title:ids.has('title')?'萬象收藏家':null,idleFx:ids.has('title')?'收藏星芒':null}}

function currentSeasonId(){const d=new Date(Date.now()+8*60*60*1000);return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`}
export function seasonState(){const raw=load(SEASON_KEY,{season:currentSeasonId(),points:0,wins:0,losses:0,draws:0});if(raw.season!==currentSeasonId())return {season:currentSeasonId(),points:0,wins:0,losses:0,draws:0};return {season:raw.season,points:Math.max(0,Math.round(raw.points||0)),wins:Math.max(0,Math.round(raw.wins||0)),losses:Math.max(0,Math.round(raw.losses||0)),draws:Math.max(0,Math.round(raw.draws||0))}}
export function seasonTier(points=0){const list=[...(SEASON_TIERS||[])].sort((a,b)=>b.min-a.min);return list.find(x=>points>=x.min)||list[list.length-1]||{id:'bronze',name:'青銅',min:0,reward:'參賽徽記'};}
export function recordSeasonResult(input){
  if(input&&typeof input==='object'&&input.server){const raw=input.server,s={season:String(raw.season||currentSeasonId()),points:Math.max(0,Math.round(raw.points||0)),wins:Math.max(0,Math.round(raw.wins||0)),losses:Math.max(0,Math.round(raw.losses||0)),draws:Math.max(0,Math.round(raw.draws||0))};save(SEASON_KEY,s);return {...s,tier:seasonTier(s.points)}}
  const result=typeof input==='string'?input:String(input?.result||'draw'),s=seasonState();if(result==='win'){s.wins++;s.points+=18}else if(result==='loss'){s.losses++;s.points=Math.max(0,s.points-8)}else{s.draws++;s.points+=4}save(SEASON_KEY,s);return {...s,tier:seasonTier(s.points)}
}
export function seasonView(){const s=seasonState();return {...s,tier:seasonTier(s.points)}}

export function towerRule(floor=1){return TOWER_RULES?.[String(floor)]||null}
export function applyTowerRuleAtStart(player,enemy,floor=1){const rule=towerRule(floor);if(!rule)return null;if(rule.critBonus){player.crit=clamp((player.crit||0)+rule.critBonus,0,.9);enemy.crit=clamp((enemy.crit||0)+rule.critBonus,0,.9)}if(rule.enemyAtkAmp)enemy.atk*=1+rule.enemyAtkAmp;if(rule.enemyCritBonus)enemy.crit=clamp((enemy.crit||0)+rule.enemyCritBonus,0,.9);if(rule.enemyShieldPct)enemy.shield=Math.round((enemy.shield||0)+(enemy.maxHp||0)*rule.enemyShieldPct);return rule}
export function towerHealMultiplier(floor=1){const rule=towerRule(floor);return 1-(rule?.healPenalty||0)}
export function towerFirstCardMultiplier(floor=1){const rule=towerRule(floor);return 1+(rule?.firstCardAmp||0)}
