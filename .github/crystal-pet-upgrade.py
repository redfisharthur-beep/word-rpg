from pathlib import Path
import re

def read(path): return Path(path).read_text()
def write(path,text): Path(path).write_text(text)
def replace_once(path,old,new):
    s=read(path); n=s.count(old)
    if n!=1: raise SystemExit(f'{path}: expected 1 exact match, got {n}: {old[:120]!r}')
    write(path,s.replace(old,new,1))
def sub_once(path,pattern,repl):
    s=read(path); out,n=re.subn(pattern,repl,s,count=1,flags=re.S)
    if n!=1: raise SystemExit(f'{path}: expected 1 regex match, got {n}: {pattern[:120]!r}')
    write(path,out)

# rpg state: crystals + four pet enhancement levels.
replace_once('src/rpg.js',
"const PET_IDS=['fox','owl','dragon'];",
"const PET_IDS=['fox','owl','dragon'];\nexport const CRYSTAL_VALUE={common:1,rare:3,epic:8,legendary:20};\nexport const PET_ENHANCE_COST=[5,10,20,40];")

replace_once('src/rpg.js',
"export function emptyRpg(){return {inventory:[],equipped:{gems:[],armor:null,rings:[]},petSkills:{fox:[],owl:[],dragon:[]}};}",
"export function emptyRpg(){return {inventory:[],equipped:{gems:[],armor:null,rings:[]},crystals:0,petEnhance:{fox:0,owl:0,dragon:0},petSkills:{fox:[],owl:[],dragon:[]}};}")

old="""  const petSkills={};
  for(const pet of PET_IDS){const valid=new Set(PET_TREES[pet].map(x=>x.id)),list=Array.isArray(src.petSkills?.[pet])?src.petSkills[pet].filter(id=>valid.has(id)):[];petSkills[pet]=PET_TREES[pet].filter(x=>list.includes(x.id)).map(x=>x.id);}
  return {...base,inventory,equipped:{gems,armor,rings},petSkills};"""
new="""  const crystals=Math.max(0,Math.round(Number(src.crystals)||0)),petEnhance={};
  for(const pet of PET_IDS)petEnhance[pet]=clamp(Math.round(Number(src.petEnhance?.[pet])||0),0,4);
  const petSkills={};
  for(const pet of PET_IDS){const valid=new Set(PET_TREES[pet].map(x=>x.id)),list=Array.isArray(src.petSkills?.[pet])?src.petSkills[pet].filter(id=>valid.has(id)):[];petSkills[pet]=PET_TREES[pet].filter(x=>list.includes(x.id)).map(x=>x.id);}
  return {...base,inventory,equipped:{gems,armor,rings},crystals,petEnhance,petSkills};"""
replace_once('src/rpg.js',old,new)

insert_after="export function resetPetSkills(rpg){const clean=cleanRpg(rpg);clean.petSkills={fox:[],owl:[],dragon:[]};return clean;}"
addition="""
export function petEnhanceLevel(pet,rpg){return cleanRpg(rpg).petEnhance?.[pet]||0;}
export function petEnhanceCost(pet,rpg){const level=petEnhanceLevel(pet,rpg);return level>=4?0:PET_ENHANCE_COST[level];}
export function enhancePet(pet,rpg){const clean=cleanRpg(rpg);if(!PET_IDS.includes(pet))return clean;const level=clean.petEnhance[pet]||0;if(level>=4)return clean;const cost=PET_ENHANCE_COST[level];if(clean.crystals<cost)return clean;clean.crystals-=cost;clean.petEnhance[pet]=level+1;return cleanRpg(clean);}
export function crystalValue(item){return CRYSTAL_VALUE[item?.quality]||0;}
export function crystallizeItem(rpg,itemId){const clean=cleanRpg(rpg),equipped=new Set([...clean.equipped.gems,clean.equipped.armor,...clean.equipped.rings].filter(Boolean));if(equipped.has(itemId))return clean;const item=clean.inventory.find(x=>x.id===itemId);if(!item)return clean;const gain=crystalValue(item);if(!gain)return clean;clean.inventory=clean.inventory.filter(x=>x.id!==itemId);clean.crystals+=gain;return cleanRpg(clean);}
"""
replace_once('src/rpg.js',insert_after,insert_after+addition)

