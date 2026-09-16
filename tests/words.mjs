import assert from 'node:assert/strict';
import {WORDS,makeQuestion} from '../src/words.js';
import {accuracyMultiplier} from '../src/cards.js';
assert.equal(WORDS.length,1200);
assert.equal(new Set(WORDS.map(x=>String(x[0]).toLowerCase())).size,1200);
for(const i of [0,399,799,1199]){const q=makeQuestion(i);assert.ok(q.word&&q.answer&&Array.isArray(q.options)&&q.options.length>=2)}
assert.equal(accuracyMultiplier(0),0);assert.ok(accuracyMultiplier(1)<accuracyMultiplier(2));assert.ok(accuracyMultiplier(2)<accuracyMultiplier(3));assert.ok(accuracyMultiplier(3)<accuracyMultiplier(4));assert.ok(accuracyMultiplier(4)<accuracyMultiplier(5));assert.equal(accuracyMultiplier(5),1.5);
console.log('Words and 5-question scoring OK');
