import { WORDS } from './game-data.js';
import { ASSETS, visual } from './assets.js';

const app=document.querySelector('#app');
const SAVE_KEY='word-rpg-v2-prototype';

const ROLES={
  warrior:{id:'warrior',name:'戰士',icon:'⚔️',art:ASSETS.role.warrior,desc:'破陣時獲得護盾'},
  mage:{id:'mage',name:'法師',icon:'🪄',art:ASSETS.role.mage,desc:'每回合第一次答對返還 1 能量'},
  archer:{id:'archer',name:'弓手',icon:'🏹',art:ASSETS.role.archer,desc:'每回合第一次答對額外造成 5 傷害'},
};

const CARD_POOL={
  strike:{id:'strike',name:'斬擊',icon:'⚔️',cost:1,text:'造成 8 傷害',boost:'答對：14 傷害',base:{damage:8},power:{damage:14}},
  guard:{id:'guard',name:'守護',icon:'🛡️',cost:1,text:'獲得 7 護盾',boost:'答對：12 護盾',base:{block:7},power:{block:12}},
  break:{id:'break',name:'破陣',icon:'💥',cost:1,text:'Break +2',boost:'答對：Break +4',base:{break:2},power:{break:4}},
  heavy:{id:'heavy',name:'重擊',icon:'🔨',cost:2,text:'造成 16 傷害',boost:'答對：25 傷害',base:{damage:16},power:{damage:25}},
  focus:{id:'focus',name:'蓄勢',icon:'✦',cost:1,text:'下次攻擊 +7',boost:'答對：+12',base:{focus:7},power:{focus:12}},
  riposte:{id:'riposte',name:'反擊',icon:'↩️',cost:1,text:'護盾 5；受攻擊後反傷 5',boost:'答對：護盾 9、反傷 9',base:{block:5,riposte:5},power:{block:9,riposte:9}},
  flurry:{id:'flurry',name:'連射',icon:'➶',cost:1,text:'造成 10 傷害',boost:'答對：14 傷害',base:{damage:10},power:{damage:14}},
  mend:{id:'mend',name:'回息',icon:'🌿',cost:1,text:'回復 4 HP',boost:'答對：回復 8 HP',base:{heal:4},power:{heal:8}},
};

const ENEMIES={
  moss:{id:'moss',name:'苔球獸',art:ASSETS.enemy.moss,icon:'🟢',hp:48,breakMax:5,intents:[{kind:'attack',value:9,label:'撞擊 9'},{kind:'guard',value:8,label:'硬化・護甲 8'},{kind:'attack',value:13,label:'蓄力撞擊 13'}]},
  rabbit:{id:'rabbit',name:'霧角兔',art:ASSETS.enemy.rabbit,icon:'🐇',hp:58,breakMax:5,intents:[{kind:'attack',value:8,label:'突進 8'},{kind:'dodge',value:0,label:'殘影・下次傷害減半'},{kind:'attack',value:15,label:'角擊 15'}]},
  bubble:{id:'bubble',name:'泡泡怪',art:ASSETS.enemy.bubble,icon:'🫧',hp:64,breakMax:6,intents:[{kind:'heal',value:9,label:'治癒・回復 9'},{kind:'attack',value:11,label:'水彈 11'},{kind:'attack',value:17,label:'膨脹爆破 17'}]},
  beetle:{id:'beetle',name:'木甲蟲',art:ASSETS.enemy.beetle,icon:'🪲',hp:82,breakMax:7,intents:[{kind:'guard',value:12,label:'甲殼・護甲 12'},{kind:'attack',value:14,label:'角撞 14'},{kind:'attack',value:20,label:'重踏 20'}]},
  shadow:{id:'shadow',name:'影語王',art:ASSETS.enemy.shadowKing,icon:'👁️',hp:120,breakMax:8,intents:[{kind:'attack',value:13,label:'影襲 13'},{kind:'drain',value:9,label:'吞噬・傷害 9 / 回復 9'},{kind:'curse',value:0,label:'暗語・下回合少 1 能量'},{kind:'attack',value:23,label:'暮色爆發 23'}]},
};

let meta=loadMeta();
let screen='home';
let run=null;
let pendingCard=null;
let pendingQuestion=null;

