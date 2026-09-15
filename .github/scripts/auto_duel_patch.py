from pathlib import Path
import re

# --- src/game.js ---
p = Path('src/game.js')
s = p.read_text()

old = "function selectedCardsHtml(cards=[],active=-1,enemy=false){if(!cards.length)return '';return `<div class=\"selected-action-cards ${enemy?'enemy-cards':''}\">${cards.map((c,i)=>`<div class=\"mini-card ${c.color} ${c.exclusive?'exclusive-card':''} ${i===active?'active':''}\">${cardArt(c,true)}<b>${esc(c.name)}</b><span>${'★'.repeat(i+1)}</span></div>`).join('')}</div>`}"
new = "function selectedCardsHtml(cards=[],active=-1,enemy=false){if(!cards.length)return '';return `<div class=\"selected-action-cards ${enemy?'enemy-cards':''}\">${cards.map((c,i)=>`<div class=\"mini-card ${c.color} ${c.exclusive?'exclusive-card':''} ${i===active?'active':''}\">${cardArt(c,true)}<b><span class=\"card-name-full\">${esc(c.name)}</span><span class=\"card-name-short\">${esc(String(c.name||'').slice(0,2))}</span></b><span>${'★'.repeat(i+1)}</span></div>`).join('')}</div>`}"
if old not in s:
    raise SystemExit('game selectedCardsHtml target not found')
s = s.replace(old, new, 1)

old = "first=playerMs<=enemyMs?'player':'enemy';run.used.push(...run.selected);"
new = "first=playerMs<=enemyMs?'player':'enemy';run.lastOrder=first;run.used.push(...run.selected);"
if old not in s:
    raise SystemExit('game lastOrder target not found')
s = s.replace(old, new, 1)

pat = r"function startFinalDuel\(\)\{.*?\}\nfunction stepDelay\(\)\{"
repl = """function startAutoDuel(){clearTimers();const P=run.player,E=run.enemy,steps=[];run.actionStartPlayer=cloneFighter(P);run.actionStartEnemy=cloneFighter(E);let who=run.lastOrder||'player',cycle=1;while(P.hp>0&&E.hp>0){if(who==='player'){const before=E.hp+E.shield;resolveAutoBasic(P,E);run.stats.damage+=Math.max(0,before-(E.hp+E.shield))}else resolveAutoBasic(E,P);steps.push({who,slot:0,cycle,autoDuel:true,finalRound:true,card:null,logs:[],player:cloneFighter(P),enemy:cloneFighter(E)});who=who==='player'?'enemy':'player';if(who===(run.lastOrder||'player'))cycle++}run.steps=steps;run.stepIndex=0;run.log=[];screen='action';render();scheduleActionStep()}
function stepDelay(){"""
s, n = re.subn(pat, repl, s, count=1, flags=re.S)
if n != 1:
    raise SystemExit('game startFinalDuel target not found')

old = "function stepDelay(){const step=run.steps[run.stepIndex];if(step?.finalRound)return 1300;if(step?.card?.id==='sacrifice')return 1900;if(step?.who==='player'&&meta.role==='archer'&&isOffensive(step.card))return Math.max(1250,1550-step.slot*80);return 1550}"
new = "function stepDelay(){const step=run.steps[run.stepIndex];if(step?.autoDuel)return 720;if(step?.card?.id==='sacrifice')return 1900;if(step?.who==='player'&&meta.role==='archer'&&isOffensive(step.card))return Math.max(1250,1550-step.slot*80);return 1550}"
if old not in s:
    raise SystemExit('game stepDelay target not found')
s = s.replace(old, new, 1)

old = "function scheduleActionStep(){clearTimeout(actionTimer);actionTimer=setTimeout(()=>{if(screen!=='action')return;if(run.stepIndex<run.steps.length-1){run.stepIndex++;render();scheduleActionStep()}else actionTimer=setTimeout(()=>{if(run.player.hp<=0||run.enemy.hp<=0||run.round>=3)finishBattle();else nextRound()},1100)},stepDelay())}"
new = "function scheduleActionStep(){clearTimeout(actionTimer);actionTimer=setTimeout(()=>{if(screen!=='action')return;if(run.stepIndex<run.steps.length-1){run.stepIndex++;render();scheduleActionStep()}else actionTimer=setTimeout(()=>{if(run.player.hp<=0||run.enemy.hp<=0)finishBattle();else if(run.round>=3)startAutoDuel();else nextRound()},run.steps[run.stepIndex]?.autoDuel?650:1100)},stepDelay())}"
if old not in s:
    raise SystemExit('game scheduleActionStep target not found')
s = s.replace(old, new, 1)

