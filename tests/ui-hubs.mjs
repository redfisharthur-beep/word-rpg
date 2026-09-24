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
storage.set('word-rpg-card-v3',JSON.stringify({authMode:'guest',wordBook:{entries:{0:{correct:1,wrong:0,first:'correct',lastAt:1}}}}));
let clipboard='',spoken=[];
globalThis.window={speechSynthesis:{cancel(){},speak:u=>spoken.push({text:u.text,lang:u.lang})}};
globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async text=>{clipboard=text}}}});
await import('../src/game-core.js');
assert.match(app.innerHTML,/data-action="guest-login"/);
document.querySelector('[data-action="guest-login"]').click();
const home=app.innerHTML;
const identity=home.match(/<div class="growth-level">([\s\S]*?)<\/div><div class="player-season-tier">/);
assert.ok(identity,'player info must live in right-side growth panel directly above season');
assert.match(identity[1],/^<b class="growth-level-value">LV1<\/b><span class="growth-title">[^<]+<\/span><span class="growth-player-name">訪客<\/span>$/,'three distinct identity lines must be level, title, player name');
assert.ok(home.indexOf('class="growth-art role-growth-art"')<home.indexOf('class="growth-panel role-growth-panel"'),'character art should remain in the left column');
const homeStyles=fs.readFileSync(new URL('../src/game-v2.css',import.meta.url),'utf8');
assert.match(homeStyles,/\.role-feature \.role-growth-art\s*\{[^}]*height:325px/,'desktop character art must fit inside its own frame');
assert.match(homeStyles,/\.role-feature \.role-growth-art img\s*\{[^}]*object-fit:contain;[^}]*transform:none/,'character art must not be scaled beyond frame');
assert.match(homeStyles,/\.role-feature \.role-growth-art img\s*\{[^}]*width:100%;[^}]*height:100%;[^}]*object-fit:contain/,'desktop role artwork fills its allotted frame without cropping');
assert.match(homeStyles,/@media\(max-width:700px\)[\s\S]*?\.role-feature \.role-growth-art img\s*\{[^}]*width:92%;[^}]*height:92%;[^}]*object-fit:contain/,'mobile role artwork shrinks slightly while remaining fully visible');
assert.match(homeStyles,/@media\(max-width:700px\)[\s\S]*?\.role-feature \.role-growth-art\s*\{[^}]*height:260px/,'mobile character art must fit inside its own frame');
assert.match(homeStyles,/\.role-feature \.role-growth-panel\s*\{[^}]*justify-items:center;[^}]*text-align:center/,'right-hand player info must be centered');
assert.match(homeStyles,/\.role-feature \.growth-level\s*\{[^}]*justify-items:center;[^}]*text-align:center/,'all three identity lines must be centered');
assert.match(homeStyles,/\.role-feature \.role-growth-panel \.player-season-tier\s*\{[^}]*justify-self:center/,'season badge must be centered under player info');
for(const id of ['quests','achievements','community'])assert.match(home,new RegExp('data-action="'+id+'"'),id+' button missing');
assert.doesNotMatch(home,/data-action="daily"/,'combined daily/achievement button must disappear');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const typography=fs.readFileSync(new URL('../src/typography.css',import.meta.url),'utf8');
assert.ok(html.includes('./src/typography.css'),'all game screens must load the light typography sheet');
assert.ok(html.indexOf('./src/typography.css')>html.indexOf('./src/progression-v2.css'),'light typography must load after all existing styles');
assert.match(typography,/body \*::after\s*\{\s*font-weight:300!important;/,'all UI text, including pseudo elements, must be light weight');
const assets=fs.readFileSync(new URL('../src/assets.js',import.meta.url),'utf8');
for(const name of ['Quest.png','Achievement.png','Community.png'])assert.ok(assets.includes('/images/'+name),'uploaded button image not wired: '+name);
for(const [id,order] of [['pet-tree',13],['equipment',14],['quests',16],['achievements',17],['community',18]])assert.ok(assets.includes(`[data-action="${id}"]{order:${order}`),'wrong visual button row/order: '+id);
assert.match(assets,/\.collection-entry\{order:15/,'collection must be the last button of row 2');
document.querySelector('[data-action="pet-tree"]').click();
assert.match(app.innerHTML,/pet-flow-tree/,'nine-tier pet tree must render');
assert.doesNotMatch(app.innerHTML,/<h2>技能路線<\/h2>|覺醒 Lv\.|強化 Lv\.|結晶 [0-9]+ · 強化完成/,'removed labels must stay gone');
for(const [pet,next] of [['fox','owl'],['owl','dragon'],['dragon',null]]){
  const rows=[...app.innerHTML.matchAll(/class="pet-flow-tier pet-flow-tier-(1|2|4) pet-flow-stage-([1-9])"/g)];
  assert.deepEqual(rows.map(x=>Number(x[1])),[1,1,1,2,2,2,4,4,4],'skill rows must follow 1,1,1,2,2,2,4,4,4');
  assert.equal((app.innerHTML.match(new RegExp('data-pet-skill="'+pet+'[|]'+pet+'-flow-','g'))||[]).length,21,'all 21 visible skill nodes belong to selected pet');
  if(next)document.querySelector('[data-pet="'+next+'"]').click();
}
document.querySelector('[data-action="setup-back"]').click();
assert.match(app.innerHTML,/data-action="pet-tree"/,'return from pet menu must preserve original home navigation');

document.querySelector('[data-action="equipment"]').click();
assert.match(app.innerHTML,/class="setup-screen system-screen equipment-screen"/,'equipment layout must use scoped responsive styles');
assert.match(app.innerHTML,/class="equip-groups"/,'equipped items remain visible');
assert.match(app.innerHTML,/class="inventory-list"/,'warehouse remains visible');
const equipmentMarkup=fs.readFileSync(new URL('../src/game-core.js',import.meta.url),'utf8');
assert.match(equipmentMarkup,/class="loot-item equipment-inventory-item quality-border-/,'warehouse item cards need a stable image-left layout');
assert.match(equipmentMarkup,/class="equipment-item-content"/,'item text and actions must share the right column');
const inventoryPattern=equipmentMarkup.match(/class="equipment-item-actions"[\s\S]*?<\/div>/);
assert.ok(inventoryPattern,'warehouse item action group is missing');
for(const action of ['data-enhance-equip','data-crystallize','data-equip'])assert.ok(equipmentMarkup.includes(action),'warehouse action missing: '+action);
assert.ok(equipmentMarkup.indexOf('class="equipment-item-info"')<equipmentMarkup.indexOf('class="loot-item-actions equipment-item-actions"'),'name and detail must come before the actions');
assert.match(homeStyles,/\.equipment-screen \.inventory-list \.equipment-inventory-item\s*\{[^}]*grid-template-columns:90px minmax\(0,1fr\)/,'desktop equipment inventory must have two columns');
assert.match(homeStyles,/@media\(max-width:700px\)[\s\S]*?\.equipment-screen \.inventory-list \.equipment-inventory-item\s*\{[^}]*grid-template-columns:74px minmax\(0,1fr\)/,'mobile equipment inventory must reserve a left image column');
assert.match(homeStyles,/\.equipment-screen \.equipment-inventory-item \.equipment-item-actions\s*\{[^}]*display:grid!important/,'scoped grid must override legacy flex layout');
const fontCss=fs.readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
assert.match(fontCss,/family=Noto\+Sans\+TC/,'load Traditional Chinese font');
assert.match(fontCss,/font-family:"Noto Sans TC","PingFang TC","Microsoft JhengHei"/,'ensure Chinese system-font fallbacks');
document.querySelector('[data-action="setup-back"]').click();
assert.match(app.innerHTML,/data-action="equipment"/,'return from equipment must preserve home navigation');

document.querySelector('[data-action="quests"]').click();
assert.doesNotMatch(app.innerHTML,/<h1>每日任務<\/h1>|今日 .*重置|<b>結晶 [0-9]+<\/b>/);
assert.match(app.innerHTML,/data-daily-chest/);
assert.doesNotMatch(app.innerHTML,/英文學習與冒險成就/,'achievement claims belong only to achievements');
document.querySelector('[data-action="setup-back"]').click();
document.querySelector('[data-action="achievements"]').click();
for(const heading of ['單字精熟成就','裝備收集成就','稱號收藏'])assert.ok(app.innerHTML.includes(heading),heading+' missing');
assert.doesNotMatch(app.innerHTML,/成就殿堂|英文學習與冒險成就|<b>識字冒險者<\/b><\/div>/,'removed achievement headings stay hidden');
assert.match(app.innerHTML,/data-equip-title=/,'earned title must be equippable from achievement screen');
assert.doesNotMatch(app.innerHTML,/data-daily-chest/,'daily chest belongs only to quests');
document.querySelector('[data-action="setup-back"]').click();
document.querySelector('[data-action="collection"]').click();
assert.doesNotMatch(app.innerHTML,/collection-rewards/,'collection rewards must move to achievements');
document.querySelector('[data-collection-tab="words"]').click();
assert.doesNotMatch(app.innerHTML,/單字精熟系統|首次作答才收錄|累積答對 1 次|答錯 0 次/,'requested verbose word-book text must be removed');
assert.match(app.innerHTML,/data-word-speak="0"/,'collected words must be playable');
assert.doesNotMatch(app.innerHTML,/🔊/,'card itself plays pronunciation without speaker art');
document.querySelector('[data-word-speak="0"]').click();
assert.equal(spoken.length,1,'clicking word card must speak exactly once');
assert.equal(spoken[0].lang,'en-US');
assert.doesNotMatch(app.innerHTML,/data-word-title=/,'title selection must move out of vocabulary collection');
document.querySelector('[data-action="setup-back"]').click();
document.querySelector('[data-action="community"]').click();
assert.match(app.innerHTML,/data-community-share/);assert.match(app.innerHTML,/data-social-app|id="social-app"/);
assert.match(app.innerHTML,/data-community-pk/);assert.doesNotMatch(app.innerHTML,/<h1>社群<\/h1>/);
await document.querySelector('[data-community-copy]').click();
assert.match(clipboard,/Word RPG/);
assert.match(clipboard,/https:\/\/word-rpg\.redfisharthur\.workers\.dev\//);
console.log('P1 UI hubs: third icon row, separate quests/achievements, centralized titles, and working community invite: PASS');
