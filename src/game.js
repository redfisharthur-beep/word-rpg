import { ASSETS, visual } from './assets.js';

const app=document.querySelector('#app');
const SAVE_KEY='word-rpg-v3';

const WORDS=[
['apple','蘋果',['蘋果','香蕉','牛奶','麵包']],['book','書',['書','筆','桌子','門']],['cat','貓',['貓','狗','鳥','魚']],['run','跑步',['跑步','睡覺','坐下','吃飯']],['happy','開心的',['開心的','生氣的','疲累的','害怕的']],['water','水',['水','果汁','牛奶','茶']],['friend','朋友',['朋友','老師','醫生','學生']],['school','學校',['學校','公園','醫院','商店']],['green','綠色的',['綠色的','紅色的','藍色的','黃色的']],['small','小的',['小的','大的','高的','長的']],['river','河流',['河流','山','天空','森林']],['forest','森林',['森林','海洋','沙漠','城市']],['cloud','雲',['雲','雨','風','雪']],['quiet','安靜的',['安靜的','吵鬧的','快速的','明亮的']],['brave','勇敢的',['勇敢的','害怕的','疲累的','孤單的']],['follow','跟隨',['跟隨','離開','等待','停止']],['listen','聆聽',['聆聽','觀看','觸摸','奔跑']],['light','光',['光','影子','聲音','煙霧']],['path','小徑',['小徑','橋','房間','屋頂']],['rabbit','兔子',['兔子','狐狸','老虎','烏龜']],['protect','保護',['保護','攻擊','忘記','丟棄']],['whisper','低語',['低語','大叫','跳躍','哭泣']],['bridge','橋',['橋','道路','城堡','洞穴']],['stone','石頭',['石頭','木頭','葉子','花朵']],['deep','深的',['深的','淺的','短的','薄的']],['danger','危險',['危險','和平','秘密','希望']],['search','尋找',['尋找','隱藏','關閉','推動']],['across','穿越',['穿越','下面','旁邊','後面']],['sudden','突然的',['突然的','緩慢的','平靜的','柔軟的']],['bubble','泡泡',['泡泡','火焰','冰塊','沙子']]
];

const ROLES={
 warrior:{name:'戰士',art:ASSETS.role.warrior,icon:'⚔️',desc:'生命較高，適合防禦與反擊',base:{hp:150,atk:17,def:6}},
 mage:{name:'法師',art:ASSETS.role.mage,icon:'🪄',desc:'攻擊較高，適合火焰與劇毒',base:{hp:130,atk:19,def:4}},
 archer:{name:'弓手',art:ASSETS.role.archer,icon:'🏹',desc:'暴擊較高，適合連擊與狂怒',base:{hp:138,atk:18,def:5,crit:.10}},
};

const STAGES=[
 {id:1,name:'苔蘚小徑',enemy:'苔球獸',art:ASSETS.enemy.moss,icon:'🟢',hp:230,atk:10,def:2,reward:'擊破後回復 12% 生命'},
 {id:2,name:'霧林追獵',enemy:'霧角兔',art:ASSETS.enemy.rabbit,icon:'🐇',hp:360,atk:14,def:4,reward:'擊破後回復 14% 生命'},
 {id:3,name:'古樹守門',enemy:'木甲蟲',art:ASSETS.enemy.beetle,icon:'🪲',hp:540,atk:18,def:7,reward:'擊破後回復 16% 生命'},
 {id:4,name:'暮色祭壇',enemy:'影語王',art:ASSETS.enemy.shadowKing,icon:'👁️',hp:820,atk:23,def:9,boss:true,reward:'最終試煉'},
];

