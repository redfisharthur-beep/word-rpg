from pathlib import Path


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f"Expected {label} source not found; refusing to patch.")
    return text.replace(old, new, 1)

# ---- src/game.js ----
path = Path('src/game.js')
text = path.read_text(encoding='utf-8')

text = replace_once(
    text,
    "x.xp=Math.max(0,Math.round(Number(x.xp)||0));return x",
    "x.xp=x.level>=50?0:Math.max(0,Math.round(Number(x.xp)||0));return x",
    'level 50 local xp clamp',
)

text = replace_once(
    text,
    "xp:Math.max(0,Math.round(Number(p.xp)||0))};persistLocal()}",
    "xp:Math.max(0,Math.round(Number(p.xp)||0))};if(meta.level>=50)meta.xp=0;persistLocal()}",
    'LINE level 50 xp clamp',
)

old_add_xp = "function addXp(amount){if(meta.authMode==='guest'){meta.level=1;meta.xp=0;persistLocal();return {amount:0,old:1,newLevel:1,levels:[],title:'訪客模式',guest:true}}const old=meta.level,levels=[];meta.xp+=Math.max(0,Math.round(amount));while(meta.level<50&&meta.xp>=xpNeed(meta.level)){meta.xp-=xpNeed(meta.level);meta.level++;levels.push(meta.level)}saveMeta();return {amount,old,newLevel:meta.level,levels,title:titleFor(meta.level)}}"
new_add_xp = "function addXp(amount){if(meta.authMode==='guest'){meta.level=1;meta.xp=0;persistLocal();return {amount:0,old:1,newLevel:1,levels:[],title:'訪客模式',guest:true}}if(meta.level>=50){meta.level=50;meta.xp=0;saveMeta();return {amount:0,old:50,newLevel:50,levels:[],title:titleFor(50),max:true}}const old=meta.level,levels=[];meta.xp+=Math.max(0,Math.round(amount));while(meta.level<50&&meta.xp>=xpNeed(meta.level)){meta.xp-=xpNeed(meta.level);meta.level++;levels.push(meta.level)}const max=meta.level>=50;if(max)meta.xp=0;saveMeta();return {amount,old,newLevel:meta.level,levels,title:titleFor(meta.level),max}}"
text = replace_once(text, old_add_xp, new_add_xp, 'level 50 maximum progression')

old_growth = "function growthPanel(stats,primary=false){const guest=meta.authMode==='guest',tier=titleTier(guest?1:meta.level),name=primary&&meta.authMode==='line'&&meta.playerName?`<span class=\"growth-player-name\">${esc(meta.playerName)}</span>`:'',bonus=primary&&!guest?`<small class=\"growth-title-bonus\">${esc(tier.label)}</small>`:'';return `<div class=\"growth-panel\"><div class=\"growth-level\"><b>Lv.${guest?1:meta.level}</b><span>${guest?'訪客':esc(tier.name)}</span>${name}${bonus}</div><div class=\"growth-stats\">${growthItem(ASSETS.ui.hp,stats.maxHp,'生命')}${growthItem(ASSETS.ui.atk,stats.atk,'攻擊')}${growthItem(ASSETS.ui.def,stats.def,'防禦')}</div></div>`}"
new_growth = "function growthPanel(stats,kind='role'){const guest=meta.authMode==='guest',statHtml=`${growthItem(ASSETS.ui.hp,stats.maxHp,'生命')}${growthItem(ASSETS.ui.atk,stats.atk,'攻擊')}${growthItem(ASSETS.ui.def,stats.def,'防禦')}`;if(kind==='pet')return `<div class=\"growth-panel pet-growth-panel\"><div class=\"growth-stats\">${statHtml}</div></div>`;const tier=titleTier(guest?1:meta.level),r=ROLES[meta.role]||ROLES.warrior,levelText=guest?'Lv.1':meta.level>=50?'Lv.50 · 滿級':`Lv.${meta.level}`,name=meta.authMode==='line'&&meta.playerName?`<span class=\"growth-player-name\">${esc(meta.playerName)}</span>`:'';return `<div class=\"growth-panel role-growth-panel\"><div class=\"growth-level\"><span class=\"growth-role-name\">${esc(r.name)}</span><b>${levelText}</b><span>${guest?'訪客':esc(tier.name)}</span>${name}</div><div class=\"growth-stats\">${statHtml}</div></div>`}"
text = replace_once(text, old_growth, new_growth, 'role/pet setup info layout')

