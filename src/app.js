import { ROLES, PETS, ITEMS, WORDS, STAGES, SKILLS } from './game-data.js';
import { visual } from './assets.js';
import { loadState, saveState } from './store.js';
import { createBattle, chooseSkill, resolveAnswer, useUltimate } from './battle-engine.js';

const app=document.querySelector('#app');
let state=loadState();
let view=!state.session?.entered?'login':state.session.roleChosen?'home':'role';
let battle=null;
let selectedStageId=1;
let toastTimer=null;

function render(){
  const content={login:renderLogin,role:renderRoleSelect,home:renderHome,map:renderMap,stage:renderStagePreview,battle:renderBattle,pet:renderPets,bag:renderBag,words:renderWords}[view]?.() || renderHome();
  if(view==='login') app.innerHTML=content;
  else app.innerHTML=`<main class="app-shell ${view==='stage'&&STAGES.find(s=>s.id===selectedStageId)?.boss?'boss-shell':''}">${content}${!['battle','role','stage'].includes(view)?renderNav():''}</main>`;
  bindEvents();
}

function renderLogin(){
  return `<main class="login-screen"><div class="login-panel">
    <input class="login-name" id="player-name" type="text" maxlength="12" autocomplete="nickname" placeholder="輸入名字" value="${escapeHtml(state.player.name||'')}" aria-label="輸入名字">
    <button class="line-login-btn" data-action="line-login" type="button"><span class="line-mark">LINE</span><span>LINE 登入</span></button>
    <button class="enter-game-btn" data-action="enter-game" type="button">進入</button>
  </div></main>`;
}

function renderRoleSelect(){
  return `<section class="role-select-screen">
    <div class="section-title role-title"><h2>選擇勇者</h2><span>${escapeHtml(state.player.name||'勇者')}</span></div>
    <div class="role-grid">${ROLES.map(role=>`<button class="role-card" data-role="${role.id}">
      <div class="role-art-wrap">${visual(role.art,role.icon,'role-select-art')}</div>
      <strong>${role.name}</strong><span>${shortBonus(role.bonus)}</span>
    </button>`).join('')}</div>
  </section>`;
}

function renderTop(title,meta=''){
  return `<div class="topbar"><div class="brand">${title}</div><div class="level-pill">Lv.${state.player.level}${meta?` · ${meta}`:''}</div></div>`;
}

function renderHome(){
  const role=ROLES.find(r=>r.id===state.player.role) || ROLES[0];
  const pet=PETS.find(p=>p.id===state.player.pet) || PETS[0];
  const petState=state.pets?.[pet.id] || {level:1,evolved:false};
  const playerName=state.player.name||'勇者';
  const starTotal=Object.values(state.progress.stageStars||{}).reduce((a,b)=>a+b,0);
  return `${renderTop('WORD RPG')}
  <section class="hero-card">
    <div class="avatar-wrap">${visual(role.art,role.icon,'hero-art')}<div class="pet-bubble">${visual(pet.art,pet.icon,'pet-art')}</div></div>
    <div class="hero-title">${role.name}・${playerName}</div>
    <div class="hero-sub">${pet.name} Lv.${petState.level}${petState.evolved?' · ✦':''}</div>
    <button class="primary-btn" data-action="go-map">▶ 開始冒險</button>
    <div class="stats"><div class="stat"><strong>${starTotal}</strong><span>⭐ 星等</span></div><div class="stat"><strong>${state.progress.masteredWords.length}</strong><span>熟練字</span></div><div class="stat"><strong>${state.player.stones}</strong><span>星語石</span></div></div>
  </section>
  <section class="quick-grid"><button class="quick soft-btn" data-view="pet">${visual(pet.art,pet.icon,'nav-art')}<span>寵物</span></button><button class="quick soft-btn" data-view="words"><span class="emoji">📖</span><span>圖鑑</span></button></section>`;
}

