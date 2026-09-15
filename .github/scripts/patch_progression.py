from pathlib import Path


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Expected {label} source not found; refusing to patch.')
    return text.replace(old, new, 1)


# ---- cards.js ----
path = Path('src/cards.js')
text = path.read_text(encoding='utf-8')

pet_line = "const PET_BASE={fox:{hp:20,atk:8,def:2},owl:{hp:35,atk:2,def:6},dragon:{hp:25,atk:6,def:4}};\n"
progression_defs = r"""export const TITLE_TIERS=[
  {level:30,name:'傳說勇者',hp:.12,atk:.12,def:.12,crit:.05,label:'生命/攻擊/防禦 +12% · 爆擊 +5%'},
  {level:20,name:'菁英勇者',hp:.08,atk:.08,def:.08,crit:.03,label:'生命/攻擊/防禦 +8% · 爆擊 +3%'},
  {level:10,name:'覺醒勇者',hp:.05,atk:.06,def:.05,crit:.02,label:'生命 +5% · 攻擊 +6% · 防禦 +5% · 爆擊 +2%'},
  {level:5,name:'冒險者',hp:.03,atk:.03,def:.03,crit:.01,label:'生命/攻擊/防禦 +3% · 爆擊 +1%'},
  {level:1,name:'初行者',hp:0,atk:0,def:0,crit:0,label:'基礎能力'}
];
export function titleTier(level=1){const lv=clamp(Math.round(Number(level)||1),1,50);return TITLE_TIERS.find(x=>lv>=x.level)||TITLE_TIERS[TITLE_TIERS.length-1];}
const ROLE_SKILLS={
  warrior:[
    {level:5,id:'warrior-5',name:'鐵壁反擊',color:'blue',text:'80% 傷害＋最大生命 20% 護盾',fx:{damage:.8,shieldMax:.20}},
    {level:10,id:'warrior-10',name:'震嶽斬',color:'red',text:'造成 155% 重擊傷害',fx:{damage:1.55}},
    {level:15,id:'warrior-15',name:'戰意怒吼',color:'red',text:'90% 傷害＋攻擊提升 18%',fx:{damage:.9,atkBuff:.18}},
    {level:20,id:'warrior-20',name:'不屈戰魂',color:'green',text:'恢復 28% 生命＋10% 護盾',fx:{healMax:.28,shieldMax:.10}},
    {level:25,id:'warrior-25',name:'破軍斬',color:'red',text:'145% 傷害＋破甲 25% 2回合',fx:{damage:1.45,armorBreak:.25,turns:2}},
    {level:30,id:'warrior-30',name:'王者壁壘',color:'blue',text:'45% 最大生命護盾＋防禦提升 20%',fx:{shieldMax:.45,defBuff:.20}},
    {level:35,id:'warrior-35',name:'狂戰連斬',color:'red',text:'連續 3 擊，每擊 70%',fx:{hits:[.7,.7,.7]}},
    {level:40,id:'warrior-40',name:'守護反擊',color:'blue',text:'135% 傷害＋25% 最大生命護盾',fx:{damage:1.35,shieldMax:.25}},
    {level:45,id:'warrior-45',name:'戰神降臨',color:'yellow',text:'攻擊 +28%・防禦 +20%・爆擊 +8%',fx:{atkBuff:.28,defBuff:.20,critBuff:.08}},
    {level:50,id:'warrior-50',name:'天崩地裂',color:'red',text:'造成 260% 終極傷害',fx:{damage:2.60}}
  ],
  mage:[
    {level:5,id:'mage-5',name:'魔力湧動',color:'yellow',text:'攻擊 +12%＋10% 最大生命護盾',fx:{atkBuff:.12,shieldMax:.10}},
    {level:10,id:'mage-10',name:'炎爆術',color:'yellow',text:'造成 155% 火焰傷害',fx:{damage:1.55}},
    {level:15,id:'mage-15',name:'寒霜禁制',color:'blue',text:'95% 傷害＋敵方攻擊 -25% 2回合',fx:{damage:.95,atkDown:.25,turns:2}},
    {level:20,id:'mage-20',name:'奧術回復',color:'green',text:'恢復最大生命 35%',fx:{healMax:.35}},
    {level:25,id:'mage-25',name:'雷霆鏈',color:'yellow',text:'連續 3 擊，每擊 65%',fx:{hits:[.65,.65,.65]}},
    {level:30,id:'mage-30',name:'魔法障壁',color:'blue',text:'獲得最大生命 50% 護盾',fx:{shieldMax:.50}},
    {level:35,id:'mage-35',name:'元素穿透',color:'yellow',text:'145% 傷害＋破甲 30% 2回合',fx:{damage:1.45,armorBreak:.30,turns:2}},
    {level:40,id:'mage-40',name:'星隕術',color:'yellow',text:'造成 205% 星隕傷害',fx:{damage:2.05}},
    {level:45,id:'mage-45',name:'賢者領域',color:'yellow',text:'攻擊 +22%・爆擊 +10%・20% 護盾',fx:{atkBuff:.22,critBuff:.10,shieldMax:.20}},
    {level:50,id:'mage-50',name:'終焉魔導',color:'yellow',text:'造成 285% 終極魔法傷害',fx:{damage:2.85}}
  ],
  archer:[
    {level:5,id:'archer-5',name:'疾風箭',color:'red',text:'115% 傷害＋爆擊 +3%',fx:{damage:1.15,critBuff:.03}},
    {level:10,id:'archer-10',name:'雙星連射',color:'red',text:'連續 2 擊，每擊 82%',fx:{hits:[.82,.82]}},
    {level:15,id:'archer-15',name:'鷹眼鎖定',color:'yellow',text:'爆擊率提升 15%',fx:{critBuff:.15}},
    {level:20,id:'archer-20',name:'回風步',color:'green',text:'85% 傷害＋恢復最大生命 20%',fx:{damage:.85,healMax:.20}},
    {level:25,id:'archer-25',name:'穿甲箭',color:'red',text:'135% 傷害＋破甲 28% 2回合',fx:{damage:1.35,armorBreak:.28,turns:2}},
    {level:30,id:'archer-30',name:'暴雨箭陣',color:'red',text:'連續 3 擊，每擊 65%',fx:{hits:[.65,.65,.65]}},
    {level:35,id:'archer-35',name:'影步狙擊',color:'red',text:'185% 傷害＋爆擊 +5%',fx:{damage:1.85,critBuff:.05}},
    {level:40,id:'archer-40',name:'風神護佑',color:'green',text:'恢復 28% 生命＋15% 護盾',fx:{healMax:.28,shieldMax:.15}},
    {level:45,id:'archer-45',name:'致命標記',color:'yellow',text:'破甲 35% 2回合＋爆擊 +12%',fx:{armorBreak:.35,turns:2,critBuff:.12}},
    {level:50,id:'archer-50',name:'天穹一箭',color:'red',text:'造成 300% 終極狙擊傷害',fx:{damage:3.00}}
  ]
};
export function unlockedRoleSkills(role='warrior',level=1){const lv=clamp(Math.round(Number(level)||1),1,50);return (ROLE_SKILLS[role]||[]).filter(x=>lv>=x.level);}
"""
text = replace_once(text, pet_line, pet_line + progression_defs, 'progression definitions insertion')