const UPGRADES=[
 {id:'atk',icon:'⚔️',name:'力量成長',desc:l=>`攻擊提升 ${9+Math.floor(l*3)}%`,apply:(r,l,s)=>r.atk=Math.ceil(r.atk*(1+(9+l*3)/100*s))},
 {id:'def',icon:'🛡️',name:'鐵壁',desc:l=>`防禦提升 ${2+Math.floor(l/2)}`,apply:(r,l,s)=>r.def+=Math.max(1,Math.round((2+Math.floor(l/2))*s))},
 {id:'hp',icon:'❤️',name:'生命祝福',desc:l=>`最大生命 +${14+Math.floor(l*5)}，並回復`,apply:(r,l,s)=>{const v=Math.max(1,Math.round((14+l*5)*s));r.maxHp+=v;r.hp=Math.min(r.maxHp,r.hp+v)}},
 {id:'crit',icon:'💥',name:'致命一擊',desc:l=>`暴擊率 +${6+Math.floor(l*2)}%`,apply:(r,l,s)=>r.crit=Math.min(.75,r.crit+(6+l*2)/100*s)},
 {id:'combo',icon:'➶',name:'連擊',desc:l=>`追加攻擊率 +${8+Math.floor(l*4)}%`,apply:(r,l,s)=>r.combo=Math.min(.78,r.combo+(8+l*4)/100*s)},
 {id:'lifesteal',icon:'🩸',name:'吸血',desc:l=>`吸血 +${3+Math.floor(l)}%`,apply:(r,l,s)=>r.lifesteal=Math.min(.38,r.lifesteal+(3+l)/100*s)},
 {id:'counter',icon:'↩️',name:'反擊',desc:l=>`反擊傷害 +${12+Math.floor(l*6)}% 攻擊`,apply:(r,l,s)=>r.counter+=((12+l*6)/100)*s},
 {id:'shield',icon:'◇',name:'護體',desc:l=>`每回合護盾 +${4+Math.floor(l*2)}`,apply:(r,l,s)=>r.shield+=Math.max(1,Math.round((4+l*2)*s))},
 {id:'fire',icon:'🔥',name:'灼燒',desc:l=>`每次攻擊附加 ${3+Math.floor(l*2)} 火傷`,apply:(r,l,s)=>r.fire+=Math.max(1,Math.round((3+l*2)*s))},
 {id:'poison',icon:'☠️',name:'劇毒',desc:l=>`每次攻擊疊加 ${2+Math.floor(l)} 中毒`,apply:(r,l,s)=>r.poison+=Math.max(1,Math.round((2+l)*s))},
 {id:'heal',icon:'🌿',name:'再生',desc:l=>`每戰鬥回合回復 ${2+Math.floor(l*2)} HP`,apply:(r,l,s)=>r.regen+=Math.max(1,Math.round((2+l*2)*s))},
 {id:'rage',icon:'✦',name:'狂怒',desc:l=>`連對每層增加 ${3+Math.floor(l)}% 攻擊`,apply:(r,l,s)=>r.rage+=((3+l)/100)*s},
];

const WHEEL=[
 {icon:'⚔️',label:'攻擊 +18%',fn:r=>r.atk=Math.ceil(r.atk*1.18)},
 {icon:'❤️',label:'回復 30% 生命',fn:r=>r.hp=Math.min(r.maxHp,r.hp+Math.ceil(r.maxHp*.30))},
 {icon:'🛡️',label:'防禦 +4',fn:r=>r.def+=4},
 {icon:'💥',label:'暴擊 +12%',fn:r=>r.crit=Math.min(.78,r.crit+.12)},
 {icon:'⬆️',label:'隨機技能升 1 級',fn:r=>levelRandomOwned(r)},
 {icon:'👑',label:'全能力強化',fn:r=>{r.atk+=5;r.def+=2;r.maxHp+=12;r.hp=Math.min(r.maxHp,r.hp+12)}},
];

const PAUSE={review:1150,focus:700,attack:560,impact:780,counter:720,between:820,defeat:1200};
let meta=loadMeta(),screen='home',run=null,upgradeChoices=[],wheelReward=null,locked=false,anim='',answerReview=null,pendingCorrect=true,combatFx={hero:'',enemy:'',proc:''};

function loadMeta(){try{return {...{role:'warrior',bestStreak:0,wins:0,runs:0},...JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')}}catch{return {role:'warrior',bestStreak:0,wins:0,runs:0}}}
function saveMeta(){localStorage.setItem(SAVE_KEY,JSON.stringify(meta));}
function shuffle(a){const c=[...a];for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]];}return c;}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function role(){return ROLES[run?.role||meta.role];}
function stage(){return STAGES[run?.stageIndex||0];}
function makeQuestion(){const w=pick(WORDS);return {word:w[0],answer:w[1],options:shuffle([...w[2]])};}
function freshEnemy(s){return {name:s.enemy,art:s.art,icon:s.icon,hp:s.hp,currentHp:s.hp,atk:s.atk,def:s.def,poison:0,boss:!!s.boss};}
function skillLevel(id){return run?.skills?.[id]||0;}
function fmtLevel(v){return Number.isInteger(v)?String(v):v.toFixed(1);}
function clearFx(){combatFx={hero:'',enemy:'',proc:''};}
function levelRandomOwned(r){const ids=Object.keys(r.skills||{});if(!ids.length){r.atk=Math.ceil(r.atk*1.12);return}const id=pick(ids),u=UPGRADES.find(x=>x.id===id),next=(r.skills[id]||0)+1;r.skills[id]=next;u?.apply(r,next,1);}

