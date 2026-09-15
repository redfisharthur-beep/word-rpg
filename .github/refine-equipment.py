from pathlib import Path
import re

def read(path):
    return Path(path).read_text()

def write(path, text):
    Path(path).write_text(text)

def replace_once(path, old, new):
    s = read(path)
    n = s.count(old)
    if n != 1:
        raise SystemExit(f"{path}: expected one exact match, got {n}: {old[:100]!r}")
    write(path, s.replace(old, new, 1))

def sub_once(path, pattern, repl):
    s = read(path)
    out, n = re.subn(pattern, repl, s, count=1, flags=re.S)
    if n != 1:
        raise SystemExit(f"{path}: expected one regex match, got {n}: {pattern[:100]!r}")
    write(path, out)

replace_once(
    'src/rpg.js',
    "export function emptyRpg(){return {inventory:[],equipped:{gems:[],armor:null,ring:null},petSkills:{fox:[],owl:[],dragon:[]}};}",
    "export function emptyRpg(){return {inventory:[],equipped:{gems:[],armor:null,rings:[]},petSkills:{fox:[],owl:[],dragon:[]}};}"
)

clean_rpg = """export function cleanRpg(raw={}){
  const base=emptyRpg(),src=raw&&typeof raw==='object'?raw:{},inventory=Array.isArray(src.inventory)?src.inventory.map(normalizeItem).filter(Boolean).slice(-60):[];
  const ids=new Set(inventory.map(x=>x.id)),eq=src.equipped&&typeof src.equipped==='object'?src.equipped:{},gems=Array.isArray(eq.gems)?[...new Set(eq.gems.filter(id=>ids.has(id)&&inventory.find(x=>x.id===id)?.type==='gem'))].slice(0,3):[];
  const armor=ids.has(eq.armor)&&inventory.find(x=>x.id===eq.armor)?.type==='armor'?eq.armor:null;
  const legacyRing=ids.has(eq.ring)&&inventory.find(x=>x.id===eq.ring)?.type==='ring'?eq.ring:null,rawRings=Array.isArray(eq.rings)?eq.rings:(legacyRing?[legacyRing]:[]),rings=[...new Set(rawRings.filter(id=>ids.has(id)&&inventory.find(x=>x.id===id)?.type==='ring'))].slice(0,2);
  const petSkills={};
  for(const pet of PET_IDS){const valid=new Set(PET_TREES[pet].map(x=>x.id)),list=Array.isArray(src.petSkills?.[pet])?src.petSkills[pet].filter(id=>valid.has(id)):[];petSkills[pet]=PET_TREES[pet].filter(x=>list.includes(x.id)).map(x=>x.id);}
  return {...base,inventory,equipped:{gems,armor,rings},petSkills};
}"""
sub_once('src/rpg.js', r"export function cleanRpg\(raw=\{\}\)\{.*?\n\}\n\nexport function skillPointBudget", clean_rpg + "\n\nexport function skillPointBudget")

equipment_bonuses = """export function equipmentBonuses(rpg){
  const clean=cleanRpg(rpg),byId=new Map(clean.inventory.map(x=>[x.id,x])),ids=[...clean.equipped.gems,clean.equipped.armor,...clean.equipped.rings].filter(Boolean),out={hpPct:0,atkPct:0,defPct:0,crit:0};
  for(const id of ids){const item=byId.get(id);if(!item?.bonuses)continue;out.hpPct+=Number(item.bonuses.hpPct)||0;out.atkPct+=Number(item.bonuses.atkPct)||0;out.defPct+=Number(item.bonuses.defPct)||0;out.crit+=Number(item.bonuses.crit)||0;}
  return out;
}"""
sub_once('src/rpg.js', r"export function equipmentBonuses\(rpg\)\{.*?\n\}\n\nfunction weightedQuality", equipment_bonuses + "\n\nfunction weightedQuality")