old_progression = """export function progressionStats(role='warrior',pet='fox',level=1){
  const lv=clamp(Math.round(Number(level)||1),1,50),rb=ROLE_BASE[role]||ROLE_BASE.warrior,pb=PET_BASE[pet]||PET_BASE.fox;
  const roleStats={maxHp:Math.round(rb.hp*(1+(lv-1)*.035)),atk:Math.round(rb.atk*(1+(lv-1)*.025)),def:Math.round(rb.def*(1+(lv-1)*.025))};
  const petStats={maxHp:Math.round(pb.hp*(1+(lv-1)*.03)),atk:Math.round(pb.atk*(1+(lv-1)*.03)),def:Math.round(pb.def*(1+(lv-1)*.03))};
  const total={maxHp:roleStats.maxHp+petStats.maxHp,atk:roleStats.atk+petStats.atk,def:roleStats.def+petStats.def,crit:.10};
  return {level:lv,role:roleStats,pet:petStats,total:{...total,hp:total.maxHp}};
}"""
new_progression = """export function progressionStats(role='warrior',pet='fox',level=1){
  const lv=clamp(Math.round(Number(level)||1),1,50),rb=ROLE_BASE[role]||ROLE_BASE.warrior,pb=PET_BASE[pet]||PET_BASE.fox,tier=titleTier(lv);
  const rawRole={maxHp:rb.hp*(1+(lv-1)*.035),atk:rb.atk*(1+(lv-1)*.025),def:rb.def*(1+(lv-1)*.025)};
  const roleStats={maxHp:Math.round(rawRole.maxHp*(1+tier.hp)),atk:Math.round(rawRole.atk*(1+tier.atk)),def:Math.round(rawRole.def*(1+tier.def))};
  const petStats={maxHp:Math.round(pb.hp*(1+(lv-1)*.03)),atk:Math.round(pb.atk*(1+(lv-1)*.03)),def:Math.round(pb.def*(1+(lv-1)*.03))};
  const total={maxHp:roleStats.maxHp+petStats.maxHp,atk:roleStats.atk+petStats.atk,def:roleStats.def+petStats.def,crit:.10+tier.crit};
  return {level:lv,role:roleStats,pet:petStats,title:tier,total:{...total,hp:total.maxHp}};
}"""
text = replace_once(text, old_progression, new_progression, 'title stat progression')