old = "function renderAction(){const step=run.steps[run.stepIndex],prev=run.stepIndex>0?run.steps[run.stepIndex-1]:null,prevP=prev?.player||run.actionStartPlayer,prevE=prev?.enemy||run.actionStartEnemy,p=step?.player||run.player,e=step?.enemy||run.enemy,metaFx=actionVisual(step,prevP,prevE,p,e),title=step?.finalRound?`第 ${step.cycle} 輪 · 普通攻擊`:(step?.card?cardSummary(step.card):'普通攻擊'),actorColor=step?.who==='player'?'#447257':'#49739b';return `<main class=\"battle-screen combat-focus action-screen\">${combatHeader({playerState:p,enemyState:e,activeStep:step,showChosen:run.round<=3,visualMeta:metaFx})}<section class=\"action-status\"><h1>${esc(title)}</h1><div class=\"battle-log current-log\">${(step?.logs||[]).slice(-3).map(x=>`<p style=\"color:${actorColor}\">${esc(x)}</p>`).join('')}${lifeDelta(prevP,prevE,p,e)}</div></section></main>`}"
new = "function renderAction(){const step=run.steps[run.stepIndex],prev=run.stepIndex>0?run.steps[run.stepIndex-1]:null,prevP=prev?.player||run.actionStartPlayer,prevE=prev?.enemy||run.actionStartEnemy,p=step?.player||run.player,e=step?.enemy||run.enemy,metaFx=actionVisual(step,prevP,prevE,p,e);if(step?.autoDuel)return `<main class=\"battle-screen combat-focus action-screen auto-duel-screen\">${combatHeader({playerState:p,enemyState:e,activeStep:step,showChosen:false,visualMeta:metaFx})}</main>`;const title=step?.card?cardSummary(step.card):'',actorColor=step?.who==='player'?'#447257':'#49739b';return `<main class=\"battle-screen combat-focus action-screen\">${combatHeader({playerState:p,enemyState:e,activeStep:step,showChosen:run.round<=3,visualMeta:metaFx})}<section class=\"action-status\"><h1>${esc(title)}</h1><div class=\"battle-log current-log\">${(step?.logs||[]).slice(-3).map(x=>`<p style=\"color:${actorColor}\">${esc(x)}</p>`).join('')}${lifeDelta(prevP,prevE,p,e)}</div></section></main>`}"
if old not in s:
    raise SystemExit('game renderAction target not found')
s = s.replace(old, new, 1)
p.write_text(s)

# --- src/pk.js ---
p = Path('src/pk.js')
s = p.read_text()
old = "  function selectedHtml(cards=[],active=-1,enemy=false){return `<div class=\"selected-action-cards ${enemy?'enemy-cards':''}\">${cards.map((c,i)=>`<div class=\"mini-card ${c.color} ${c.exclusive?'exclusive-card':''} ${i===active?'active':''}\">${cardArt(c,true)}<b>${esc(c.name)}</b><span>${'★'.repeat(i+1)}</span></div>`).join('')}</div>`}"
new = "  function selectedHtml(cards=[],active=-1,enemy=false){return `<div class=\"selected-action-cards ${enemy?'enemy-cards':''}\">${cards.map((c,i)=>`<div class=\"mini-card ${c.color} ${c.exclusive?'exclusive-card':''} ${i===active?'active':''}\">${cardArt(c,true)}<b><span class=\"card-name-full\">${esc(c.name)}</span><span class=\"card-name-short\">${esc(String(c.name||'').slice(0,2))}</span></b><span>${'★'.repeat(i+1)}</span></div>`).join('')}</div>`}"
if old not in s:
    raise SystemExit('pk selectedHtml target not found')
s = s.replace(old, new, 1)

old = "  function renderAction(){const step=last?.steps?.[stepIndex],prev=stepIndex>0?last.steps[stepIndex-1]:null,prevSelf=prev?.self||last?.beforeMe,prevOpp=prev?.opponent||last?.beforeOpponent,self=step?.self||me,opp=step?.opponent||opponent,fx=actionVisual(step,prevSelf,prevOpp,self,opp),title=step?.finalRound?`第 ${step.cycle} 輪 · 普通攻擊`:(step?.card?cardSummary(step.card):'普通攻擊'),actorColor=step?.who==='self'?'#447257':'#49739b';app.innerHTML=`<main class=\"pk-battle combat-focus action-screen\">${header({self,opp,step,showCards:true,fx})}<section class=\"action-status\"><h1>${esc(title)}</h1><div class=\"battle-log current-log\">${(step?.logs||[]).slice(-3).map(x=>`<p style=\"color:${actorColor}\">${esc(x)}</p>`).join('')}${lifeDelta(prevSelf,prevOpp,self,opp)}</div></section></main>`}"
new = "  function renderAction(){const step=last?.steps?.[stepIndex],prev=stepIndex>0?last.steps[stepIndex-1]:null,prevSelf=prev?.self||last?.beforeMe,prevOpp=prev?.opponent||last?.beforeOpponent,self=step?.self||me,opp=step?.opponent||opponent,fx=actionVisual(step,prevSelf,prevOpp,self,opp);if(step?.autoDuel){app.innerHTML=`<main class=\"pk-battle combat-focus action-screen auto-duel-screen\">${header({self,opp,step,showCards:false,fx})}</main>`;return}const title=step?.card?cardSummary(step.card):'',actorColor=step?.who==='self'?'#447257':'#49739b';app.innerHTML=`<main class=\"pk-battle combat-focus action-screen\">${header({self,opp,step,showCards:true,fx})}<section class=\"action-status\"><h1>${esc(title)}</h1><div class=\"battle-log current-log\">${(step?.logs||[]).slice(-3).map(x=>`<p style=\"color:${actorColor}\">${esc(x)}</p>`).join('')}${lifeDelta(prevSelf,prevOpp,self,opp)}</div></section></main>`}"
if old not in s:
    raise SystemExit('pk renderAction target not found')