sub_once(
    'src/rpg.js',
    r"export function equipItem\(rpg,itemId\)\{.*?\}\nexport function unequipItem",
    """export function equipItem(rpg,itemId){const clean=cleanRpg(rpg),item=clean.inventory.find(x=>x.id===itemId);if(!item)return clean;if(item.type==='gem'){const gems=clean.equipped.gems.filter(id=>id!==itemId);if(gems.length>=3)return clean;clean.equipped.gems=[...gems,itemId];}else if(item.type==='armor')clean.equipped.armor=itemId;else if(item.type==='ring'){const rings=clean.equipped.rings.filter(id=>id!==itemId);if(rings.length>=2)return clean;clean.equipped.rings=[...rings,itemId];}return cleanRpg(clean);}
export function unequipItem"""
)
sub_once(
    'src/rpg.js',
    r"export function unequipItem\(rpg,itemId\)\{.*?\}\nexport function itemBonusText",
    """export function unequipItem(rpg,itemId){const clean=cleanRpg(rpg);clean.equipped.gems=clean.equipped.gems.filter(id=>id!==itemId);if(clean.equipped.armor===itemId)clean.equipped.armor=null;clean.equipped.rings=clean.equipped.rings.filter(id=>id!==itemId);return cleanRpg(clean);}
export function itemBonusText"""
)

equipment_block = """function equipmentSlot(id){const item=meta.rpg.inventory.find(x=>x.id===id);return `<div class=\"equip-slot\">${item?`${lootArt(item,'equip-art')}<span class=\"quality-${esc(item.quality)}\">${esc(item.name)}</span><small>${esc(itemBonusText(item))}</small><button class=\"mini-system-btn\" data-unequip=\"${esc(item.id)}\">卸下</button>`:'<span class=\"empty-equip-slot\">—</span>'}</div>`}
function equipmentGroup(label,kind,slots){return `<section class=\"equip-group ${esc(kind)}\"><h2>${esc(label)}</h2><div class=\"equip-group-slots\">${slots.join('')}</div></section>`}
function systemBackButton(){return `<button class=\"system-back-btn\" data-action=\"setup-back\" aria-label=\"返回\">${uiImg(ASSETS.ui.back,'返回','')}</button>`}
function renderEquipment(){const eq=meta.rpg.equipped,rings=eq.rings||[],equipped=new Set([...eq.gems,eq.armor,...rings].filter(Boolean)),items=[...meta.rpg.inventory].reverse();return `<main class=\"setup-screen system-screen\"><section class=\"system-card\"><div class=\"system-head\">${systemBackButton()}<span></span><span></span></div><div class=\"equip-groups\">${equipmentGroup('寶石','gems',[0,1,2].map(i=>equipmentSlot(eq.gems[i])))}${equipmentGroup('裝甲','armor',[equipmentSlot(eq.armor)])}${equipmentGroup('戒指','rings',[0,1].map(i=>equipmentSlot(rings[i])))}</div><div class=\"inventory-list\">${items.length?items.map(item=>{const on=equipped.has(item.id),gemFull=item.type==='gem'&&eq.gems.length>=3&&!on,ringFull=item.type==='ring'&&rings.length>=2&&!on,full=gemFull||ringFull;return `<div class=\"loot-item quality-border-${esc(item.quality)}\">${lootArt(item)}<div><b class=\"quality-${esc(item.quality)}\">${esc(item.name)}</b><small>${esc(itemBonusText(item))}</small></div><button class=\"mini-system-btn\" ${on?'data-unequip':'data-equip'}=\"${esc(item.id)}\" ${full?'disabled':''}>${on?'卸下':'裝備'}</button></div>`}).join(''):'<div class=\"empty-system\">尚未獲得裝備</div>'}</div></section></main>`}"""
sub_once('src/game.js', r"function equipmentSlot\(label,id\)\{.*?\}\nfunction renderEquipment\(\)\{.*?\}\nfunction renderPetTree", equipment_block + "\nfunction renderPetTree")

pet_tree = """function renderPetTree(){const points=availableSkillPoints(meta.level,meta.rpg);return `<main class=\"setup-screen system-screen\"><section class=\"system-card\"><div class=\"system-head\">${systemBackButton()}<span></span><b>${points} 點</b></div><div class=\"pet-tree-grid\">${Object.entries(PET_TREES).map(([pet,tree])=>{const owned=new Set(meta.rpg.petSkills[pet]||[]);return `<section class=\"pet-tree\"><h2>${esc(PETS[pet]?.name||pet)}</h2>${tree.map(node=>{const got=owned.has(node.id),ok=canUnlockPetSkill(pet,node.id,meta.level,meta.rpg);return `<button class=\"skill-node ${got?'unlocked':''}\" data-pet-skill=\"${pet}|${node.id}\" ${got||!ok?'disabled':''}><b>${esc(node.name)}</b><span>${node.cost} 點</span><small>${esc(node.desc)}</small></button>`}).join('')}</section>`}).join('')}</div><button class=\"secondary-btn reset-tree-btn\" data-action=\"reset-pet-tree\">重置技能樹</button></section></main>`}"""
sub_once('src/game.js', r"function renderPetTree\(\)\{.*?\}\nfunction statItem", pet_tree + "\nfunction statItem")