function renderMap(){
  return `${renderTop('霧森之路',`${state.progress.unlockedStage}/5`)}
  <div class="section-title"><h2>冒險</h2><span>點選關卡</span></div>
  <section class="map-card"><div class="map-glow"></div><div class="path">${STAGES.map((stage,index)=>{
    const unlocked=stage.id<=state.progress.unlockedStage;
    const cleared=state.progress.cleared.includes(stage.id);
    const stars=state.progress.stageStars?.[stage.id]||0;
    return `<button class="node ${!unlocked?'locked':''} ${stage.boss?'boss':''} ${cleared?'cleared':''}" ${unlocked?'data-preview-stage="'+stage.id+'"':''}>
      <span class="node-step">${stage.boss?'BOSS':String(index+1).padStart(2,'0')}</span>
      <span class="node-icon">${cleared?'✓':stage.icon}</span>
      <small><b>${stage.name}</b><em>${stage.subtitle}</em>${stars?`<i>${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</i>`:''}</small>
    </button>`;
  }).join('')}</div></section>`;
}

function renderStagePreview(){
  const stage=STAGES.find(s=>s.id===selectedStageId)||STAGES[0];
  const stars=state.progress.stageStars?.[stage.id]||0;
  const reward=ITEMS.find(i=>i.id===stage.reward);
  const wordCount=stage.wordIds?.length||0;
  return `${renderTop(stage.boss?'暮色試煉':stage.name,stage.threat)}
  <section class="stage-preview ${stage.boss?'boss-preview':''}">
    ${stage.boss?'<div class="boss-warning">FINAL BATTLE</div>':''}
    <button class="back-chip" data-action="back-map">← 地圖</button>
    <div class="preview-art ${stage.boss?'boss-art':''}">${visual(stage.enemy.art,stage.enemy.icon,'preview-enemy-art')}</div>
    <div class="preview-kicker">${stage.subtitle}</div>
    <div class="preview-name">${stage.enemy.name}</div>
    <div class="preview-stars">${stars?'★'.repeat(stars)+'☆'.repeat(3-stars):'☆☆☆'}</div>
    <div class="preview-grid">
      <div><strong>${stage.enemy.hp}</strong><span>HP</span></div>
      <div><strong>${stage.enemy.breakMax}</strong><span>BREAK</span></div>
      <div><strong>${wordCount}</strong><span>WORDS</span></div>
    </div>
    <div class="preview-hint">${stage.boss?'👁 ':''}${stage.hint}</div>
    <div class="preview-meta"><span>${reward?`${reward.icon} ${reward.name}`:'🎁 獎勵'}</span><span>${stage.boss?'錯題優先':'混合題型'}</span></div>
    <button class="primary-btn battle-start-btn ${stage.boss?'boss-start':''}" data-start-stage="${stage.id}">${stage.boss?'⚔ 挑戰影語王':'⚔ 開始戰鬥'}</button>
  </section>`;
}

