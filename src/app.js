import { ROLES, PETS, ITEMS, WORDS, STAGES, SKILLS } from './game-data.js';
import { visual } from './assets.js';
import { loadState, saveState } from './store.js';
import { createBattle, chooseSkill, resolveAnswer } from './battle-engine.js';

const app=document.querySelector('#app');
let state=loadState();
let view=!state.session?.entered?'login':state.session.roleChosen?'home':'role';
let battle=null;
let toastTimer=null;

function render(){
  const content={login:renderLogin,role:renderRoleSelect,home:renderHome,map:renderMap,battle:renderBattle,pet:renderPets,bag:renderBag,words:renderWords}[view]?.() || renderHome();
  if(view==='login') app.innerHTML=content;
  else app.innerHTML=`<main class="app-shell">${content}${!['battle','role'].includes(view)?renderNav():''}</main>`;
  bindEvents();
}

function renderLogin(){
  return `<main class="login-screen">
    <div class="login-panel">
      <input class="login-name" id="player-name" type="text" maxlength="12" autocomplete="nickname" placeholder="輸入名字" value="${escapeHtml(state.player.name||'')}" aria-label="輸入名字">
      <button class="line-login-btn" data-action="line-login" type="button"><span class="line-mark">LINE</span><span>LINE 登入</span></button>
      <button class="enter-game-btn" data-action="enter-game" type="button">進入</button>
    </div>
  </main>`;
}

function renderRoleSelect(){
  return `<section class="role-select-screen">
    <div class="section-title role-title"><h2>選擇勇者</h2><span>${escapeHtml(state.player.name||'勇者')}</span></div>
    <div class="role-grid">${ROLES.map(role=>`<button class="role-card" data-role="${role.id}">
      <div class="role-art-wrap">${visual(role.art,role.icon,'role-select-art')}</div>
      <strong>${role.name}</strong>
      <span>${shortBonus(role.bonus)}</span>
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
  return `${renderTop('WORD RPG')}
  <section class="hero-card">
    <div class="avatar-wrap">${visual(role.art,role.icon,'hero-art')}<div class="pet-bubble">${visual(pet.art,pet.icon,'pet-art')}</div></div>
    <div class="hero-title">${role.name}・${playerName}</div>
    <div class="hero-sub">${pet.name} Lv.${petState.level}${petState.evolved?' · ✦':''}</div>
    <button class="primary-btn" data-action="go-map">▶ 開始冒險</button>
    <div class="stats">
      <div class="stat"><strong>${state.progress.cleared.length}</strong><span>關卡</span></div>
      <div class="stat"><strong>${state.progress.masteredWords.length}</strong><span>熟練字</span></div>
      <div class="stat"><strong>${state.player.stones}</strong><span>星語石</span></div>
    </div>
  </section>
  <section class="quick-grid">
    <button class="quick soft-btn" data-view="pet">${visual(pet.art,pet.icon,'nav-art')}<span>寵物</span></button>
    <button class="quick soft-btn" data-view="words"><span class="emoji">📖</span><span>圖鑑</span></button>
  </section>`;
}

function renderMap(){
  return `${renderTop('霧森之路',`${state.progress.unlockedStage}/5`)}
  <div class="section-title"><h2>冒險</h2><span>選一個節點</span></div>
  <section class="map-card"><div class="path">
    ${STAGES.map(stage=>{
      const unlocked=stage.id<=state.progress.unlockedStage;
      const cleared=state.progress.cleared.includes(stage.id);
      return `<button class="node ${!unlocked?'locked':''} ${stage.boss?'boss':''}" ${unlocked?'data-stage="'+stage.id+'"':''}>${cleared?'✅':stage.icon}<small>${stage.name}</small></button>`;
    }).join('')}
  </div></section>`;
}