stats_block = """function statItem(src,value,label){return `<span class=\"battle-stat-line\">${uiImg(src,label,'')}<em>${esc(label)}</em><b>${esc(value)}</b></span>`}
function shieldStat(value){return `<span class=\"battle-stat-line shield-stat\"><i class=\"stat-spacer\" aria-hidden=\"true\"></i><em>護盾</em><b>${esc(Math.max(0,Math.round(value||0)))}</b></span>`}
function stats(f){return `<div class=\"stat-row\">${statItem(ASSETS.ui.hp,`${Math.max(0,Math.round(f.hp))}/${Math.round(f.maxHp)}`,'生命')}${statItem(ASSETS.ui.atk,Math.round(f.atk),'攻擊')}${statItem(ASSETS.ui.def,Math.round(f.def),'防禦')}${statItem(ASSETS.ui.crit,`${Math.round(f.crit*100)}%`,'爆擊率')}${shieldStat(f.shield)}</div>`}"""
sub_once('src/game.js', r"function statItem\(src,value,label\)\{.*?\}\nfunction stats\(f\)\{.*?\}\nfunction selectedCardsHtml", stats_block + "\nfunction selectedCardsHtml")

pk_stat = """function statItem(src,value,label){return `<span class=\"battle-stat-line\">${uiImg(src,label,'')}<em>${esc(label)}</em><b>${esc(value)}</b></span>`}
  function shieldStat(value){return `<span class=\"battle-stat-line shield-stat\"><i class=\"stat-spacer\" aria-hidden=\"true\"></i><em>護盾</em><b>${esc(Math.max(0,Math.round(value||0)))}</b></span>`}"""
sub_once('src/pk.js', r"function statItem\(src,value,label\)\{.*?\}\n  function fighter", pk_stat + "\n  function fighter")
replace_once(
    'src/pk.js',
    "<div class=\"stat-row\">${statItem(ASSETS.ui.hp,`${Math.round(f.hp)}/${Math.round(f.maxHp)}`,'生命')}${statItem(ASSETS.ui.atk,Math.round(f.atk),'攻擊')}${statItem(ASSETS.ui.def,Math.round(f.def),'防禦')}${statItem(ASSETS.ui.crit,`${Math.round(f.crit*100)}%`,'爆擊')}${f.shield>0?`<span>護盾 ${Math.round(f.shield)}</span>`:''}</div>",
    "<div class=\"stat-row\">${statItem(ASSETS.ui.hp,`${Math.round(f.hp)}/${Math.round(f.maxHp)}`,'生命')}${statItem(ASSETS.ui.atk,Math.round(f.atk),'攻擊')}${statItem(ASSETS.ui.def,Math.round(f.def),'防禦')}${statItem(ASSETS.ui.crit,`${Math.round(f.crit*100)}%`,'爆擊率')}${shieldStat(f.shield)}</div>"
)