old_deal = "export function dealHand(n=9){return Array.from({length:n},randomCard);}"
new_deal = """export function dealHand(n=9,role=null,level=1){
  const hand=Array.from({length:n},randomCard),skills=role?unlockedRoleSkills(role,level):[];
  if(hand.length&&skills.length){const skill=skills[rnd(0,skills.length-1)],at=rnd(0,hand.length-1);hand[at]={...skill,uid:crypto.randomUUID(),kind:'exclusive',exclusive:true,role};}
  return hand;
}"""
text = replace_once(text, old_deal, new_deal, 'role skill hand insertion')

apply_anchor = "function applyCard(card,actor,target,power,logs){if(power<=0)return;if(card.kind==='stat')return applyStat(card,actor,power,logs);switch(card.id){"
exclusive_apply = r"""function applyExclusive(card,actor,target,power,logs){
  const fx=card.fx||{},scale=Math.max(.1,Math.min(1.75,power)),turns=Math.max(1,Math.round(fx.turns||2));
  if(Array.isArray(fx.hits)){for(const mult of fx.hits){if(target.hp<=0)break;hit(actor,target,mult*power,logs,card.name);}}
  else if(fx.damage)hit(actor,target,fx.damage*power,logs,card.name);
  if(fx.healMax&&actor.hp>0)healHpOnly(actor,Math.round(actor.maxHp*fx.healMax*scale),logs,card.name);
  if(fx.shieldMax&&actor.hp>0){const v=Math.max(1,Math.round(actor.maxHp*fx.shieldMax*scale));actor.shield+=v;logs.push(`${card.name} 護盾 +${v}`);}
  if(fx.atkBuff&&actor.hp>0){const pct=fx.atkBuff*scale;actor.atk*=1+pct;logs.push(`${card.name} 攻擊 +${Math.round(pct*100)}%`);}
  if(fx.defBuff&&actor.hp>0){const pct=fx.defBuff*scale;actor.def*=1+pct;logs.push(`${card.name} 防禦 +${Math.round(pct*100)}%`);}
  if(fx.critBuff&&actor.hp>0){const pct=fx.critBuff*scale;actor.crit=Math.min(.85,actor.crit+pct);logs.push(`${card.name} 爆擊 +${Math.round(pct*100)}%`);}
  if(fx.armorBreak&&target.hp>0){const pct=Math.min(.65,fx.armorBreak*scale);target.armorBreak.push({pct,turns});logs.push(`${card.name} 破甲 ${Math.round(pct*100)}%`);}
  if(fx.atkDown&&target.hp>0){const pct=Math.min(.60,fx.atkDown*scale);target.atkDown.push({pct,turns});logs.push(`${card.name} 降攻 ${Math.round(pct*100)}%`);}
}
function applyCard(card,actor,target,power,logs){if(power<=0)return;if(card?.exclusive)return applyExclusive(card,actor,target,power,logs);if(card.kind==='stat')return applyStat(card,actor,power,logs);switch(card.id){"""
text = replace_once(text, apply_anchor, exclusive_apply, 'exclusive card resolver')