function loadMeta(){try{return {...{role:'warrior',best:0,runs:0,wins:0},...JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')}}catch{return {role:'warrior',best:0,runs:0,wins:0}}}
function saveMeta(){localStorage.setItem(SAVE_KEY,JSON.stringify(meta));}
function role(){return ROLES[run?.role||meta.role]||ROLES.warrior;}
function imgEnemy(e){return visual(e.art,e.icon,'enemy-art-v2');}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}
function shuffle(a){const c=[...a];for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]];}return c;}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function hasRelic(id){return !!run?.relics?.some(x=>x.id===id);}

function freshDeck(roleId){const common=['strike','strike','guard','guard','break','focus'];if(roleId==='warrior')return [...common,'heavy','riposte'];if(roleId==='mage')return [...common,'mend','focus'];return [...common,'flurry','flurry'];}
function buildRoute(){return [
  [{type:'battle',enemy:'moss',icon:'⚔️',title:'苔蘚伏擊',sub:'穩定・普通戰鬥'},{type:'battle',enemy:'rabbit',icon:'⚔️',title:'霧角追獵',sub:'高風險・殘影敵人'}],
  shuffle([{type:'event',icon:'?',title:'迷霧事件',sub:'未知選擇'},{type:'camp',icon:'🔥',title:'營火',sub:'回復或鍛造'}]),
  shuffle([{type:'battle',enemy:'bubble',icon:'⚔️',title:'靜水異動',sub:'會自我回復'},{type:'battle',enemy:'rabbit',icon:'⚔️',title:'霧林追擊',sub:'速度與閃避'}]),
  shuffle([{type:'treasure',icon:'🎁',title:'遺物寶箱',sub:'永久改變這一局'},{type:'event',icon:'?',title:'古樹低語',sub:'風險與報酬'}]),
  [{type:'elite',enemy:'beetle',icon:'☠️',title:'木甲守門者',sub:'菁英・高分高獎勵'},{type:'camp',icon:'🔥',title:'最後營火',sub:'保命或鍛造'}],
  [{type:'boss',enemy:'shadow',icon:'👁️',title:'影語王',sub:'最終戰'}]
];}
function makeGhosts(){return shuffle([{name:'Mika',score:620+Math.floor(Math.random()*100)},{name:'Nox',score:700+Math.floor(Math.random()*120)},{name:'Rin',score:790+Math.floor(Math.random()*100)}]);}
function startRun(){run={role:meta.role,hp:68,maxHp:68,gold:0,score:0,step:0,route:buildRoute(),deck:freshDeck(meta.role),relics:[],ghosts:makeGhosts(),battle:null,lastReward:null,won:false};screen='map';render();}

function render(){app.innerHTML=`<main class="v2-shell">${screen==='home'?renderHome():screen==='map'?renderMap():screen==='battle'?renderBattle():screen==='reward'?renderReward():screen==='event'?renderEvent():screen==='camp'?renderCamp():screen==='treasure'?renderTreasure():screen==='end'?renderEnd():renderHome()}</main>${pendingQuestion?renderQuizModal():''}`;bind();}

function renderHome(){const r=ROLES[meta.role];return `<section class="home-v2"><div class="brand-v2">WORD//RIFT <span>V2 PROTOTYPE</span></div><div class="home-hero">${visual(r.art,r.icon,'hero-art-v2')}<div><small>選擇勇者</small><h1>${r.name}</h1><p>${r.desc}</p></div></div><div class="role-switch">${Object.values(ROLES).map(x=>`<button class="role-chip ${x.id===meta.role?'active':''}" data-role="${x.id}">${x.icon} ${x.name}</button>`).join('')}</div><button class="start-run" data-action="start-run">開始一次冒險 <b>→</b></button><div class="home-stats"><span>最佳分數 <b>${meta.best||0}</b></span><span>通關 <b>${meta.wins||0}</b></span><span>嘗試 <b>${meta.runs||0}</b></span></div><p class="prototype-note">測試重點：選路、出牌、Build、想不想再跑一次。帶 <b>WORD BOOST</b> 的牌才考英文。幽靈對手目前是離線玩法測試，不是真人即時資料。</p></section>`;}