replace_once(
    'src/styles.css',
    ".stat-row{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 13px;margin-top:9px}.stat-row span{padding:0;background:transparent;border-radius:0;font-size:16px;color:#36413c;font-weight:500}",
    ".stat-row{display:grid;grid-template-columns:1fr;justify-items:center;gap:4px;margin-top:9px}.stat-row .battle-stat-line{display:grid;grid-template-columns:26px 58px minmax(46px,auto);align-items:center;gap:6px;padding:0;background:transparent;border-radius:0;color:#36413c;font-weight:500;line-height:1.05}.battle-stat-line img{display:block;width:24px;height:24px;object-fit:contain}.battle-stat-line em{font-style:normal;font-size:14px;text-align:left;white-space:nowrap}.battle-stat-line b{font-size:15px;text-align:right;white-space:nowrap}.stat-spacer{display:block;width:24px;height:24px}"
)
replace_once(
    'src/styles.css',
    ".mini-card .asset-slot{width:62px;height:58px;border:0;border-radius:0;background-color:transparent}.mini-card .exclusive-card-art{width:62px;height:58px}",
    ".mini-card .asset-slot{width:62px;height:58px;border:0;border-radius:0;background-color:transparent}.mini-card .exclusive-card-art{width:62px;height:58px;padding:0}.mini-card .exclusive-card-art img{width:84%;height:84%;max-width:84%;max-height:84%;object-fit:contain}"
)
replace_once(
    'src/styles.css',
    ".stat-row{gap:4px 9px}.stat-row span{font-size:16px;padding:0}",
    ".stat-row{gap:3px}.stat-row .battle-stat-line{grid-template-columns:22px 52px minmax(42px,auto);gap:4px}.battle-stat-line img{width:21px;height:21px}.battle-stat-line em{font-size:12px}.battle-stat-line b{font-size:13px}.stat-spacer{width:21px;height:21px}"
)
replace_once(
    'src/styles.css',
    ".mini-card .asset-slot{width:50px;height:42px;border-radius:0;transform:translateY(3px)}.mini-card .exclusive-card-art{width:50px;height:42px;transform:translateY(3px);overflow:visible;padding:1px}",
    ".mini-card .asset-slot{width:50px;height:42px;border-radius:0;transform:translateY(3px)}.mini-card .exclusive-card-art{width:50px;height:42px;transform:translateY(3px);overflow:visible;padding:0}.mini-card .exclusive-card-art img{width:84%;height:84%;max-width:84%;max-height:84%}"
)
replace_once(
    'src/styles.css',
    ".system-screen{align-items:start}.system-card{width:min(860px,96%);margin:20px auto;background:rgba(249,246,240,.96);border-radius:28px;padding:22px;box-shadow:var(--shadow)}.system-head{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;margin-bottom:16px}.system-head h1{margin:0;text-align:center}.system-head>b{text-align:right}.equip-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.equip-slot{min-height:118px;background:#ebe4da;border-radius:16px;padding:10px;display:grid;align-content:center;gap:5px;text-align:center}",
    ".system-screen{align-items:start}.system-card{width:min(860px,96%);margin:20px auto;background:rgba(249,246,240,.96);border-radius:28px;padding:22px;box-shadow:var(--shadow)}.system-head{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;margin-bottom:12px}.system-head>b{text-align:right}.system-back-btn{border:0;background:transparent;padding:0;width:74px;height:58px;display:grid;place-items:center;justify-self:start}.system-back-btn img{display:block;width:100%;height:100%;object-fit:contain}.equip-groups{display:grid;gap:14px}.equip-group{display:grid;gap:8px}.equip-group h2{margin:0;font-size:20px;text-align:left;color:#3b4741}.equip-group-slots{display:grid;gap:10px}.equip-group.gems .equip-group-slots{grid-template-columns:repeat(3,minmax(0,1fr))}.equip-group.armor .equip-group-slots{grid-template-columns:minmax(0,1fr)}.equip-group.rings .equip-group-slots{grid-template-columns:repeat(2,minmax(0,1fr))}.equip-slot{min-height:118px;background:#ebe4da;border-radius:16px;padding:10px;display:grid;align-content:center;gap:5px;text-align:center}.empty-equip-slot{font-size:30px;color:#9b968e}"
)
replace_once(
    'src/styles.css',
    "@media(max-width:700px){.system-entry{font-size:16px;padding:8px 12px}.system-card{width:96%;padding:12px;border-radius:20px}.equip-grid{grid-template-columns:repeat(2,1fr)}.equip-slot:last-child{grid-column:1/-1}.pet-tree-grid{grid-template-columns:1fr}.loot-item{padding:9px}.system-head h1{font-size:26px}}",
    "@media(max-width:700px){.system-entry{font-size:16px;padding:8px 12px}.system-card{width:96%;padding:12px;border-radius:20px}.system-back-btn{width:62px;height:48px}.equip-groups{gap:11px}.equip-group h2{font-size:18px}.equip-group-slots{gap:7px}.equip-slot{min-height:104px;padding:7px}.equip-art{width:62px;height:62px}.pet-tree-grid{grid-template-columns:1fr}.loot-item{padding:9px}}"
)
