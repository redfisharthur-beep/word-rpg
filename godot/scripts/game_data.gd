extends RefCounted
class_name WordRpgGameData

const ROLES: Dictionary = {
	"warrior": {"name": "戰士", "art": "res://images/warrior.png", "hp": 540.0, "atk": 96.0, "def": 62.0, "trait": "藍牌 +30%・出牌補護盾"},
	"mage": {"name": "法師", "art": "res://images/mage.png", "hp": 470.0, "atk": 112.0, "def": 45.0, "trait": "黃牌 +25%・爆發型"},
	"archer": {"name": "弓手", "art": "res://images/archer.png", "hp": 500.0, "atk": 106.0, "def": 50.0, "trait": "紅牌 +20%・連擊型"}
}

const PETS: Dictionary = {
	"fox": {"name": "靈狐", "art": "res://images/fox.png", "hp": 20.0, "atk": 8.0, "def": 2.0, "trait": "紅牌追擊"},
	"owl": {"name": "夜梟", "art": "res://images/owl.png", "hp": 35.0, "atk": 2.0, "def": 6.0, "trait": "答題穩定・續航"},
	"dragon": {"name": "幼龍", "art": "res://images/dragon.png", "hp": 25.0, "atk": 6.0, "def": 4.0, "trait": "黃牌爆發"}
}

const STAGES: Array[Dictionary] = [
	{"id": "moss", "name": "苔球獸", "art": "res://images/moss.png", "hp": 560.0, "atk": 105.0, "def": 48.0, "crit": 0.10, "skill": "孢子甲殼"},
	{"id": "rabbit", "name": "霧角兔", "art": "res://images/rabbit.png", "hp": 660.0, "atk": 120.0, "def": 55.0, "crit": 0.16, "skill": "霧影突襲"},
	{"id": "beetle", "name": "木甲蟲", "art": "res://images/beetle.png", "hp": 800.0, "atk": 132.0, "def": 78.0, "crit": 0.12, "skill": "硬殼反震"},
	{"id": "shadow", "name": "影語王", "art": "res://images/shadow-king.png", "hp": 1000.0, "atk": 155.0, "def": 85.0, "crit": 0.22, "skill": "暗影汲取"}
]

const CARD_POOL: Array[String] = [
	"stat", "stat", "stat", "combo", "desperate", "poison", "break", "sun", "preempt", "regen", "sacrifice", "restore", "diamond", "aegis", "boost"
]

const CARDS: Dictionary = {
	"combo": {"name": "瞬步連擊", "color": "red", "text": "3 次連擊・每擊 50%", "art": "res://images/card-combo.png"},
	"desperate": {"name": "破釜沉舟", "color": "blue", "text": "200% 傷害・自身降防", "art": "res://images/card-desperate.png"},
	"poison": {"name": "淬毒之刃", "color": "yellow", "text": "70% 傷害・中毒 3 回合", "art": "res://images/card-poison.png"},
	"break": {"name": "破甲一擊", "color": "red", "text": "70% 傷害・降防 30%", "art": "res://images/card-break.png"},
	"sun": {"name": "熾陽閃", "color": "yellow", "text": "80% 傷害・封鎖爆擊", "art": "res://images/card-sun.png"},
	"preempt": {"name": "制敵機先", "color": "red", "text": "90% 傷害・降攻 30%", "art": "res://images/card-preempt.png"},
	"regen": {"name": "生生不息", "color": "green", "text": "立即回血・持續回血", "art": "res://images/card-regen.png"},
	"sacrifice": {"name": "玉石俱焚", "color": "yellow", "text": "300% 傷害・犧牲生命", "art": "res://images/card-sacrifice.png"},
	"restore": {"name": "返本歸元", "color": "green", "text": "恢復最大生命 80%", "art": "res://images/card-restore.png"},
	"diamond": {"name": "金剛不壞", "color": "blue", "text": "防禦 +200%・2 回合", "art": "res://images/card-diamond.png"},
	"aegis": {"name": "混元護體", "color": "blue", "text": "攻擊力 100% 護盾", "art": "res://images/card-aegis.png"},
	"boost": {"name": "神功附體", "color": "neutral", "text": "強化下一張牌・獲得護盾", "art": "res://images/card-boost.png"}
}