text = replace_once(text, "${growthPanel(g.role,true)}", "${growthPanel(g.role,'role')}", 'role growth panel call')
text = replace_once(text, "${growthPanel(g.pet)}", "${growthPanel(g.pet,'pet')}", 'pet growth panel call')

old_selected = "function selectedCardsHtml(cards=[],active=-1,enemy=false){if(!cards.length)return '';return `<div class=\"selected-action-cards ${enemy?'enemy-cards':''}\">${cards.map((c,i)=>`<div class=\"mini-card ${c.color} ${c.exclusive?'exclusive-card':''} ${i===active?'active':''}\">${cardArt(c,true)}<b>${esc(c.name)}</b><span>${i+1}</span></div>`).join('')}</div>`}"
new_selected = "function selectedCardsHtml(cards=[],active=-1,enemy=false){if(!cards.length)return '';return `<div class=\"selected-action-cards ${enemy?'enemy-cards':''}\">${cards.map((c,i)=>`<div class=\"mini-card ${c.color} ${c.exclusive?'exclusive-card':''} ${i===active?'active':''}\">${cardArt(c,true)}<b>${esc(c.name)}</b><span>${'★'.repeat(i+1)}</span></div>`).join('')}</div>`}"
text = replace_once(text, old_selected, new_selected, 'single-player mini card stars')

text = replace_once(
    text,
    '<span class="card-order">${order||\'\'}</span>',
    '<span class="card-order">${order?\'★\'.repeat(order):\'\'}</span>',
    'single-player card priority stars',
)

old_reward = "function rewardHtml(){const r=run?.lastReward;if(!r)return '';if(r.guest)return `<div class=\"growth-reward\"><b>訪客模式</b><span>不累積 EXP · 角色不升級</span></div>`;return `<div class=\"growth-reward\"><b>EXP +${r.amount}</b><span>Lv.${meta.level} · ${esc(titleFor(meta.level))}</span>${r.levels.length?`<strong>LEVEL UP</strong>`:''}</div>`}"
new_reward = "function rewardHtml(){const r=run?.lastReward;if(!r)return '';if(r.guest)return `<div class=\"growth-reward\"><b>訪客模式</b><span>不累積 EXP · 角色不升級</span></div>`;if(r.max)return `<div class=\"growth-reward\"><b>Lv.50 · 滿級</b><span>${esc(titleFor(50))}</span></div>`;return `<div class=\"growth-reward\"><b>EXP +${r.amount}</b><span>Lv.${meta.level} · ${esc(titleFor(meta.level))}</span>${r.levels.length?`<strong>LEVEL UP</strong>`:''}</div>`}"
text = replace_once(text, old_reward, new_reward, 'max level reward display')

path.write_text(text, encoding='utf-8')

# ---- src/pk.js ----
path = Path('src/pk.js')
text = path.read_text(encoding='utf-8')
text = replace_once(text, "level:meta.level||1", "level:50", 'PK client sends fixed level 50')
text = replace_once(
    text,
    '<span class="card-order">${order||\'\'}</span>',
    '<span class="card-order">${order?\'★\'.repeat(order):\'\'}</span>',
    'PK card priority stars',
)
old_pk_selected = "function selectedHtml(cards=[],active=-1,enemy=false){return `<div class=\"selected-action-cards ${enemy?'enemy-cards':''}\">${cards.map((c,i)=>`<div class=\"mini-card ${c.color} ${c.exclusive?'exclusive-card':''} ${i===active?'active':''}\">${cardArt(c,true)}<b>${esc(c.name)}</b><span>${i+1}</span></div>`).join('')}</div>`}"
new_pk_selected = "function selectedHtml(cards=[],active=-1,enemy=false){return `<div class=\"selected-action-cards ${enemy?'enemy-cards':''}\">${cards.map((c,i)=>`<div class=\"mini-card ${c.color} ${c.exclusive?'exclusive-card':''} ${i===active?'active':''}\">${cardArt(c,true)}<b>${esc(c.name)}</b><span>${'★'.repeat(i+1)}</span></div>`).join('')}</div>`}"
text = replace_once(text, old_pk_selected, new_pk_selected, 'PK mini card stars')
path.write_text(text, encoding='utf-8')

