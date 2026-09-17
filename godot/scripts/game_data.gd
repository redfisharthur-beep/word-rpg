extends RefCounted
class_name WordRpgGameData

const Shared = preload("res://godot/generated/game_data.gd")

static var ROLES: Dictionary = _build_roles()
static var PETS: Dictionary = _build_pets()
static var STAGES: Array[Dictionary] = _build_stages()
static var CARD_POOL: Array = Shared.CARD_POOL.duplicate(true)
static var CARDS: Dictionary = _build_cards()
static var EXCLUSIVE: Dictionary = _build_exclusive()

static func _build_roles() -> Dictionary:
	var out: Dictionary = {}
	var arts := {"warrior":"res://images/warrior.png", "mage":"res://images/mage.png", "archer":"res://images/archer.png"}
	for id: String in ["warrior", "mage", "archer"]:
		var raw: Dictionary = Shared.ROLES[id]
		var base: Dictionary = raw.get("base", {})
		out[id] = {
			"name": String(raw.get("name", id)), "art": String(arts[id]),
			"hp": float(base.get("hp", 500)), "atk": float(base.get("atk", 100)), "def": float(base.get("def", 50)),
			"trait": String(raw.get("trait", "")), "ultimate": raw.get("ultimate", {}).duplicate(true)
		}
	return out

static func _build_pets() -> Dictionary:
	var out: Dictionary = {}
	var arts := {"fox":"res://images/fox.png", "owl":"res://images/owl.png", "dragon":"res://images/dragon.png"}
	for id: String in ["fox", "owl", "dragon"]:
		var raw: Dictionary = Shared.PETS[id]
		var base: Dictionary = raw.get("base", {})
		var awakening: Dictionary = raw.get("awakening", {}).duplicate(true)
		if not awakening.is_empty(): awakening["art"] = String(awakening.get("art", "")).replace("/images/", "res://images/")
		out[id] = {
			"name": String(raw.get("name", id)), "art": String(arts[id]),
			"hp": float(base.get("hp", 20)), "atk": float(base.get("atk", 5)), "def": float(base.get("def", 3)),
			"trait": String(raw.get("trait", "")), "awakening": awakening
		}
	return out

static func _build_stages() -> Array[Dictionary]:
	var out: Array[Dictionary] = []
	for raw_value: Variant in Shared.STAGES:
		var raw: Dictionary = (raw_value as Dictionary).duplicate(true)
		var asset := String(raw.get("asset", raw.get("id", "")))
		raw["art"] = "res://images/%s.png" % asset
		out.append(raw)
	return out

static func _build_cards() -> Dictionary:
	var out: Dictionary = {}
	for id: Variant in Shared.CARDS.keys():
		var card: Dictionary = (Shared.CARDS[id] as Dictionary).duplicate(true)
		card["art"] = "res://images/card-%s.png" % String(id)
		out[id] = card
	return out

static func _build_exclusive() -> Dictionary:
	var out: Dictionary = {}
	for role_id: String in ["warrior", "mage", "archer"]:
		var list: Array[Dictionary] = []
		for raw_value: Variant in Shared.ROLE_SKILLS.get(role_id, []):
			var raw: Dictionary = (raw_value as Dictionary).duplicate(true)
			var fx: Dictionary = raw.get("fx", {})
			if fx.has("damage"): raw["damage"] = fx["damage"]
			if fx.has("hits"): raw["hits"] = fx["hits"]
			if fx.has("healMax"): raw["heal"] = fx["healMax"]
			if fx.has("shieldMax"): raw["shield"] = fx["shieldMax"]
			if fx.has("defBuff"): raw["def_buff"] = fx["defBuff"]
			list.append(raw)
		out[role_id] = list
	return out

static func xp_need(level: int) -> int:
	return 60 + maxi(0, level - 1) * 12

static func title_name(level: int) -> String:
	var lv := clampi(level, 1, 50)
	for raw_value: Variant in Shared.TITLES:
		var raw: Dictionary = raw_value
		if lv >= int(raw.get("level", 1)): return String(raw.get("name", "初行者"))
	return "初行者"

static func _title(level: int) -> Dictionary:
	var lv := clampi(level, 1, 50)
	for raw_value: Variant in Shared.TITLES:
		var raw: Dictionary = raw_value
		if lv >= int(raw.get("level", 1)): return raw
	return {"hp":0.0,"atk":0.0,"def":0.0,"crit":0.0}

