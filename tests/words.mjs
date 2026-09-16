import assert from 'node:assert/strict';
import {WORDS,makeQuestion} from '../src/words.js';
import {accuracyMultiplier} from '../src/cards.js';
assert.equal(WORDS.length,1200);
assert.equal(new Set(WORDS.map(x=>String(x[0]).toLowerCase())).size,1200);
for(const i of [0,399,799,1199]){const q=makeQuestion(i);assert.ok(q.word&&q.answer&&Array.isArray(q.options)&&q.options.length>=2)}
const normal={pet:'fox',rpg:{}};const owl={pet:'owl',rpg:{}};assert.equal(accuracyMultiplier(0,normal),0);assert.equal(accuracyMultiplier(1,normal),.65);assert.equal(accuracyMultiplier(2,normal),.9);assert.equal(accuracyMultiplier(3,normal),1.15);assert.equal(accuracyMultiplier(4,normal),1.32);assert.equal(accuracyMultiplier(5,normal),1.5);assert.equal(accuracyMultiplier(0,owl),.65);assert.equal(accuracyMultiplier(1,owl),.9);assert.equal(accuracyMultiplier(2,owl),1.15);assert.equal(accuracyMultiplier(3,owl),1.32);assert.equal(accuracyMultiplier(4,owl),1.5);assert.equal(accuracyMultiplier(5,owl),1.7);assert.ok(Math.abs(accuracyMultiplier(1,{pet:'owl',rpg:{petSkills:{owl:['owl-1']}}})-.95)<1e-9);
console.log('Words and 5-question scoring OK');
