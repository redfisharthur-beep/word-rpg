import assert from 'node:assert/strict';
import {emptyRpg,cleanRpg,rollLoot,rollMythicLoot,addLoot,equipItem,synthesisInfo,synthesizeItem,equipmentResonance,collectionEntries,collectionProgress,crystallizeItem,petSkillEffects,recordTowerFloor,mythicEquipmentEffects,itemBonusText,mythicAbilityText} from '../src/rpg.js';
import {makeFighter,resolveCardAction,resolveAutoBasic} from '../src/cards.js';
const seq=vals=>{let i=0;return ()=>vals[Math.min(i++,vals.length-1)]};
const loot=(q=.1,type=.1,sub=.1)=>rollLoot(3,50,seq([0,q,type,sub]));
assert.equal(collectionEntries().length,30);
let r=emptyRpg();const a=loot(),b=loot(),c=loot();r=addLoot(addLoot(addLoot(r,a),b),c);assert.equal(collectionProgress(r).owned,1);assert.equal(synthesisInfo(r,a.id).can,true);r=synthesizeItem(r,a.id);assert.equal(r.inventory.filter(x=>x.subtype==='ruby'&&x.quality==='rare').length,1);assert.ok(r.collection.includes('gem:ruby:common'));assert.ok(r.collection.includes('gem:ruby:rare'));
let keep=emptyRpg();const t=loot(.1,.1,.9);keep=addLoot(keep,t);const key=`${t.type}:${t.subtype}:${t.quality}`;keep=crystallizeItem(keep,t.id);assert.ok(keep.collection.includes(key));
let res=emptyRpg();const r1=loot(),r2=loot(),wr=loot(.1,.9,.1);for(const x of [r1,r2,wr])res=addLoot(res,x);res=equipItem(res,r1.id);res=equipItem(res,r2.id);res=equipItem(res,wr.id);assert.equal(equipmentResonance(res).firstCardAmp,.12);
const base=makeFighter({maxHp:500,hp:500,atk:100,def:50,crit:0,role:'mage',pet:null,rpg:emptyRpg()}),boosted=makeFighter({maxHp:500,hp:500,atk:100,def:50,crit:0,role:'mage',pet:null,rpg:res}),target1=makeFighter({maxHp:1000,hp:1000,def:50,crit:0}),target2=makeFighter({maxHp:1000,hp:1000,def:50,crit:0}),card={id:'stat-atk',kind:'stat',stat:'atk',pct:20,color:'red',name:'test'};resolveCardAction(base,target1,card,3,{cards:[card],slotIndex:0});resolveCardAction(boosted,target2,card,3,{cards:[card],slotIndex:0});assert.ok(boosted.atk>base.atk);
let aw=emptyRpg();aw.petEnhance.fox=4;aw=cleanRpg(aw);assert.ok(petSkillEffects('fox',aw).firstCardAmp>=.15);
// Legendary equipment always gets precisely one real combat affix, including migrated items.
for(const [type,subtype,power,effect] of [
  ['gem','ruby','ember','lifesteal'],
  ['gem','thunder','thunderbolt','stunChance'],
  ['armor','guardian','ironward','blockChance'],
  ['armor','bloodspirit','bloodthorn','reflect'],
  ['ring','warbreaker','keenedge','critBonusMin'],
  ['ring','battlesoul','quickblade','flurry2Chance']
]){
  let legendary=addLoot(emptyRpg(),{id:'legendary-'+subtype,type,subtype,quality:'legendary'});
  const gear=legendary.inventory[0];
  assert.equal(gear.legendaryPower,power,'old and new legendary items receive one subtype-specific affix');
  assert.ok(itemBonusText(gear).includes('✦'),'legendary special affix must be visible in equipment description');
  assert.ok(mythicAbilityText(gear).includes('｜'),'special affix must show its name and description');
  legendary=equipItem(legendary,gear.id);
  assert.ok(mythicEquipmentEffects(legendary)[effect]>0,'legendary special affix changes combat stats');
  const saved=cleanRpg(JSON.parse(JSON.stringify(legendary)));
  assert.equal(saved.inventory[0].legendaryPower,power,'legendary affix persists through save normalization');
}
const forged=cleanRpg({inventory:[{id:'forged',type:'gem',subtype:'ruby',quality:'legendary',legendaryPower:'truehit'}]});
assert.equal(forged.inventory[0].legendaryPower,'ember','invalid or mythic-only affixes are replaced by the correct legendary affix');
let tower=recordTowerFloor(emptyRpg(),7);tower=recordTowerFloor(tower,4);assert.equal(tower.towerBest,7);tower=recordTowerFloor(tower,20);assert.equal(tower.towerBest,20);tower=recordTowerFloor(tower,99);assert.equal(tower.towerBest,20);
const noMyth=rollMythicLoot({boss:false,towerFloor:7,level:50},seq([0,.1]));assert.equal(noMyth,null);
const bossMyth=rollMythicLoot({boss:true,level:50},seq([.01,.01]));assert.equal(bossMyth.quality,'mythic');assert.equal(synthesisInfo(addLoot(emptyRpg(),bossMyth),bossMyth.id).can,false);
let myth=addLoot(emptyRpg(),bossMyth);myth=equipItem(myth,bossMyth.id);assert.ok(mythicEquipmentEffects(myth).lifesteal>0);
const highTower=rollMythicLoot({towerFloor:10,level:50},seq([.05,.9]));assert.equal(highTower.quality,'mythic');
const oldRandom=Math.random;
try{
  let drain=rollMythicLoot({boss:true,level:50},seq([.01,.01,.01]));assert.equal(drain.mythicPower,'lifesteal');let dr=addLoot(emptyRpg(),drain);dr=equipItem(dr,drain.id);let da=makeFighter({maxHp:500,hp:250,atk:100,def:40,crit:0,rpg:dr}),dt=makeFighter({maxHp:500,hp:500,atk:80,def:40,crit:0,rpg:emptyRpg()});resolveAutoBasic(da,dt);assert.ok(da.hp>250);
  let fury=rollMythicLoot({boss:true,level:50},seq([.01,.85,.30]));assert.equal(fury.type,'ring');assert.equal(fury.mythicPower,'flurry');let fr=addLoot(emptyRpg(),fury);fr=equipItem(fr,fury.id);let fa=makeFighter({maxHp:500,hp:500,atk:100,def:40,crit:0,rpg:fr}),ft=makeFighter({maxHp:1000,hp:1000,atk:80,def:0,crit:0,rpg:emptyRpg()});Math.random=()=>.01;resolveAutoBasic(fa,ft);assert.ok(ft.hp<=700);
}finally{Math.random=oldRandom;}
console.log('RPG systems OK');