s = s.replace(old, new, 1)

old = "  function stepDelay(){const step=last?.steps?.[stepIndex],r=(step?.who==='self'?me?.profile?.role:opponent?.profile?.role);if(step?.finalRound)return 1300;if(step?.card?.id==='sacrifice')return 1900;if(r==='archer'&&isOffensive(step?.card))return Math.max(1250,1550-(step?.slot||0)*80);return 1550}"
new = "  function stepDelay(){const step=last?.steps?.[stepIndex],r=(step?.who==='self'?me?.profile?.role:opponent?.profile?.role);if(step?.autoDuel)return 720;if(step?.card?.id==='sacrifice')return 1900;if(r==='archer'&&isOffensive(step?.card))return Math.max(1250,1550-(step?.slot||0)*80);return 1550}"
if old not in s:
    raise SystemExit('pk stepDelay target not found')
s = s.replace(old, new, 1)
p.write_text(s)

# --- worker/index.js ---
p = Path('worker/index.js')
s = p.read_text()
anchor = "    a.fighter=A;b.fighter=B;const finished=round>=3||A.hp<=0||B.hp<=0;let winner=null,nextHandA=null,nextHandB=null;"
inject = """    if(round>=3&&A.hp>0&&B.hp>0){let who=first,cycle=1;while(A.hp>0&&B.hp>0){if(who==='a')resolveAutoBasic(A,B);else resolveAutoBasic(B,A);stepsA.push({who:who==='a'?'self':'opponent',slot:0,cycle,autoDuel:true,finalRound:true,card:null,self:cloneFighter(A),opponent:cloneFighter(B),logs:[]});stepsB.push({who:who==='b'?'self':'opponent',slot:0,cycle,autoDuel:true,finalRound:true,card:null,self:cloneFighter(B),opponent:cloneFighter(A),logs:[]});who=who==='a'?'b':'a';if(who===first)cycle++}}
    a.fighter=A;b.fighter=B;const finished=round>=3||A.hp<=0||B.hp<=0;let winner=null,nextHandA=null,nextHandB=null;"""
if anchor not in s:
    raise SystemExit('worker auto duel anchor not found')
s = s.replace(anchor, inject, 1)
old = "    if(finished){const ar=A.hp/A.maxHp,br=B.hp/B.maxHp;winner=Math.abs(ar-br)<.0001?'draw':ar>br?'a':'b';a.state='finished';b.state='finished'}else{a.round++;b.round++;a.ready=null;b.ready=null}"
new = "    if(finished){if(A.hp<=0&&B.hp<=0)winner='draw';else if(B.hp<=0)winner='a';else if(A.hp<=0)winner='b';else{const ar=A.hp/A.maxHp,br=B.hp/B.maxHp;winner=Math.abs(ar-br)<.0001?'draw':ar>br?'a':'b'}a.state='finished';b.state='finished'}else{a.round++;b.round++;a.ready=null;b.ready=null}"
if old not in s:
    raise SystemExit('worker winner target not found')
s = s.replace(old, new, 1)
p.write_text(s)

# --- src/styles.css ---
p = Path('src/styles.css')
s = p.read_text()
old = ".mini-card b{font-size:16px;line-height:1.15;text-align:center;color:#27312d}"
new = ".mini-card b{font-size:16px;line-height:1.15;text-align:center;color:#27312d}.card-name-short{display:none}"
if old not in s:
    raise SystemExit('css card name anchor not found')
s = s.replace(old, new, 1)
media = '@media(max-width:700px){'
before, mobile = s.split(media, 1)
old = ".role-growth-panel .growth-stats{justify-self:start}"
new = ".role-growth-panel .growth-stats{justify-self:start;transform:translateX(10px)}"
if old not in mobile:
    raise SystemExit('css mobile role stats target not found')
mobile = mobile.replace(old, new, 1)
old = ".mini-card b{font-size:15px}"
new = ".mini-card b{font-size:15px}.mini-card .card-name-full{display:none}.mini-card .card-name-short{display:inline}"
if old not in mobile:
    raise SystemExit('css mobile mini card target not found')
mobile = mobile.replace(old, new, 1)
s = before + media + mobile
p.write_text(s)