function startRun(){const base=ROLES[meta.role].base;run={role:meta.role,stageIndex:0,cycle:1,totalAnswers:0,correct:0,streak:0,maxStreak:0,hp:base.hp,maxHp:base.hp,atk:base.atk,def:base.def,crit:base.crit||.05,combo:0,lifesteal:0,counter:0,shield:0,fire:0,poison:0,regen:0,rage:0,question:makeQuestion(),enemy:freshEnemy(STAGES[0]),skills:{},battleRound:0,won:false};meta.runs+=1;saveMeta();screen='stage';locked=false;anim='';answerReview=null;clearFx();render();}
function render(){app.innerHTML=screen==='home'?renderHome():screen==='stage'?renderStageIntro():screen==='play'?renderPlay():screen==='upgrade'?renderUpgrade():screen==='wheel'?renderWheel():screen==='clear'?renderStageClear():screen==='end'?renderEnd():renderHome();bind();}

function renderHome(){const r=ROLES[meta.role];return `<main class="home-screen"><div class="home-overlay"></div><section class="home-panel"><div class="logo-mark">WORD QUEST <span>V3</span></div><div class="home-copy"><small>AUTO BATTLE × ENGLISH</small><h1>答題養成，三回合驗證。</h1><p>每次先答題拿能力，再自動交戰 3 回合。答錯也能拿到一半強化。</p></div><div class="role-preview">${visual(r.art,r.icon,'home-role-art')}<div><b>${r.name}</b><span>${r.desc}</span></div></div><div class="role-row">${Object.entries(ROLES).map(([id,x])=>`<button class="role-btn ${id===meta.role?'active':''}" data-role="${id}">${x.icon}<b>${x.name}</b></button>`).join('')}</div><button class="fight-btn" data-action="start">FIGHT <span>→</span></button><div class="meta-row"><span>最佳連對 <b>${meta.bestStreak}</b></span><span>通關 <b>${meta.wins}</b></span><span>挑戰 <b>${meta.runs}</b></span></div></section></main>`;}

function renderStageIntro(){const s=stage();return `<main class="stage-screen"><section class="stage-card"><small>STAGE ${s.id} / ${STAGES.length}</small><h1>${s.name}</h1>${visual(s.art,s.icon,'stage-enemy-art')}<h2>${s.enemy}</h2><p>${s.boss?'最後的 Boss 戰。前面累積的所有能力都會在這裡派上用場。':'先看敵人能力，再答題強化自己；每次選完能力後自動交戰 3 回合。'}</p><div class="stage-stats three"><span>❤️ HP <b>${s.hp}</b></span><span>⚔️ 攻擊 <b>${s.atk}</b></span><span>🛡️ 防禦 <b>${s.def}</b></span></div><button class="fight-btn" data-action="enter-stage">開始答題 <span>→</span></button></section></main>`;}

function renderRoundDots(){return `<div class="round-dots">${[1,2,3].map(n=>`<i class="${run.battleRound===n?'active':run.battleRound>n?'done':''}"></i>`).join('')}</div>`;}
function renderPlay(){const e=run.enemy,r=role(),enemyPct=clamp(e.currentHp/e.hp*100,0,100),hpPct=clamp(run.hp/run.maxHp*100,0,100);return `<main class="game-shell ${locked?'locked':''}"><header class="game-head"><button data-action="quit">×</button><div><small>STAGE ${stage().id} · CYCLE</small><b>${run.cycle}</b></div><div class="streak-chip">🔥 ${run.streak}</div></header><section class="arena ${anim}"><div class="hero-side">${combatFx.hero?`<div class="combat-number hero-number">${combatFx.hero}</div>`:''}${visual(r.art,r.icon,'hero-art')}<div class="hero-name">${r.name}</div><div class="hpbar"><i style="width:${hpPct}%"></i></div><small>${run.hp} / ${run.maxHp}</small><div class="stats-mini"><span>⚔️ ${run.atk}</span><span>🛡️ ${run.def}</span><span>💥 ${Math.round(run.crit*100)}%</span></div></div><div class="vs-line"><span>${run.battleRound?`ROUND ${run.battleRound}/3`:'READY'}</span><b>VS</b>${renderRoundDots()}${combatFx.proc?`<em>${combatFx.proc}</em>`:'<em>&nbsp;</em>'}</div><div class="enemy-side">${combatFx.enemy?`<div class="combat-number enemy-number">${combatFx.enemy}</div>`:''}<div class="enemy-label">${e.boss?'BOSS':'ENEMY'} · ${e.name}</div>${visual(e.art,e.icon,'enemy-art')}<div class="hpbar enemy"><i style="width:${enemyPct}%"></i></div><small>${Math.max(0,e.currentHp)} / ${e.hp}</small><div class="stats-mini enemy-stats"><span>⚔️ ${e.atk}</span><span>🛡️ ${e.def}</span></div>${e.poison?`<span class="effect-tag">☠️ ${e.poison}</span>`:''}</div></section><div class="skill-strip">${renderOwnedSkills()}</div>${renderQuiz()}</main>`;}