const EXCLUSIVE: Dictionary = {
	"warrior": [
		{"level": 10, "id": "warrior-10", "name": "震嶽斬", "color": "red", "text": "180% 重擊", "damage": 1.80},
		{"level": 20, "id": "warrior-20", "name": "不屈戰魂", "color": "green", "text": "回血 35% + 護盾 15%", "heal": 0.35, "shield": 0.15},
		{"level": 30, "id": "warrior-30", "name": "王者壁壘", "color": "blue", "text": "護盾 55% + 防禦 30%", "shield": 0.55, "def_buff": 0.30},
		{"level": 40, "id": "warrior-40", "name": "守護反擊", "color": "blue", "text": "155% 傷害 + 護盾 30%", "damage": 1.55, "shield": 0.30},
		{"level": 50, "id": "warrior-50", "name": "天崩地裂", "color": "red", "text": "320% 終極傷害", "damage": 3.20}
	],
	"mage": [
		{"level": 10, "id": "mage-10", "name": "炎爆術", "color": "yellow", "text": "185% 火焰傷害", "damage": 1.85},
		{"level": 20, "id": "mage-20", "name": "奧術回復", "color": "green", "text": "回血 45%", "heal": 0.45},
		{"level": 30, "id": "mage-30", "name": "魔法障壁", "color": "blue", "text": "護盾 65%", "shield": 0.65},
		{"level": 40, "id": "mage-40", "name": "星隕術", "color": "yellow", "text": "240% 星隕傷害", "damage": 2.40},
		{"level": 50, "id": "mage-50", "name": "終焉魔導", "color": "yellow", "text": "340% 終極傷害", "damage": 3.40}
	],
	"archer": [
		{"level": 10, "id": "archer-10", "name": "雙星連射", "color": "red", "text": "2 連擊・每擊 95%", "hits": [0.95, 0.95]},
		{"level": 20, "id": "archer-20", "name": "回風步", "color": "green", "text": "105% 傷害 + 回血 25%", "damage": 1.05, "heal": 0.25},
		{"level": 30, "id": "archer-30", "name": "暴雨箭陣", "color": "red", "text": "3 連擊・每擊 78%", "hits": [0.78, 0.78, 0.78]},
		{"level": 40, "id": "archer-40", "name": "風神護佑", "color": "green", "text": "回血 35% + 護盾 20%", "heal": 0.35, "shield": 0.20},
		{"level": 50, "id": "archer-50", "name": "天穹一箭", "color": "red", "text": "350% 終極傷害", "damage": 3.50}
	]
}

static func xp_need(level: int) -> int:
	return 60 + maxi(0, level - 1) * 12

static func title_name(level: int) -> String:
	if level >= 30:
		return "傳說勇者"
	if level >= 20:
		return "菁英勇者"
	if level >= 10:
		return "覺醒勇者"
	if level >= 5:
		return "冒險者"
	return "初行者"

