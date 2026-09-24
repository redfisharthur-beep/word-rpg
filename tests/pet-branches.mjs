import assert from 'node:assert/strict';
import {PET_TREES,PET_FLOW,petSkillPrerequisite,emptyRpg,cleanRpg,availableSkillPoints,canUnlockPetSkill,unlockPetSkill,resetPetSkills,petSkillEffects,maxedPkRpg} from '../src/rpg.js';
import {progressionStats} from '../src/cards.js';
for(const pet of ['fox','owl','dragon']){
  const flow=PET_FLOW[pet];
  assert.equal(flow.branches.length,2,'the root splits into exactly two middle routes');
  assert.equal(PET_TREES[pet].length,21,'legacy abilities are retained without appearing as extra route buttons');
  assert.equal(petSkillPrerequisite(pet,flow.root),null);
  for(const branch of flow.branches){
    assert.equal(branch.leaves.length,2,'each middle route has exactly two final branches');
    assert.equal(petSkillPrerequisite(pet,branch.node),flow.root);
    for(const leaf of branch.leaves)assert.equal(petSkillPrerequisite(pet,leaf),branch.node);
  }
  let r=emptyRpg();
  assert.equal(canUnlockPetSkill(pet,flow.branches[0].node,80,r),false);
  r=unlockPetSkill(pet,flow.root,80,r);
  assert.equal(canUnlockPetSkill(pet,flow.branches[0].node,80,r),true);
  r=unlockPetSkill(pet,flow.branches[0].node,80,r);
  assert.equal(canUnlockPetSkill(pet,flow.branches[1].node,80,r),false,'the opposite middle route is exclusive');
  const [firstLeaf,otherLeaf]=flow.branches[0].leaves;
  assert.equal(canUnlockPetSkill(pet,firstLeaf,80,r),true);
  r=unlockPetSkill(pet,firstLeaf,80,r);
  assert.equal(canUnlockPetSkill(pet,otherLeaf,80,r),false,'the two end routes are exclusive');
  assert.equal(cleanRpg(r).petSkills[pet].length,3,'all chosen nodes survive normalization');
  assert.ok(availableSkillPoints(80,r)<79);
  assert.equal(availableSkillPoints(80,resetPetSkills(r)),79,'reset refunds every point');
}
let fox=emptyRpg();for(const id of ['fox-1','fox-7','fox-moon-1-1'])fox=unlockPetSkill('fox',id,80,fox);
const before=progressionStats('warrior','fox',80,emptyRpg()).total,after=progressionStats('warrior','fox',80,fox).total;
assert.ok(after.maxHp>before.maxHp,'the selected route changes real combat stats');
let legacy=emptyRpg();legacy.petSkills.fox=['fox-1','fox-2','fox-3','fox-4','fox-5'];legacy.petSkills.owl=['owl-1','owl-2','owl-3','owl-4','owl-5'];legacy.petSkills.dragon=['dragon-1','dragon-2','dragon-3','dragon-4','dragon-5'];legacy=cleanRpg(legacy);
for(const pet of ['fox','owl','dragon'])assert.equal(legacy.petSkills[pet].length,5,'previously purchased skills remain in existing saves');
assert.ok(Math.abs(petSkillEffects('fox',legacy).firstCardAmp-.15)<1e-10,'old skill effects stay intact');
const pk=maxedPkRpg();for(const pet of ['fox','owl','dragon'])assert.ok(pk.petSkills[pet].length>=3,'both PK players receive the same preconfigured normalized skill level');
console.log('Pet flow: 1 root, 2 middle nodes, 4 mutually exclusive final routes; saved skills and combat bonuses: PASS');