function renderBattle(){
  if(!battle){ view='map'; return renderMap(); }
  const stage=STAGES.find(s=>s.id===battle.stageId);
  const hp=Math.max(0,battle.enemy.currentHp/battle.enemy.hp*100);
  const br=Math.max(0,battle.enemy.break/battle.enemy.breakMax*100);
  if(battle.finished){
    const reward=battle.rewardEarned?ITEMS.find(i=>i.id===battle.rewardEarned):null;
    return `${renderTop(stage.name)}<section class="hero-card result-card">
      <div class="result-icon">${battle.won?'🏆':'💤'}</div>
      <div class="hero-title">${battle.won?'勝利':'再試一次'}</div>
      ${battle.won&&reward?`<div class="loot-reveal">${visual(reward.art,reward.icon,'loot-art')}<strong>${reward.name}</strong><span>${reward.kind}</span></div>`:''}
      ${battle.won&&!reward?`<div class="hero-sub">已完成關卡</div>`:`<div class="hero-sub">${battle.won?'獎勵已收入背包':'休息一下，再回來挑戰'}</div>`}
      <button class="primary-btn" data-action="finish-battle">返回地圖</button>
    </section>`;
  }
  const result=battle.lastResult;
  const fx=result?.correct?result.effect:'enemy';
  const feedback=result?renderFeedback(result):'';
  return `${renderTop(stage.name,`Turn ${battle.turn}`)}
  <section class="battle-stage ${result?'has-feedback':''}">
    <div class="enemy-box ${fx==='damage'?'hit':''} ${result?.broke?'broken':''}">
      <div class="enemy-avatar">${visual(battle.enemy.art,battle.enemy.icon,'enemy-art')}</div>
      ${feedback}
      <div class="enemy-name">${battle.enemy.name}</div>
      <div class="intent">👁 ${battle.enemy.intent}</div>
    </div>
    <div class="bar-label"><span>HP</span><span>${battle.enemy.currentHp}/${battle.enemy.hp}</span></div><div class="bar"><i style="width:${hp}%"></i></div>
    <div class="bar-label"><span>BREAK</span><span>${battle.enemy.break}/${battle.enemy.breakMax}</span></div><div class="bar break"><i style="width:${br}%"></i></div>
    <div class="skill-row">${SKILLS.map(s=>`<button class="skill-card ${battle.selectedSkill===s.id?'selected':''}" data-skill="${s.id}">${visual(s.art,s.icon,'skill-art')}<span>${s.name}</span></button>`).join('')}</div>
    <div class="question-card">
      <div class="status-line"><span class="mini-pill">🔥 ${battle.player.combo}</span><span class="status-mini">❤️ ${battle.player.hp} · 🛡️ ${battle.player.guard}</span></div>
      <div class="question-word">${battle.currentWord.word}</div>
      <div class="answers">${shuffle([...battle.currentWord.options]).map(o=>`<button class="soft-btn" data-answer="${o}">${o}</button>`).join('')}</div>
    </div>
  </section>`;
}

function renderFeedback(result){
  if(!result.correct) return `<div class="battle-fx enemy-fx">-${result.playerDamage || 0} HP</div>`;
  if(result.effect==='damage') return `<div class="battle-fx damage-fx">-${result.amount}</div>`;
  if(result.effect==='break') return `<div class="battle-fx break-fx">${result.broke?'BREAK!':`+${result.amount}`}</div>`;
  return `<div class="battle-fx guard-fx">🛡 +${result.amount}</div>`;
}

function renderPets(){
  return `${renderTop('寵物',`🔹 ${state.player.stones}`)}
  <div class="section-title"><h2>夥伴</h2><span>同行・升級・進化</span></div>
  <div class="pet-grid">${PETS.map(p=>{
    const active=state.player.pet===p.id;
    const petState=state.pets?.[p.id] || {level:1,evolved:false};
    const upgradeCost=Math.max(1,petState.level);
    const canEvolve=!petState.evolved&&petState.level>=p.evolve&&state.inventory.includes('core');
    return `<article class="card pet-card ${active?'active-card':''}">
      <button class="pet-select" data-pet="${p.id}">${visual(p.art,p.icon,'card-art')}<h3>${p.name}${petState.evolved?' ✦':''}</h3><span class="pet-level">Lv.${petState.level}</span></button>
      <p>${p.passive}</p>
      <div class="pet-actions">
        ${petState.level<10?`<button class="mini-action" data-upgrade-pet="${p.id}">🔹 ${upgradeCost} 升級</button>`:'<span class="mini-action disabled">MAX</span>'}
        ${canEvolve?`<button class="mini-action evolve" data-evolve-pet="${p.id}">💠 進化</button>`:`<span class="mini-tag">${petState.evolved?'已進化':`Lv.${p.evolve} 進化`}</span>`}
      </div>
      <span class="rarity">${active?'同行中':'點角色同行'}</span>
    </article>`;
  }).join('')}</div>`;
}

function renderBag(){
  const owned=ITEMS.filter(i=>state.inventory.includes(i.id) || (i.id==='star-stone'&&state.player.stones>0));
  return `${renderTop('背包')}<div class="section-title"><h2>收藏</h2><span>${owned.length} 件</span></div>
  <div class="item-grid">${owned.length?owned.map(i=>`<div class="card">${visual(i.art,i.icon,'card-art')}<h3>${i.name}</h3><p>${i.effect}</p><span class="rarity">${i.kind} · ${i.rarity}</span></div>`).join(''):'<div class="empty">還沒有收藏</div>'}</div>`;
}