function renderQuiz(){const q=run.question,battleFocus=anim||run.battleRound>0;return `<section class="quiz-card ${answerReview?'reviewing':''} ${battleFocus?'battle-focus':''}"><div class="quiz-top"><span>${answerReview?'作答結果':battleFocus?'三回合戰鬥中':'選出正確中文'}</span><b>${!answerReview&&!battleFocus&&run.streak>=2?'再答對就有轉盤！':''}</b></div><h2>${q.word}</h2><div class="answers">${q.options.map(o=>{let cls='';if(answerReview){if(o===q.answer)cls='correct-answer';else if(o===answerReview.selected&&!answerReview.correct)cls='wrong-answer';}return `<button class="${cls}" data-answer="${o}" ${(locked||battleFocus)?'disabled':''}>${o}</button>`}).join('')}</div>${answerReview?`<div class="answer-summary ${answerReview.correct?'ok':'bad'}"><b>${answerReview.correct?'✓ 答對':'✕ 答錯'}</b><span>正解：${q.answer}</span></div>`:''}</section>`;}

function renderOwnedSkills(){const owned=Object.entries(run.skills).sort((a,b)=>b[1]-a[1]);if(!owned.length)return '<span class="empty-skill">尚未取得能力</span>';return owned.slice(0,7).map(([id,l],i)=>{const u=UPGRADES.find(x=>x.id===id);return `<span class="${i===0?'main-build':''}">${u?.icon||'✦'} ${u?.name||id} <b>Lv.${fmtLevel(l)}</b></span>`}).join('');}

function answer(value){if(screen!=='play'||locked||run.battleRound>0)return;locked=true;run.totalAnswers++;pendingCorrect=value===run.question.answer;answerReview={selected:value,correct:pendingCorrect};if(pendingCorrect){run.correct++;run.streak++;run.maxStreak=Math.max(run.maxStreak,run.streak);meta.bestStreak=Math.max(meta.bestStreak,run.streak);saveMeta();}else run.streak=0;render();setTimeout(()=>{answerReview=null;upgradeChoices=rollUpgrades();screen='upgrade';locked=false;render();},PAUSE.review);}

function rollUpgrades(){const weighted=[];for(const u of UPGRADES){weighted.push(u);for(let i=0;i<Math.min(4,Math.floor(skillLevel(u.id)));i++)weighted.push(u)}const result=[];for(const u of shuffle(weighted)){if(!result.some(x=>x.id===u.id))result.push(u);if(result.length===3)break}return result;}

function chooseUpgrade(id){const u=UPGRADES.find(x=>x.id===id);if(!u)return;const gain=pendingCorrect?1:.5;const next=skillLevel(id)+gain;run.skills[id]=next;u.apply(run,next,pendingCorrect?1:.5);if(pendingCorrect&&run.streak>0&&run.streak%3===0){wheelReward=null;screen='wheel';render();return}startBattleSet();}