function renderBattle(){
  if(!battle){view='map';return renderMap();}
  const stage=STAGES.find(s=>s.id===battle.stageId);
  const role=ROLES.find(r=>r.id===battle.player.roleId)||ROLES[0];
  const hp=Math.max(0,battle.enemy.currentHp/battle.enemy.hp*100);
  const br=Math.max(0,battle.enemy.break/battle.enemy.breakMax*100);
  const energy=Math.max(0,Math.min(100,battle.player.energy||0));
  if(battle.finished){
    const reward=battle.rewardEarned?ITEMS.find(i=>i.id===battle.rewardEarned):null;
    const stars=battle.won?'★'.repeat(battle.stars)+'☆'.repeat(3-battle.stars):'';
    return `${renderTop(stage.name)}<section class="hero-card result-card"><div class="result-icon">${battle.won?'🏆':'💤'}</div><div class="hero-title">${battle.won?'勝利':'再試一次'}</div>${battle.won?`<div class="hero-sub" style="font-size:24px">${stars}</div>`:''}${battle.won&&reward?`<div class="loot-reveal">${visual(reward.art,reward.icon,'loot-art')}<strong>${reward.name}</strong><span>${reward.kind}</span></div>`:''}${battle.won&&!reward?`<div class="hero-sub">已完成關卡</div>`:`<div class="hero-sub">${battle.won?'獎勵已收入背包':'休息一下，再回來挑戰'}</div>`}<button class="primary-btn" data-action="finish-battle">返回地圖</button></section>`;
  }
  const result=battle.lastResult;
  const fx=result?.effect==='ultimate'?'damage':result?.correct?result.effect:'enemy';
  return `${renderTop(stage.name,`Turn ${battle.turn}`)}
  <section class="battle-stage ${stage.boss?'boss-battle':''} ${result?'has-feedback':''}">
    <div class="enemy-box ${fx==='damage'?'hit':''} ${result?.broke?'broken':''}">
      ${stage.boss?'<div class="boss-aura"></div>':''}<div class="enemy-avatar">${visual(battle.enemy.art,battle.enemy.icon,'enemy-art')}</div>${result?renderFeedback(result):''}
      <div class="enemy-name">${battle.enemy.name}</div><div class="intent">👁 ${battle.enemy.intent}</div>
      ${result?.enemyText?`<div class="battle-note enemy-note">${result.enemyText}</div>`:''}${result?.petText?`<div class="battle-note pet-note">🐾 ${result.petText}</div>`:''}${result?.roleText?`<div class="battle-note role-note">✦ ${result.roleText}</div>`:''}${result?.itemText?`<div class="battle-note role-note">🎒 ${result.itemText}</div>`:''}${result?.ultimateText?`<div class="battle-note ultimate-note">${role.ultimate.icon} ${result.ultimateText}</div>`:''}
    </div>
    <div class="bar-label"><span>HP</span><span>${battle.enemy.currentHp}/${battle.enemy.hp}</span></div><div class="bar"><i style="width:${hp}%"></i></div>
    <div class="bar-label"><span>BREAK</span><span>${battle.enemy.break}/${battle.enemy.breakMax}</span></div><div class="bar break"><i style="width:${br}%"></i></div>
    <div class="battle-companion"><span>🐾 ${battle.pet.name}</span><small>Lv.${battle.pet.level}${battle.pet.evolved?' ✦':''}</small></div>
    <div class="ultimate-panel ${energy>=100?'ready':''}">
      <div class="ultimate-head"><span>${role.ultimate.icon} ${role.ultimate.name}</span><small>${Math.round(energy)} / 100</small></div>
      <div class="energy-bar"><i style="width:${energy}%"></i></div>
      <button class="ultimate-btn" data-action="ultimate" ${energy<100?'disabled':''}>${energy>=100?'釋放大招':role.ultimate.desc}</button>
    </div>
    <div class="skill-row">${SKILLS.map(s=>`<button class="skill-card ${battle.selectedSkill===s.id?'selected':''}" data-skill="${s.id}">${visual(s.art,s.icon,'skill-art')}<span>${s.name}</span></button>`).join('')}</div>
    ${renderQuestion(battle.currentQuestion)}
  </section>`;
}

function renderQuestion(q){
  const status=`<div class="status-line"><span class="mini-pill">🔥 ${battle.player.combo}</span><span class="status-mini">❤️ ${battle.player.hp} · 🛡️ ${battle.player.guard}</span></div>`;
  if(q.type==='spelling') return `<div class="question-card">${status}<div class="question-kind">✎ ${q.label}</div><div class="question-word">${q.prompt}</div><div class="question-hint">${q.zh}</div><div class="spell-row"><input id="spell-answer" class="spell-input" autocomplete="off" autocapitalize="none" placeholder="type..."><button class="spell-submit" data-action="submit-spelling">GO</button></div></div>`;
  if(q.type==='listening') return `<div class="question-card">${status}<div class="question-kind">🔊 ${q.label}</div><button class="listen-btn" data-action="speak-word">🔊</button><div class="answers">${q.options.map(o=>`<button class="soft-btn" data-answer="${o}">${o}</button>`).join('')}</div></div>`;
  return `<div class="question-card">${status}<div class="question-kind">${q.type==='reverse'?'⇄':'◆'} ${q.label}</div><div class="question-word">${q.prompt}</div><div class="answers">${shuffle([...q.options]).map(o=>`<button class="soft-btn" data-answer="${o}">${o}</button>`).join('')}</div></div>`;
}

