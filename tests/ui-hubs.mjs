import assert from 'node:assert/strict';
import fs from 'node:fs';
const nodes=new Map(),storage=new Map();
const app={_html:'',set innerHTML(html){this._html=String(html);nodes.clear()},get innerHTML(){return this._html},querySelector:()=>null,querySelectorAll:()=>[]};
function element(selector,dataset={}){
  const key=selector+JSON.stringify(dataset);
  if(!nodes.has(key))nodes.set(key,{dataset,hidden:false,textContent:'',value:'',handlers:{},addEventListener(name,fn){this.handlers[name]=fn},click(){const fn=this.handlers.click;assert.equal(typeof fn,'function','missing event handler on '+selector);return fn()},focus(){},select(){}});
  return nodes.get(key);
}
function matches(selector){
  const m=selector.match(/^\[([^\]=]+)(?:="([^"]*)")?\]$/);
  if(!m)return null;
  const marker=m[2]===undefined?m[1]:m[1]+'="'+m[2]+'"';
  return app.innerHTML.includes(marker)?m:null;
}
globalThis.document={
  getElementById:()=>({}),addEventListener(){},
  querySelector(selector){if(selector==='#app')return app;const match=matches(selector);if(!match)return null;if(match[2]!==undefined&&match[1].startsWith('data-')){const attr=match[1],key=attr.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase());return this.querySelectorAll('['+attr+']').find(node=>node.dataset[key]===match[2])||null}return element(selector)},
  querySelectorAll(selector){
    const m=selector.match(/^\[data-([a-z-]+)\]$/);
    if(!m)return [];
    const attr=m[1],key=attr.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),pattern=new RegExp('data-'+attr+'="([^"]+)"','g');
    return [...app.innerHTML.matchAll(pattern)].map((item,i)=>element(selector+':'+i,{[key]:item[1]}));
  }
};
globalThis.Audio=class{pause(){}play(){return Promise.resolve()}getAttribute(){return ''}};
globalThis.location={search:'',pathname:'/',hash:''};
globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
let clipboard='';
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async text=>{clipboard=text}}}});
await import('../src/game-core.js');
assert.match(app.innerHTML,/data-action="guest-login"/);
document.querySelector('[data-action="guest-login"]').click();
const home=app.innerHTML;
for(const id of ['quests','achievements','community'])assert.match(home,new RegExp('data-action="'+id+'"'),id+' button missing');
assert.doesNotMatch(home,/data-action="daily"/,'combined daily/achievement button must disappear');
const assets=fs.readFileSync(new URL('../src/assets.js',import.meta.url),'utf8');
for(const name of ['Quest.png','Achievement.png','Community.png'])assert.ok(assets.includes('/images/'+name),'uploaded button image not wired: '+name);
for(const [id,order] of [['pet-tree',13],['equipment',14],['quests',16],['achievements',17],['community',18]])assert.ok(assets.includes(`[data-action="${id}"]{order:${order}`),'wrong visual button row/order: '+id);
assert.match(assets,/\.collection-entry\{order:15/,'collection must be the last button of row 2');
document.querySelector('[data-action="pet-tree"]').click();
assert.match(app.innerHTML,/寵物專屬技能樹/);
assert.match(app.innerHTML,/迅影突襲/);
assert.match(app.innerHTML,/赤焰獵手/);
assert.match(app.innerHTML,/月影守護/);
assert.equal((app.innerHTML.match(/class="pet-branch pet-branch-/g)||[]).length,3,'selected pet must show three distinct tree lanes');
assert.equal((app.innerHTML.match(/data-pet-skill="fox\|fox-/g)||[]).length,9,'selected fox must show nine actual purchasable skills');
assert.doesNotMatch(app.innerHTML,/data-pet-skill="owl\|owl-/,'unselected owl tree must be hidden');
document.querySelector('[data-pet="owl"]').click();
assert.match(app.innerHTML,/星夜智識/);
assert.match(app.innerHTML,/聖羽療癒/);
assert.equal((app.innerHTML.match(/data-pet-skill="owl\|owl-/g)||[]).length,9);
assert.doesNotMatch(app.innerHTML,/data-pet-skill="fox\|fox-/,'changing pet replaces lower tree');
document.querySelector('[data-pet="dragon"]').click();
assert.match(app.innerHTML,/元素術式/);
assert.match(app.innerHTML,/真龍滅擊/);
assert.match(app.innerHTML,/龍鱗護體/);
assert.equal((app.innerHTML.match(/data-pet-skill="dragon\|dragon-/g)||[]).length,9);
document.querySelector('[data-action="setup-back"]').click();
assert.match(app.innerHTML,/data-action="pet-tree"/,'return from pet menu must preserve original home navigation');
document.querySelector('[data-action="quests"]').click();
assert.match(app.innerHTML,/每日任務/);
assert.match(app.innerHTML,/data-daily-chest/);
assert.doesNotMatch(app.innerHTML,/英文學習與冒險成就/,'achievement claims belong only to achievements');
document.querySelector('[data-action="setup-back"]').click();
document.querySelector('[data-action="achievements"]').click();
for(const heading of ['英文學習與冒險成就','單字精熟成就','裝備收集成就','稱號收藏'])assert.ok(app.innerHTML.includes(heading),heading+' missing');
assert.match(app.innerHTML,/data-equip-title=/,'earned title must be equippable from achievement screen');
assert.doesNotMatch(app.innerHTML,/data-daily-chest/,'daily chest belongs only to quests');
document.querySelector('[data-action="setup-back"]').click();
document.querySelector('[data-action="collection"]').click();
assert.doesNotMatch(app.innerHTML,/collection-rewards/,'collection rewards must move to achievements');
document.querySelector('[data-collection-tab="words"]').click();
assert.doesNotMatch(app.innerHTML,/單字精熟系統|首次作答才收錄|累積答對 1 次/,'requested verbose word-book text must be removed');
assert.doesNotMatch(app.innerHTML,/data-word-title=/,'title selection must move out of vocabulary collection');
document.querySelector('[data-action="setup-back"]').click();
document.querySelector('[data-action="community"]').click();
assert.match(app.innerHTML,/分享成績/);
assert.match(app.innerHTML,/data-community-pk/);
await document.querySelector('[data-community-copy]').click();
assert.match(clipboard,/Word RPG/);
assert.match(clipboard,/https:\/\/word-rpg\.redfisharthur\.workers\.dev\//);
console.log('P1 UI hubs: third icon row, separate quests/achievements, centralized titles, and working community invite: PASS');
