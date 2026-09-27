import assert from 'node:assert/strict';
import {
  PET_TREES,PET_FLOW,PET_ENHANCE_MAX,PET_BREAKTHROUGHS,petEnhanceStatScale,petSkillPrerequisite,
  emptyRpg,cleanRpg,availableSkillPoints,canUnlockPetSkill,unlockPetSkill,resetPetSkills,
  petSkillEffects,maxedPkRpg,petEnhanceCost,enhancePet,petEnhanceLevel,petAwakened
} from '../src/rpg.js';
import {progressionStats} from '../src/cards.js';

for(const pet of ['fox','owl','dragon']){
  const flow=PET_FLOW[pet];
  assert.equal(flow.root.length,3,'one shared three-node core');
  assert.equal(flow.branches.length,2,'exactly two final playstyles');
  assert.equal(PET_TREES[pet].length,11,'only one clean 11-node skill tree remains');
  assert.equal(petSkillPrerequisite(pet,flow.root[0]),null);
  for(let i=1;i<3;i++)assert.equal(petSkillPrerequisite(pet,flow.root[i]),flow.root[i-1]);

  let r=emptyRpg();
  assert.equal(canUnlockPetSkill(pet,flow.branches[0].nodes[0],80,r),false,'final paths require completed core');
  for(const node of flow.root)r=unlockPetSkill(pet,node,80,r);
  assert.equal(r.petSkills[pet].length,3);

  const path=flow.branches[0],other=flow.branches[1];
  assert.equal(path.nodes.length,4);
  r=unlockPetSkill(pet,path.nodes[0],80,r);
  assert.equal(canUnlockPetSkill(pet,other.nodes[0],80,r),false,'the two final paths are mutually exclusive');
  assert.equal(canUnlockPetSkill(pet,path.nodes[2],80,r),false,'cannot skip path tiers');
  for(const node of path.nodes.slice(1))r=unlockPetSkill(pet,node,80,r);
  assert.equal(r.petSkills[pet].length,7,'complete build is three core plus four path nodes');
  assert.equal(cleanRpg(r).petSkills[pet].length,7);
  assert.ok(availableSkillPoints(80,r)<79);
  assert.equal(availableSkillPoints(80,resetPetSkills(r)),79,'reset refunds all pet skill points');
}

// Old duplicated skills are deliberately retired; loading an old save refunds their points.
let legacy=emptyRpg();
legacy.petSkills.fox=['fox-1','fox-2','fox-3','fox-4','fox-5'];
legacy.petSkills.owl=['owl-1','owl-2','owl-3','owl-4','owl-5'];
legacy.petSkills.dragon=['dragon-1','dragon-2','dragon-3','dragon-4','dragon-5'];
legacy=cleanRpg(legacy);
for(const pet of ['fox','owl','dragon'])assert.equal(legacy.petSkills[pet].length,0,'retired duplicate skill IDs are removed and points refunded');

// Skill paths have meaningful stat/combat impact.
let fox=emptyRpg();for(const node of [...PET_FLOW.fox.root,...PET_FLOW.fox.branches[1].nodes])fox=unlockPetSkill('fox',node,80,fox);
const base=progressionStats('warrior','fox',80,emptyRpg()).total,withSkills=progressionStats('warrior','fox',80,fox).total;
assert.ok(withSkills.maxHp>base.maxHp&&withSkills.def>base.def,'guardian fox path materially changes combat stats');

assert.equal(PET_ENHANCE_MAX,10);
assert.deepEqual(PET_BREAKTHROUGHS.fox.map(x=>x.level),[3,6,9,10]);
assert.deepEqual([0,3,6,9,10].map(petEnhanceStatScale),[1,1.45,1.95,2.55,2.80]);
let level=emptyRpg();level.crystals=10000;
const costs=[];for(let n=0;n<10;n++){costs.push(petEnhanceCost('fox',level));level=enhancePet('fox',level);assert.equal(petEnhanceLevel('fox',level),n+1);}
assert.deepEqual(costs,[5,10,20,35,45,60,70,80,100,130]);
assert.equal(level.petEnhance.fox,10);
assert.equal(petEnhanceCost('fox',level),0);
assert.equal(enhancePet('fox',level).crystals,level.crystals);
assert.equal(petAwakened('fox',{...level,petEnhance:{fox:5,owl:0,dragon:0}}),false,'evolution begins at +6');
assert.equal(petAwakened('fox',{...level,petEnhance:{fox:6,owl:0,dragon:0}}),true,'+6 is the evolution milestone');

const f3=petSkillEffects('fox',{...level,petSkills:{fox:[],owl:[],dragon:[]},petEnhance:{fox:3,owl:0,dragon:0}});
const f6=petSkillEffects('fox',{...level,petSkills:{fox:[],owl:[],dragon:[]},petEnhance:{fox:6,owl:0,dragon:0}});
const f9=petSkillEffects('fox',{...level,petSkills:{fox:[],owl:[],dragon:[]},petEnhance:{fox:9,owl:0,dragon:0}});
const f10=petSkillEffects('fox',{...level,petSkills:{fox:[],owl:[],dragon:[]},petEnhance:{fox:10,owl:0,dragon:0}});
assert.ok(f3.firstCardAmp>0&&f6.firstCardAmp>f3.firstCardAmp&&f9.crit>0&&f10.ultimate,'breakthroughs add signature combat power');

const stats3=progressionStats('warrior','fox',80,{...level,petSkills:{fox:[],owl:[],dragon:[]},petEnhance:{fox:3,owl:0,dragon:0}}).total;
const stats6=progressionStats('warrior','fox',80,{...level,petSkills:{fox:[],owl:[],dragon:[]},petEnhance:{fox:6,owl:0,dragon:0}}).total;
const stats9=progressionStats('warrior','fox',80,{...level,petSkills:{fox:[],owl:[],dragon:[]},petEnhance:{fox:9,owl:0,dragon:0}}).total;
assert.ok(stats6.atk>stats3.atk&&stats9.atk>stats6.atk,'milestone scaling substantially increases pet contribution');

const pk=maxedPkRpg();
for(const pet of ['fox','owl','dragon']){
  assert.equal(pk.petEnhance[pet],10,'PK keeps pets normalized at the highest enhancement');
  assert.equal(pk.petSkills[pet].length,7,'PK uses one complete legal pet build');
}
console.log('Pet progression: +3/+6/+9/+10 breakthroughs, one clean tree, two exclusive final paths and larger combat impact: PASS');