function renderFeedback(result){
  if(result.effect==='ultimate') return `<div class="battle-fx ultimate-fx">-${result.amount}</div>`;
  if(!result.correct) return `<div class="battle-fx enemy-fx">-${result.playerDamage||0} HP</div>`;
  if(result.effect==='damage') return `<div class="battle-fx damage-fx">-${result.amount}</div>`;
  if(result.effect==='break') return `<div class="battle-fx break-fx">${result.broke?'BREAK!':`+${result.amount}`}</div>`;
  return `<div class="battle-fx guard-fx">🛡 +${result.amount}</div>`;
}

function renderPets(){
  return `${renderTop('寵物',`🔹 ${state.player.stones}`)}<div class="section-title"><h2>夥伴</h2><span>同行・升級・進化</span></div><div class="pet-grid">${PETS.map(p=>{
    const active=state.player.pet===p.id;
    const petState=state.pets?.[p.id]||{level:1,evolved:false};
    const upgradeCost=Math.max(1,petState.level);
    const canEvolve=!petState.evolved&&petState.level>=p.evolve&&state.inventory.includes('core');
    return `<article class="card pet-card ${active?'active-card':''}"><button class="pet-select" data-pet="${p.id}">${visual(p.art,p.icon,'card-art')}<h3>${p.name}${petState.evolved?' ✦':''}</h3><span class="pet-level">Lv.${petState.level}</span></button><p>${p.passive}</p><div class="pet-actions">${petState.level<10?`<button class="mini-action" data-upgrade-pet="${p.id}">🔹 ${upgradeCost} 升級</button>`:'<span class="mini-action disabled">MAX</span>'}${canEvolve?`<button class="mini-action evolve" data-evolve-pet="${p.id}">💠 進化</button>`:`<span class="mini-tag">${petState.evolved?'已進化':`Lv.${p.evolve} 進化`}</span>`}</div><span class="rarity">${active?'同行中':'點角色同行'}</span></article>`;
  }).join('')}</div>`;
}

function renderBag(){
  const owned=ITEMS.filter(i=>state.inventory.includes(i.id)||(i.id==='star-stone'&&state.player.stones>0));
  return `${renderTop('背包')}<div class="section-title"><h2>收藏</h2><span>${owned.length} 件</span></div><div class="item-grid">${owned.length?owned.map(i=>`<div class="card">${visual(i.art,i.icon,'card-art')}<h3>${i.name}</h3><p>${i.effect}</p><span class="rarity">${i.kind} · ${i.rarity}</span></div>`).join(''):'<div class="empty">還沒有收藏</div>'}</div>`;
}

function renderWords(){
  return `${renderTop('單字圖鑑')}<div class="section-title"><h2>Word Book</h2><span>${state.progress.masteredWords.length}/${WORDS.length}</span></div><div class="word-grid">${WORDS.map(w=>{
    const stats=state.progress.wordStats[w.id]||{correct:0,wrong:0};
    const total=stats.correct+stats.wrong;
    const rate=total?Math.round(stats.correct/total*100):0;
    return `<div class="card word-card"><div class="word-badge">${rate>=80?'⭐':'🔤'}</div><h3>${w.word}</h3><p>${w.zh}</p><div class="progress"><i style="width:${rate}%"></i></div><span class="rarity">${rate}%</span></div>`;
  }).join('')}</div>`;
}

