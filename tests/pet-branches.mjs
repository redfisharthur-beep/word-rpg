import assert from 'node:assert/strict';
import {PET_TREES,PET_PATHS,petSkillPath,petSkillPrerequisite,emptyRpg,cleanRpg,availableSkillPoints,canUnlockPetSkill,unlockPetSkill,resetPetSkills,petSkillEffects,maxedPkRpg} from '../src/rpg.js';
import {progressionStats,applyPetRoundEnd} from '../src/cards.js';

for(const pet of ['fox','owl','dragon']){
  const paths=PET_PATHS[pet],all=paths.flatMap(path=>path.nodes);
  assert.equal(paths.length,3,pet+' must have three independent paths');
  assert.equal(PET_TREES[pet].length,21,pet+' must offer nine base and twelve fork skills');
  assert.equal(new Set(all).size,9,'each skill must belong to exactly one path');
  assert.deepEqual(new Set(all),new Set(PET_TREES[pet].slice(0,9).map(node=>node.id)));
  for(const path of paths){
    assert.equal(path.nodes.length,3,'each branch has three connected tiers');
    assert.equal(petSkillPrerequisite(pet,path.nodes[0]),null,'first skill requires no other path');
    assert.equal(petSkillPrerequisite(pet,path.nodes[1]),path.nodes[0]);
    assert.equal(petSkillPrerequisite(pet,path.nodes[2]),path.nodes[1]);
    for(const id of path.nodes)assert.equal(petSkillPath(pet,id)?.id,path.id);
    assert.equal(path.forks.length,2,'each route offers two distinct specializations');
    for(const fork of path.forks){
      assert.equal(fork.nodes.length,2,'each specialization extends into a second skill');
      assert.equal(petSkillPath(pet,fork.nodes[0])?.id,path.id);
      assert.equal(petSkillPrerequisite(pet,fork.nodes[0]),path.nodes.at(-1));
      assert.equal(petSkillPrerequisite(pet,fork.nodes[1]),fork.nodes[0]);
    }
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
assert.ok(Math.abs(petSkillEffects('fox',legacy).firstCardAmp-.15)<1e-10,'legacy first-card skill strength preserved');
const maxed=maxedPkRpg();
for(const pet of ['fox','owl','dragon'])assert.equal(maxed.petSkills[pet].length,15,'normalized PK uses one complete specialization per branch for fairness');
let forkRpg=emptyRpg();
const wind=PET_PATHS.fox[0];
for(const id of wind.nodes)forkRpg=unlockPetSkill('fox',id,80,forkRpg);
const [first,second]=wind.forks;
assert.ok(canUnlockPetSkill('fox',first.nodes[0],80,forkRpg));
forkRpg=unlockPetSkill('fox',first.nodes[0],80,forkRpg);
assert.equal(canUnlockPetSkill('fox',first.nodes[1],80,forkRpg),true,'selected specialization continues further');
assert.equal(canUnlockPetSkill('fox',second.nodes[0],80,forkRpg),false,'opposite fork becomes exclusive');
forkRpg=unlockPetSkill('fox',first.nodes[1],80,forkRpg);
assert.ok(petSkillEffects('fox',forkRpg).firstCardAmp>petSkillEffects('fox',legacy).firstCardAmp,'advanced fork alters live combat effects');
assert.equal(cleanRpg(forkRpg).petSkills.fox.length,5,'new fork skills survive save normalization');
console.log('Pet branching: 3 primary routes and two further specialization forks each, legacy saves, gating, live effects and maxed PK: PASS');