function renderHeader(){return `<header class="run-head"><button data-action="quit">×</button><div><b>${role().name}</b><small>RIFT ${Math.min(run.step+1,6)}/6</small></div><div class="run-res">❤️ ${run.hp}/${run.maxHp}　◈ ${run.gold}</div></header>`;}
function ghostRank(){return 1+run.ghosts.filter(g=>g.score>run.score).length;}
function renderMap(){const options=run.route[run.step]||[];return `${renderHeader()}<section class="map-v2"><div class="map-title"><small>CHOOSE YOUR PATH</small><h2>${run.step===5?'最後一步':'下一步走哪裡？'}</h2><p>安全、資源、牌組強度，不能全部都要。</p></div><div class="route-progress">${[0,1,2,3,4,5].map(i=>`<i class="${i<run.step?'done':i===run.step?'now':''}"></i>`).join('')}</div><div class="node-options">${options.map((n,i)=>`<button class="route-node ${n.type}" data-node="${i}"><span>${n.icon}</span><div><b>${n.title}</b><small>${n.sub}</small></div><em>→</em></button>`).join('')}</div><div class="ghost-strip"><small>GHOST RACE</small><b>目前第 ${ghostRank()}/4</b><span>你 ${run.score}　·　${run.ghosts.map(g=>`${g.name} ${g.score}`).join('　')}</span></div><div class="build-strip"><span>牌組 ${run.deck.length}</span><span>◈ ${run.gold}</span>${run.relics.length?run.relics.map(x=>`<b>${x.icon} ${x.name}</b>`).join(''):'<b>尚無遺物</b>'}</div></section>`;}

