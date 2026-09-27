import assert from 'node:assert/strict';
import {WORDS,makeQuestion} from '../src/words.js';
import {accuracyMultiplier} from '../src/cards.js';
assert.equal(WORDS.length,1200);
assert.equal(new Set(WORDS.map(x=>String(x[0]).toLowerCase())).size,1200);
for(const i of [0,399,799,1199]){const q=makeQuestion(i);assert.ok(q.word&&q.answer&&Array.isArray(q.options)&&q.options.length>=2)}
const normal={pet:'fox',rpg:{}};
const owl={pet:'owl',rpg:{}};
assert.equal(accuracyMultiplier(0,normal),0);
assert.equal(accuracyMultiplier(1,normal),.65);
assert.equal(accuracyMultiplier(2,normal),.9);
assert.equal(accuracyMultiplier(3,normal),1.15);
assert.equal(accuracyMultiplier(4,normal),1.32);
assert.equal(accuracyMultiplier(5,normal),1.5);
assert.equal(accuracyMultiplier(0,owl),.70);
assert.equal(accuracyMultiplier(1,owl),.95);
assert.equal(accuracyMultiplier(2,owl),1.2);
assert.equal(accuracyMultiplier(3,owl),1.4);
assert.equal(accuracyMultiplier(4,owl),1.6);
assert.equal(accuracyMultiplier(5,owl),1.8);

const owlSkill={pet:'owl',rpg:{petSkills:{fox:[],owl:['owl-core-1'],dragon:[]}}};
assert.equal(accuracyMultiplier(1,owlSkill),.95);
assert.equal(accuracyMultiplier(2,owlSkill),1.2);
assert.ok(Math.abs(accuracyMultiplier(3,owlSkill)-1.48)<1e-9);
assert.ok(Math.abs(accuracyMultiplier(4,owlSkill)-1.68)<1e-9);
assert.ok(Math.abs(accuracyMultiplier(5,owlSkill)-1.88)<1e-9);

const owlFull={pet:'owl',rpg:{
  petSkills:{fox:[],owl:['owl-core-1','owl-core-2','owl-core-3','owl-off-1','owl-off-2','owl-off-3','owl-off-4'],dragon:[]},
  petEnhance:{fox:0,owl:10,dragon:0}
}};
assert.equal(accuracyMultiplier(1,owlFull),.95);
assert.ok(Math.abs(accuracyMultiplier(3,owlFull)-1.98)<1e-9);
assert.ok(Math.abs(accuracyMultiplier(4,owlFull)-2.18)<1e-9);
assert.ok(Math.abs(accuracyMultiplier(5,owlFull)-2.38)<1e-9);
console.log('Words and 5-question scoring OK');
