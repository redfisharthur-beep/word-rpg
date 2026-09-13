import { ASSETS, visual } from './assets.js';

const app=document.querySelector('#app');
const SAVE_KEY='word-rpg-v3';

const WORDS=[
['apple','蘋果',['蘋果','香蕉','牛奶','麵包']],['book','書',['書','筆','桌子','門']],['cat','貓',['貓','狗','鳥','魚']],['run','跑步',['跑步','睡覺','坐下','吃飯']],['happy','開心的',['開心的','生氣的','疲累的','害怕的']],['water','水',['水','果汁','牛奶','茶']],['friend','朋友',['朋友','老師','醫生','學生']],['school','學校',['學校','公園','醫院','商店']],['green','綠色的',['綠色的','紅色的','藍色的','黃色的']],['small','小的',['小的','大的','高的','長的']],
['river','河流',['河流','山','天空','森林']],['forest','森林',['森林','海洋','沙漠','城市']],['cloud','雲',['雲','雨','風','雪']],['quiet','安靜的',['安靜的','吵鬧的','快速的','明亮的']],['brave','勇敢的',['勇敢的','害怕的','疲累的','孤單的']],['follow','跟隨',['跟隨','離開','等待','停止']],['listen','聆聽',['聆聽','觀看','觸摸','奔跑']],['light','光',['光','影子','聲音','煙霧']],['path','小徑',['小徑','橋','房間','屋頂']],['rabbit','兔子',['兔子','狐狸','老虎','烏龜']],
['protect','保護',['保護','攻擊','忘記','丟棄']],['whisper','低語',['低語','大叫','跳躍','哭泣']],['bridge','橋',['橋','道路','城堡','洞穴']],['stone','石頭',['石頭','木頭','葉子','花朵']],['deep','深的',['深的','淺的','短的','薄的']],['danger','危險',['危險','和平','秘密','希望']],['search','尋找',['尋找','隱藏','關閉','推動']],['across','穿越',['穿越','下面','旁邊','後面']],['sudden','突然的',['突然的','緩慢的','平靜的','柔軟的']],['bubble','泡泡',['泡泡','火焰','冰塊','沙子']]
];

const ROLES={
 warrior:{name:'戰士',art:ASSETS.role.warrior,icon:'⚔️',desc:'生命較高，升級偏坦克與反擊',base:{hp:120,atk:16,def:5}},
 mage:{name:'法師',art:ASSETS.role.mage,icon:'🪄',desc:'技能傷害高，容易走元素流',base:{hp:100,atk:18,def:3}},
 archer:{name:'弓手',art:ASSETS.role.archer,icon:'🏹',desc:'暴擊與連擊成長最快',base:{hp:108,atk:17,def:4}},
};

const ENEMY_STAGES=[
 {from:1,to:3,id:'moss',name:'苔球獸',art:ASSETS.enemy.moss,icon:'🟢',hp:58,atk:9},
 {from:4,to:6,id:'rabbit',name:'霧角兔',art:ASSETS.enemy.rabbit,icon:'🐇',hp:78,atk:12},
 {from:7,to:9,id:'beetle',name:'木甲蟲',art:ASSETS.enemy.beetle,icon:'🪲',hp:108,atk:16},
 {from:10,to:10,id:'shadow',name:'影語王',art:ASSETS.enemy.shadowKing,icon:'👁️',hp:170,atk:21,boss:true},
];