function renderWords(){
  return `${renderTop('單字圖鑑')}<div class="section-title"><h2>Word Book</h2><span>${state.progress.masteredWords.length}/${WORDS.length}</span></div>
  <div class="word-grid">${WORDS.map(w=>{
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
  document.querySelector('#player-name')?.addEventListener('keydown',event=>{if(event.key==='Enter') enterGame();});
  document.querySelector('[data-action="line-login"]')?.addEventListener('click',()=>toast('LINE 登入尚未串接'));
  document.querySelectorAll('[data-role]').forEach(el=>el.addEventListener('click',()=>chooseRole(el.dataset.role)));
  document.querySelector('[data-action="go-map"]')?.addEventListener('click',()=>{view='map';render();});
  document.querySelectorAll('[data-stage]').forEach(el=>el.addEventListener('click',()=>startBattle(Number(el.dataset.stage))));
  document.querySelectorAll('[data-skill]').forEach(el=>el.addEventListener('click',()=>{battle=chooseSkill(battle,el.dataset.skill);render();}));
  document.querySelectorAll('[data-answer]').forEach(el=>el.addEventListener('click',()=>answer(el.dataset.answer)));
  document.querySelectorAll('[data-pet]').forEach(el=>el.addEventListener('click',()=>selectPet(el.dataset.pet)));
  document.querySelectorAll('[data-upgrade-pet]').forEach(el=>el.addEventListener('click',()=>upgradePet(el.dataset.upgradePet)));
  document.querySelectorAll('[data-evolve-pet]').forEach(el=>el.addEventListener('click',()=>evolvePet(el.dataset.evolvePet)));
  document.querySelector('[data-action="finish-battle"]')?.addEventListener('click',()=>{battle=null;view='map';render();});
}

function enterGame(){
  const input=document.querySelector('#player-name');
  const name=(input?.value||'').trim();
  if(!name){toast('請輸入名字');input?.focus();return;}
  state.player.name=name.slice(0,12);
  state.session={...state.session,entered:true,loginMethod:'guest'};
  saveState(state);
  view=state.session.roleChosen?'home':'role';
  render();
}

function chooseRole(roleId){
  if(!ROLES.some(r=>r.id===roleId)) return;
  state.player.role=roleId;
  state.session.roleChosen=true;
  saveState(state);
  view='home';
  render();
}

function selectPet(petId){
  if(!PETS.some(p=>p.id===petId)) return;
  state.player.pet=petId;
  saveState(state);
  toast('已更換夥伴');
  render();
}

function upgradePet(petId){
  const petState=state.pets?.[petId];
  if(!petState || petState.level>=10) return;
  const cost=Math.max(1,petState.level);
  if(state.player.stones<cost){toast(`需要 ${cost} 顆星語石`);return;}
  state.player.stones-=cost;
  petState.level+=1;
  saveState(state);
  toast(`升到 Lv.${petState.level}`);
  render();
}

function evolvePet(petId){
  const pet=PETS.find(p=>p.id===petId);
  const petState=state.pets?.[petId];
  const coreIndex=state.inventory.indexOf('core');
  if(!pet||!petState||petState.evolved||petState.level<pet.evolve||coreIndex<0) return;
  petState.evolved=true;
  state.inventory.splice(coreIndex,1);
  saveState(state);
  toast('進化成功 ✦');
  render();
}

function startBattle(stageId){
  const stage=STAGES.find(s=>s.id===stageId);
  if(!stage) return;
  battle=createBattle(stage);
  view='battle';
  render();
}

function answer(answerText){
  const wordId=battle.currentWord.id;
  const correct=answerText===battle.currentWord.zh;
  const stats=state.progress.wordStats[wordId]||{correct:0,wrong:0};
  correct?stats.correct++:stats.wrong++;
  state.progress.wordStats[wordId]=stats;
  const total=stats.correct+stats.wrong;
  if(total>=3 && stats.correct/total>=.8 && !state.progress.masteredWords.includes(wordId)) state.progress.masteredWords.push(wordId);

  battle=resolveAnswer(battle,answerText);
  if(battle.finished&&battle.won&&!battle.rewardProcessed){
    battle.rewardEarned=completeStage(battle.stageId);
    battle.rewardProcessed=true;
  }
  saveState(state);
  toast(correct?'✓ 正確':'✕ '+battle.lastResult.zh);
  render();
}

function completeStage(stageId){
  const stage=STAGES.find(s=>s.id===stageId);
  if(!stage) return null;
  const firstClear=!state.progress.cleared.includes(stageId);
  state.player.exp+=20;
  if(state.player.exp>=100){state.player.level+=1;state.player.exp-=100;}
  if(!firstClear) return null;

  state.progress.cleared.push(stageId);
  state.progress.unlockedStage=Math.min(STAGES.length,Math.max(state.progress.unlockedStage,stageId+1));
  if(stage.reward==='star-stone') state.player.stones+=2;
  else if(!state.inventory.includes(stage.reward)) state.inventory.push(stage.reward);
  return stage.reward;
}

function shortBonus(text){
  return text.replace('時，',' · ').replace('有機率','').replace('額外','');
}

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
  return arr;
}

function escapeHtml(value){
  return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function toast(text){
  document.querySelector('.toast')?.remove();
  const el=document.createElement('div');el.className='toast';el.textContent=text;document.body.appendChild(el);
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.remove(),900);
}

render();
