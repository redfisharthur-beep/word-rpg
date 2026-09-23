import assert from 'node:assert/strict';
import {emptyRpg,cleanRpg,addLoot,enhanceEquipment,equipmentEnhanceInfo,equipmentBonuses,equipItem,maxedPkRpg,crystallizeItem} from '../src/rpg.js';
const item=(quality,id)=>({id,type:'gem',subtype:'ruby',quality});
const qualities=['common','rare','epic','legendary','mythic'];
const rates=qualities.map((quality,i)=>equipmentEnhanceInfo(item(quality,'q'+i)));
assert.deepEqual(rates.map(x=>x.cost),[2,3,5,8,12],'reduced first-level costs by quality');
assert.deepEqual(qualities.map((quality,i)=>equipmentEnhanceInfo({...item(quality,'q'+i),enhance:9}).cost),[20,30,50,80,120],'higher upgrade levels retain predictable reduced costs');
for(let i=1;i<rates.length;i++){assert.ok(rates[i].cost>rates[i-1].cost,'higher gear quality needs more crystals');assert.ok(rates[i].chance<rates[i-1].chance,'higher gear quality is less likely to succeed')}
let r=addLoot(emptyRpg(),item('common','a'));r.crystals=10000;r=equipItem(r,'a');
const base=equipmentBonuses(r).atkPct;
let result=enhanceEquipment(r,'a',()=>0);
assert.equal(result.ok,true);assert.equal(result.success,true);assert.equal(result.after,1);assert.equal(result.rpg.crystals,r.crystals-rates[0].cost);
r=result.rpg;assert.ok(equipmentBonuses(r).atkPct>base,'enhancement boosts equipped combat bonuses');
result=enhanceEquipment(r,'a',()=>1);
assert.equal(result.success,false);assert.equal(result.before,1);assert.equal(result.after,0,'failed enhancement reduces level by one');
assert.ok(result.rpg.crystals<r.crystals,'failed enhancement still consumes crystals');
r=result.rpg;result=enhanceEquipment(r,'a',()=>1);assert.equal(result.after,0,'failure at +0 does not become negative');
r=result.rpg;for(let n=0;n<10;n++){result=enhanceEquipment(r,'a',()=>0);assert.equal(result.after,n+1);r=result.rpg}
assert.equal(r.inventory[0].enhance,10);assert.ok(equipmentBonuses(r).atkPct>base);
const atMax=enhanceEquipment(r,'a',()=>0);assert.equal(atMax.ok,false);assert.equal(atMax.rpg.crystals,r.crystals,'no crystals spent at +10');
assert.equal(equipmentEnhanceInfo(r.inventory[0]).cost,0);
let scarce=addLoot(emptyRpg(),item('mythic','m'));scarce.crystals=1;
result=enhanceEquipment(scarce,'m',()=>0);assert.equal(result.ok,false);assert.equal(result.reason,'結晶不足');
const encoded=JSON.parse(JSON.stringify(r));assert.equal(cleanRpg(encoded).inventory[0].enhance,10,'save/load preserves enhancement');
const invalid=cleanRpg({...r,inventory:[{...r.inventory[0],enhance:900}]});assert.equal(invalid.inventory[0].enhance,10,'malformed save clamps enhancement');
const pk=maxedPkRpg();assert.equal(pk.inventory.length,6);assert.ok(pk.inventory.every(gear=>gear.enhance===10),'PK has maxed enhancement for both players');
const crystals=crystallizeItem(r,'a');assert.equal(crystals.inventory.length,1,'equipped upgraded items cannot be crystallized');
console.log('Equipment upgrade: quality costs and odds, success and downgrade, +10 cap, stat gains, insufficient funds, save roundtrip and normalized PK: PASS');