const UPGRADES=[
 {id:'atk',icon:'⚔️',name:'力量成長',desc:'攻擊 +20%',apply:r=>r.atk=Math.ceil(r.atk*1.2)},
 {id:'def',icon:'🛡️',name:'鐵壁',desc:'防禦 +3',apply:r=>r.def+=3},
 {id:'hp',icon:'❤️',name:'生命祝福',desc:'最大生命 +18，回復 18',apply:r=>{r.maxHp+=18;r.hp=Math.min(r.maxHp,r.hp+18)}},
 {id:'crit',icon:'💥',name:'致命一擊',desc:'暴擊率 +10%',apply:r=>r.crit+=.10},
 {id:'combo',icon:'➶',name:'連擊',desc:'25% 機率追加一次攻擊',apply:r=>r.combo+=.25},
 {id:'lifesteal',icon:'🩸',name:'吸血',desc:'造成傷害時回復 6%',apply:r=>r.lifesteal+=.06},
 {id:'counter',icon:'↩️',name:'反擊',desc:'受傷後反擊 25% 攻擊',apply:r=>r.counter+=.25},
 {id:'shield',icon:'◇',name:'開場護盾',desc:'每題獲得 8 護盾',apply:r=>r.shield+=8},
 {id:'fire',icon:'🔥',name:'灼燒',desc:'攻擊附加 6 火焰傷害',apply:r=>r.fire+=6},
 {id:'poison',icon:'☠️',name:'劇毒',desc:'攻擊疊加 4 中毒',apply:r=>r.poison+=4},
 {id:'heal',icon:'🌿',name:'再生',desc:'每題開始回復 5 HP',apply:r=>r.regen+=5},
 {id:'rage',icon:'✦',name:'狂怒',desc:'連續答對時每層 +5% 攻擊',apply:r=>r.rage+=.05},
];

const WHEEL=[
 {icon:'⚔️',label:'攻擊 +25%',fn:r=>r.atk=Math.ceil(r.atk*1.25)},
 {icon:'❤️',label:'回滿 35 HP',fn:r=>r.hp=Math.min(r.maxHp,r.hp+35)},
 {icon:'🛡️',label:'防禦 +4',fn:r=>r.def+=4},
 {icon:'💥',label:'暴擊 +15%',fn:r=>r.crit+=.15},
 {icon:'✨',label:'技能三選一',fn:r=>{r.extraPick=true}},
 {icon:'👑',label:'全能力強化',fn:r=>{r.atk+=5;r.def+=2;r.maxHp+=10;r.hp+=10}},
];

let meta=loadMeta();
let screen='home';
let run=null;
let upgradeChoices=[];
let wheelReward=null;
let feedback='';

function loadMeta(){try{return {...{role:'warrior',bestStreak:0,wins:0,runs:0},...JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')}}catch{return {role:'warrior',bestStreak:0,wins:0,runs:0}}}
function saveMeta(){localStorage.setItem(SAVE_KEY,JSON.stringify(meta));}
function shuffle(a){const c=[...a];for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]];}return c;}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function role(){return ROLES[run?.role||meta.role];}
function makeQuestion(){const w=pick(WORDS);return {word:w[0],answer:w[1],options:shuffle([...w[2]])};}
function enemyForQuestion(n){const base=ENEMY_STAGES.find(x=>n>=x.from&&n<=x.to)||ENEMY_STAGES[0];return structuredClone(base);}
function freshEnemy(n){const e=enemyForQuestion(n);return {...e,currentHp:e.hp,poison:0};}

function startRun(){const base=ROLES[meta.role].base;run={role:meta.role,q:1,correct:0,streak:0,maxStreak:0,hp:base.hp,maxHp:base.hp,atk:base.atk,def:base.def,crit:.05,combo:0,lifesteal:0,counter:0,shield:0,fire:0,poison:0,regen:0,rage:0,question:makeQuestion(),enemy:freshEnemy(1),build:[],extraPick:false,won:false};meta.runs+=1;saveMeta();screen='play';feedback='';render();}
function render(){app.innerHTML=screen==='home'?renderHome():screen==='play'?renderPlay():screen==='upgrade'?renderUpgrade():screen==='wheel'?renderWheel():screen==='end'?renderEnd():renderHome();bind();}