old_offensive = "const OFFENSIVE=new Set(['combo','desperate','poison','break','sun','preempt','sacrifice']);\nexport function isOffensive(card){return !!card&&OFFENSIVE.has(card.id);}"
new_offensive = "const OFFENSIVE=new Set(['combo','desperate','poison','break','sun','preempt','sacrifice']);\nfunction exclusiveOffensive(card){return !!(card?.fx?.damage||(Array.isArray(card?.fx?.hits)&&card.fx.hits.length));}\nexport function isOffensive(card){return !!card&&(card.exclusive?exclusiveOffensive(card):OFFENSIVE.has(card.id));}"
text = replace_once(text, old_offensive, new_offensive, 'exclusive offensive detection')
path.write_text(text, encoding='utf-8')


# ---- game.js ----
path = Path('src/game.js')
text = path.read_text(encoding='utf-8')
text = replace_once(text,
    "import {dealHand,makeFighter,resolveCardAction,resolveBasic,resolveAutoBasic,afterAction,cardSummary,cloneFighter,bondMultiplier,supportBoost,isOffensive,applyPetRoundEnd,progressionStats} from './cards.js';",
    "import {dealHand,makeFighter,resolveCardAction,resolveBasic,resolveAutoBasic,afterAction,cardSummary,cloneFighter,bondMultiplier,supportBoost,isOffensive,applyPetRoundEnd,progressionStats,titleTier} from './cards.js';",
    'game title import')
text = replace_once(text, "const TITLE_STEPS=[[30,'傳說勇者'],[20,'菁英勇者'],[10,'覺醒勇者'],[5,'冒險者'],[1,'初行者']];\n", "", 'legacy title steps removal')
text = replace_once(text,
    "function titleFor(level=meta.level){return TITLE_STEPS.find(([lv])=>level>=lv)?.[1]||'初行者'}",
    "function titleFor(level=meta.level){return titleTier(level).name}",
    'title lookup')

old_panel = "function growthPanel(stats){const guest=meta.authMode==='guest';return `<div class=\"growth-panel\"><div class=\"growth-level\"><b>Lv.${guest?1:meta.level}</b><span>${guest?'訪客':esc(titleFor(meta.level))}</span></div><div class=\"growth-stats\">${growthItem(ASSETS.ui.hp,stats.maxHp,'生命')}${growthItem(ASSETS.ui.atk,stats.atk,'攻擊')}${growthItem(ASSETS.ui.def,stats.def,'防禦')}</div></div>`}"
new_panel = "function growthPanel(stats,primary=false){const guest=meta.authMode==='guest',tier=titleTier(guest?1:meta.level),name=primary&&meta.authMode==='line'&&meta.playerName?`<span class=\"growth-player-name\">${esc(meta.playerName)}</span>`:'',bonus=primary&&!guest?`<small class=\"growth-title-bonus\">${esc(tier.label)}</small>`:'';return `<div class=\"growth-panel\"><div class=\"growth-level\"><b>Lv.${guest?1:meta.level}</b><span>${guest?'訪客':esc(tier.name)}</span>${name}${bonus}</div><div class=\"growth-stats\">${growthItem(ASSETS.ui.hp,stats.maxHp,'生命')}${growthItem(ASSETS.ui.atk,stats.atk,'攻擊')}${growthItem(ASSETS.ui.def,stats.def,'防禦')}</div></div>`}"
text = replace_once(text, old_panel, new_panel, 'LINE name and title bonus panel')

