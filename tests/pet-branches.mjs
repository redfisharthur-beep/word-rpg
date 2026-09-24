import assert from 'node:assert/strict';
import {PET_TREES,PET_FLOW,PET_ENHANCE_MAX,petSkillPrerequisite,emptyRpg,cleanRpg,availableSkillPoints,canUnlockPetSkill,unlockPetSkill,resetPetSkills,petSkillEffects,maxedPkRpg,petEnhanceCost,enhancePet,petEnhanceLevel} from '../src/rpg.js';
import {progressionStats} from '../src/cards.js';

for(const pet of ['fox','owl','dragon']){
  const flow=PET_FLOW[pet];
  assert.equal(flow.root.length,3,'three single-node tiers');
  assert.equal(flow.branches.length,2,'two mid-branches');
  assert.equal(PET_TREES[pet].length,42,'old 21 nodes retained alongside 21 new nodes');
  assert.equal(petSkillPrerequisite(pet,flow.root[0]),null);
  for(let i=1;i<3;i++)assert.equal(petSkillPrerequisite(pet,flow.root[i]),flow.root[i-1]);
  let r=emptyRpg();
  assert.equal(canUnlockPetSkill(pet,flow.branches[0].nodes[0],80,r),false,'mid-branch requires completed root');
  for(const node of flow.root)r=unlockPetSkill(pet,node,80,r);
  assert.equal(r.petSkills[pet].length,3);
  const mid=flow.branches[0],otherMid=flow.branches[1];
  r=unlockPetSkill(pet,mid.nodes[0],80,r);
  assert.equal(canUnlockPetSkill(pet,otherMid.nodes[0],80,r),false,'opposite mid branch is exclusive');
  assert.equal(canUnlockPetSkill(pet,mid.nodes[2],80,r),false,'cannot skip a middle tier');
  for(const node of mid.nodes.slice(1))r=unlockPetSkill(pet,node,80,r);
  assert.equal(r.petSkills[pet].length,6);
  for(const branch of flow.branches){
    assert.equal(branch.nodes.length,3,'three two-node tiers');
    assert.equal(petSkillPrerequisite(pet,branch.nodes[0]),flow.root[2]);
    for(let i=1;i<3;i++)assert.equal(petSkillPrerequisite(pet,branch.nodes[i]),branch.nodes[i-1]);
    assert.equal(branch.leaves.length,2,'four final routes total');
    for(const leaf of branch.leaves){
      assert.equal(leaf.nodes.length,3,'three four-node tiers');
      assert.equal(petSkillPrerequisite(pet,leaf.nodes[0]),branch.nodes[2]);
      for(let i=1;i<3;i++)assert.equal(petSkillPrerequisite(pet,leaf.nodes[i]),leaf.nodes[i-1]);
    }
  }
  const leaf=mid.leaves[0],otherLeaf=mid.leaves[1];
  r=unlockPetSkill(pet,leaf.nodes[0],80,r);
  assert.equal(canUnlockPetSkill(pet,otherLeaf.nodes[0],80,r),false,'other terminal route is exclusive');
  assert.equal(canUnlockPetSkill(pet,leaf.nodes[2],80,r),false,'cannot skip final tier');
  for(const node of leaf.nodes.slice(1))r=unlockPetSkill(pet,node,80,r);
  assert.equal(r.petSkills[pet].length,9,'nine skills unlocked on one complete route');
  assert.equal(cleanRpg(r).petSkills[pet].length,9,'selected route survives saved progress');
  assert.ok(availableSkillPoints(80,r)<79);
  assert.equal(availableSkillPoints(80,resetPetSkills(r)),79,'reset refunds purchased skills');
}
const fullFox=PET_FLOW.fox,foxNodes=[...fullFox.root,...fullFox.branches[1].nodes,...fullFox.branches[1].leaves[0].nodes];
let fox=emptyRpg();for(const node of foxNodes)fox=unlockPetSkill('fox',node,80,fox);
const base=progressionStats('warrior','fox',80,emptyRpg()).total,withSkills=progressionStats('warrior','fox',80,fox).total;
assert.ok(withSkills.maxHp>base.maxHp,'final route modifies actual combat stats');
let legacy=emptyRpg();
legacy.petSkills.fox=['fox-1','fox-2','fox-3','fox-4','fox-5'];
legacy.petSkills.owl=['owl-1','owl-2','owl-3','owl-4','owl-5'];
legacy.petSkills.dragon=['dragon-1','dragon-2','dragon-3','dragon-4','dragon-5'];
legacy=cleanRpg(legacy);
for(const pet of ['fox','owl','dragon'])assert.equal(legacy.petSkills[pet].length,5,'legacy skills retained');
assert.ok(Math.abs(petSkillEffects('fox',legacy).firstCardAmp-.15)<1e-10,'old effects unchanged');

assert.equal(PET_ENHANCE_MAX,10);
let level=emptyRpg();level.crystals=10000;
const costs=[];for(let n=0;n<10;n++){costs.push(petEnhanceCost('fox',level));level=enhancePet('fox',level);assert.equal(petEnhanceLevel('fox',level),n+1);}
assert.equal(level.petEnhance.fox,10,'awakening cap is ten');
assert.equal(petEnhanceCost('fox',level),0,'max level has no cost');
assert.equal(enhancePet('fox',level).crystals,level.crystals,'max level does not consume crystals');
assert.equal(cleanRpg({...level,petEnhance:{fox:999,owl:-1,dragon:4}}).petEnhance.fox,10,'out-of-range saves capped at ten');
assert.deepEqual(costs,[5,10,20,40,40,50,60,70,80,90]);
assert.ok(petSkillEffects('fox',{...level,petEnhance:{fox:4,owl:0,dragon:0}}).firstCardAmp>=.15,'awakening effect starts at level four');
assert.ok(progressionStats('warrior','fox',80,level).total.maxHp>progressionStats('warrior','fox',80,{...level,petEnhance:{fox:4,owl:0,dragon:0}}).total.maxHp,'levels 5–10 improve pet stats');
const pk=maxedPkRpg();for(const pet of ['fox','owl','dragon']){assert.equal(pk.petEnhance[pet],10,'PK uses highest awakening level');assert.ok(pk.petSkills[pet].length>=9);}
console.log('Pet progression: nine 1-1-1/2-2-2/4-4-4 tiers, exclusive routes, legacy saves and awakening +10: PASS');
