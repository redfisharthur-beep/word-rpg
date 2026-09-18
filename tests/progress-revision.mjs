import assert from 'node:assert/strict';
import {cleanProgress,progressRecord,prepareProgressWrite} from '../worker/progress-revision.js';

const defaults=progressRecord({});
assert.equal(defaults.revision,0);
assert.equal(defaults.level,1);
assert.equal(defaults.role,'warrior');
assert.equal(defaults.pet,'fox');

const legacy=prepareProgressWrite({}, {role:'mage',pet:'owl',level:12,xp:33,rpg:{}}, false, null);
assert.equal(legacy.ok,true);
assert.equal(legacy.progress.revision,1);
assert.equal(legacy.progress.role,'mage');
assert.equal(legacy.progress.pet,'owl');
assert.equal(legacy.progress.level,12);

const first=prepareProgressWrite({revision:0}, {role:'archer',pet:'dragon',level:8,xp:9,rpg:{}}, true, 0);
assert.equal(first.ok,true);
assert.equal(first.progress.revision,1);

const stale=prepareProgressWrite(first.progress, {role:'mage',pet:'fox',level:9,xp:0,rpg:{}}, true, 0);
assert.equal(stale.ok,false);
assert.equal(stale.status,409);
assert.equal(stale.current.revision,1);
assert.equal(stale.current.role,'archer');

const second=prepareProgressWrite(first.progress, {role:'mage',pet:'fox',level:9,xp:100,rpg:{}}, true, 1);
assert.equal(second.ok,true);
assert.equal(second.progress.revision,2);
assert.equal(second.progress.role,'mage');
assert.equal(second.progress.level,9);

const maxed=cleanProgress({role:'bad',pet:'bad',level:99,xp:999,rpg:{}});
assert.equal(maxed.role,'warrior');
assert.equal(maxed.pet,'fox');
assert.equal(maxed.level,50);
assert.equal(maxed.xp,0);

console.log('Progress revision tests: PASS');