text = replace_once(text, "hand:dealHand(9),enemyHand:dealHand(9)", "hand:dealHand(9,meta.role,level),enemyHand:dealHand(9)", 'initial special hand')
text = replace_once(text, "run.hand=dealHand(9);run.enemyHand=dealHand(9);", "run.hand=dealHand(9,meta.role,run.level);run.enemyHand=dealHand(9);", 'stage special hand')
text = replace_once(text, "${growthPanel(g.role)}", "${growthPanel(g.role,true)}", 'primary growth panel')

image_anchor = "function imageButton(src,label,attrs=''){return `<button ${attrs} aria-label=\"${esc(label)}\" style=\"border:0;background:transparent;padding:0;display:grid;place-items:center;width:100%;cursor:pointer\">${uiImg(src,label,'display:block;max-width:100%;height:auto;object-fit:contain;')}</button>`}"
image_new = image_anchor + "\nfunction cardArt(c,mini=false){if(c?.exclusive){const r=ROLES[c.role]||ROLES.warrior;return `<span class=\"exclusive-card-art ${mini?'mini':''}\">${uiImg(r.art,c.name,'')}</span>`}return slot('card-'+c.id)}"
text = replace_once(text, image_anchor, image_new, 'exclusive card art helper')

old_selected = "function selectedCardsHtml(cards=[],active=-1,enemy=false){if(!cards.length)return '';return `<div class=\"selected-action-cards ${enemy?'enemy-cards':''}\">${cards.map((c,i)=>`<div class=\"mini-card ${c.color} ${i===active?'active':''}\">${slot('card-'+c.id)}<b>${esc(c.name)}</b><span>${i+1}</span></div>`).join('')}</div>`}"
new_selected = "function selectedCardsHtml(cards=[],active=-1,enemy=false){if(!cards.length)return '';return `<div class=\"selected-action-cards ${enemy?'enemy-cards':''}\">${cards.map((c,i)=>`<div class=\"mini-card ${c.color} ${c.exclusive?'exclusive-card':''} ${i===active?'active':''}\">${cardArt(c,true)}<b>${esc(c.name)}</b><span>${i+1}</span></div>`).join('')}</div>`}"
text = replace_once(text, old_selected, new_selected, 'selected exclusive card art')

old_card = "function cardHtml(c,i){const used=run.used.includes(i),order=run.selected.indexOf(i)+1,hint=cardHint(c);return `<button class=\"battle-card ${c.color} ${used?'used':''} ${order?'selected':''}\" data-card=\"${i}\" ${used?'disabled':''}><span class=\"card-order\">${order||''}</span>${slot('card-'+c.id)}<b>${esc(c.name)}</b><small>${esc(hint)}</small></button>`}"
new_card = "function cardHtml(c,i){const used=run.used.includes(i),order=run.selected.indexOf(i)+1,hint=cardHint(c);return `<button class=\"battle-card ${c.color} ${c.exclusive?'exclusive-card':''} ${used?'used':''} ${order?'selected':''}\" data-card=\"${i}\" ${used?'disabled':''}><span class=\"card-order\">${order||''}</span>${cardArt(c,false)}<b>${esc(c.name)}</b><small>${esc(hint)}</small></button>`}"
text = replace_once(text, old_card, new_card, 'exclusive card renderer')

