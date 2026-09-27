import assert from 'node:assert/strict';
import {
  emptyRpg,cleanRpg,addLoot,enhanceEquipment,equipmentEnhanceInfo,equipmentBonuses,equipItem,
  maxedPkRpg,crystallizeItem,mythicEquipmentEffects,itemBonusText
} from '../src/rpg.js';
import {makeFighter,resolveAutoBasic} from '../src/cards.js';

const item=(quality,id,subtype='ruby',type='gem')=>({id,type,subtype,quality});
const chance=(quality,level)=>equipmentEnhanceInfo({...item(quality,'rate-'+quality+'-'+level),enhance:level}).chance;

// Only epic, legendary and mythic gear can be enhanced.
for(const quality of ['common','rare']){
  const info=equipmentEnhanceInfo(item(quality,'locked-'+quality));
  assert.equal(info.eligible,false);
  assert.equal(info.cost,0);
  assert.equal(info.chance,0);
  let r=addLoot(emptyRpg(),item(quality,'locked-'+quality));r.crystals=999;
  const result=enhanceEquipment(r,'locked-'+quality,()=>0);
  assert.equal(result.ok,false);
  assert.equal(result.reason,'史詩以上裝備才可強化');
  assert.equal(result.rpg.crystals,999,'locked quality must not consume crystals');
  assert.equal(result.rpg.inventory[0].enhance,0,'common/rare saves cannot retain enhancement levels');
}

// Requested success-rate table. Level means current level; chance is for the next target level.
assert.deepEqual([0,1,2,3,4,5,6,7,8,9].map(level=>chance('epic',level)),[.90,.90,.90,.80,.80,.80,.70,.70,.70,.50]);
assert.deepEqual([0,1,2,3,4,5,6,7,8,9].map(level=>chance('legendary',level)),[.80,.80,.80,.70,.70,.70,.60,.60,.60,.40]);
assert.deepEqual([0,1,2,3,4,5,6,7,8,9].map(level=>chance('mythic',level)),[.70,.70,.70,.60,.60,.60,.50,.50,.50,.30]);

// Cost remains quality-scaled.
assert.deepEqual(['epic','legendary','mythic'].map((quality,i)=>equipmentEnhanceInfo(item(quality,'q'+i)).cost),[5,8,12]);
assert.deepEqual(['epic','legendary','mythic'].map((quality,i)=>equipmentEnhanceInfo({...item(quality,'q'+i),enhance:9}).cost),[50,80,120]);

// +4, +7 and +9 are large base-stat milestones.
function atkAt(level){
  let r=addLoot(emptyRpg(),{...item('epic','milestone-'+level),enhance:level});
  r=equipItem(r,'milestone-'+level);
  return equipmentBonuses(r).atkPct;
}
const atk=[0,1,2,3,4,5,6,7,8,9,10].map(atkAt);
assert.ok(atk[4]-atk[3] > atk[3]-atk[2]*.999,'+4 has a visibly larger stat jump');
assert.ok(atk[7]-atk[6] > atk[6]-atk[5]*.999,'+7 has a visibly larger stat jump');
assert.ok(atk[9]-atk[8] > atk[8]-atk[7]*.999,'+9 has a visibly larger stat jump');
assert.ok(atk[10]>atk[9],'+10 continues increasing base stats');

// Success, downgrade, pity and +10 cap still work.
let r=addLoot(emptyRpg(),item('epic','a'));r.crystals=10000;r=equipItem(r,'a');
const base=equipmentBonuses(r).atkPct;
let result=enhanceEquipment(r,'a',()=>0);
assert.equal(result.ok,true);assert.equal(result.success,true);assert.equal(result.after,1);
r=result.rpg;assert.ok(equipmentBonuses(r).atkPct>base,'enhancement boosts equipped combat bonuses');
result=enhanceEquipment(r,'a',()=>1);
assert.equal(result.success,false);assert.equal(result.before,1);assert.equal(result.after,0,'failed enhancement reduces level by one');
r=result.rpg;for(let n=0;n<10;n++){result=enhanceEquipment(r,'a',()=>0);assert.equal(result.after,n+1);r=result.rpg}
assert.equal(r.inventory[0].enhance,10);
const atMax=enhanceEquipment(r,'a',()=>0);assert.equal(atMax.ok,false);assert.equal(atMax.rpg.crystals,r.crystals,'no crystals spent at +10');
assert.equal(equipmentEnhanceInfo(r.inventory[0]).cost,0);

