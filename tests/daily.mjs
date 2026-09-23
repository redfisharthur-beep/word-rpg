import assert from 'node:assert/strict';
import {cleanDaily,recordDaily,claimQuest,claimAchievement,claimDailyChest,recordTowerBest,DAILY_QUESTS} from '../src/daily.js';
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
console.log('P3 daily quests, rewards, chest, rollover and achievements: PASS');