old_next = "function nextRound(){if(run.player.hp<=0||run.enemy.hp<=0||run.round>=3)return finishBattle();if(run.round===1){run.round=2;run.selected=[];run.enemySelected=[];run.selectDeadline=0;screen='cards';render();return}if(run.round===2){startFinalDuel();return}}"
new_next = "function nextRound(){if(run.player.hp<=0||run.enemy.hp<=0||run.round>=3)return finishBattle();if(run.round===1){run.round=2;run.hand=dealHand(9,meta.role,run.level);run.enemyHand=dealHand(9);run.used=[];run.enemyUsed=[];run.selected=[];run.enemySelected=[];run.selectDeadline=0;screen='cards';render();return}if(run.round===2){startFinalDuel();return}}"
text = replace_once(text, old_next, new_next, 'fresh nine-card second round')
path.write_text(text, encoding='utf-8')


# ---- pk.js ----
path = Path('src/pk.js')
text = path.read_text(encoding='utf-8')
image_anchor = "  function imageButton(src,label,attrs=''){return `<button ${attrs} aria-label=\"${esc(label)}\" style=\"border:0;background:transparent;padding:0;display:grid;place-items:center;width:100%;cursor:pointer\">${uiImg(src,label,'display:block;max-width:100%;height:auto;object-fit:contain;')}</button>`}"
image_new = image_anchor + "\n  function cardArt(c,mini=false){if(c?.exclusive){const r=ROLES[c.role]||ROLES.warrior;return `<span class=\"exclusive-card-art ${mini?'mini':''}\">${uiImg(r.art,c.name,'')}</span>`}return `<span class=\"asset-slot\" data-asset=\"card-${esc(c.id)}\"></span>`}"
text = replace_once(text, image_anchor, image_new, 'PK exclusive card art helper')

old_card = "  function card(c,i){const unavailable=used.includes(i),order=selected.indexOf(i)+1,hint=cardHint(c);return `<button class=\"battle-card ${c.color} ${unavailable?'used':''} ${order?'selected':''}\" data-pk-card=\"${i}\" ${unavailable?'disabled':''}><span class=\"card-order\">${order||''}</span><span class=\"asset-slot\" data-asset=\"card-${esc(c.id)}\"></span><b>${esc(c.name)}</b><small>${esc(hint)}</small></button>`}"
new_card = "  function card(c,i){const unavailable=used.includes(i),order=selected.indexOf(i)+1,hint=cardHint(c);return `<button class=\"battle-card ${c.color} ${c.exclusive?'exclusive-card':''} ${unavailable?'used':''} ${order?'selected':''}\" data-pk-card=\"${i}\" ${unavailable?'disabled':''}><span class=\"card-order\">${order||''}</span>${cardArt(c,false)}<b>${esc(c.name)}</b><small>${esc(hint)}</small></button>`}"
text = replace_once(text, old_card, new_card, 'PK exclusive card renderer')

old_selected = "  function selectedHtml(cards=[],active=-1,enemy=false){return `<div class=\"selected-action-cards ${enemy?'enemy-cards':''}\">${cards.map((c,i)=>`<div class=\"mini-card ${c.color} ${i===active?'active':''}\"><span class=\"asset-slot\" data-asset=\"card-${esc(c.id)}\"></span><b>${esc(c.name)}</b><span>${i+1}</span></div>`).join('')}</div>`}"
new_selected = "  function selectedHtml(cards=[],active=-1,enemy=false){return `<div class=\"selected-action-cards ${enemy?'enemy-cards':''}\">${cards.map((c,i)=>`<div class=\"mini-card ${c.color} ${c.exclusive?'exclusive-card':''} ${i===active?'active':''}\">${cardArt(c,true)}<b>${esc(c.name)}</b><span>${i+1}</span></div>`).join('')}</div>`}"
text = replace_once(text, old_selected, new_selected, 'PK selected special card art')

old_next = "  function next(){if(round>=3||last?.finished){status='finished';render();return}round++;selected=[];selectDeadline=0;if(round===3){correct=0;qIndex=0;send({type:'ready',selected:[],correct:0,elapsedMs:200});status='wait';render();return}status='cards';render()}"
new_next = "  function next(){if(round>=3||last?.finished){status='finished';render();return}round++;selected=[];selectDeadline=0;if(round===3){correct=0;qIndex=0;send({type:'ready',selected:[],correct:0,elapsedMs:200});status='wait';render();return}if(last?.nextHand){hand=last.nextHand;used=[]}status='cards';render()}"
text = replace_once(text, old_next, new_next, 'PK fresh second-round hand')
path.write_text(text, encoding='utf-8')