function renderUpgrade(){const rate=pendingCorrect?1:.5;return `<main class="choice-screen"><div class="choice-head"><small>${pendingCorrect?'FULL POWER':'HALF POWER'}</small><h1>${pendingCorrect?'答對：三選一完整強化':'答錯：仍可三選一，但只有 50% 效果'}</h1><p>${pendingCorrect?'選完後會自動戰鬥 3 回合。':'學習不中斷，下一題還有機會追回來。'}</p></div><div class="upgrade-grid">${upgradeChoices.map(u=>{const cur=skillLevel(u.id),next=cur+(pendingCorrect?1:.5);return `<button data-upgrade="${u.id}"><span>${u.icon}</span><div><em>${cur?`Lv.${fmtLevel(cur)} → Lv.${fmtLevel(next)}`:`NEW → Lv.${fmtLevel(next)}`}</em><b>${u.name}</b><small>${u.desc(Math.max(1,next))}${rate<1?' · 本次 50% 效果':''}</small></div></button>`}).join('')}</div><div class="build-line">${summarizeBuild()}</div></main>`;}

function summarizeBuild(){const owned=Object.entries(run.skills).sort((a,b)=>b[1]-a[1]);if(!owned.length)return '尚未成形';return owned.map(([id,l])=>{const u=UPGRADES.find(x=>x.id===id);return `${u?.icon||'✦'} ${u?.name||id} Lv.${fmtLevel(l)}`}).join('　');}

function renderWheel(){return `<main class="wheel-screen"><small>STREAK BONUS</small><h1>🔥 連續答對 ${run.streak} 題</h1><p>轉盤是額外獎勵，結束後立即進入 3 回合戰鬥。</p><div class="wheel ${wheelReward?'stopped':'spinning'}">${WHEEL.map((x,i)=>`<div class="wheel-item i${i}"><span>${x.icon}</span></div>`).join('')}<b>LUCK</b></div>${wheelReward?`<div class="wheel-result"><span>${wheelReward.icon}</span><b>${wheelReward.label}</b></div><button class="continue-btn" data-action="wheel-next">開始戰鬥</button>`:`<button class="spin-btn" data-action="spin">轉！</button>`}</main>`;}
function spinWheel(){if(wheelReward)return;wheelReward=pick(WHEEL);wheelReward.fn(run);render();}

function startBattleSet(){screen='play';locked=true;answerReview=null;run.battleRound=1;anim='';clearFx();render();setTimeout(()=>playBattleRound(),PAUSE.focus);}
function playBattleRound(){if(screen!=='play'||run.battleRound<1)return;clearFx();if(run.regen){const before=run.hp;run.hp=Math.min(run.maxHp,run.hp+run.regen);if(run.hp>before)combatFx.hero=`+${run.hp-before}`;}let raw=Math.round(run.atk*(1+run.rage*Math.max(0,run.streak-1))),crit=false;if(Math.random()<run.crit){raw*=2;crit=true}let damage=Math.max(1,raw-run.enemy.def)+run.fire;let combo=0;if(run.combo>0&&Math.random()<Math.min(.78,run.combo))combo=Math.max(1,Math.round(run.atk*.6)-run.enemy.def);combatFx.proc=[crit?'💥 暴擊':'',combo?'➶ 連擊':'',run.fire?'🔥 灼燒':''].filter(Boolean).join(' · ');anim='hero-attack';render();setTimeout(()=>{run.enemy.currentHp-=damage+combo;combatFx.enemy=`-${damage+combo}`;if(run.poison){run.enemy.poison+=run.poison;combatFx.proc=[combatFx.proc,`☠️ +${run.poison}`].filter(Boolean).join(' · ')}if(run.lifesteal){const heal=Math.max(1,Math.round((damage+combo)*run.lifesteal));run.hp=Math.min(run.maxHp,run.hp+heal);combatFx.hero=`+${heal}`}anim='enemy-hit';render();setTimeout(()=>afterHeroAttack(),PAUSE.impact);},PAUSE.attack);}

function afterHeroAttack(){if(run.enemy.poison>0){run.enemy.currentHp-=run.enemy.poison;combatFx.enemy=`-${run.enemy.poison}`;combatFx.proc='☠️ 毒傷';}if(run.enemy.currentHp<=0){anim='enemy-down';render();setTimeout(()=>finishBattleSet(true),PAUSE.defeat);return}clearFx();anim='enemy-turn';render();setTimeout(()=>{const incoming=Math.max(1,run.enemy.atk-run.def-run.shield);run.hp=Math.max(0,run.hp-incoming);combatFx.hero=`-${incoming}`;let counter=0;if(run.counter>0){counter=Math.max(1,Math.round(run.atk*run.counter)-run.enemy.def);run.enemy.currentHp-=counter;combatFx.enemy=`-${counter}`;combatFx.proc='↩️ 反擊'}anim='hero-hit';render();setTimeout(()=>{if(run.hp<=0){finish(false);return}if(run.enemy.currentHp<=0){anim='enemy-down';render();setTimeout(()=>finishBattleSet(true),PAUSE.defeat);return}if(run.battleRound>=3){finishBattleSet(false);return}run.battleRound++;anim='';clearFx();render();setTimeout(()=>playBattleRound(),PAUSE.between);},PAUSE.counter);},PAUSE.counter);}

