export function createPkMode({app,meta,ROLES,PETS,WORDS,UPGRADES,visual,onExit}){
  let socket=null,alive=false,status='idle',me=null,opponent=null,question=null,turn=1,round=0;
  let review=null,pendingCorrect=true,choices=[],waiting=false,combatFx={self:'',opp:'',proc:''},anim='';

  const role=()=>ROLES[me?.role||meta.role];
  const pet=()=>PETS[me?.pet||meta.pet||'fox'];
  const oppRole=()=>ROLES[opponent?.role||'warrior'];
  const oppPet=()=>PETS[opponent?.pet||'fox'];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const shuffle=a=>{const c=[...a];for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]];}return c};
  const fmt=v=>Number.isInteger(v)?String(v):v.toFixed(1);
  const wsUrl=()=>`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/match`;

  function basePlayer(profile){
    const b=ROLES[profile.role].base;
    return {role:profile.role,pet:profile.pet,hp:b.hp,maxHp:b.hp,atk:b.atk,def:b.def,crit:b.crit||.05,combo:0,lifesteal:0,counter:0,shield:0,fire:0,poison:0,regen:0,rage:0,roleGuard:0,reprisal:0,elementAmp:0,arcaneBurst:0,firstCrit:0,firstCombo:0,skills:{},streak:0};
  }

  function start(){
    stop(false);status='connecting';alive=true;renderQueue('連線中…');
    try{socket=new WebSocket(wsUrl())}catch{renderQueue('無法連線');return}
    socket.onopen=()=>{status='matching';renderQueue('PK 配對中…');send({type:'join',profile:{role:meta.role,pet:meta.pet||'fox'}})};
    socket.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}handle(m)};
    socket.onerror=()=>{if(alive)renderQueue('PK 連線失敗')};
    socket.onclose=()=>{if(alive&&status!=='finished'){status='closed';renderQueue('連線已中斷')}};
  }
  function stop(exit=true){alive=false;if(socket){try{socket.close(1000,'leave')}catch{}socket=null}if(exit)onExit();}
  function send(data){if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(data))}

  function handle(m){
    if(m.type==='queued'){status='matching';renderQueue('PK 配對中…');return}
    if(m.type==='matched'){
      status='battle';me=basePlayer({role:meta.role,pet:meta.pet||'fox'});opponent={...m.opponent,hp:m.opponent.hp,maxHp:m.opponent.maxHp};turn=1;round=0;waiting=false;review=null;question=makeQuestion(m.questionIndex);renderBattle();return;
    }
    if(m.type==='waiting-opponent'){waiting=true;renderBattle();return}
    if(m.type==='battle-result'){waiting=false;animateRounds(m.rounds||[],m.nextQuestionIndex,m.finished,m.winner);return}
    if(m.type==='opponent-left'){status='finished';renderEnd(true,'對手離線');return}
    if(m.type==='error'){renderQueue(m.message||'配對發生錯誤')}
  }

  function makeQuestion(index){const w=WORDS[index%WORDS.length];return {word:w[0],answer:w[1],options:shuffle([...w[2]])}}
  function skillLevel(id){return me.skills[id]||0}
  function rollChoices(){
    const r=role(),allowed=UPGRADES.filter(u=>!u.roleOnly||u.roleOnly===me.role),weighted=[];
    for(const u of allowed){weighted.push(u);for(let i=0;i<Math.min(4,Math.floor(skillLevel(u.id)));i++)weighted.push(u);if(r.favored.includes(u.id))weighted.push(u,u)}
    const out=[];for(const u of shuffle(weighted)){if(!out.some(x=>x.id===u.id))out.push(u);if(out.length===3)break}
    if(!out.some(u=>u.roleOnly===me.role)){const ex=shuffle(allowed.filter(u=>u.roleOnly===me.role));if(ex.length)out[2]=ex[0]}
    return out;
  }

  function answer(value){
    if(status!=='battle'||waiting||review||round>0)return;
    pendingCorrect=value===question.answer;review={selected:value,correct:pendingCorrect};me.streak=pendingCorrect?me.streak+1:0;renderBattle();
    setTimeout(()=>{if(!alive)return;review=null;choices=rollChoices();renderUpgrade()},1150);
  }
  function chooseUpgrade(id){
    const u=UPGRADES.find(x=>x.id===id);if(!u||waiting)return;
    const gain=pendingCorrect?1:.5,next=skillLevel(id)+gain;me.skills[id]=next;u.apply(me,next,pendingCorrect?1:.5);waiting=true;send({type:'ready',correct:pendingCorrect,snapshot:snapshot()});renderBattle();
  }
  function snapshot(){
    const keys=['hp','maxHp','atk','def','crit','combo','lifesteal','counter','shield','fire','poison','regen','rage','roleGuard','reprisal','elementAmp','arcaneBurst','firstCrit','firstCombo'];
    const out={role:me.role,pet:me.pet,skills:me.skills,streak:me.streak};for(const k of keys)out[k]=Number(me[k]||0);return out;
  }

  function animateRounds(rounds,nextQuestionIndex,finished,winner){
    if(!alive)return;round=1;let i=0;
    const step=()=>{
      const r=rounds[i];if(!r){round=0;if(finished){status='finished';renderEnd(winner==='self',winner==='draw'?'平手':'');return}turn++;question=makeQuestion(nextQuestionIndex);review=null;combatFx={self:'',opp:'',proc:''};anim='';renderBattle();return}
      me.hp=r.selfHp;opponent.hp=r.opponentHp;combatFx={self:r.received?`-${r.received}`:'',opp:r.dealt?`-${r.dealt}`:'',proc:[r.selfCrit?'💥 暴擊':'',r.selfCombo?'➶ 連擊':'',r.oppCrit?'對手暴擊':''].filter(Boolean).join(' · ')};anim='pk-clash';renderBattle();
      setTimeout(()=>{i++;round=i<rounds.length?i+1:3;anim='';combatFx={self:'',opp:'',proc:''};setTimeout(step,520)},900);
    };step();
  }

  function renderQueue(text){
    app.innerHTML=`<main class="home-screen pk-queue-screen"><div class="home-overlay"></div><div class="pk-match-banner"><span class="pk-pulse"></span><b>${text}</b><small>找到同樣按下 PK 的玩家就會立即開始</small></div><section class="home-panel pk-queue-panel"><div class="logo-mark">WORD QUEST <span>PK</span></div><div class="role-preview">${visual(ROLES[meta.role].art,ROLES[meta.role].icon,'home-role-art')}<div><b>${ROLES[meta.role].name}</b><span>${PETS[meta.pet||'fox'].icon} ${PETS[meta.pet||'fox'].name}<br>即時 1 對 1 配對</span></div></div><button class="home-btn" data-pk-cancel>取消配對</button></section></main>`;
    app.querySelector('[data-pk-cancel]')?.addEventListener('click',()=>stop(true));
  }
  function renderBattle(){
    const r=role(),p=pet(),or=oppRole(),op=oppPet();const myPct=clamp(me.hp/me.maxHp*100,0,100),oppPct=clamp(opponent.hp/opponent.maxHp*100,0,100);
    app.innerHTML=`<main class="game-shell pk-shell"><header class="game-head"><button data-pk-quit>×</button><div><small>REALTIME PK · TURN</small><b>${turn}</b></div><div class="streak-chip">${waiting?'等待對手…':'⚔️ PK'}</div></header><section class="arena ${anim}"><div class="hero-side">${combatFx.self?`<div class="combat-number hero-number">${combatFx.self}</div>`:''}${visual(r.art,r.icon,'hero-art')}<div class="pk-pet">${visual(p.art,p.icon,'hero-art')}</div><div class="hero-name">你 · ${r.name}</div><div class="hpbar"><i style="width:${myPct}%"></i></div><small>${Math.max(0,me.hp)} / ${me.maxHp}</small><div class="stats-mini"><span>⚔️ ${me.atk}</span><span>🛡️ ${me.def}</span><span>💥 ${Math.round(me.crit*100)}%</span></div></div><div class="vs-line"><span>${round?`ROUND ${round}/3`:'ONLINE'}</span><b>VS</b><div class="round-dots">${[1,2,3].map(n=>`<i class="${round===n?'active':round>n?'done':''}"></i>`).join('')}</div><em>${combatFx.proc||'&nbsp;'}</em></div><div class="enemy-side">${combatFx.opp?`<div class="combat-number enemy-number">${combatFx.opp}</div>`:''}<div class="enemy-label">對手 · ${or.name}</div>${visual(or.art,or.icon,'enemy-art')}<div class="pk-pet pk-pet-right">${visual(op.art,op.icon,'hero-art')}</div><div class="hpbar enemy"><i style="width:${oppPct}%"></i></div><small>${Math.max(0,opponent.hp)} / ${opponent.maxHp}</small><div class="stats-mini enemy-stats"><span>${op.icon} ${op.name}</span></div></div></section>${waiting?`<div class="pk-waiting-strip"><span class="pk-pulse"></span>等待對手完成選擇…</div>`:''}${renderQuiz()}</main>`;
    app.querySelector('[data-pk-quit]')?.addEventListener('click',()=>stop(true));app.querySelectorAll('[data-pk-answer]').forEach(el=>el.addEventListener('click',()=>answer(el.dataset.pkAnswer)));
  }
  function renderQuiz(){
    const battleFocus=round>0||waiting;return `<section class="quiz-card ${review?'reviewing':''} ${battleFocus?'battle-focus':''}"><div class="quiz-top"><span>${review?'作答結果':round?'三回合 PK 中':waiting?'等待對手':'雙方同一題'}</span><b>${pendingCorrect&&review?'完整強化':''}</b></div><h2>${question.word}</h2><div class="answers">${question.options.map(o=>{let cls='';if(review){if(o===question.answer)cls='correct-answer';else if(o===review.selected&&!review.correct)cls='wrong-answer'}return `<button class="${cls}" data-pk-answer="${o}" ${(battleFocus||review)?'disabled':''}>${o}</button>`}).join('')}</div>${review?`<div class="answer-summary ${review.correct?'ok':'bad'}"><b>${review.correct?'✓ 答對':'✕ 答錯'}</b><span>正解：${question.answer}</span></div>`:''}</section>`;
  }
  function renderUpgrade(){
    app.innerHTML=`<main class="choice-screen pk-choice"><div class="choice-head"><small>REALTIME PK</small><h1>${pendingCorrect?'答對：三選一完整強化':'答錯：仍可拿 50% 強化'}</h1><p>選完後等待對手，雙方準備完成就立即打 3 回合。</p></div><div class="upgrade-grid">${choices.map(u=>{const cur=skillLevel(u.id),next=cur+(pendingCorrect?1:.5);return `<button data-pk-upgrade="${u.id}"><span>${u.icon}</span><div><em>${cur?`Lv.${fmt(cur)} → Lv.${fmt(next)}`:`NEW → Lv.${fmt(next)}`}</em><b>${u.name}</b><small>${u.desc(Math.max(1,next))}${pendingCorrect?'':' · 本次 50%'}</small></div></button>`}).join('')}</div></main>`;
    app.querySelectorAll('[data-pk-upgrade]').forEach(el=>el.addEventListener('click',()=>chooseUpgrade(el.dataset.pkUpgrade)));
  }
  function renderEnd(win,note=''){
    app.innerHTML=`<main class="end-screen"><div class="end-card"><div class="end-icon">${win?'🏆':'⚔️'}</div><small>REALTIME PK</small><h1>${note|| (win?'PK 勝利！':'PK 戰敗')}</h1><div class="end-stats"><span>回合<b>${turn}</b></span><span>剩餘 HP<b>${Math.max(0,me?.hp||0)}</b></span><span>職業<b>${role().name}</b></span></div><button class="fight-btn" data-pk-again>再次配對 <span>⚔️</span></button><button class="home-btn" data-pk-home>回首頁</button></div></main>`;
    app.querySelector('[data-pk-again]')?.addEventListener('click',start);app.querySelector('[data-pk-home]')?.addEventListener('click',()=>stop(true));
  }
  return {start,stop};
}
