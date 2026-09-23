import assert from 'node:assert/strict';
import {PET_TREES,PET_PATHS,petSkillPath,petSkillPrerequisite,emptyRpg,cleanRpg,availableSkillPoints,canUnlockPetSkill,unlockPetSkill,resetPetSkills,petSkillEffects,maxedPkRpg} from '../src/rpg.js';
import {progressionStats,applyPetRoundEnd} from '../src/cards.js';

for(const pet of ['fox','owl','dragon']){
  const paths=PET_PATHS[pet],all=paths.flatMap(path=>path.nodes);
  assert.equal(paths.length,3,pet+' must have three independent paths');
  assert.equal(PET_TREES[pet].length,9,pet+' must offer nine skills');
  assert.equal(new Set(all).size,9,'each skill must belong to exactly one path');
  assert.deepEqual(new Set(all),new Set(PET_TREES[pet].map(node=>node.id)));
  for(const path of paths){
    assert.equal(path.nodes.length,3,'each branch has three connected tiers');
    assert.equal(petSkillPrerequisite(pet,path.nodes[0]),null,'first skill requires no other path');
    assert.equal(petSkillPrerequisite(pet,path.nodes[1]),path.nodes[0]);
    assert.equal(petSkillPrerequisite(pet,path.nodes[2]),path.nodes[1]);
    for(const id of path.nodes)assert.equal(petSkillPath(pet,id)?.id,path.id);
  }
}
let r=emptyRpg();
assert.equal(canUnlockPetSkill('fox','fox-7',80,r),true,'survival route starts independently');
assert.equal(canUnlockPetSkill('fox','fox-8',80,r),false,'survival route tier two needs its own precursor');
assert.equal(canUnlockPetSkill('fox','fox-1',80,r),true,'starting one route does not lock another route');
r=unlockPetSkill('fox','fox-7',80,r);
assert.equal(canUnlockPetSkill('fox','fox-8',80,r),true);
assert.equal(canUnlockPetSkill('fox','fox-9',80,r),false);
r=unlockPetSkill('fox','fox-8',80,r);
r=unlockPetSkill('fox','fox-9',80,r);
assert.equal(availableSkillPoints(80,r),79-2-4-6);
assert.ok(petSkillEffects('fox',r).hpPct>=.04);
assert.ok(petSkillEffects('fox',r).defPct>=.05);
assert.ok(petSkillEffects('fox',r).guardHeal>=.04);
const unskilled=progressionStats('warrior','fox',80,emptyRpg()).total;
const skilled=progressionStats('warrior','fox',80,r).total;
assert.ok(skilled.maxHp>unskilled.maxHp&&skilled.def>unskilled.def,'new pet defense skills alter actual combat stats');
const foxFighter={pet:'fox',rpg:r,hp:600,maxHp:1000,shield:0};
const notes=applyPetRoundEnd(foxFighter,[{color:'green'},{color:'blue'},{color:'red'}],[]);
assert.equal(foxFighter.hp,640,'fox healing branch restores 4% of maximum HP in battle');
assert.ok(notes.length>0);
let attack=unlockPetSkill('fox','fox-1',80,r);
assert.ok(attack.petSkills.fox.includes('fox-1'),'branches are freely combinable');
assert.equal(availableSkillPoints(80,attack),79-2-4-6-2);
assert.equal(availableSkillPoints(80,resetPetSkills(attack)),79,'respec returns all points');
assert.equal(attack.petEnhance.fox,0);
let legacy=emptyRpg();
legacy.petSkills.fox=['fox-1','fox-2','fox-3','fox-4','fox-5'];
legacy.petSkills.owl=['owl-1','owl-2','owl-3','owl-4','owl-5'];
legacy.petSkills.dragon=['dragon-1','dragon-2','dragon-3','dragon-4','dragon-5'];
legacy=cleanRpg(legacy);
for(const pet of ['fox','owl','dragon'])assert.equal(legacy.petSkills[pet].length,5,'migration must retain all original skill IDs');
for(const [pet,node] of [['fox','fox-6'],['owl','owl-6'],['dragon','dragon-7']]){const isolated=cleanRpg({...emptyRpg(),petSkills:{fox:[],owl:[],dragon:[],[pet]:legacy.petSkills[pet]}});assert.ok(canUnlockPetSkill(pet,node,80,isolated),'original branch skills unlock new terminal skill: '+node)}
assert.equal(petSkillEffects('fox',legacy).firstCardAmp,.15,'legacy first-card skill strength preserved');
const maxed=maxedPkRpg();
for(const pet of ['fox','owl','dragon'])assert.equal(maxed.petSkills[pet].length,9,'normalized PK retains all 3 max-level branches for every pet');
console.log('Pet branching: 3 independent paths per pet, 27 skills, legacy saves, unlock gating, stats, healing and maxed PK: PASS');