# ---- worker/index.js ----
path = Path('worker/index.js')
text = path.read_text(encoding='utf-8')
text = replace_once(text, "hand:dealHand(9),used:[]", "hand:dealHand(9,profile.role,profile.level),used:[]", 'PK initial role hand')

old_finish = """    a.fighter=A;b.fighter=B;const finished=round>=3||A.hp<=0||B.hp<=0;let winner=null;
    if(finished){const ar=A.hp/A.maxHp,br=B.hp/B.maxHp;winner=Math.abs(ar-br)<.0001?'draw':ar>br?'a':'b';a.state='finished';b.state='finished'}else{a.round++;b.round++;a.ready=null;b.ready=null}
    const nextQuestions=!finished&&round===1?qset(a.questionUsed||[]):null;if(nextQuestions){a.questionUsed=[...(a.questionUsed||[]),...nextQuestions];b.questionUsed=[...(b.questionUsed||[]),...nextQuestions]}"""
new_finish = """    a.fighter=A;b.fighter=B;const finished=round>=3||A.hp<=0||B.hp<=0;let winner=null,nextHandA=null,nextHandB=null;
    if(finished){const ar=A.hp/A.maxHp,br=B.hp/B.maxHp;winner=Math.abs(ar-br)<.0001?'draw':ar>br?'a':'b';a.state='finished';b.state='finished'}else{a.round++;b.round++;a.ready=null;b.ready=null;if(round===1){a.hand=dealHand(9,a.profile.role,a.profile.level);b.hand=dealHand(9,b.profile.role,b.profile.level);a.used=[];b.used=[];nextHandA=a.hand;nextHandB=b.hand}}
    const nextQuestions=!finished&&round===1?qset(a.questionUsed||[]):null;if(nextQuestions){a.questionUsed=[...(a.questionUsed||[]),...nextQuestions];b.questionUsed=[...(b.questionUsed||[]),...nextQuestions]}"""
text = replace_once(text, old_finish, new_finish, 'PK fresh-hand server logic')

old_send_a = "this.send(ws,{type:'battle-result',round,self:this.view(a),opponent:this.view(b),correct:ra.correct,logs:allLogsA,steps:stepsA,opponentCards:cardsB,orderText,finished,winner:winner==='a'?'self':winner==='b'?'opponent':winner,nextQuestions});"
new_send_a = "this.send(ws,{type:'battle-result',round,self:this.view(a),opponent:this.view(b),correct:ra.correct,logs:allLogsA,steps:stepsA,opponentCards:cardsB,orderText,finished,winner:winner==='a'?'self':winner==='b'?'opponent':winner,nextQuestions,nextHand:nextHandA});"
text = replace_once(text, old_send_a, new_send_a, 'PK next hand response A')

old_send_b = "this.send(other,{type:'battle-result',round,self:this.view(b),opponent:this.view(a),correct:rb.correct,logs:allLogsB,steps:stepsB,opponentCards:cardsA,orderText:round===3?'最終決戰 · 5 輪普通攻擊':(first==='b'?`你先出手 · ${(rb.elapsedMs/1000).toFixed(1)} 秒`:`對手先出手 · ${(ra.elapsedMs/1000).toFixed(1)} 秒`),finished,winner:winner==='b'?'self':winner==='a'?'opponent':winner,nextQuestions})"
new_send_b = "this.send(other,{type:'battle-result',round,self:this.view(b),opponent:this.view(a),correct:rb.correct,logs:allLogsB,steps:stepsB,opponentCards:cardsA,orderText:round===3?'最終決戰 · 5 輪普通攻擊':(first==='b'?`你先出手 · ${(rb.elapsedMs/1000).toFixed(1)} 秒`:`對手先出手 · ${(ra.elapsedMs/1000).toFixed(1)} 秒`),finished,winner:winner==='b'?'self':winner==='a'?'opponent':winner,nextQuestions,nextHand:nextHandB})"
text = replace_once(text, old_send_b, new_send_b, 'PK next hand response B')
path.write_text(text, encoding='utf-8')


