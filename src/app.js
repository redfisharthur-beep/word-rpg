import { ROLES, PETS, ITEMS, WORDS, STAGES, SKILLS } from './game-data.js';
import { visual } from './assets.js';
import { loadState, saveState } from './store.js';
import { createBattle, chooseSkill, resolveAnswer } from './battle-engine.js';

const app=document.querySelector('#app');
let state=loadState();
let view='home';
let battle=null;
let toastTimer=null;

function render(){
  const content={home:renderHome,map:renderMap,battle:renderBattle,pet:renderPets,bag:renderBag,words:renderWords}[view]?.() || renderHome();
  app.innerHTML=`<main class="app-shell">${content}${view!=='battle'?renderNav():''}</main>`;
  bindEvents();
}

function renderTop(title,meta=''){
  return `<div class="topbar"><div class="brand">${title}</div><div class="level-pill">Lv.${state.player.level}${meta?` · ${meta}`:''}</div></div>`;
}

function renderHome(){
  const role=ROLES.find(r=>r.id===state.player.role) || ROLES[0];
  const pet=PETS.find(p=>p.id===state.player.pet) || PETS[0];
  return `${renderTop('WORD RPG')}
  <section class="hero-card">
    <div class="avatar-wrap">${visual(role.art,role.icon,'hero-art')}<div class="pet-bubble">${visual(pet.art,pet.icon,'pet-art')}</div></div>
    <div class="hero-title">${role.name}・${state.player.name}</div>
    <div class="hero-sub">${role.bonus}</div>
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
    return `${renderTop(stage.name)}<section class="hero-card result-card">
      <div class="result-icon">${battle.won?'🏆':'💤'}</div>
      <div class="hero-title">${battle.won?'勝利':'再試一次'}</div>
      <div class="hero-sub">${battle.won?`獲得 ${rewardLabel(stage.reward)}`:'休息一下，再回來挑戰'}</div>
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
  return `${renderTop('寵物')}
  <div class="section-title"><h2>夥伴</h2><span>點選同行</span></div>
  <div class="pet-grid">${PETS.map(p=>{
    const active=state.player.pet===p.id;
    return `<button class="card soft-btn pet-card ${active?'active-card':''}" data-pet="${p.id}">${visual(p.art,p.icon,'card-art')}<h3>${p.name}</h3><p>${p.passive}</p><div class="progress"><i style="width:${active?65:30}%"></i></div><span class="rarity">${active?'同行中':'可選擇'}</span></button>`;
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
  document.querySelector('[data-action="go-map"]')?.addEventListener('click',()=>{view='map';render();});
  document.querySelectorAll('[data-stage]').forEach(el=>el.addEventListener('click',()=>startBattle(Number(el.dataset.stage))));
  document.querySelectorAll('[data-skill]').forEach(el=>el.addEventListener('click',()=>{battle=chooseSkill(battle,el.dataset.skill);render();}));
  document.querySelectorAll('[data-answer]').forEach(el=>el.addEventListener('click',()=>answer(el.dataset.answer)));
  document.querySelectorAll('[data-pet]').forEach(el=>el.addEventListener('click',()=>{state.player.pet=el.dataset.pet;saveState(state);toast('已更換夥伴');render();}));
  document.querySelector('[data-action="finish-battle"]')?.addEventListener('click',()=>{battle=null;view='map';render();});
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
  if(battle.finished && battle.won) completeStage(battle.stageId);
  saveState(state);
  toast(correct?'✓ 正確':'✕ '+battle.lastResult.zh);
  render();
}

function completeStage(stageId){
  const stage=STAGES.find(s=>s.id===stageId);
  if(!state.progress.cleared.includes(stageId)){
    state.progress.cleared.push(stageId);
    state.progress.unlockedStage=Math.min(STAGES.length,Math.max(state.progress.unlockedStage,stageId+1));
    if(stage.reward==='star-stone') state.player.stones+=2;
    else if(!state.inventory.includes(stage.reward)) state.inventory.push(stage.reward);
    state.player.exp+=40;
    if(state.player.exp>=100){state.player.level+=1;state.player.exp-=100;}
  }
}

function rewardLabel(id){
  const item=ITEMS.find(i=>i.id===id);
  return item?`${item.icon} ${item.name}`:'獎勵';
}

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
  return arr;
}

function toast(text){
  document.querySelector('.toast')?.remove();
  const el=document.createElement('div');el.className='toast';el.textContent=text;document.body.appendChild(el);
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.remove(),900);
}

render();