let scarce=addLoot(emptyRpg(),item('mythic','m'));scarce.crystals=1;
result=enhanceEquipment(scarce,'m',()=>0);assert.equal(result.ok,false);assert.equal(result.reason,'結晶不足');

let pity=addLoot(emptyRpg(),item('mythic','pity'));pity.crystals=10000;
const chance0=equipmentEnhanceInfo(pity.inventory[0]).chance;
for(let n=1;n<=20;n++){
  const attempt=enhanceEquipment(pity,'pity',()=>1);
  assert.equal(attempt.success,false);
  pity=attempt.rpg;
  assert.equal(pity.inventory[0].enhanceFailures,n);
  assert.ok(Math.abs(equipmentEnhanceInfo(pity.inventory[0]).chance-(chance0+Math.min(n,20)*.02))<1e-10);
}
assert.equal(equipmentEnhanceInfo(pity.inventory[0]).chance,Math.min(1,chance0+.40));
const completed=enhanceEquipment(pity,'pity',()=>0);
assert.equal(completed.success,true);
assert.equal(completed.rpg.inventory[0].enhanceFailures,0);

// +10 grants a strong, visible and functional affix to epic+ gear.
let ruby10=addLoot(emptyRpg(),{...item('epic','ruby10'),enhance:10});
ruby10=equipItem(ruby10,'ruby10');
assert.match(itemBonusText(ruby10.inventory[0]),/\+10·赤曜霸體/);
const rubyFx=mythicEquipmentEffects(ruby10);
assert.equal(rubyFx.damageAmp,.20);
assert.equal(rubyFx.lifesteal,.10);

let guardian10=addLoot(emptyRpg(),{...item('epic','guardian10','guardian','armor'),enhance:10});
guardian10=equipItem(guardian10,'guardian10');
const guardianFx=mythicEquipmentEffects(guardian10);
assert.equal(guardianFx.startShieldPct,.30);
assert.equal(guardianFx.blockChance,.12);
const guarded=makeFighter({maxHp:1000,hp:1000,atk:100,def:100,crit:0,rpg:guardian10});
assert.equal(guarded.shield,300,'+10 guardian affix applies its starting shield in real combat');

let warbreaker10=addLoot(emptyRpg(),{...item('epic','war10','warbreaker','ring'),enhance:10});
warbreaker10=equipItem(warbreaker10,'war10');
const warFx=mythicEquipmentEffects(warbreaker10);
assert.equal(warFx.damageAmp,.25);
assert.equal(warFx.defPenPct,.20);
const attacker=makeFighter({maxHp:1000,hp:1000,atk:100,def:0,crit:0,rpg:warbreaker10});
const target=makeFighter({maxHp:1000,hp:1000,atk:1,def:100,crit:0,rpg:emptyRpg()});
const hpBefore=target.hp;
resolveAutoBasic(attacker,target);
assert.ok(target.hp<hpBefore,'+10 damage/penetration affix changes real combat damage');

// Save normalization and PK still retain max epic+ enhancement.
const encoded=JSON.parse(JSON.stringify(r));assert.equal(cleanRpg(encoded).inventory[0].enhance,10);
const invalid=cleanRpg({...r,inventory:[{...r.inventory[0],enhance:900}]});assert.equal(invalid.inventory[0].enhance,10);
const pk=maxedPkRpg();assert.equal(pk.inventory.length,6);assert.ok(pk.inventory.every(gear=>gear.enhance===10),'PK has maxed enhancement for both players');

const crystals=crystallizeItem(r,'a');assert.equal(crystals.inventory.length,1,'equipped upgraded items cannot be crystallized');
console.log('Equipment upgrade: epic+ gate, requested rates, milestone stats, pity, +10 affixes and PK normalization: PASS');
