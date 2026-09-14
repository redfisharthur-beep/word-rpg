import { ASSETS, visual } from './assets.js';
import { createPkMode } from './pk.js';

const app=document.querySelector('#app');
const SAVE_KEY='word-rpg-v4';
const WORDS=[
['apple','蘋果',['蘋果','香蕉','牛奶','麵包']],['book','書',['書','筆','桌子','門']],['cat','貓',['貓','狗','鳥','魚']],['run','跑步',['跑步','睡覺','坐下','吃飯']],['happy','開心的',['開心的','生氣的','疲累的','害怕的']],['water','水',['水','果汁','牛奶','茶']],['friend','朋友',['朋友','老師','醫生','學生']],['school','學校',['學校','公園','醫院','商店']],['green','綠色的',['綠色的','紅色的','藍色的','黃色的']],['small','小的',['小的','大的','高的','長的']],['river','河流',['河流','山','天空','森林']],['forest','森林',['森林','海洋','沙漠','城市']],['cloud','雲',['雲','雨','風','雪']],['quiet','安靜的',['安靜的','吵鬧的','快速的','明亮的']],['brave','勇敢的',['勇敢的','害怕的','疲累的','孤單的']],['follow','跟隨',['跟隨','離開','等待','停止']],['listen','聆聽',['聆聽','觀看','觸摸','奔跑']],['light','光',['光','影子','聲音','煙霧']],['path','小徑',['小徑','橋','房間','屋頂']],['rabbit','兔子',['兔子','狐狸','老虎','烏龜']],['protect','保護',['保護','攻擊','忘記','丟棄']],['whisper','低語',['低語','大叫','跳躍','哭泣']],['bridge','橋',['橋','道路','城堡','洞穴']],['stone','石頭',['石頭','木頭','葉子','花朵']],['deep','深的',['深的','淺的','短的','薄的']],['danger','危險',['危險','和平','秘密','希望']],['search','尋找',['尋找','隱藏','關閉','推動']],['across','穿越',['穿越','下面','旁邊','後面']],['sudden','突然的',['突然的','緩慢的','平靜的','柔軟的']],['bubble','泡泡',['泡泡','火焰','冰塊','沙子']]
];
const ROLES={
 warrior:{name:'戰士',art:ASSETS.role.warrior,base:{hp:165,atk:20,def:8},trait:'格擋後，下次強攻更痛'},
 mage:{name:'法師',art:ASSETS.role.mage,base:{hp:140,atk:24,def:4},trait:'蓄能後，下一擊爆發'},
 archer:{name:'弓手',art:ASSETS.role.archer,base:{hp:150,atk:22,def:5},trait:'連續答對時，攻擊成長最快'}
};
const PETS={
 fox:{name:'靈狐',art:ASSETS.pet.fox,trait:'連對 3 次，追加追擊'},
 owl:{name:'夜梟',art:ASSETS.pet.owl,trait:'每戰第一次答錯，傷害減半'},
 dragon:{name:'幼龍',art:ASSETS.pet.dragon,trait:'爆發攻擊額外增加傷害'}
};
const STAGES=[
 {name:'苔球獸',art:ASSETS.enemy.moss,hp:115,atk:18,intents:['attack','guard','attack']},
 {name:'霧角兔',art:ASSETS.enemy.rabbit,hp:155,atk:22,intents:['guard','attack','charge']},
 {name:'木甲蟲',art:ASSETS.enemy.beetle,hp:205,atk:26,intents:['guard','charge','attack']},
 {name:'影語王',art:ASSETS.enemy.shadowKing,hp:290,atk:31,intents:['charge','attack','guard','attack'],boss:true}
];
const TACTICS={
 strike:{name:'強攻',hint:'敵人蓄力時最有效'},
 guard:{name:'守勢',hint:'敵人攻擊時降低傷害'},
 focus:{name:'蓄能',hint:'下一次強攻大幅提升'}
};
const UPGRADES=[
 {id:'power',name:'強攻成長',desc:'強攻傷害 +20%',apply:r=>r.power*=1.2},
 {id:'guard',name:'守勢成長',desc:'格擋效果 +15%',apply:r=>r.guard+=.15},
 {id:'focus',name:'蓄能成長',desc:'蓄能倍率 +25%',apply:r=>r.focus+=.25},
 {id:'hp',name:'生命成長',desc:'最大生命 +25',apply:r=>{r.maxHp+=25;r.hp=Math.min(r.maxHp,r.hp+25)}},
 {id:'combo',name:'連擊成長',desc:'每次連對再 +5% 傷害',apply:r=>r.comboAmp+=.05},
 {id:'heal',name:'回復成長',desc:'每場勝利多回復 12 HP',apply:r=>r.winHeal+=12}
];