function renderNav(){
  const tabs=[['home','🏕️','首頁'],['map','🗺️','冒險'],['pet','🐾','寵物'],['bag','🎒','背包'],['words','📖','圖鑑']];
  return `<nav class="bottom-nav">${tabs.map(([id,ic,label])=>`<button class="icon-btn ${view===id?'active':''}" data-view="${id}"><b>${ic}</b>${label}</button>`).join('')}</nav>`;
}

function bindEvents(){
  document.querySelectorAll('[data-view]').forEach(el=>el.addEventListener('click',()=>{view=el.dataset.view;render();}));
  document.querySelector('[data-action="enter-game"]')?.addEventListener('click',enterGame);
  document.querySelector('#player-name')?.addEventListener('keydown',e=>{if(e.key==='Enter') enterGame();});
  document.querySelector('[data-action="line-login"]')?.addEventListener('click',()=>toast('LINE 登入尚未串接'));
  document.querySelectorAll('[data-role]').forEach(el=>el.addEventListener('click',()=>chooseRole(el.dataset.role)));
  document.querySelector('[data-action="go-map"]')?.addEventListener('click',()=>{view='map';render();});
  document.querySelectorAll('[data-preview-stage]').forEach(el=>el.addEventListener('click',()=>openStagePreview(Number(el.dataset.previewStage))));
  document.querySelector('[data-action="back-map"]')?.addEventListener('click',()=>{view='map';render();});
  document.querySelectorAll('[data-start-stage]').forEach(el=>el.addEventListener('click',()=>startBattle(Number(el.dataset.startStage))));
  document.querySelectorAll('[data-skill]').forEach(el=>el.addEventListener('click',()=>{battle=chooseSkill(battle,el.dataset.skill);render();}));
  document.querySelector('[data-action="ultimate"]')?.addEventListener('click',activateUltimate);
  document.querySelectorAll('[data-answer]').forEach(el=>el.addEventListener('click',()=>answer(el.dataset.answer)));
  document.querySelector('[data-action="submit-spelling"]')?.addEventListener('click',submitSpelling);
  document.querySelector('#spell-answer')?.addEventListener('keydown',e=>{if(e.key==='Enter') submitSpelling();});
  document.querySelector('[data-action="speak-word"]')?.addEventListener('click',speakCurrentWord);
  document.querySelectorAll('[data-pet]').forEach(el=>el.addEventListener('click',()=>selectPet(el.dataset.pet)));
  document.querySelectorAll('[data-upgrade-pet]').forEach(el=>el.addEventListener('click',()=>upgradePet(el.dataset.upgradePet)));
  document.querySelectorAll('[data-evolve-pet]').forEach(el=>el.addEventListener('click',()=>evolvePet(el.dataset.evolvePet)));
  document.querySelector('[data-action="finish-battle"]')?.addEventListener('click',()=>{battle=null;view='map';render();});
  if(view==='battle'&&battle?.currentQuestion?.type==='listening') setTimeout(speakCurrentWord,100);
}

function enterGame(){
  const input=document.querySelector('#player-name');
  const name=(input?.value||'').trim();
  if(!name){toast('請輸入名字');input?.focus();return;}
  state.player.name=name.slice(0,12);
  state.session={...state.session,entered:true,loginMethod:'guest'};
  saveState(state);view=state.session.roleChosen?'home':'role';render();
}