# ---- worker/index.js ----
path = Path('worker/index.js')
text = path.read_text(encoding='utf-8')
old_clean = "function cleanProgress(input={}){return {role:['warrior','mage','archer'].includes(input.role)?input.role:'warrior',pet:['fox','owl','dragon'].includes(input.pet)?input.pet:'fox',level:clamp(Math.round(Number(input.level)||1),1,50),xp:Math.max(0,Math.round(Number(input.xp)||0))}}"
new_clean = "function cleanProgress(input={}){const level=clamp(Math.round(Number(input.level)||1),1,50);return {role:['warrior','mage','archer'].includes(input.role)?input.role:'warrior',pet:['fox','owl','dragon'].includes(input.pet)?input.pet:'fox',level,xp:level>=50?0:Math.max(0,Math.round(Number(input.xp)||0))}}"
text = replace_once(text, old_clean, new_clean, 'server max level xp clamp')
old_profile = "profile(p){return {name:String(p.name||'PLAYER').slice(0,16),role:['warrior','mage','archer'].includes(p.role)?p.role:'warrior',pet:['fox','owl','dragon'].includes(p.pet)?p.pet:'fox',level:clamp(Math.round(Number(p.level)||1),1,50)}}"
new_profile = "profile(p){return {name:String(p.name||'PLAYER').slice(0,16),role:['warrior','mage','archer'].includes(p.role)?p.role:'warrior',pet:['fox','owl','dragon'].includes(p.pet)?p.pet:'fox',level:50}}"
text = replace_once(text, old_profile, new_profile, 'authoritative fixed level 50 PK profile')
path.write_text(text, encoding='utf-8')

# ---- src/styles.css ----
path = Path('src/styles.css')
text = path.read_text(encoding='utf-8')
text = replace_once(
    text,
    ".pet-growth-art img{height:155px;width:min(100%,220px)}.growth-panel{display:grid;gap:12px;align-content:center;min-width:0}",
    ".pet-growth-art img{height:155px;width:min(100%,220px)}.role-growth-art img{transform:translateX(2%)}.role-feature .growth-panel{transform:translateX(12px)}.pet-growth-panel{align-content:center}.growth-panel{display:grid;gap:12px;align-content:center;min-width:0}",
    'desktop role info right shift',
)
text = replace_once(
    text,
    ".growth-level span{font-size:18px;color:#4b5851;font-weight:500}.growth-player-name{font-size:17px!important;color:#29332f!important}.growth-title-bonus{font-size:13px;line-height:1.35;color:#68736d;font-weight:500}",
    ".growth-level span{font-size:18px;color:#4b5851;font-weight:500}.growth-role-name{font-size:24px!important;color:#34403a!important}.growth-player-name{font-size:17px!important;color:#29332f!important}",
    'remove title bonus display style and add role label style',
)
text = replace_once(
    text,
    ".card-order{position:absolute;right:7px;top:5px;width:auto;height:auto;border-radius:0;display:block;background:transparent;color:#41594d;font-size:28px;font-weight:500;line-height:1;text-shadow:0 2px 8px rgba(255,255,255,.95);z-index:3}",
    ".card-order{position:absolute;right:7px;top:5px;width:auto;height:auto;border-radius:0;display:block;background:transparent;color:#41594d;font-size:22px;font-weight:500;line-height:1;letter-spacing:-1px;text-shadow:0 2px 8px rgba(255,255,255,.95);z-index:3}",
    'card priority star sizing',
)
text = replace_once(
    text,
    ".mini-card>span:last-child{position:absolute;top:0;right:2px;font-size:19px;font-weight:500;color:#41594d}",
    ".mini-card>span:last-child{position:absolute;top:0;right:2px;font-size:14px;font-weight:500;letter-spacing:-1px;color:#41594d}",
    'mini priority star sizing',
)
text = replace_once(
    text,
    ".growth-art img{height:285px;transform:translateX(3%)}.role-feature .growth-panel{transform:translateX(5px)}.pet-growth-art img{height:112px;width:min(100%,155px);transform:translateX(0)}",
    ".growth-art img{height:285px;transform:translateX(3%)}.role-growth-art img{transform:translateX(8%)}.role-feature .growth-panel{transform:translateX(14px)}.pet-growth-art img{height:112px;width:min(100%,155px);transform:translateX(0)}",
    'mobile role art and info right shift',
)
text = replace_once(text, ".card-order{right:3px;top:3px;font-size:20px}", ".card-order{right:3px;top:3px;font-size:15px;letter-spacing:-1px}", 'mobile card stars')
text = replace_once(text, ".mini-card>span:last-child{font-size:16px;right:0}", ".mini-card>span:last-child{font-size:12px;right:0;letter-spacing:-1px}", 'mobile mini card stars')
path.write_text(text, encoding='utf-8')
