// Small, serializable daily progression shared by the Web client and Worker.
// All timestamps are grouped by the existing Taiwan game-day boundary.
export const dayId=(now=Date.now())=>new Date(now+8*60*60*1000).toISOString().slice(0,10);
export const DAILY_QUESTS=[
  {id:'adventure',name:'冒險三場',target:3,reward:5,desc:'完成三場冒險'},
  {id:'correct',name:'英文練功',target:20,reward:10,desc:'答對 20 題單字'},
  {id:'pk',name:'競技挑戰',target:1,reward:8,desc:'完成一場 PK'},
  {id:'tower',name:'登塔試煉',target:1,reward:12,desc:'成功通過一層試煉塔'}
];
export const LEARNING_ACHIEVEMENTS=[
  {id:'words-100',name:'識字冒險者',desc:'累積答對 100 題',key:'correct',target:100,reward:150,title:'識字冒險者'},
  {id:'words-500',name:'單字達人',desc:'累積答對 500 題',key:'correct',target:500,reward:400,title:'單字達人'},
  {id:'wins-30',name:'百戰勇者',desc:'冒險勝利 30 場',key:'adventure',target:30,reward:300,title:'百戰勇者'},
  {id:'tower-20',name:'登塔宗師',desc:'試煉塔通關 20 層',key:'towerBest',target:20,reward:600,title:'登塔宗師'}
];
const keys=['adventure','correct','pk','tower'];
const counter=(obj,key)=>Math.max(0,Math.min(10000000,Math.floor(Number(obj?.[key])||0)));
export function cleanDaily(raw={},now=Date.now()){
  const today=dayId(now),same=raw?.date===today,counts={},totals={};
  for(const key of keys){counts[key]=same?counter(raw?.counts,key):0;totals[key]=counter(raw?.totals,key)}
  totals.towerBest=counter(raw?.totals,'towerBest');
  const ids=DAILY_QUESTS.map(q=>q.id),achievements=LEARNING_ACHIEVEMENTS.map(q=>q.id);
  return {date:today,counts,totals,claimed:same&&Array.isArray(raw?.claimed)?[...new Set(raw.claimed)].filter(x=>ids.includes(x)):[],achievementClaims:Array.isArray(raw?.achievementClaims)?[...new Set(raw.achievementClaims)].filter(x=>achievements.includes(x)):[],activeTitle:typeof raw?.activeTitle==='string'?raw.activeTitle.slice(0,32):'',bonusClaimed:same&&raw?.bonusClaimed===true};
}
export function recordDaily(raw,key,amount=1,now=Date.now()){
  const state=cleanDaily(raw,now);if(!keys.includes(key))return state;
  const n=Math.max(0,Math.min(1000,Math.round(Number(amount)||0)));
  state.counts[key]+=n;state.totals[key]+=n;return state;
}
export function recordTowerBest(raw,floor,now=Date.now()){
  const state=cleanDaily(raw,now);state.totals.towerBest=Math.max(state.totals.towerBest,counter({floor},'floor'));return state;
}
export function claimQuest(raw,id,now=Date.now()){
  const state=cleanDaily(raw,now),quest=DAILY_QUESTS.find(q=>q.id===id);
  if(!quest||state.claimed.includes(id)||state.counts[id]<quest.target)return {state,reward:0};
  state.claimed.push(id);return {state,reward:quest.reward};
}
export function claimAchievement(raw,id,now=Date.now()){
  const state=cleanDaily(raw,now),achievement=LEARNING_ACHIEVEMENTS.find(q=>q.id===id);
  if(!achievement||state.achievementClaims.includes(id)||state.totals[achievement.key]<achievement.target)return {state,reward:0};
  state.achievementClaims.push(id);state.activeTitle=achievement.title;
  return {state,reward:achievement.reward,title:achievement.title};
}

export function claimDailyChest(raw,now=Date.now()){
  const state=cleanDaily(raw,now);
  if(state.bonusClaimed||DAILY_QUESTS.some(q=>!state.claimed.includes(q.id)))return {state,granted:false};
  state.bonusClaimed=true;return {state,granted:true};
}