# ---- styles.css ----
path = Path('src/styles.css')
text = path.read_text(encoding='utf-8')
text = replace_once(text,
    ".pet-growth-art img{height:125px;width:min(100%,190px)}",
    ".pet-growth-art img{height:155px;width:min(100%,220px)}",
    'desktop pet art size')
text = replace_once(text,
    ".growth-level span{font-size:18px;color:#4b5851;font-weight:500}",
    ".growth-level span{font-size:18px;color:#4b5851;font-weight:500}.growth-player-name{font-size:17px!important;color:#29332f!important}.growth-title-bonus{font-size:13px;line-height:1.35;color:#68736d;font-weight:500}",
    'identity/title styles')
text = replace_once(text,
    ".battle-card .asset-slot{width:min(150px,88%);height:132px;border:0;border-radius:0;background-color:transparent;display:block}",
    ".battle-card .asset-slot{width:min(150px,88%);height:132px;border:0;border-radius:0;background-color:transparent;display:block}.exclusive-card-art{width:min(150px,88%);height:132px;display:grid;place-items:center;overflow:hidden}.exclusive-card-art img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 8px 9px rgba(50,58,54,.18))}.battle-card.exclusive-card{box-shadow:inset 0 0 0 2px rgba(118,91,39,.20)}",
    'exclusive card desktop art')
text = replace_once(text,
    ".mini-card .asset-slot{width:62px;height:58px;border:0;border-radius:0;background-color:transparent}",
    ".mini-card .asset-slot{width:62px;height:58px;border:0;border-radius:0;background-color:transparent}.mini-card .exclusive-card-art{width:62px;height:58px}",
    'exclusive mini art')

old_mobile = ".growth-feature{grid-template-columns:minmax(0,1.2fr) minmax(112px,.8fr);gap:5px}.role-feature{min-height:340px;padding:10px 8px 12px}.pet-feature{min-height:160px;padding:5px 7px 6px}.growth-art img{height:285px;transform:translateX(-6%)}.pet-growth-art img{height:92px;width:min(100%,130px);transform:translateX(-4%)}.growth-panel{gap:7px}"
new_mobile = ".growth-feature{grid-template-columns:minmax(0,1.08fr) minmax(122px,.92fr);gap:4px}.role-feature{min-height:340px;padding:10px 2px 12px 18px}.pet-feature{min-height:160px;padding:5px 7px 6px}.growth-art img{height:285px;transform:translateX(3%)}.role-feature .growth-panel{transform:translateX(5px)}.pet-growth-art img{height:112px;width:min(100%,155px);transform:translateX(0)}.growth-panel{gap:7px}"
text = replace_once(text, old_mobile, new_mobile, 'mobile role shift and pet size')
text = replace_once(text, ".pet-feature .visual-wrap{max-height:105px}", ".pet-feature .visual-wrap{max-height:125px}", 'mobile pet visual height')
text = replace_once(text,
    ".battle-card .asset-slot{width:min(70px,92%);height:60px;border-radius:0}",
    ".battle-card .asset-slot{width:min(70px,92%);height:60px;border-radius:0}.battle-card .exclusive-card-art{width:min(70px,92%);height:60px}",
    'exclusive card mobile art')
text = replace_once(text,
    ".mini-card .asset-slot{width:50px;height:47px;border-radius:0}",
    ".mini-card .asset-slot{width:50px;height:47px;border-radius:0}.mini-card .exclusive-card-art{width:50px;height:47px}",
    'exclusive mini mobile art')
path.write_text(text, encoding='utf-8')