function chooseRole(roleId){if(!ROLES.some(r=>r.id===roleId)) return;state.player.role=roleId;state.session.roleChosen=true;saveState(state);view='home';render();}
function selectPet(petId){if(!PETS.some(p=>p.id===petId)) return;state.player.pet=petId;saveState(state);toast('已更換夥伴');render();}
function upgradePet(petId){const p=state.pets?.[petId];if(!p||p.level>=10)return;const cost=Math.max(1,p.level);if(state.player.stones<cost){toast(`需要 ${cost} 顆星語石`);return;}state.player.stones-=cost;p.level+=1;saveState(state);toast(`升到 Lv.${p.level}`);render();}
function evolvePet(petId){const pet=PETS.find(p=>p.id===petId);const ps=state.pets?.[petId];const i=state.inventory.indexOf('core');if(!pet||!ps||ps.evolved||ps.level<pet.evolve||i<0)return;ps.evolved=true;state.inventory.splice(i,1);saveState(state);toast('進化成功 ✦');render();}
function openStagePreview(stageId){const stage=STAGES.find(s=>s.id===stageId);if(!stage||stage.id>state.progress.unlockedStage)return;selectedStageId=stageId;view='stage';render();}

function startBattle(stageId){
  const stage=STAGES.find(s=>s.id===stageId);if(!stage)return;
  const petState=state.pets?.[state.player.pet]||{level:1,evolved:false};
  battle=createBattle(stage,{petId:state.player.pet,petLevel:petState.level,petEvolved:petState.evolved,roleId:state.player.role,wordStats:state.progress.wordStats,inventory:state.inventory});
  view='battle';render();
}

function activateUltimate(){
  if(!battle||battle.player.energy<100)return;
  battle=useUltimate(battle);
  if(battle.finished&&battle.won&&!battle.rewardProcessed){battle.rewardEarned=completeStage(battle.stageId,battle.stars);battle.rewardProcessed=true;saveState(state);}
  render();
}

function submitSpelling(){const input=document.querySelector('#spell-answer');const value=(input?.value||'').trim();if(!value){input?.focus();return;}answer(value);}
function speakCurrentWord(){const word=battle?.currentQuestion?.word;if(!word||!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const utter=new SpeechSynthesisUtterance(word);utter.lang='en-US';utter.rate=.82;window.speechSynthesis.speak(utter);}

function answer(answerText){
  const q=battle.currentQuestion;
  const correct=String(answerText).trim().toLowerCase()===String(q.answer).trim().toLowerCase();
  const stats=state.progress.wordStats[q.wordId]||{correct:0,wrong:0};
  correct?stats.correct++:stats.wrong++;state.progress.wordStats[q.wordId]=stats;
  const total=stats.correct+stats.wrong;
  if(total>=3&&stats.correct/total>=.8&&!state.progress.masteredWords.includes(q.wordId)) state.progress.masteredWords.push(q.wordId);
  battle.wordStats=state.progress.wordStats;
  battle=resolveAnswer(battle,answerText);
  if(battle.finished&&battle.won&&!battle.rewardProcessed){battle.rewardEarned=completeStage(battle.stageId,battle.stars);battle.rewardProcessed=true;}
  saveState(state);toast(correct?'✓ 正確':`✕ ${q.word} = ${q.zh}`);render();
}

function completeStage(stageId,stars=1){
  const stage=STAGES.find(s=>s.id===stageId);if(!stage)return null;
  const previous=state.progress.stageStars?.[stageId]||0;
  state.progress.stageStars={...(state.progress.stageStars||{}),[stageId]:Math.max(previous,stars)};
  const firstClear=!state.progress.cleared.includes(stageId);state.player.exp+=20;
  if(state.player.exp>=100){state.player.level+=1;state.player.exp-=100;}
  if(!firstClear)return null;
  state.progress.cleared.push(stageId);state.progress.unlockedStage=Math.min(STAGES.length,Math.max(state.progress.unlockedStage,stageId+1));
  if(stage.reward==='star-stone') state.player.stones+=2;else if(!state.inventory.includes(stage.reward)) state.inventory.push(stage.reward);
  return stage.reward;
}

function shortBonus(text){return text.replace('時，',' · ').replace('有機率','').replace('額外','');}
function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
function escapeHtml(value){return String(value).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));}
function toast(text){document.querySelector('.toast')?.remove();const el=document.createElement('div');el.className='toast';el.textContent=text;document.body.appendChild(el);clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.remove(),900);}

render();