static func progression_stats(role_id: String, pet_id: String, level: int) -> Dictionary:
	var safe_level := clampi(level, 1, 50)
	var role: Dictionary = ROLES.get(role_id, ROLES["warrior"])
	var pet: Dictionary = PETS.get(pet_id, PETS["fox"])
	var tier := _title(safe_level)
	var role_hp := float(role["hp"]) * (1.0 + float(safe_level - 1) * 0.035) * (1.0 + float(tier.get("hp", 0.0)))
	var role_atk := float(role["atk"]) * (1.0 + float(safe_level - 1) * 0.025) * (1.0 + float(tier.get("atk", 0.0)))
	var role_def := float(role["def"]) * (1.0 + float(safe_level - 1) * 0.025) * (1.0 + float(tier.get("def", 0.0)))
	var pet_hp := float(pet["hp"]) * (1.0 + float(safe_level - 1) * 0.03)
	var pet_atk := float(pet["atk"]) * (1.0 + float(safe_level - 1) * 0.03)
	var pet_def := float(pet["def"]) * (1.0 + float(safe_level - 1) * 0.03)
	return {
		"max_hp": roundi(role_hp + pet_hp), "hp": roundi(role_hp + pet_hp),
		"atk": roundi(role_atk + pet_atk), "def": roundi(role_def + pet_def),
		"crit": minf(0.85, 0.10 + float(tier.get("crit", 0.0))), "shield": 0,
		"poison": [], "armor_break": [], "atk_down": [], "def_boost": [], "heal_block": [],
		"crit_lock": 0, "stun": 0, "regen": 0, "regen_fresh": false,
		"role": role_id, "pet": pet_id
	}

static func stage_stats(stage_index: int, level: int) -> Dictionary:
	var idx := clampi(stage_index, 0, STAGES.size() - 1)
	var base: Dictionary = STAGES[idx].duplicate(true)
	var safe_level := clampi(level, 1, 50)
	var high := maxi(0, safe_level - 20)
	var hp_scale := 1.0 + float(safe_level - 1) * 0.06 + float(high) * 0.008
	var atk_scale := 1.0 + float(safe_level - 1) * 0.04 + float(high) * 0.006
	var def_scale := 1.0 + float(safe_level - 1) * 0.035 + float(high) * 0.005
	base["max_hp"] = roundi(float(base.get("hp", 500)) * hp_scale)
	base["hp"] = int(base["max_hp"])
	base["atk"] = roundi(float(base.get("atk", 100)) * atk_scale)
	base["def"] = roundi(float(base.get("def", 50)) * def_scale)
	base["shield"] = 0
	base["poison"] = []; base["armor_break"] = []; base["atk_down"] = []; base["def_boost"] = []; base["heal_block"] = []
	base["crit_lock"] = 0; base["stun"] = 0; base["regen"] = 0; base["regen_fresh"] = false
	base["role"] = "monster"; base["pet"] = ""
	return base

static func ultimate(role_id: String) -> Dictionary:
	return (ROLES.get(role_id, ROLES["warrior"]).get("ultimate", {}) as Dictionary).duplicate(true)

static func tower_rule(floor: int) -> Dictionary:
	return (Shared.TOWER_RULES.get(str(floor), {}) as Dictionary).duplicate(true)

static func _quality(stage_index: int) -> String:
	var tables := [[70,25,4,1],[60,30,8,2],[50,34,12,4],[35,40,18,7]]
	var qualities := ["common","rare","epic","legendary"]
	var weights: Array = tables[clampi(stage_index,0,3)]
	var roll := randf() * 100.0
	var acc := 0.0
	for i: int in range(weights.size()):
		acc += float(weights[i])
		if roll < acc: return String(qualities[i])
	return "common"

static func roll_loot(stage_index: int, level: int) -> Dictionary:
	var idx := clampi(stage_index, 0, 4)
	var chances := [0.45,0.55,0.68,0.82,1.0]
	if randf() > float(chances[idx]): return {}
	var quality := _quality(mini(3, idx))
	if idx == 4 and randf() < 0.03: quality = "mythic"
	var type_roll := randf()
	var item_type := "gem" if type_roll < 0.55 else ("armor" if type_roll < 0.80 else "ring")
	var subtype := ""
	if item_type == "gem": subtype = ["ruby","thunder"][randi_range(0,1)]
	elif item_type == "armor": subtype = ["guardian","bloodspirit"][randi_range(0,1)]
	else: subtype = ["warbreaker","battlesoul"][randi_range(0,1)]
	var quality_name := String(Shared.QUALITIES.get(quality, {}).get("name", quality))
	var names := {"ruby":"紅曜石","thunder":"雷光石","guardian":"守護甲","bloodspirit":"血靈甲","warbreaker":"破軍戒","battlesoul":"戰魂戒"}
	return {"id":"%d-%d" % [Time.get_unix_time_from_system(), randi()],"type":item_type,"subtype":subtype,"quality":quality,"name":"%s%s" % [quality_name,String(names[subtype])],"level":level,"art":"res://images/loot-%s-%s-%s.png" % [item_type,subtype,quality]}