function renderHome(){const r=ROLES[meta.role];return `<main class="home-screen"><div class="home-overlay"></div><section class="home-panel"><div class="logo-mark">WORD QUEST <span>V3</span></div><div class="home-copy"><small>AUTO BATTLE × ENGLISH</small><h1>答對，就變強。</h1><p>每題都推進戰鬥。答對後三選一升級，連續答對 3 題啟動幸運轉盤。</p></div><div class="role-preview">${visual(r.art,r.icon,'home-role-art')}<div><b>${r.name}</b><span>${r.desc}</span></div></div><div class="role-row">${Object.entries(ROLES).map(([id,x])=>`<button class="role-btn ${id===meta.role?'active':''}" data-role="${id}">${x.icon}<b>${x.name}</b></button>`).join('')}</div><button class="fight-btn" data-action="start">FIGHT <span>→</span></button><div class="meta-row"><span>最佳連對 <b>${meta.bestStreak}</b></span><span>通關 <b>${meta.wins}</b></span><span>挑戰 <b>${meta.runs}</b></span></div></section></main>`;}
function renderPlay(){const e=run.enemy,r=role(),enemyPct=clamp(e.currentHp/e.hp*100,0,100),hpPct=clamp(run.hp/run.maxHp*100,0,100);return `<main class="game-shell"><header class="game-head"><button data-action="quit">×</button><div><small>QUESTION</small><b>${run.q}/10</b></div><div class="streak-chip">🔥 ${run.streak}</div></header><section class="arena"><div class="enemy-side"><div class="enemy-label">${e.boss?'BOSS':'ENEMY'} · ${e.name}</div>${visual(e.art,e.icon,'enemy-art')}<div class="hpbar enemy"><i style="width:${enemyPct}%"></i></div><small>${Math.max(0,e.currentHp)} / ${e.hp}</small>${e.poison?`<span class="effect-tag">☠️ ${e.poison}</span>`:''}</div><div class="vs-line"><span>AUTO</span><b>VS</b><span>BATTLE</span></div><div class="hero-side">${visual(r.art,r.icon,'hero-art')}<div class="hero-name">${r.name}</div><div class="hpbar"><i style="width:${hpPct}%"></i></div><small>${run.hp} / ${run.maxHp}</small><div class="stats-mini"><span>⚔️ ${run.atk}</span><span>🛡️ ${run.def}</span><span>💥 ${Math.round(run.crit*100)}%</span></div></div></section>${feedback?`<div class="battle-feedback">${feedback}</div>`:''}<section class="quiz-card"><div class="quiz-top"><span>答對＝攻擊＋升級</span><b>${run.streak>=2?'下一題連對就轉盤！':''}</b></div><h2>${run.question.word}</h2><div class="answers">${run.question.options.map(o=>`<button data-answer="${o}">${o}</button>`).join('')}</div></section></main>`;}

function answer(value){if(screen!=='play')return;const correct=value===run.question.answer;let notes=[];if(run.regen){const before=run.hp;run.hp=Math.min(run.maxHp,run.hp+run.regen);if(run.hp>before)notes.push(`再生 +${run.hp-before}`)}const playerShield=run.shield;if(correct){run.correct++;run.streak++;run.maxStreak=Math.max(run.maxStreak,run.streak);meta.bestStreak=Math.max(meta.bestStreak,run.streak);saveMeta();let damage=Math.round(run.atk*(1+run.rage*Math.max(0,run.streak-1)));if(Math.random()<run.crit){damage*=2;notes.push('暴擊！')}damage+=run.fire;run.enemy.currentHp-=damage;notes.push(`你造成 ${damage}`);if(run.poison){run.enemy.poison+=run.poison;notes.push(`中毒 +${run.poison}`)}if(run.lifesteal){const heal=Math.max(1,Math.round(damage*run.lifesteal));run.hp=Math.min(run.maxHp,run.hp+heal);notes.push(`吸血 +${heal}`)}if(run.combo>0&&Math.random()<Math.min(.75,run.combo)){const extra=Math.round(run.atk*.65);run.enemy.currentHp-=extra;notes.push(`連擊 +${extra}`)}}else{run.streak=0;notes.push(`答案：${run.question.answer}`)}if(run.enemy.currentHp>0){if(run.enemy.poison){run.enemy.currentHp-=run.enemy.poison;notes.push(`毒傷 ${run.enemy.poison}`)}if(run.enemy.currentHp>0){const incoming=Math.max(1,run.enemy.atk-run.def-playerShield);run.hp=Math.max(0,run.hp-incoming);notes.push(`敵人反擊 ${incoming}`);if(run.counter>0&&incoming>0){const counter=Math.max(1,Math.round(run.atk*run.counter));run.enemy.currentHp-=counter;notes.push(`反擊 ${counter}`)}}}feedback=(correct?'✓ 答對｜':'✕ 答錯｜')+notes.join('・');if(run.hp<=0){finish(false);return}if(run.enemy.currentHp<=0)feedback+='・擊破！';if(correct){upgradeChoices=shuffle([...UPGRADES]).slice(0,3);screen='upgrade';render();return}nextQuestion();}