static func progression_stats(role_id: String, pet_id: String, level: int) -> Dictionary:
	var safe_level: int = clampi(level, 1, 50)
	var role: Dictionary = ROLES.get(role_id, ROLES["warrior"])
	var pet: Dictionary = PETS.get(pet_id, PETS["fox"])
	var title_hp: float = 0.0
	var title_atk: float = 0.0
	var title_def: float = 0.0
	var title_crit: float = 0.0
	if safe_level >= 30:
		title_hp = 0.12; title_atk = 0.12; title_def = 0.12; title_crit = 0.05
	elif safe_level >= 20:
		title_hp = 0.08; title_atk = 0.08; title_def = 0.08; title_crit = 0.03
	elif safe_level >= 10:
		title_hp = 0.05; title_atk = 0.06; title_def = 0.05; title_crit = 0.02
	elif safe_level >= 5:
		title_hp = 0.03; title_atk = 0.03; title_def = 0.03; title_crit = 0.01
	var role_hp: float = float(role["hp"]) * (1.0 + float(safe_level - 1) * 0.035) * (1.0 + title_hp)
	var role_atk: float = float(role["atk"]) * (1.0 + float(safe_level - 1) * 0.025) * (1.0 + title_atk)
	var role_def: float = float(role["def"]) * (1.0 + float(safe_level - 1) * 0.025) * (1.0 + title_def)
	var pet_hp: float = float(pet["hp"]) * (1.0 + float(safe_level - 1) * 0.03)
	var pet_atk: float = float(pet["atk"]) * (1.0 + float(safe_level - 1) * 0.03)
	var pet_def: float = float(pet["def"]) * (1.0 + float(safe_level - 1) * 0.03)
	return {
		"max_hp": roundi(role_hp + pet_hp),
		"hp": roundi(role_hp + pet_hp),
		"atk": roundi(role_atk + pet_atk),
		"def": roundi(role_def + pet_def),
		"crit": minf(0.85, 0.10 + title_crit),
		"shield": 0,
		"armor_break": 0.0,
		"armor_break_turns": 0,
		"atk_down": 0.0,
		"atk_down_turns": 0,
		"def_boost": 0.0,
		"def_boost_turns": 0,
		"crit_lock": 0,
		"poison_damage": 0,
		"poison_turns": 0,
		"regen_turns": 0,
		"role": role_id,
		"pet": pet_id
	}

static func stage_stats(stage_index: int, level: int) -> Dictionary:
	var idx: int = clampi(stage_index, 0, STAGES.size() - 1)
	var base: Dictionary = STAGES[idx].duplicate(true)
	var safe_level: int = clampi(level, 1, 50)
	var high: int = maxi(0, safe_level - 20)
	var hp_scale: float = 1.0 + float(safe_level - 1) * 0.06 + float(high) * 0.008
	var atk_scale: float = 1.0 + float(safe_level - 1) * 0.04 + float(high) * 0.006
	var def_scale: float = 1.0 + float(safe_level - 1) * 0.035 + float(high) * 0.005
	base["max_hp"] = roundi(float(base["hp"]) * hp_scale)
	base["hp"] = int(base["max_hp"])
	base["atk"] = roundi(float(base["atk"]) * atk_scale)
	base["def"] = roundi(float(base["def"]) * def_scale)
	base["shield"] = 0
	base["armor_break"] = 0.0
	base["armor_break_turns"] = 0
	base["atk_down"] = 0.0
	base["atk_down_turns"] = 0
	base["def_boost"] = 0.0
	base["def_boost_turns"] = 0
	base["crit_lock"] = 0
	base["poison_damage"] = 0
	base["poison_turns"] = 0
	base["regen_turns"] = 0
	base["role"] = "monster"
	base["pet"] = ""
	return base

static func accuracy_multiplier(correct: int, pet_id: String) -> float:
	var n: int = clampi(correct, 0, 5)
	if pet_id == "owl":
		if n == 5: return 1.70
		if n == 4: return 1.50
		if n == 3: return 1.32
		if n == 2: return 1.15
		if n == 1: return 0.90
		return 0.65
	if n == 5: return 1.50
	if n == 4: return 1.32
	if n == 3: return 1.15
	if n == 2: return 0.90
	if n == 1: return 0.65
	return 0.0

static func deal_hand(count: int, role_id: String, level: int) -> Array[Dictionary]:
	var hand: Array[Dictionary] = []
	var exclusives: Array = EXCLUSIVE.get(role_id, [])
	var unlocked: Array[Dictionary] = []
	for value: Variant in exclusives:
		var skill: Dictionary = value
		if level >= int(skill.get("level", 99)):
			unlocked.append(skill.duplicate(true))
	var exclusive_count: int = 0
	if level >= 50: exclusive_count = 3
	elif level >= 30: exclusive_count = 2
	elif level >= 10: exclusive_count = 1
	exclusive_count = mini(exclusive_count, unlocked.size())
	for i: int in range(maxi(0, count - exclusive_count)):
		hand.append(random_card())
	unlocked.shuffle()
	for i: int in range(exclusive_count):
		var card: Dictionary = unlocked[i].duplicate(true)
		card["exclusive"] = true
		card["art"] = "res://images/skill-%s-%d.png" % [role_id, int(card["level"])]
		hand.append(card)
	hand.shuffle()
	return hand

