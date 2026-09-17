# AUTO-GENERATED from data/game-data.json. Do not edit directly.
extends RefCounted
class_name WordRpgSharedData

const DATA: Dictionary = {
  "roles": {
    "warrior": {"name":"戰士","trait":"藍牌更強，出牌時還能補護盾","base":{"hp":540,"atk":96,"def":62},"ultimate":{"id":"warrior-ultimate","name":"天崩地裂・極","mult":2.8}},
    "mage": {"name":"法師","trait":"黃牌更強，神功附體效果更高","base":{"hp":470,"atk":112,"def":45},"ultimate":{"id":"mage-ultimate","name":"終焉魔導・極","mult":3.0}},
    "archer": {"name":"弓手","trait":"紅牌更強，連續攻擊越打越痛","base":{"hp":500,"atk":106,"def":50},"ultimate":{"id":"archer-ultimate","name":"天穹三連・極","hits":[1.0,1.0,1.0]}}
  },
  "pets": {
    "fox": {"name":"靈狐","trait":"搶到先手更強；紅牌多時會追擊","base":{"hp":20,"atk":8,"def":2},"awakening":{"name":"九尾靈狐","art":"res://images/pet-fox-awakened.png"}},
    "owl": {"name":"夜梟","trait":"答錯仍有保底；防守牌多時會回血","base":{"hp":35,"atk":2,"def":6},"awakening":{"name":"星夜智梟","art":"res://images/pet-owl-awakened.png"}},
    "dragon": {"name":"幼龍","trait":"黃牌更強；連用黃牌會再爆發","base":{"hp":25,"atk":6,"def":4},"awakening":{"name":"真龍型態","art":"res://images/pet-dragon-awakened.png"}}
  },
  "stages": [
    {"id":"moss","name":"苔球獸","asset":"moss","hp":560,"atk":105,"def":48,"crit":0.1,"skill":"孢子甲殼","skillText":"每回合獲得護盾，毒素傷害減半"},
    {"id":"rabbit","name":"霧角兔","asset":"rabbit","hp":660,"atk":120,"def":55,"crit":0.16,"skill":"霧影突襲","skillText":"更容易搶先手，連擊後兩段減傷"},
    {"id":"bubble","name":"泡泡怪","asset":"bubble","hp":720,"atk":126,"def":62,"crit":0.12,"skill":"泡泡護膜","skillText":"每回合獲得泡泡護盾，低血量時護盾更厚"},
    {"id":"beetle","name":"木甲蟲","asset":"beetle","hp":800,"atk":132,"def":78,"crit":0.12,"skill":"硬殼反震","skillText":"每回合獲得護盾，受到攻擊會反震"},
    {"id":"shadow","name":"影語王","asset":"shadowKing","hp":1000,"atk":155,"def":85,"crit":0.22,"skill":"暗影汲取","skillText":"攻擊吸血，半血狂暴並清除負面"}
  ],
  "titles": [
    {"level":30,"name":"傳說勇者","hp":0.12,"atk":0.12,"def":0.12,"crit":0.05,"label":"生命/攻擊/防禦 +12% · 爆擊 +5%"},
    {"level":20,"name":"菁英勇者","hp":0.08,"atk":0.08,"def":0.08,"crit":0.03,"label":"生命/攻擊/防禦 +8% · 爆擊 +3%"},
    {"level":10,"name":"覺醒勇者","hp":0.05,"atk":0.06,"def":0.05,"crit":0.02,"label":"生命 +5% · 攻擊 +6% · 防禦 +5% · 爆擊 +2%"},
    {"level":5,"name":"冒險者","hp":0.03,"atk":0.03,"def":0.03,"crit":0.01,"label":"生命/攻擊/防禦 +3% · 爆擊 +1%"},
    {"level":1,"name":"初行者","hp":0.0,"atk":0.0,"def":0.0,"crit":0.0,"label":"基礎能力"}
  ],
  "cardPool": ["stat","stat","stat","combo","desperate","poison","break","sun","preempt","regen","sacrifice","restore","diamond","aegis","boost"],
  "cards": {
    "combo":{"name":"瞬步連擊","color":"red","text":"連續攻擊 3 次，每次 50% 攻擊力"},
    "desperate":{"name":"破釜沉舟","color":"blue","text":"造成 200% 傷害，自身防禦下降 50%"},
    "poison":{"name":"淬毒之刃","color":"yellow","text":"70% 傷害，附加 30% 攻擊力毒素 3 回合"},
    "break":{"name":"破甲一擊","color":"red","text":"70% 傷害，對手防禦降低 30% 2 回合"},
    "sun":{"name":"熾陽閃","color":"yellow","text":"80% 火焰傷害，對手 2 回合無法爆擊"},
    "preempt":{"name":"制敵機先","color":"red","text":"90% 傷害，對手攻擊降低 30% 2 回合"},
    "regen":{"name":"生生不息","color":"green","text":"先回血，再於之後每次行動持續回血"},
    "sacrifice":{"name":"玉石俱焚","color":"yellow","text":"300% 傷害，自身失去目前 80% 生命"},
    "restore":{"name":"返本歸元","color":"green","text":"恢復最大生命 80%，溢出轉護盾"},
    "diamond":{"name":"金剛不壞","color":"blue","text":"防禦增加 200%，持續 2 回合"},
    "aegis":{"name":"混元護體","color":"blue","text":"增加 100% 攻擊力護盾直到戰鬥結束"},
    "boost":{"name":"神功附體","color":"neutral","text":"強化下一張卡，並立即獲得護盾"}
  },
  "roleSkills": {},
  "qualities": {"common":{"name":"普通","rank":0},"rare":{"name":"稀有","rank":1},"epic":{"name":"史詩","rank":2},"legendary":{"name":"傳說","rank":3},"mythic":{"name":"神話","rank":4}},
  "equipmentValues": {},
  "towerRules": {
    "5":{"id":"frenzy","name":"狂熱試煉","desc":"雙方爆擊率 +10%","critBonus":0.1},
    "10":{"id":"scarcity","name":"枯竭試煉","desc":"雙方治療效果 -50%","healPenalty":0.5},
    "15":{"id":"opening","name":"先鋒試煉","desc":"每輪第一張牌效果 ×1.5","firstCardAmp":0.5},
    "20":{"id":"overlord","name":"王之領域","desc":"影語王攻擊 +20%、爆擊 +15%、開場護盾 20%","enemyAtkAmp":0.2,"enemyCritBonus":0.15,"enemyShieldPct":0.2}
  },
  "collectionRewards": [
    {"count":10,"id":"frame","name":"收藏家角色框","desc":"戰鬥角色框解鎖"},
    {"count":20,"id":"background","name":"秘藏戰鬥背景","desc":"戰鬥場景特效解鎖"},
    {"count":30,"id":"title","name":"萬象收藏家","desc":"限定稱號與待機星芒解鎖"}
  ],
  "seasonTiers": [
    {"min":600,"id":"legend","name":"傳說","reward":"傳說稱號＋金色星芒"},
    {"min":300,"id":"gold","name":"黃金","reward":"黃金戰鬥背景"},
    {"min":120,"id":"silver","name":"白銀","reward":"白銀角色框"},
    {"min":0,"id":"bronze","name":"青銅","reward":"參賽徽記"}
  ]
}
const ROLES: Dictionary = DATA["roles"]
const PETS: Dictionary = DATA["pets"]
const STAGES: Array = DATA["stages"]
const TITLES: Array = DATA["titles"]
const CARD_POOL: Array = DATA["cardPool"]
const CARDS: Dictionary = DATA["cards"]
const ROLE_SKILLS: Dictionary = DATA["roleSkills"]
const QUALITIES: Dictionary = DATA["qualities"]
const EQUIPMENT_VALUES: Dictionary = DATA["equipmentValues"]
const TOWER_RULES: Dictionary = DATA["towerRules"]
const COLLECTION_REWARDS: Array = DATA["collectionRewards"]
const SEASON_TIERS: Array = DATA["seasonTiers"]