# Pet enhancement scales only the pet's own stat contribution, +10% per enhancement level.
replace_once('src/cards.js',
"import {equipmentBonuses,petSkillEffects} from './rpg.js';",
"import {equipmentBonuses,petSkillEffects,petEnhanceLevel} from './rpg.js';")
replace_once('src/cards.js',
"const petStats={maxHp:Math.round(pb.hp*(1+(lv-1)*.03)),atk:Math.round(pb.atk*(1+(lv-1)*.03)),def:Math.round(pb.def*(1+(lv-1)*.03))};",
"const petEnhance=petEnhanceLevel(pet,rpg||{}),petScale=1+petEnhance*.10,petStats={maxHp:Math.round(pb.hp*(1+(lv-1)*.03)*petScale),atk:Math.round(pb.atk*(1+(lv-1)*.03)*petScale),def:Math.round(pb.def*(1+(lv-1)*.03)*petScale)};")

# game imports.
replace_once('src/game.js',
"import {emptyRpg,cleanRpg,rollLoot,addLoot,equipItem,unequipItem,itemBonusText,lootImage,QUALITY,PET_TREES,availableSkillPoints,canUnlockPetSkill,unlockPetSkill,resetPetSkills} from './rpg.js';",
"import {emptyRpg,cleanRpg,rollLoot,addLoot,equipItem,unequipItem,itemBonusText,lootImage,QUALITY,PET_TREES,availableSkillPoints,canUnlockPetSkill,unlockPetSkill,resetPetSkills,crystalValue,crystallizeItem,petEnhanceLevel,petEnhanceCost,enhancePet} from './rpg.js';")

# Inventory hides equipped items and gains a crystal action.
old_render=re.search(r"function renderEquipment\(\)\{.*?\}\nfunction renderPetTree",read('src/game.js'),re.S)
if not old_render: raise SystemExit('game.js renderEquipment block not found')
new_render="""function renderEquipment(){const eq=meta.rpg.equipped,rings=eq.rings||[],equipped=new Set([...eq.gems,eq.armor,...rings].filter(Boolean)),items=[...meta.rpg.inventory].filter(item=>!equipped.has(item.id)).reverse();return `<main class=\"setup-screen system-screen\"><section class=\"system-card\"><div class=\"system-head\">${systemBackButton()}<span></span><b class=\"crystal-count\">結晶 ${meta.rpg.crystals||0}</b></div><div class=\"equip-groups\">${equipmentGroup('寶石','gems',[0,1,2].map(i=>equipmentSlot(eq.gems[i])))}${equipmentGroup('裝甲','armor',[equipmentSlot(eq.armor)])}${equipmentGroup('戒指','rings',[0,1].map(i=>equipmentSlot(rings[i])))}</div><div class=\"inventory-list\">${items.length?items.map(item=>{const gemFull=item.type==='gem'&&eq.gems.length>=3,ringFull=item.type==='ring'&&rings.length>=2,full=gemFull||ringFull;return `<div class=\"loot-item quality-border-${esc(item.quality)}\">${lootArt(item)}<div><b class=\"quality-${esc(item.quality)}\">${esc(item.name)}</b><small>${esc(itemBonusText(item))}</small></div><div class=\"loot-item-actions\"><button class=\"mini-system-btn\" data-equip=\"${esc(item.id)}\" ${full?'disabled':''}>裝備</button><button class=\"mini-system-btn crystal-btn\" data-crystallize=\"${esc(item.id)}\">結晶 +${crystalValue(item)}</button></div></div>`}).join(''):'<div class=\"empty-system\">沒有多餘裝備</div>'}</div></section></main>`}
function renderPetTree"""
s=read('src/game.js'); write('src/game.js',s[:old_render.start()]+new_render+s[old_render.end():])