static func random_card() -> Dictionary:
	var id: String = CARD_POOL[randi_range(0, CARD_POOL.size() - 1)]
	if id == "stat":
		var stats: Array[Dictionary] = [
			{"stat": "hp", "name": "氣血充盈", "color": "green", "art": "res://images/card-stat-hp.png"},
			{"stat": "def", "name": "罡氣護體", "color": "blue", "art": "res://images/card-stat-def.png"},
			{"stat": "atk", "name": "戰意沸騰", "color": "red", "art": "res://images/card-stat-atk.png"},
			{"stat": "crit", "name": "破綻洞悉", "color": "yellow", "art": "res://images/card-stat-crit.png"}
		]
		var result: Dictionary = stats[randi_range(0, stats.size() - 1)].duplicate(true)
		result["id"] = "stat-%s" % String(result["stat"])
		result["kind"] = "stat"
		result["pct"] = randi_range(1, 3) * 10 if result["stat"] == "crit" else randi_range(2, 6) * 10
		result["text"] = "爆擊率 +%d%%" % int(result["pct"]) if result["stat"] == "crit" else "能力 +%d%%" % int(result["pct"])
		return result
	var card: Dictionary = CARDS[id].duplicate(true)
	card["id"] = id
	if id == "boost":
		card["boost"] = randi_range(3, 8) * 10
		card["text"] = "下一張 +%d%%・立即護盾" % int(card["boost"])
	return card

static func bond_multiplier(cards: Array[Dictionary], card: Dictionary) -> float:
	var color: String = String(card.get("color", "neutral"))
	if color == "neutral": return 1.0
	var count: int = 0
	for other: Dictionary in cards:
		if String(other.get("color", "")) == color:
			count += 1
	return 1.5 if count >= 2 else 1.0

static func apply_card(actor: Dictionary, target: Dictionary, card: Dictionary, correct: int, selected: Array[Dictionary], slot_index: int, boost: float = 1.0) -> Dictionary:
	var logs: Array[String] = []
	var before_target_pool: int = int(target.get("hp", 0)) + int(target.get("shield", 0))
	var before_actor_hp: int = int(actor.get("hp", 0))
	var power: float = accuracy_multiplier(correct, String(actor.get("pet", ""))) * bond_multiplier(selected, card) * boost
	if power <= 0.0:
		logs.append("答題失敗・技能凍結")
		return {"logs": logs, "damage": 0, "heal": 0, "next_boost": 1.0}
	var id: String = String(card.get("id", ""))
	if id == "boost":
		var bonus: int = int(card.get("boost", 30)) + (20 if String(actor.get("role", "")) == "mage" else 0)
		var shield_gain: int = maxi(1, roundi(_effective_atk(actor) * 0.30 * power))
		actor["shield"] = int(actor.get("shield", 0)) + shield_gain
		logs.append("神功附體 +%d%%" % bonus)
		logs.append("護盾 +%d" % shield_gain)
		return {"logs": logs, "damage": 0, "heal": 0, "next_boost": 1.0 + float(bonus) / 100.0}
	var role_amp: float = 1.0
	var role_id: String = String(actor.get("role", ""))
	var color: String = String(card.get("color", ""))
	if role_id == "warrior" and color == "blue": role_amp *= 1.30
	if role_id == "mage" and color == "yellow": role_amp *= 1.25
	if role_id == "archer" and color == "red": role_amp *= 1.20
	var pet_id: String = String(actor.get("pet", ""))
	if pet_id == "dragon" and color == "yellow": role_amp *= 1.20
	power *= role_amp
	if bool(card.get("exclusive", false)):
		_apply_exclusive(actor, target, card, power, logs)
	elif String(card.get("kind", "")) == "stat":
		_apply_stat(actor, card, power, logs)
	else:
		_apply_standard(actor, target, card, power, logs)
	if role_id == "warrior" and color == "blue" and int(actor.get("hp", 0)) > 0:
		var guard: int = maxi(1, roundi(_effective_def(actor) * 0.14))
		actor["shield"] = int(actor.get("shield", 0)) + guard
		logs.append("戰士護盾 +%d" % guard)
	if pet_id == "fox" and slot_index == selected.size() - 1:
		var red_count: int = 0
		for selected_card: Dictionary in selected:
			if String(selected_card.get("color", "")) == "red": red_count += 1
		if red_count >= 2 and int(target.get("hp", 0)) > 0:
			_hit(actor, target, 0.40 * accuracy_multiplier(correct, pet_id), "靈狐追擊", logs)
	var after_target_pool: int = int(target.get("hp", 0)) + int(target.get("shield", 0))
	return {"logs": logs, "damage": maxi(0, before_target_pool - after_target_pool), "heal": maxi(0, int(actor.get("hp", 0)) - before_actor_hp), "next_boost": 1.0}