function enterNode(index){const n=run.route[run.step]?.[index];if(!n)return;if(['battle','elite','boss'].includes(n.type)){startBattle(n.enemy,n.type);return;}screen=n.type;render();}
function startBattle(enemyId,kind='battle'){const e=structuredClone(ENEMIES[enemyId]);if(kind==='elite')e.hp+=10;if(kind==='boss')e.hp+=8;const energy=hasRelic('battery')?4:3;run.battle={kind,enemy:e,enemyHp:e.hp,enemyBlock:0,enemyBreak:0,enemyDodge:false,intentIndex:0,playerBlock:0,energy,maxEnergy:energy,hand:[],drawPile:shuffle([...run.deck]),discard:[],focus:0,riposte:0,turn:1,roleProc:false,energyPenalty:0,log:'先看敵人意圖，再決定出牌順序。'};drawHand();screen='battle';render();}
function drawHand(){const b=run.battle;b.hand=[];while(b.hand.length<4){if(!b.drawPile.length){b.drawPile=shuffle(b.discard);b.discard=[];}if(!b.drawPile.length)break;b.hand.push({uid:crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`,id:b.drawPile.pop(),rune:false});}shuffle(b.hand.map((_,i)=>i)).slice(0,Math.min(2,b.hand.length)).forEach(i=>b.hand[i].rune=true);}
function currentIntent(){const b=run.battle;return b.enemy.intents[b.intentIndex%b.enemy.intents.length];}
function renderBattle(){const b=run.battle,e=b.enemy,intent=currentIntent(),hp=clamp(b.enemyHp/e.hp*100,0,100),br=clamp(b.enemyBreak/e.breakMax*100,0,100);return `${renderHeader()}<section class="battle-v2"><div class="enemy-zone"><div class="intent-v2"><small>敵人下一步</small><b>${intent.label}</b></div>${imgEnemy(e)}<h2>${e.name}</h2><div class="enemy-bars"><div><span>HP ${Math.max(0,b.enemyHp)}/${e.hp}</span><i><em style="width:${hp}%"></em></i></div><div><span>BREAK ${b.enemyBreak}/${e.breakMax}</span><i class="break"><em style="width:${br}%"></em></i></div></div>${b.enemyBlock?`<div class="float-tag">🛡 ${b.enemyBlock}</div>`:''}</div><div class="turn-line"><span>Turn ${b.turn}</span><b>${b.log}</b></div><div class="player-line"><span>❤️ ${run.hp}</span><span>🛡 ${b.playerBlock}</span><span>✦ ${b.energy}/${b.maxEnergy}</span>${b.focus?`<span>⚡ +${b.focus}</span>`:''}</div><div class="hand-v2">${b.hand.map(c=>renderCard(c)).join('')}</div><button class="end-turn" data-action="end-turn">結束回合</button></section>`;}
function renderCard(c){const card=CARD_POOL[c.id],disabled=run.battle.energy<card.cost;return `<button class="card-v2 ${c.rune?'rune':''}" data-card="${c.uid}" ${disabled?'disabled':''}><div class="card-cost">${card.cost}</div>${c.rune?'<div class="rune-label">WORD BOOST</div>':''}<span class="card-icon">${card.icon}</span><b>${card.name}</b><p>${card.text}</p>${c.rune?`<small>${card.boost}</small>`:'<small>直接使用</small>'}</button>`;}

function chooseCard(uid){const b=run.battle,item=b.hand.find(x=>x.uid===uid);if(!item)return;const card=CARD_POOL[item.id];if(b.energy<card.cost)return;if(item.rune){pendingCard=uid;pendingQuestion=makeQuestion();render();return;}playCard(uid,false);}
function makeQuestion(){const w=pick(WORDS.slice(0,40));return {word:w.word,answer:w.zh,options:shuffle([...w.options])};}
function answerQuiz(answer){if(!pendingQuestion||!pendingCard)return;const correct=answer===pendingQuestion.answer,uid=pendingCard;pendingCard=null;pendingQuestion=null;playCard(uid,correct);}
function renderQuizModal(){return `<div class="quiz-backdrop"><section class="quiz-modal"><div class="quiz-kicker">WORD BOOST</div><h2>${pendingQuestion.word}</h2><p>選對就強化這張牌；答錯仍然會出牌。</p><div class="quiz-options">${pendingQuestion.options.map(o=>`<button data-quiz="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join('')}</div></section></div>`;}

function playCard(uid,powered){const b=run.battle,item=b.hand.find(x=>x.uid===uid);if(!item)return;const card=CARD_POOL[item.id];if(b.energy<card.cost)return;b.energy-=card.cost;const effect=powered?card.power:card.base;let notes=[];
  if(effect.damage){let dmg=effect.damage+b.focus+(hasRelic('sharp')?2:0);b.focus=0;if(run.role==='archer'&&powered&&!b.roleProc){dmg+=5;b.roleProc=true;notes.push('弓手追擊 +5');}if(b.enemyDodge){dmg=Math.ceil(dmg/2);b.enemyDodge=false;notes.push('殘影減傷');}const absorbed=Math.min(b.enemyBlock,dmg);b.enemyBlock-=absorbed;dmg-=absorbed;b.enemyHp-=dmg;notes.push(`傷害 ${dmg}`);}
  if(effect.block){b.playerBlock+=effect.block;notes.push(`護盾 +${effect.block}`);}
  if(effect.break){b.enemyBreak+=effect.break;notes.push(`Break +${effect.break}`);if(run.role==='warrior'){b.playerBlock+=3;notes.push('戰士護盾 +3');}if(b.enemyBreak>=b.enemy.breakMax){b.enemyBreak=0;b.enemy.stunned=true;notes.push('BREAK！敵人暈眩');}}
  if(effect.focus){b.focus+=effect.focus;notes.push(`下次攻擊 +${effect.focus}`);}
  if(effect.riposte)b.riposte=Math.max(b.riposte,effect.riposte);
  if(effect.heal){const before=run.hp;run.hp=Math.min(run.maxHp,run.hp+effect.heal);notes.push(`回復 ${run.hp-before}`);}
  if(powered&&run.role==='mage'&&!b.roleProc){b.energy=Math.min(b.maxEnergy,b.energy+1);b.roleProc=true;notes.push('法師返還 1 能量');}
  b.log=`${powered?'✓ 強化':'普通'}・${card.name}｜${notes.join('・')}`;b.discard.push(item.id);b.hand=b.hand.filter(x=>x.uid!==uid);if(b.enemyHp<=0){winBattle();return;}render();}

function endTurn(){const b=run.battle;if(!b)return;const killed=enemyAct();if(killed)return;if(run.hp<=0){endRun(false);return;}b.turn+=1;b.energy=Math.max(1,b.maxEnergy-b.energyPenalty);b.energyPenalty=0;b.playerBlock=0;b.roleProc=false;drawHand();render();}
function enemyAct(){const b=run.battle,intent=currentIntent();if(b.enemy.stunned){b.enemy.stunned=false;b.log='BREAK！敵人本回合無法行動';b.intentIndex++;return false;}if(intent.kind==='attack'||intent.kind==='drain'){let dmg=intent.value,blocked=Math.min(b.playerBlock,dmg);dmg-=blocked;b.playerBlock-=blocked;run.hp=Math.max(0,run.hp-dmg);if(b.riposte&&intent.value>0){b.enemyHp-=b.riposte;b.log=`敵人造成 ${dmg} 傷害・反擊 ${b.riposte}`;}else b.log=`敵人造成 ${dmg} 傷害`;if(intent.kind==='drain'){b.enemyHp=Math.min(b.enemy.hp,b.enemyHp+intent.value);b.log+=`・敵人回復 ${intent.value}`;}}
  if(intent.kind==='guard'){b.enemyBlock+=intent.value;b.log=`敵人獲得 ${intent.value} 護甲`;}
  if(intent.kind==='heal'){b.enemyHp=Math.min(b.enemy.hp,b.enemyHp+intent.value);b.log=`敵人回復 ${intent.value}`;}
  if(intent.kind==='dodge'){b.enemyDodge=true;b.log='敵人進入殘影：下一次攻擊傷害減半';}
  if(intent.kind==='curse'){b.energyPenalty=1;b.log='暗語：你下回合少 1 能量';}
  b.riposte=0;b.intentIndex++;if(b.enemyHp<=0){winBattle();return true;}return false;}

function winBattle(){const b=run.battle;run.score+=b.kind==='boss'?500:b.kind==='elite'?220:100;run.gold+=b.kind==='boss'?0:b.kind==='elite'?35:20;if(b.kind==='boss'){endRun(true);return;}run.lastReward=shuffle(Object.keys(CARD_POOL)).slice(0,3);screen='reward';render();}
function renderReward(){return `${renderHeader()}<section class="reward-v2"><small>BATTLE WON</small><h2>拿新牌，還是保持牌組精簡？</h2><p>牌越多不一定越強；穩定抽到核心牌也是策略。</p><div class="reward-cards">${run.lastReward.map(id=>{const c=CARD_POOL[id];return `<button data-reward="${id}" class="reward-card"><span>${c.icon}</span><b>${c.name}</b><p>${c.text}</p><small>${c.boost}</small></button>`;}).join('')}</div><button class="skip-reward" data-action="skip-reward">不要新牌・改拿 ◈15</button></section>`;}
function takeReward(id){if(CARD_POOL[id])run.deck.push(id);advance();}
function skipReward(){run.gold+=15;advance();}
function advance(){run.step+=1;run.battle=null;run.lastReward=null;screen='map';render();}

function renderEvent(){const event=run.step<3?{title:'迷霧中的商人',text:'他願意用你的生命換一件強力遺物。'}:{title:'古樹的低語',text:'樹洞裡有一股力量，但你感覺它並不安全。'};return `${renderHeader()}<section class="event-v2"><div class="event-icon">?</div><small>RANDOM EVENT</small><h2>${event.title}</h2><p>${event.text}</p><div class="event-choices"><button data-event="risk"><b>冒險</b><span>-10 HP，獲得「鋒利符文」：所有攻擊 +2</span></button><button data-event="safe"><b>保守</b><span>獲得 ◈18，安全離開</span></button></div></section>`;}
function resolveEvent(type){if(type==='risk'){run.hp=Math.max(1,run.hp-10);if(!hasRelic('sharp'))run.relics.push({id:'sharp',icon:'🗡️',name:'鋒利符文'});}else run.gold+=18;advance();}

function renderCamp(){const canForge=run.gold>=30&&run.deck.includes('strike');return `${renderHeader()}<section class="event-v2 camp"><div class="event-icon">🔥</div><small>CAMP</small><h2>營火</h2><p>只能選一個。你要保命，還是花資源讓牌組更兇？</p><div class="event-choices"><button data-camp="heal"><b>休息</b><span>回復 22 HP</span></button><button data-camp="upgrade" ${canForge?'':'disabled'}><b>鍛造 ◈30</b><span>${canForge?'將一張斬擊升級成重擊':'金幣不足或沒有斬擊'}</span></button></div></section>`;}
function resolveCamp(type){if(type==='heal')run.hp=Math.min(run.maxHp,run.hp+22);else{if(run.gold<30)return;const idx=run.deck.indexOf('strike');if(idx<0)return;run.gold-=30;run.deck[idx]='heavy';}advance();}

function renderTreasure(){const choices=[{id:'heart',icon:'♥',name:'血石',text:'最大 HP +12，並回復 12'},{id:'battery',icon:'✦',name:'裂隙電池',text:'每回合最大能量 +1'}];return `${renderHeader()}<section class="event-v2 treasure"><div class="event-icon">🎁</div><small>TREASURE</small><h2>只拿一件</h2><div class="event-choices">${choices.map(x=>`<button data-treasure="${x.id}"><b>${x.icon} ${x.name}</b><span>${x.text}</span></button>`).join('')}</div></section>`;}
function takeTreasure(id){if(id==='heart'){run.maxHp+=12;run.hp=Math.min(run.maxHp,run.hp+12);run.relics.push({id:'heart',icon:'♥',name:'血石'});}else run.relics.push({id:'battery',icon:'✦',name:'裂隙電池'});advance();}

function endRun(won){meta.runs+=1;if(won)meta.wins+=1;meta.best=Math.max(meta.best,run.score);saveMeta();screen='end';run.won=won;render();}
function renderEnd(){const rank=ghostRank();return `<section class="end-v2"><div class="end-mark">${run.won?'👑':'☠️'}</div><small>${run.won?'RIFT CLEARED':'RUN ENDED'}</small><h1>${run.won?'你擊敗了影語王':'這次倒在裂隙裡'}</h1><div class="end-score">${run.score}<span>分</span></div><div class="ghost-finish">幽靈排名 <b>#${rank}/4</b>　${rank===1?'你超過所有測試對手':'再跑一局可以超車'}</div><div class="end-grid"><span>剩餘 HP <b>${run.hp}</b></span><span>牌組 <b>${run.deck.length}</b></span><span>遺物 <b>${run.relics.length}</b></span></div><button class="start-run" data-action="again">再跑一次 <b>↻</b></button><button class="back-home" data-action="home">回首頁</button></section>`;}

function quitRun(){if(confirm('放棄這次冒險？')){run=null;pendingCard=null;pendingQuestion=null;screen='home';render();}}
function bind(){document.querySelectorAll('[data-role]').forEach(el=>el.onclick=()=>{meta.role=el.dataset.role;saveMeta();render();});document.querySelector('[data-action="start-run"]')?.addEventListener('click',startRun);document.querySelector('[data-action="again"]')?.addEventListener('click',startRun);document.querySelector('[data-action="home"]')?.addEventListener('click',()=>{run=null;screen='home';render();});document.querySelector('[data-action="quit"]')?.addEventListener('click',quitRun);document.querySelectorAll('[data-node]').forEach(el=>el.onclick=()=>enterNode(Number(el.dataset.node)));document.querySelectorAll('[data-card]').forEach(el=>el.onclick=()=>chooseCard(el.dataset.card));document.querySelectorAll('[data-quiz]').forEach(el=>el.onclick=()=>answerQuiz(el.dataset.quiz));document.querySelector('[data-action="end-turn"]')?.addEventListener('click',endTurn);document.querySelectorAll('[data-reward]').forEach(el=>el.onclick=()=>takeReward(el.dataset.reward));document.querySelector('[data-action="skip-reward"]')?.addEventListener('click',skipReward);document.querySelectorAll('[data-event]').forEach(el=>el.onclick=()=>resolveEvent(el.dataset.event));document.querySelectorAll('[data-camp]').forEach(el=>el.onclick=()=>resolveCamp(el.dataset.camp));document.querySelectorAll('[data-treasure]').forEach(el=>el.onclick=()=>takeTreasure(el.dataset.treasure));}

render();