# Pet tree: crystal count + enhancement block next to each pet. Keep skill points independent.
pet_match=re.search(r"function renderPetTree\(\)\{.*?\}\nfunction statItem",read('src/game.js'),re.S)
if not pet_match: raise SystemExit('game.js renderPetTree block not found')
pet_new="""function renderPetTree(){const points=availableSkillPoints(meta.level,meta.rpg),crystals=meta.rpg.crystals||0;return `<main class=\"setup-screen system-screen\"><section class=\"system-card\"><div class=\"system-head\">${systemBackButton()}<span></span><b>${points} 點 · 結晶 ${crystals}</b></div><div class=\"pet-tree-grid\">${Object.entries(PET_TREES).map(([pet,tree])=>{const owned=new Set(meta.rpg.petSkills[pet]||[]),enhance=petEnhanceLevel(pet,meta.rpg),cost=petEnhanceCost(pet,meta.rpg),max=enhance>=4,can=max?false:crystals>=cost;return `<section class=\"pet-tree\"><div class=\"pet-tree-head\"><div><h2>${esc(PETS[pet]?.name||pet)}</h2><small>強化 Lv.${enhance}/4 · 寵物能力 +${enhance*10}%${max?' · MAX':` · 下次 ${cost} 結晶`}</small></div><button class=\"mini-system-btn pet-enhance-btn\" data-pet-enhance=\"${pet}\" ${can?'':'disabled'}>${max?'滿級':'強化'}</button></div>${tree.map(node=>{const got=owned.has(node.id),ok=canUnlockPetSkill(pet,node.id,meta.level,meta.rpg);return `<button class=\"skill-node ${got?'unlocked':''}\" data-pet-skill=\"${pet}|${node.id}\" ${got||!ok?'disabled':''}><b>${esc(node.name)}</b><span>${node.cost} 點</span><small>${esc(node.desc)}</small></button>`}).join('')}</section>`}).join('')}</div><button class=\"secondary-btn reset-tree-btn\" data-action=\"reset-pet-tree\">重置技能樹</button></section></main>`}
function statItem"""
s=read('src/game.js'); write('src/game.js',s[:pet_match.start()]+pet_new+s[pet_match.end():])

# Bind crystal and pet enhancement actions.
needle="document.querySelectorAll('[data-unequip]').forEach(b=>b.addEventListener('click',()=>{meta.rpg=unequipItem(meta.rpg,b.dataset.unequip);saveMeta();render()}));"
add="""document.querySelectorAll('[data-unequip]').forEach(b=>b.addEventListener('click',()=>{meta.rpg=unequipItem(meta.rpg,b.dataset.unequip);saveMeta();render()}));document.querySelectorAll('[data-crystallize]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.crystallize,item=meta.rpg.inventory.find(x=>x.id===id);if(!item)return;const gain=crystalValue(item);if(!confirm(`將「${item.name}」轉換為 ${gain} 個結晶？`))return;meta.rpg=crystallizeItem(meta.rpg,id);saveMeta();render()}));document.querySelectorAll('[data-pet-enhance]').forEach(b=>b.addEventListener('click',()=>{const pet=b.dataset.petEnhance,cost=petEnhanceCost(pet,meta.rpg);if(!cost)return;meta.rpg=enhancePet(pet,meta.rpg);saveMeta();render()}));"""
replace_once('src/game.js',needle,add)

# CSS for crystal/inventory action/pet enhancement header.
append="""
/* CRYSTAL_PET_ENHANCE_V1 */
.crystal-count{white-space:nowrap;color:#6d604a}.loot-item-actions{display:flex;gap:7px;align-items:center;justify-content:flex-end}.crystal-btn{background:#e5dcc8}.pet-tree-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center}.pet-tree-head h2{margin:0;text-align:left}.pet-tree-head small{display:block;margin-top:3px;color:#59645e;font-size:12px;line-height:1.35}.pet-enhance-btn{min-width:76px;background:#e4d7bd}.pet-enhance-btn:disabled{opacity:.45}
@media(max-width:700px){.loot-item-actions{display:grid;gap:5px}.crystal-btn{white-space:nowrap}.pet-tree-head small{font-size:11px}.pet-enhance-btn{min-width:68px;padding:8px 9px}.crystal-count{font-size:14px}}
"""
css=read('src/styles.css')
if '/* CRYSTAL_PET_ENHANCE_V1 */' in css: raise SystemExit('crystal css marker already exists')
write('src/styles.css',css+'\n'+append)