function chooseUpgrade(id){const u=UPGRADES.find(x=>x.id===id);if(!u)return;u.apply(run);run.build.push(u.id);feedback=`獲得 ${u.icon} ${u.name}`;if(run.extraPick){run.extraPick=false;upgradeChoices=shuffle([...UPGRADES]).slice(0,3);render();return}if(run.streak>0&&run.streak%3===0){wheelReward=null;screen='wheel';render();return}nextQuestion();}
function renderUpgrade(){return `<main class="choice-screen"><div class="choice-head"><small>LEVEL UP</small><h1>答對了！選一個變強</h1><p>這一局要走哪種流派，由你決定。</p></div><div class="upgrade-grid">${upgradeChoices.map(u=>`<button data-upgrade="${u.id}"><span>${u.icon}</span><b>${u.name}</b><small>${u.desc}</small></button>`).join('')}</div><div class="build-line">目前：${summarizeBuild()}</div></main>`;}
function summarizeBuild(){if(!run.build.length)return '尚未成形';const count={};for(const id of run.build)count[id]=(count[id]||0)+1;return Object.entries(count).slice(-5).map(([id,n])=>`${UPGRADES.find(x=>x.id===id)?.icon||'✦'}×${n}`).join('　');}
function renderWheel(){return `<main class="wheel-screen"><small>STREAK BONUS</small><h1>🔥 連續答對 ${run.streak} 題</h1><p>轉盤會給你額外強化，不占一般升級。</p><div class="wheel ${wheelReward?'stopped':'spinning'}">${WHEEL.map((x,i)=>`<div class="wheel-item i${i}"><span>${x.icon}</span></div>`).join('')}<b>LUCK</b></div>${wheelReward?`<div class="wheel-result"><span>${wheelReward.icon}</span><b>${wheelReward.label}</b></div><button class="continue-btn" data-action="wheel-next">繼續冒險</button>`:`<button class="spin-btn" data-action="spin">轉！</button>`}</main>`;}
function spinWheel(){if(wheelReward)return;wheelReward=pick(WHEEL);wheelReward.fn(run);render();}
function nextQuestion(){if(run.q>=10){finish(true);return}run.q++;run.question=makeQuestion();run.enemy=freshEnemy(run.q);screen='play';render();}
function finish(won){run.won=won;if(won)meta.wins+=1;meta.bestStreak=Math.max(meta.bestStreak,run.maxStreak);saveMeta();screen='end';render();}
function renderEnd(){return `<main class="end-screen"><div class="end-card"><div class="end-icon">${run.won?'👑':'💀'}</div><small>${run.won?'CLEAR':'DEFEAT'}</small><h1>${run.won?'擊敗影語王！':'這次冒險結束'}</h1><div class="end-stats"><span>答對<b>${run.correct}/10</b></span><span>最高連對<b>${run.maxStreak}</b></span><span>最終攻擊<b>${run.atk}</b></span></div><div class="build-summary">${summarizeBuild()}</div><button class="fight-btn" data-action="again">再玩一次 <span>↻</span></button><button class="home-btn" data-action="home">回首頁</button></div></main>`;}
function quit(){if(confirm('放棄這次挑戰？')){run=null;screen='home';render()}}
function bind(){document.querySelectorAll('[data-role]').forEach(el=>el.onclick=()=>{meta.role=el.dataset.role;saveMeta();render()});document.querySelector('[data-action="start"]')?.addEventListener('click',startRun);document.querySelectorAll('[data-answer]').forEach(el=>el.onclick=()=>answer(el.dataset.answer));document.querySelectorAll('[data-upgrade]').forEach(el=>el.onclick=()=>chooseUpgrade(el.dataset.upgrade));document.querySelector('[data-action="spin"]')?.addEventListener('click',spinWheel);document.querySelector('[data-action="wheel-next"]')?.addEventListener('click',nextQuestion);document.querySelector('[data-action="quit"]')?.addEventListener('click',quit);document.querySelector('[data-action="again"]')?.addEventListener('click',startRun);document.querySelector('[data-action="home"]')?.addEventListener('click',()=>{run=null;screen='home';render()});}
render();