function finishBattleSet(enemyDead){anim='';clearFx();if(enemyDead){run.battleRound=0;screen='clear';locked=false;render();return}run.battleRound=0;run.cycle++;run.question=makeQuestion();locked=false;answerReview=null;screen='play';render();}

function strongestBuild(){const owned=Object.entries(run.skills).sort((a,b)=>b[1]-a[1]);if(!owned.length)return '尚未形成流派';const [id,l]=owned[0],u=UPGRADES.find(x=>x.id===id);return `${u?.icon||'✦'} ${u?.name||id} Lv.${fmtLevel(l)}`;}
function renderStageClear(){const s=stage();return `<main class="stage-screen"><section class="stage-card clear"><small>STAGE ${s.id} CLEAR</small><div class="clear-icon">✓</div><h1>擊破 ${s.enemy}</h1><p>${s.boss?'你完成了這次冒險。':`${s.reward}，所有能力等級保留到下一關。`}</p><div class="clear-summary"><span>循環 <b>${run.cycle}</b></span><span>剩餘 HP <b>${run.hp}/${run.maxHp}</b></span><span>主力能力 <b>${strongestBuild()}</b></span></div><div class="build-line">${summarizeBuild()}</div>${s.boss?`<button class="fight-btn" data-action="finish">查看結果 <span>→</span></button>`:`<button class="fight-btn" data-action="next-stage">前往下一關 <span>→</span></button>`}</section></main>`;}

function nextStage(){const heal=Math.ceil(run.maxHp*[.12,.14,.16,.0][run.stageIndex]);run.hp=Math.min(run.maxHp,run.hp+heal);run.stageIndex++;run.cycle=1;run.battleRound=0;run.enemy=freshEnemy(stage());run.question=makeQuestion();answerReview=null;clearFx();screen='stage';render();}
function finish(won){run.won=won;if(won)meta.wins+=1;meta.bestStreak=Math.max(meta.bestStreak,run.maxStreak);saveMeta();screen='end';locked=false;run.battleRound=0;clearFx();render();}
function renderEnd(){return `<main class="end-screen"><div class="end-card"><div class="end-icon">${run.won?'👑':'💀'}</div><small>${run.won?'CLEAR':'DEFEAT'}</small><h1>${run.won?'擊敗影語王！':'這次冒險結束'}</h1><div class="end-stats"><span>答對<b>${run.correct}</b></span><span>最高連對<b>${run.maxStreak}</b></span><span>最終攻擊<b>${run.atk}</b></span></div><div class="build-summary">${summarizeBuild()}</div><button class="fight-btn" data-action="again">再玩一次 <span>↻</span></button><button class="home-btn" data-action="home">回首頁</button></div></main>`;}
function quit(){if(confirm('放棄這次挑戰？')){run=null;screen='home';locked=false;clearFx();render()}}

function bind(){document.querySelectorAll('[data-role]').forEach(el=>el.onclick=()=>{meta.role=el.dataset.role;saveMeta();render()});document.querySelector('[data-action="start"]')?.addEventListener('click',startRun);document.querySelector('[data-action="enter-stage"]')?.addEventListener('click',()=>{screen='play';render()});document.querySelectorAll('[data-answer]').forEach(el=>el.onclick=()=>answer(el.dataset.answer));document.querySelectorAll('[data-upgrade]').forEach(el=>el.onclick=()=>chooseUpgrade(el.dataset.upgrade));document.querySelector('[data-action="spin"]')?.addEventListener('click',spinWheel);document.querySelector('[data-action="wheel-next"]')?.addEventListener('click',startBattleSet);document.querySelector('[data-action="next-stage"]')?.addEventListener('click',nextStage);document.querySelector('[data-action="finish"]')?.addEventListener('click',()=>finish(true));document.querySelector('[data-action="quit"]')?.addEventListener('click',quit);document.querySelector('[data-action="again"]')?.addEventListener('click',startRun);document.querySelector('[data-action="home"]')?.addEventListener('click',()=>{run=null;screen='home';clearFx();render()});}
render();