let meta=loadMeta(),screen='home',run=null,selectedTactic=null,answerState=null,upgradeChoices=[],anim='',pkMode=null;
const shuffle=a=>{const c=[...a];for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]];}return c};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function loadMeta(){try{return {...{role:'warrior',pet:'fox',playerName:''},...JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')}}catch{return {role:'warrior',pet:'fox',playerName:''}}}
function saveMeta(){localStorage.setItem(SAVE_KEY,JSON.stringify(meta))}
function question(){const w=pick(WORDS);return {word:w[0],answer:w[1],options:shuffle(w[2])}}
function role(){return ROLES[run?.role||meta.role]}
function pet(){return PETS[run?.pet||meta.pet]}
function stage(){return STAGES[run.stageIndex]}
function startRun(){const b=ROLES[meta.role].base;run={role:meta.role,pet:meta.pet,stageIndex:0,hp:b.hp,maxHp:b.hp,atk:b.atk,def:b.def,enemyHp:STAGES[0].hp,turn:0,streak:0,focusReady:1,power:1,guard:.5,focus:.65,comboAmp:.05,winHeal:8,owlSave:true,q:question()};screen='battle';selectedTactic=null;answerState=null;render()}
function resetEnemy(){run.enemyHp=stage().hp;run.turn=0;run.focusReady=1;run.owlSave=true;run.q=question();selectedTactic=null;answerState=null}
function openSetup(){const el=document.querySelector('#player-name');const name=(el?.value||meta.playerName).trim();if(!name){el?.focus();return}meta.playerName=name;saveMeta();screen='setup';render()}
function startPk(){pkMode?.stop(false);pkMode=createPkMode({app,meta,ROLES,PETS,WORDS,visual,onExit:()=>{pkMode=null;screen='setup';render()}});pkMode.start()}
function enemyIntent(){return stage().intents[run.turn%stage().intents.length]}
function intentName(i){return i==='attack'?'攻擊':i==='guard'?'防守':'蓄力'}
function chooseTactic(id){if(!TACTICS[id]||answerState)return;selectedTactic=id;run.q=question();render()}
function answer(value){if(!selectedTactic||answerState)return;const correct=value===run.q.answer;answerState={selected:value,correct};render();setTimeout(()=>resolveTurn(correct),380)}
function resolveTurn(correct){const intent=enemyIntent(),r=role();let dealt=0,received=0;let quality=correct?1:.28;if(selectedTactic==='strike'){
 let mult=run.power*run.focusReady*(1+run.streak*run.comboAmp);if(intent==='charge')mult*=1.35;if(intent==='guard')mult*=.65;if(r===ROLES.archer&&correct)mult*=1+Math.min(.35,run.streak*.04);if(r===ROLES.mage&&run.focusReady>1)mult*=1.15;if(run.pet==='dragon'&&run.focusReady>1)mult*=1.18;dealt=Math.max(1,Math.round(run.atk*mult*quality));run.focusReady=1;
 }else if(selectedTactic==='guard'){
 dealt=Math.max(1,Math.round(run.atk*.28*quality));if(correct&&r===ROLES.warrior)run.focusReady=Math.max(run.focusReady,1.3);
 }else{
 dealt=Math.max(1,Math.round(run.atk*.12*quality));if(correct)run.focusReady=1+run.focus;
 }
 if(correct){run.streak++;if(run.pet==='fox'&&run.streak%3===0)dealt+=Math.round(run.atk*.55)}else run.streak=0;
 run.enemyHp=Math.max(0,run.enemyHp-dealt);
 if(run.enemyHp>0){let enemyMult=intent==='charge'?.25:intent==='guard'?.55:1;if(intent==='attack')enemyMult=1.2;let reduction=run.def;if(selectedTactic==='guard')reduction+=stage().atk*run.guard*(correct?1:.35);received=Math.max(0,Math.round(stage().atk*enemyMult-reduction));if(!correct&&run.pet==='owl'&&run.owlSave){received=Math.round(received*.5);run.owlSave=false}run.hp=Math.max(0,run.hp-received)}
 anim='impact';render();setTimeout(()=>{anim='';if(run.enemyHp<=0)return clearStage();if(run.hp<=0){screen='end';return render()}run.turn++;selectedTactic=null;answerState=null;run.q=question();render()},520)}
function clearStage(){run.hp=Math.min(run.maxHp,run.hp+run.winHeal);if(run.stageIndex>=STAGES.length-1){screen='win';return render()}upgradeChoices=shuffle(UPGRADES).slice(0,3);screen='upgrade';render()}
function takeUpgrade(id){const u=UPGRADES.find(x=>x.id===id);if(!u)return;u.apply(run);run.stageIndex++;resetEnemy();screen='battle';render()}
function renderHome(){return `<main class="home-screen"><section class="home-panel home-login"><input id="player-name" value="${esc(meta.playerName)}" maxlength="16" placeholder="輸入名字"><button class="line-image-btn" data-action="line-login" aria-label="LINE 登入"></button><button class="fight-hotspot" data-action="setup" aria-label="進入遊戲"></button></section></main>`}
function slot(id){return `<span class="asset-slot" data-asset="${id}"></span>`}
function renderSetup(){return `<main class="setup-screen"><section class="setup-card"><h1>選擇角色</h1><div class="pick-grid">${Object.entries(ROLES).map(([id,x])=>`<button class="pick-card ${meta.role===id?'active':''}" data-role="${id}">${visual(x.art,'','pick-art')}<b>${x.name}</b><small>${x.trait}</small></button>`).join('')}</div><h1>選擇夥伴</h1><div class="pick-grid pets">${Object.entries(PETS).map(([id,x])=>`<button class="pick-card ${meta.pet===id?'active':''}" data-pet="${id}">${visual(x.art,'','pick-art')}<b>${x.name}</b><small>${x.trait}</small></button>`).join('')}</div><div class="setup-actions"><button class="primary-btn" data-action="start">開始冒險</button><button class="secondary-btn" data-action="pk">線上對戰</button></div></section></main>`}
function renderBattle(){const s=stage(),intent=enemyIntent(),hp=clamp(run.hp/run.maxHp*100,0,100),ehp=clamp(run.enemyHp/s.hp*100,0,100);return `<main class="battle-screen ${anim}"><header class="battle-top"><button class="text-btn" data-action="quit">返回</button><b>${meta.playerName}</b><span>連續 ${run.streak}</span></header><section class="combat-stage"><div class="fighter hero">${visual(role().art,'','fighter-art')}<div class="name-line">${role().name}</div><div class="hp"><i style="width:${hp}%"></i></div></div><div class="battle-center"><strong>${intentName(intent)}</strong><small>敵人下一步</small></div><div class="fighter enemy">${visual(s.art,'','fighter-art')}<div class="name-line">${s.name}</div><div class="hp enemy-hp"><i style="width:${ehp}%"></i></div></div></section>${selectedTactic?renderQuestion():renderTactics()}</main>`}
function renderTactics(){return `<section class="tactic-area"><h1>這回合怎麼打？</h1><div class="tactic-grid">${Object.entries(TACTICS).map(([id,x])=>`<button class="tactic-card" data-tactic="${id}">${slot('tactic-'+id)}<b>${x.name}</b><small>${x.hint}</small></button>`).join('')}</div></section>`}
function renderQuestion(){const q=run.q;return `<section class="word-area"><div class="chosen-tactic">${TACTICS[selectedTactic].name}</div><h2>${q.word}</h2><div class="answer-grid">${q.options.map(o=>`<button class="answer-btn ${answerState&&o===q.answer?'right':''} ${answerState&&o===answerState.selected&&!answerState.correct?'wrong':''}" data-answer="${o}" ${answerState?'disabled':''}>${o}</button>`).join('')}</div></section>`}
function renderUpgrade(){return `<main class="upgrade-screen"><section class="upgrade-card"><h1>選一個成長方向</h1><div class="upgrade-grid">${upgradeChoices.map(u=>`<button data-upgrade="${u.id}">${slot('upgrade-'+u.id)}<b>${u.name}</b><small>${u.desc}</small></button>`).join('')}</div></section></main>`}
function renderEnd(win=false){return `<main class="result-screen"><section class="result-card"><h1>${win?'完成冒險':'挑戰失敗'}</h1><button class="primary-btn" data-action="retry">再試一次</button><button class="secondary-btn" data-action="home">回首頁</button></section></main>`}
function render(){app.innerHTML=screen==='home'?renderHome():screen==='setup'?renderSetup():screen==='battle'?renderBattle():screen==='upgrade'?renderUpgrade():screen==='win'?renderEnd(true):renderEnd(false);bind()}
function bind(){document.querySelector('[data-action="setup"]')?.addEventListener('click',openSetup);document.querySelector('[data-action="start"]')?.addEventListener('click',startRun);document.querySelector('[data-action="pk"]')?.addEventListener('click',startPk);document.querySelector('[data-action="quit"]')?.addEventListener('click',()=>{screen='setup';render()});document.querySelector('[data-action="retry"]')?.addEventListener('click',startRun);document.querySelector('[data-action="home"]')?.addEventListener('click',()=>{screen='home';render()});document.querySelector('[data-action="line-login"]')?.addEventListener('click',()=>alert('LINE 登入尚未設定'));document.querySelectorAll('[data-role]').forEach(el=>el.addEventListener('click',()=>{meta.role=el.dataset.role;saveMeta();render()}));document.querySelectorAll('[data-pet]').forEach(el=>el.addEventListener('click',()=>{meta.pet=el.dataset.pet;saveMeta();render()}));document.querySelectorAll('[data-tactic]').forEach(el=>el.addEventListener('click',()=>chooseTactic(el.dataset.tactic)));document.querySelectorAll('[data-answer]').forEach(el=>el.addEventListener('click',()=>answer(el.dataset.answer)));document.querySelectorAll('[data-upgrade]').forEach(el=>el.addEventListener('click',()=>takeUpgrade(el.dataset.upgrade)))}
render();
