// Small, serializable daily progression shared by the Web client and Worker.
// All timestamps are grouped by the existing Taiwan game-day boundary.
export const dayId=(now=Date.now())=>new Date(now+8*60*60*1000).toISOString().slice(0,10);
// Weekly periods start Monday 00:00 Asia/Taipei.
export const weekId=(now=Date.now())=>{const d=new Date(dayId(now)+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10)};
export const DAILY_QUESTS=[
  {id:'adventure',name:'冒險三場',target:3,reward:5,desc:'完成三場冒險'},
  {id:'correct',name:'英文練功',target:20,reward:10,desc:'答對 20 題單字'},
  {id:'pk',name:'競技挑戰',target:1,reward:8,desc:'完成一場 PK'},
  {id:'tower',name:'登塔試煉',target:1,reward:12,desc:'成功通過一層試煉塔'}
];
export const WEEKLY_QUESTS=[
  {id:'correct-week',name:'每週單字特訓',key:'correct',target:100,reward:80,desc:'本週答對 100 題'},
  {id:'adventure-week',name:'每週冒險挑戰',key:'adventure',target:15,reward:75,desc:'本週完成 15 場冒險'},
  {id:'pk-week',name:'競技週試煉',key:'pk',target:5,reward:100,desc:'本週完成 5 場 PK'},
  {id:'tower-week',name:'登塔週挑戰',key:'tower',target:5,reward:100,desc:'本週通過 5 層試煉塔'}
];
export const LIFETIME_QUESTS=[
  {id:'correct-life-200',name:'單字百鍊',key:'correct',target:200,reward:120,desc:'累積答對 200 題'},
  {id:'correct-life-1000',name:'千字修行',key:'correct',target:1000,reward:450,desc:'累積答對 1000 題'},
  {id:'adventure-life-100',name:'百戰冒險',key:'adventure',target:100,reward:300,desc:'累積完成 100 場冒險'},
  {id:'pk-life-50',name:'競技傳奇',key:'pk',target:50,reward:350,desc:'累積完成 50 場 PK'},
  {id:'tower-life-10',name:'登塔遠征',key:'towerBest',target:10,reward:200,desc:'試煉塔最高通過 10 層'}
];
export const LEARNING_ACHIEVEMENTS=[
  {id:'words-100',name:'識字冒險者',desc:'累積答對 100 題',key:'correct',target:100,reward:150,title:'識字冒險者'},
  {id:'words-500',name:'單字達人',desc:'累積答對 500 題',key:'correct',target:500,reward:400,title:'單字達人'},
  {id:'wins-30',name:'百戰勇者',desc:'冒險勝利 30 場',key:'adventure',target:30,reward:300,title:'百戰勇者'},
  {id:'tower-20',name:'登塔宗師',desc:'試煉塔通關 20 層',key:'towerBest',target:20,reward:600,title:'登塔宗師'},
  {id:'words-30',name:'識字新星',desc:'累積答對 30 題',key:'correct',target:30,reward:40,title:'識字新星'},
  {id:'words-300',name:'文字旅人',desc:'累積答對 300 題',key:'correct',target:300,reward:180,title:'文字旅人'},
  {id:'words-1000',name:'千字賢者',desc:'累積答對 1000 題',key:'correct',target:1000,reward:650,title:'千字賢者'},
  {id:'words-3000',name:'萬卷學者',desc:'累積答對 3000 題',key:'correct',target:3000,reward:1000,title:'萬卷學者'},
  {id:'wins-10',name:'冒險先鋒',desc:'完成 10 場冒險',key:'adventure',target:10,reward:70,title:'冒險先鋒'},
  {id:'wins-100',name:'百戰英雄',desc:'完成 100 場冒險',key:'adventure',target:100,reward:650,title:'百戰英雄'},
  {id:'wins-300',name:'不敗傳說',desc:'完成 300 場冒險',key:'adventure',target:300,reward:1200,title:'不敗傳說'},
  {id:'pk-10',name:'競技新秀',desc:'完成 10 場 PK',key:'pk',target:10,reward:90,title:'競技新秀'},
  {id:'pk-50',name:'競技戰將',desc:'完成 50 場 PK',key:'pk',target:50,reward:400,title:'競技戰將'},
  {id:'pk-200',name:'競技王者',desc:'完成 200 場 PK',key:'pk',target:200,reward:1000,title:'競技王者'},
  {id:'tower-5',name:'登塔勇者',desc:'試煉塔最高通過 5 層',key:'towerBest',target:5,reward:120,title:'登塔勇者'},
  {id:'tower-10',name:'雲端行者',desc:'試煉塔最高通過 10 層',key:'towerBest',target:10,reward:300,title:'雲端行者'}
];
const keys=['adventure','correct','pk','tower'];
const counter=(obj,key)=>Math.max(0,Math.min(10000000,Math.floor(Number(obj?.[key])||0)));
export function cleanDaily(raw={},now=Date.now()){
  const today=dayId(now),week=weekId(now),same=raw?.date===today,sameWeek=raw?.weekDate===week;
  const counts={},weekCounts={},totals={};
  for(const key of keys){
    counts[key]=same?counter(raw?.counts,key):0;
    weekCounts[key]=sameWeek?counter(raw?.weekCounts,key):0;
    totals[key]=counter(raw?.totals,key);
  }
  totals.towerBest=counter(raw?.totals,'towerBest');
  const unique=(value,ids)=>Array.isArray(value)?[...new Set(value)].filter(id=>ids.includes(id)):[];
  return {
    date:today,weekDate:week,counts,weekCounts,totals,
    claimed:same?unique(raw?.claimed,DAILY_QUESTS.map(x=>x.id)):[],
    weeklyClaimed:sameWeek?unique(raw?.weeklyClaimed,WEEKLY_QUESTS.map(x=>x.id)):[],
    lifetimeClaimed:unique(raw?.lifetimeClaimed,LIFETIME_QUESTS.map(x=>x.id)),
    achievementClaims:unique(raw?.achievementClaims,LEARNING_ACHIEVEMENTS.map(x=>x.id)),
    activeTitle:typeof raw?.activeTitle==='string'?raw.activeTitle.slice(0,32):'',
    bonusClaimed:same&&raw?.bonusClaimed===true
  };
}
export function recordDaily(raw,key,amount=1,now=Date.now()){
  const state=cleanDaily(raw,now);if(!keys.includes(key))return state;
  const n=Math.max(0,Math.min(1000,Math.round(Number(amount)||0)));
  state.counts[key]+=n;state.weekCounts[key]+=n;state.totals[key]+=n;return state;
}
export function claimWeeklyQuest(raw,id,now=Date.now()){
  const state=cleanDaily(raw,now),quest=WEEKLY_QUESTS.find(x=>x.id===id);
  if(!quest||state.weeklyClaimed.includes(id)||state.weekCounts[quest.key]<quest.target)return {state,reward:0};
  state.weeklyClaimed.push(id);return {state,reward:quest.reward};
}
export function claimLifetimeQuest(raw,id,now=Date.now()){
  const state=cleanDaily(raw,now),quest=LIFETIME_QUESTS.find(x=>x.id===id);
  if(!quest||state.lifetimeClaimed.includes(id)||state.totals[quest.key]<quest.target)return {state,reward:0};
  state.lifetimeClaimed.push(id);return {state,reward:quest.reward};
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