static func enemy_attack(enemy: Dictionary, player: Dictionary, stage_id: String) -> Array[String]:
	var logs: Array[String] = []
	if stage_id == "moss":
		var moss_shield: int = roundi(float(enemy["max_hp"]) * 0.12)
		enemy["shield"] = int(enemy.get("shield", 0)) + moss_shield
		logs.append("孢子甲殼・護盾 +%d" % moss_shield)
	if stage_id == "beetle":
		var shell: int = roundi(float(enemy["max_hp"]) * 0.15)
		enemy["shield"] = int(enemy.get("shield", 0)) + shell
		logs.append("硬殼防禦・護盾 +%d" % shell)
	var hits: int = 2 if stage_id == "rabbit" else 1
	for i: int in range(hits):
		if int(player.get("hp", 0)) <= 0: break
		_hit(enemy, player, 0.62 if hits == 2 else 1.0, "敵方攻擊", logs)
	if stage_id == "shadow" and int(enemy.get("hp", 0)) > 0:
		var missing: int = int(enemy["max_hp"]) - int(enemy["hp"])
		var heal: int = mini(missing, roundi(float(enemy["atk"]) * 0.25))
		enemy["hp"] = int(enemy["hp"]) + heal
		if heal > 0: logs.append("暗影汲取 +%d" % heal)
	return logs

static func end_round(actor: Dictionary) -> Array[String]:
	var logs: Array[String] = []
	if int(actor.get("poison_turns", 0)) > 0 and int(actor.get("hp", 0)) > 0:
		var poison: int = int(actor.get("poison_damage", 0))
		actor["hp"] = maxi(0, int(actor["hp"]) - poison)
		actor["poison_turns"] = int(actor["poison_turns"]) - 1
		logs.append("毒素 %d" % poison)
	if int(actor.get("regen_turns", 0)) > 0 and int(actor.get("hp", 0)) > 0:
		var regen: int = roundi(float(actor["max_hp"]) * 0.08)
		actor["hp"] = mini(int(actor["max_hp"]), int(actor["hp"]) + regen)
		actor["regen_turns"] = int(actor["regen_turns"]) - 1
		logs.append("持續回血 +%d" % regen)
	for key: String in ["armor_break", "atk_down", "def_boost"]:
		var turns_key: String = "%s_turns" % key
		if int(actor.get(turns_key, 0)) > 0:
			actor[turns_key] = int(actor[turns_key]) - 1
			if int(actor[turns_key]) <= 0: actor[key] = 0.0
	if int(actor.get("crit_lock", 0)) > 0: actor["crit_lock"] = int(actor["crit_lock"]) - 1
	return logs

