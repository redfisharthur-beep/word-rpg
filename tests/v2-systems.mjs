import assert from 'node:assert/strict';
import {GAME_ROLES,GAME_PETS,GAME_STAGES,TOWER_RULES,COLLECTION_REWARDS,SEASON_TIERS,EQUIPMENT_VALUES} from '../src/generated/game-data.js';
import {progressionStats,dealHand} from '../src/cards.js';
import {emptyRpg,cleanRpg,collectionEntries,maxedPkRpg,skillPointBudget} from '../src/rpg.js';

assert.deepEqual(Object.keys(GAME_ROLES).sort(),['archer','mage','warrior']);
assert.deepEqual(Object.keys(GAME_PETS).sort(),['dragon','fox','owl']);
assert.equal(GAME_STAGES.length,5,'Adventure must contain 5 stages');
assert.equal(GAME_STAGES[2].id,'bubble','Bubble monster must be stage 3');
assert.equal(GAME_STAGES[4].id,'shadow','Shadow King must be the final boss');

for(const id of ['warrior','mage','archer']){
  const u=GAME_ROLES[id].ultimate;
  assert.ok(u?.name,`${id} ultimate name missing`);
  assert.ok(Number(u?.mult)>0||Array.isArray(u?.hits),`${id} ultimate power missing`);
}
for(const id of ['fox','owl','dragon'])assert.ok(GAME_PETS[id]?.awakening?.name,`${id} awakening missing`);

for(const floor of ['5','10','15','20'])assert.ok(TOWER_RULES[floor],`Tower milestone ${floor} missing`);
assert.deepEqual(COLLECTION_REWARDS.map(x=>x.count),[10,20,30]);
assert.deepEqual(SEASON_TIERS.map(x=>x.id),['legend','gold','silver','bronze']);
assert.ok(EQUIPMENT_VALUES.mythic.warbreaker.atk>0);

const rpg=cleanRpg(emptyRpg());
const stats=progressionStats('warrior','fox',1,rpg).total;
assert.ok(stats.maxHp>0&&stats.atk>0&&stats.def>0);
for(const level of [1,9,10,29]){
  const hand=dealHand(9,'warrior',level);
  assert.equal(hand.length,9);
  assert.equal(hand.filter(x=>x.exclusive).length,1,`Lv.${level} should deal exactly 1 exclusive card`);
}
for(const level of [30,40,50,79,80]){
  const hand=dealHand(9,'warrior',level);
  assert.equal(hand.length,9);
  assert.equal(hand.filter(x=>x.exclusive).length,2,`Lv.${level} should deal exactly 2 exclusive cards`);
}
assert.equal(collectionEntries().length,30,'Collection should contain 30 equipment discoveries');
assert.ok(progressionStats('warrior','fox',80,rpg).total.atk>progressionStats('warrior','fox',50,rpg).total.atk,'Level 80 must scale above level 50');
assert.equal(progressionStats('warrior','fox',999,rpg).level,80,'Growth must cap at level 80');
assert.equal(skillPointBudget(80),79,'Level 80 skill-point budget must be 79');
const pk=maxedPkRpg();
assert.equal(pk.inventory.length,6,'PK must have six max-quality equipment items');
assert.ok(pk.inventory.every(item=>item.quality==='mythic'),'PK equipment must be mythic');
assert.deepEqual(pk.petEnhance,{fox:4,owl:4,dragon:4},'PK pets must be fully enhanced');
assert.ok(Object.values(pk.petSkills).every(skills=>skills.length>0),'PK pet skills must be unlocked');

console.log('v2 systems ok');
