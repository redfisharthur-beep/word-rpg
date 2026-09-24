import assert from 'node:assert/strict';
import {cleanDaily,recordDaily,claimQuest,claimAchievement,claimDailyChest,recordTowerBest,DAILY_QUESTS,WEEKLY_QUESTS,LIFETIME_QUESTS,LEARNING_ACHIEVEMENTS,claimWeeklyQuest,claimLifetimeQuest,weekId,dayId} from '../src/daily.js';
const today=Date.parse('2026-09-23T15:59:00Z'),tomorrow=Date.parse('2026-09-23T16:01:00Z');
let daily=cleanDaily({},today);
daily=recordDaily(daily,'correct',20,today);
daily=recordDaily(daily,'adventure',3,today);
daily=recordDaily(daily,'pk',1,today);
daily=recordDaily(daily,'tower',1,today);
daily=recordTowerBest(daily,20,today);
for(const quest of DAILY_QUESTS){
  const result=claimQuest(daily,quest.id,today);assert.equal(result.reward,quest.reward);
  daily=result.state;assert.equal(claimQuest(daily,quest.id,today).reward,0,'quest rewards cannot be claimed twice');
}
assert.equal(claimDailyChest(daily,today).granted,true);
daily=claimDailyChest(daily,today).state;
assert.equal(claimDailyChest(daily,today).granted,false,'daily chest can only be claimed once');
const achievement=claimAchievement(daily,'tower-20',today);
assert.equal(achievement.title,'登塔宗師');daily=achievement.state;
daily=cleanDaily(daily,tomorrow);
assert.equal(daily.counts.correct,0);assert.equal(daily.claimed.length,0);assert.equal(daily.bonusClaimed,false);
assert.equal(daily.totals.towerBest,20);assert.equal(daily.activeTitle,'登塔宗師');
assert.equal(claimAchievement(daily,'tower-20',tomorrow).reward,0,'achievement claims persist across days');

assert.ok(LEARNING_ACHIEVEMENTS.length>=16,'new permanent title achievements must be available');
assert.equal(new Set(LEARNING_ACHIEVEMENTS.map(a=>a.title)).size,LEARNING_ACHIEVEMENTS.length,'achievement titles must be unique');
const weekStart=Date.parse('2026-09-20T16:00:00Z'); // Monday 00:00 Taiwan
assert.equal(weekId(weekStart),'2026-09-21');
assert.equal(weekId(weekStart-1),'2026-09-14','week resets exactly at Taiwan Monday midnight');
let mission=cleanDaily({},weekStart);
mission=recordDaily(mission,'correct',200,weekStart);
mission=recordDaily(mission,'adventure',100,weekStart);
mission=recordDaily(mission,'pk',50,weekStart);
mission=recordDaily(mission,'tower',5,weekStart);
mission=recordTowerBest(mission,10,weekStart);
for(const q of WEEKLY_QUESTS){const result=claimWeeklyQuest(mission,q.id,weekStart);assert.equal(result.reward,q.reward);mission=result.state;assert.equal(claimWeeklyQuest(mission,q.id,weekStart).reward,0,'weekly rewards cannot be repeated');}
for(const q of LIFETIME_QUESTS.filter(q=>mission.totals[q.key]>=q.target)){const result=claimLifetimeQuest(mission,q.id,weekStart);assert.equal(result.reward,q.reward);mission=result.state;assert.equal(claimLifetimeQuest(mission,q.id,weekStart).reward,0,'lifetime rewards cannot be repeated');}
const nextDay=weekStart+24*60*60*1000;
const afterDay=cleanDaily(mission,nextDay);
assert.equal(afterDay.weekCounts.correct,200,'weekly progress persists on Tuesday');
assert.equal(afterDay.weeklyClaimed.length,WEEKLY_QUESTS.length,'weekly claims persist until next Monday');
const nextMonday=weekStart+7*24*60*60*1000;
const afterWeek=cleanDaily(mission,nextMonday);
assert.equal(afterWeek.weekCounts.correct,0,'weekly progress resets Monday');
assert.equal(afterWeek.weeklyClaimed.length,0,'weekly rewards reset Monday');
assert.equal(afterWeek.totals.correct,200,'lifetime progress persists through weekly reset');
assert.equal(afterWeek.lifetimeClaimed.length,mission.lifetimeClaimed.length,'lifetime claims never reset');
const legacy=cleanDaily({date:dayId(weekStart),counts:{correct:20},totals:{correct:20},claimed:['correct']},weekStart);
assert.equal(legacy.totals.correct,20,'legacy daily save remains compatible');
console.log('P3 daily quests, rewards, chest, rollover and achievements: PASS');