static func roll_loot(stage_index: int, level: int) -> Dictionary:
	var idx: int = clampi(stage_index, 0, 3)
	var chances: Array[float] = [0.45, 0.55, 0.68, 1.0]
	if randf() > chances[idx]: return {}
	var quality_tables: Array[Array] = [[70,25,4,1],[60,30,8,2],[50,34,12,4],[35,40,18,7]]
	var weights: Array = quality_tables[idx]
	var roll: float = randf() * 100.0
	var acc: float = 0.0
	var quality_index: int = 0
	for i: int in range(weights.size()):
		acc += float(weights[i])
		if roll < acc:
			quality_index = i
			break
	var qualities: Array[String] = ["common", "rare", "epic", "legendary"]
	var quality_names: Dictionary = {"common":"普通", "rare":"稀有", "epic":"史詩", "legendary":"傳說"}
	var quality: String = qualities[quality_index]
	var type_roll: float = randf()
	var item_type: String = "gem" if type_roll < 0.55 else ("armor" if type_roll < 0.80 else "ring")
	var subtype: String = ""
	if item_type == "gem": subtype = ["ruby", "thunder"][randi_range(0,1)]
	elif item_type == "armor": subtype = ["guardian", "bloodspirit"][randi_range(0,1)]
	else: subtype = ["warbreaker", "battlesoul"][randi_range(0,1)]
	var names: Dictionary = {"ruby":"紅曜石", "thunder":"雷光石", "guardian":"守護甲", "bloodspirit":"血靈甲", "warbreaker":"破軍戒", "battlesoul":"戰魂戒"}
	return {"id": "%d-%d" % [Time.get_unix_time_from_system(), randi()], "type": item_type, "subtype": subtype, "quality": quality, "name": "%s%s" % [String(quality_names[quality]), String(names[subtype])], "level": level, "art": "res://images/loot-%s-%s-%s.png" % [item_type, subtype, quality]}

static func _apply_stat(actor: Dictionary, card: Dictionary, power: float, logs: Array[String]) -> void:
	var pct: float = float(card.get("pct", 0)) / 100.0 * power
	var stat: String = String(card.get("stat", ""))
	if stat == "hp":
		var add: int = roundi(float(actor["max_hp"]) * pct)
		actor["max_hp"] = int(actor["max_hp"]) + add
		actor["hp"] = int(actor["hp"]) + add
		logs.append("生命值 +%d%%" % roundi(pct * 100.0))
	elif stat == "crit":
		actor["crit"] = minf(0.80, float(actor["crit"]) + pct)
		logs.append("爆擊率 +%d%%" % roundi(pct * 100.0))
	elif stat == "atk":
		actor["atk"] = roundi(float(actor["atk"]) * (1.0 + pct))
		logs.append("攻擊力 +%d%%" % roundi(pct * 100.0))
	elif stat == "def":
		actor["def"] = roundi(float(actor["def"]) * (1.0 + pct))
		var shield: int = maxi(1, roundi(float(actor["max_hp"]) * 0.08 * power))
		actor["shield"] = int(actor.get("shield", 0)) + shield
		logs.append("防禦力 +%d%%・護盾 +%d" % [roundi(pct * 100.0), shield])

static func _apply_exclusive(actor: Dictionary, target: Dictionary, card: Dictionary, power: float, logs: Array[String]) -> void:
	var hits_value: Variant = card.get("hits", null)
	if hits_value is Array:
		for mult_value: Variant in hits_value:
			_hit(actor, target, float(mult_value) * power, String(card["name"]), logs)
	elif card.has("damage"):
		_hit(actor, target, float(card["damage"]) * power, String(card["name"]), logs)
	if card.has("heal"):
		_heal(actor, roundi(float(actor["max_hp"]) * float(card["heal"]) * minf(1.75, power)), String(card["name"]), logs)
	if card.has("shield"):
		var shield: int = roundi(float(actor["max_hp"]) * float(card["shield"]) * minf(1.75, power))
		actor["shield"] = int(actor.get("shield", 0)) + shield
		logs.append("%s・護盾 +%d" % [String(card["name"]), shield])
	if card.has("def_buff"):
		actor["def_boost"] = float(actor.get("def_boost", 0.0)) + float(card["def_buff"]) * minf(1.75, power)
		actor["def_boost_turns"] = 2

