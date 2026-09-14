export function createPkMode({app,meta,ROLES,PETS,WORDS,visual,onExit}){
  let socket=null,alive=false,status='idle',me=null,opponent=null,q=null,choice=null,answerState=null,waiting=false,turn=1;
  const shuffle=a=>{const c=[...a];for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]];}return c};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const wsUrl=()=>`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/match`;
  const makeQuestion=index=>{const w=WORDS[index%WORDS.length];return {word:w[0],answer:w[1],options:shuffle([...w[2]])}};
  const basePlayer=profile=>{const b=ROLES[profile.role].base;return {role:profile.role,pet:profile.pet,hp:b.hp,maxHp:b.hp,atk:b.atk,def:b.def,crit:.05,combo:0,lifesteal:0,counter:0,shield:0,fire:0,poison:0,regen:0,rage:0,roleGuard:0,reprisal:0,elementAmp:0,arcaneBurst:0,firstCrit:0,firstCombo:0,skills:{},streak:0}};
  const send=data=>{if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(data))};
  function stop(exit=true){alive=false;if(socket){try{socket.close(1000,'leave')}catch{}socket=null}if(exit)onExit()}
  function start(){stop(false);alive=true;status='connecting';renderQueue('連線中');try{socket=new WebSocket(wsUrl())}catch{return renderQueue('無法連線')}
    socket.onopen=()=>{status='matching';renderQueue('等待對手');send({type:'join',profile:{role:meta.role,pet:meta.pet||'fox'}})};
    socket.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}handle(m)};
    socket.onerror=()=>alive&&renderQueue('連線失敗');socket.onclose=()=>alive&&status!=='finished'&&renderQueue('連線中斷')}
  function handle(m){if(m.type==='queued'){status='matching';return renderQueue('等待對手')}
    if(m.type==='matched'){status='battle';me=basePlayer({role:meta.role,pet:meta.pet||'fox'});opponent={...m.opponent,hp:m.opponent.hp,maxHp:m.opponent.maxHp};q=makeQuestion(m.questionIndex);turn=1;choice=null;answerState=null;waiting=false;return renderBattle()}
    if(m.type==='waiting-opponent'){waiting=true;return renderBattle()}
    if(m.type==='battle-result'){waiting=false;if(me&&m.selfMaxHp)me.maxHp=m.selfMaxHp;if(opponent&&m.opponentMaxHp)opponent.maxHp=m.opponentMaxHp;const rounds=m.rounds||[];const last=rounds[rounds.length-1];if(last){me.hp=last.selfHp;opponent.hp=last.opponentHp}if(m.finished){status='finished';return renderEnd(m.winner==='self',m.winner==='draw'?'平手':'')}turn++;q=makeQuestion(m.nextQuestionIndex);choice=null;answerState=null;return renderBattle()}
    if(m.type==='opponent-left'){status='finished';return renderEnd(true,'對手離線')}
    if(m.type==='error')return renderQueue(m.message||'配對錯誤')}
  function snapshot(){const out={role:me.role,pet:me.pet,skills:me.skills,streak:me.streak};['hp','maxHp','atk','def','crit','combo','lifesteal','counter','shield','fire','poison','regen','rage','roleGuard','reprisal','elementAmp','arcaneBurst','firstCrit','firstCombo'].forEach(k=>out[k]=Number(me[k]||0));return out}
  function choose(id){if(waiting||answerState)return;choice=id;renderBattle()}
  function answer(value){if(!choice||waiting||answerState)return;const correct=value===q.answer;answerState={selected:value,correct};if(correct)me.streak++;else me.streak=0;
    if(choice==='strike')me.atk=Math.max(1,Math.round(me.atk*(correct?1.08:1.02)));
    if(choice==='guard')me.def+=correct?2:1;
    if(choice==='focus')me.crit=Math.min(.55,me.crit+(correct?.06:.02));
    waiting=true;renderBattle();setTimeout(()=>send({type:'ready',correct,snapshot:snapshot()}),280)}
  function slot(id){return `<span class="asset-slot" data-asset="${id}"></span>`}
  function renderQueue(text){app.innerHTML=`<main class="pk-screen"><section class="pk-card"><h1>${text}</h1><div class="pk-wait"></div><button class="secondary-btn" data-cancel>取消</button></section></main>`;app.querySelector('[data-cancel]')?.addEventListener('click',()=>stop(true))}
  function renderBattle(){const myRole=ROLES[me.role],oppRole=ROLES[opponent.role||'warrior'];const myPct=clamp(me.hp/me.maxHp*100,0,100),oppPct=clamp(opponent.hp/opponent.maxHp*100,0,100);app.innerHTML=`<main class="pk-battle"><header class="battle-top"><button class="text-btn" data-quit>返回</button><b>線上對戰</b><span>第 ${turn} 回合</span></header><section class="combat-stage"><div class="fighter hero">${visual(myRole.art,'','fighter-art')}<div class="name-line">${myRole.name}</div><div class="hp"><i style="width:${myPct}%"></i></div></div><div class="battle-center"><strong>VS</strong><small>${waiting?'等待對手':'選擇策略'}</small></div><div class="fighter enemy">${visual(oppRole.art,'','fighter-art')}<div class="name-line">對手</div><div class="hp enemy-hp"><i style="width:${oppPct}%"></i></div></div></section>${choice?renderQuestion():renderChoices()}</main>`;app.querySelector('[data-quit]')?.addEventListener('click',()=>stop(true));app.querySelectorAll('[data-choice]').forEach(el=>el.addEventListener('click',()=>choose(el.dataset.choice)));app.querySelectorAll('[data-answer]').forEach(el=>el.addEventListener('click',()=>answer(el.dataset.answer)))}
  function renderChoices(){return `<section class="tactic-area"><h1>這回合怎麼打？</h1><div class="tactic-grid"><button class="tactic-card" data-choice="strike">${slot('pk-strike')}<b>強攻</b><small>提高攻擊</small></button><button class="tactic-card" data-choice="guard">${slot('pk-guard')}<b>守勢</b><small>提高防禦</small></button><button class="tactic-card" data-choice="focus">${slot('pk-focus')}<b>蓄能</b><small>提高暴擊</small></button></div></section>`}
  function renderQuestion(){return `<section class="word-area"><div class="chosen-tactic">${choice==='strike'?'強攻':choice==='guard'?'守勢':'蓄能'}</div><h2>${q.word}</h2><div class="answer-grid">${q.options.map(o=>`<button class="answer-btn ${answerState&&o===q.answer?'right':''} ${answerState&&o===answerState.selected&&!answerState.correct?'wrong':''}" data-answer="${o}" ${(waiting||answerState)?'disabled':''}>${o}</button>`).join('')}</div>${waiting?'<p class="waiting-text">等待對手完成</p>':''}</section>`}
  function renderEnd(win,note=''){app.innerHTML=`<main class="result-screen"><section class="result-card"><h1>${note||(win?'對戰勝利':'對戰結束')}</h1><button class="primary-btn" data-again>再次配對</button><button class="secondary-btn" data-home>返回</button></section></main>`;app.querySelector('[data-again]')?.addEventListener('click',start);app.querySelector('[data-home]')?.addEventListener('click',()=>stop(true))}
  return {start,stop};
}