static func _apply_standard(actor: Dictionary, target: Dictionary, card: Dictionary, power: float, logs: Array[String]) -> void:
	var id: String = String(card.get("id", ""))
	match id:
		"combo":
			for i: int in range(3): _hit(actor, target, 0.50 * power, "瞬步連擊", logs)
		"desperate":
			_hit(actor, target, 2.0 * power, "破釜沉舟", logs); actor["def_boost"] = -0.50; actor["def_boost_turns"] = 2
		"poison":
			_hit(actor, target, 0.70 * power, "淬毒之刃", logs); target["poison_damage"] = roundi(_effective_atk(actor) * 0.30 * power); target["poison_turns"] = 3
		"break":
			_hit(actor, target, 0.70 * power, "破甲一擊", logs); target["armor_break"] = minf(0.65, 0.30 * power); target["armor_break_turns"] = 2
		"sun":
			_hit(actor, target, 0.80 * power, "熾陽閃", logs); target["crit_lock"] = 2
		"preempt":
			_hit(actor, target, 0.90 * power, "制敵機先", logs); target["atk_down"] = minf(0.60, 0.30 * power); target["atk_down_turns"] = 2
		"regen":
			_heal(actor, roundi(float(actor["max_hp"]) * 0.15 * power), "生生不息", logs); actor["regen_turns"] = 3
		"sacrifice":
			_hit(actor, target, 3.0 * power, "玉石俱焚", logs); actor["hp"] = maxi(1, roundi(float(actor["hp"]) * 0.20)); logs.append("自身生命大幅下降")
		"restore":
			_heal_with_shield(actor, roundi(float(actor["max_hp"]) * 0.80 * power), "返本歸元", logs)
		"diamond":
			actor["def_boost"] = 2.0 * power; actor["def_boost_turns"] = 2; logs.append("金剛不壞")
		"aegis":
			var shield: int = roundi(_effective_atk(actor) * power); actor["shield"] = int(actor.get("shield", 0)) + shield; logs.append("護盾 +%d" % shield)

static func _effective_atk(fighter: Dictionary) -> float:
	return maxf(1.0, float(fighter.get("atk", 1)) * (1.0 - float(fighter.get("atk_down", 0.0))))

static func _effective_def(fighter: Dictionary) -> float:
	return maxf(0.0, float(fighter.get("def", 0)) * (1.0 + float(fighter.get("def_boost", 0.0))) * (1.0 - float(fighter.get("armor_break", 0.0))))

static func _hit(actor: Dictionary, target: Dictionary, mult: float, label: String, logs: Array[String]) -> int:
	if int(target.get("hp", 0)) <= 0: return 0
	var raw: float = _effective_atk(actor) * mult
	var critical: bool = int(actor.get("crit_lock", 0)) <= 0 and randf() < float(actor.get("crit", 0.10))
	if critical: raw *= 2.0
	var damage: int = maxi(1, roundi(raw * 100.0 / (100.0 + _effective_def(target))))
	var remaining: int = damage
	var shield: int = int(target.get("shield", 0))
	if shield > 0:
		var blocked: int = mini(shield, remaining)
		target["shield"] = shield - blocked
		remaining -= blocked
	if remaining > 0:
		target["hp"] = maxi(0, int(target.get("hp", 0)) - remaining)
	logs.append("%s%s %d" % [label, "（爆擊）" if critical else "", damage])
	return damage

static func _heal(actor: Dictionary, amount: int, label: String, logs: Array[String]) -> void:
	var before: int = int(actor.get("hp", 0))
	actor["hp"] = mini(int(actor["max_hp"]), before + maxi(0, amount))
	var actual: int = int(actor["hp"]) - before
	if actual > 0: logs.append("%s +%d" % [label, actual])

static func _heal_with_shield(actor: Dictionary, amount: int, label: String, logs: Array[String]) -> void:
	var before: int = int(actor.get("hp", 0))
	var max_hp: int = int(actor.get("max_hp", 1))
	var room: int = maxi(0, max_hp - before)
	var heal: int = mini(room, amount)
	actor["hp"] = before + heal
	var overflow: int = maxi(0, amount - heal)
	actor["shield"] = int(actor.get("shield", 0)) + overflow
	logs.append("%s・回血 +%d・護盾 +%d" % [label, heal, overflow])
