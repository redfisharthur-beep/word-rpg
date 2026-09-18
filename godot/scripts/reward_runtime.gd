extends RefCounted
class_name WordRpgRewardRuntime

const GameData = preload("res://godot/scripts/game_data.gd")
const Shared = preload("res://godot/generated/game_data.gd")
const RpgRuntime = preload("res://godot/scripts/rpg_runtime.gd")

const ITEM_NAMES := {
	"ruby":"紅曜石",
	"thunder":"雷光石",
	"guardian":"守護甲",
	"bloodspirit":"血靈甲",
	"warbreaker":"破軍戒",
	"battlesoul":"戰魂戒"
}

static func adventure_xp(stage_index: int) -> int:
	return 80 + maxi(0, stage_index) * 25

static func tower_xp(floor: int) -> int:
	return 100 + clampi(floor, 1, 20) * 15

static func tower_crystals(floor: int) -> int:
	match clampi(floor, 1, 20):
		20: return 20
		15: return 12
		10: return 8
		5: return 5
		_: return 1

static func mythic_drop_chance(boss: bool = false, tower_floor: int = 0) -> float:
	if boss:
		return 0.03
	var floor := clampi(tower_floor, 0, 20)
	if floor >= 20: return 0.30
	if floor >= 15: return 0.18
	if floor >= 10: return 0.12
	if floor >= 8: return 0.04
	return 0.0

static func tower_regular_loot_stage(floor: int) -> int:
	var safe_floor := clampi(floor, 1, 20)
	if safe_floor % 5 == 0:
		return 3
	return mini(3, floori(float(safe_floor - 1) / 3.0))

static func _quality(stage_index: int) -> String:
	var tables := [[70,25,4,1],[60,30,8,2],[50,34,12,4],[35,40,18,7]]
	var qualities := ["common","rare","epic","legendary"]
	var weights: Array = tables[clampi(stage_index, 0, 3)]
	var roll := randf() * 100.0
	var acc := 0.0
	for i: int in range(weights.size()):
		acc += float(weights[i])
		if roll < acc:
			return String(qualities[i])
	return "common"

static func _random_pair() -> Array[String]:
	var type_roll := randf()
	var item_type := "gem" if type_roll < 0.55 else ("armor" if type_roll < 0.80 else "ring")
	var subtype := ""
	if item_type == "gem": subtype = ["ruby","thunder"][randi_range(0,1)]
	elif item_type == "armor": subtype = ["guardian","bloodspirit"][randi_range(0,1)]
	else: subtype = ["warbreaker","battlesoul"][randi_range(0,1)]
	return [item_type, subtype]

static func _make_item(item_type: String, subtype: String, quality: String, level: int) -> Dictionary:
	var quality_name := String((Shared.QUALITIES.get(quality, {}) as Dictionary).get("name", quality))
	var item := {
		"id":"loot-%d-%d" % [int(Time.get_unix_time_from_system()), randi()],
		"type":item_type,
		"subtype":subtype,
		"quality":quality,
		"name":"%s%s" % [quality_name, String(ITEM_NAMES.get(subtype, subtype))],
		"level":clampi(level, 1, 50),
		"bonuses":GameData.item_bonuses(item_type, subtype, quality),
		"art":"res://images/loot-%s-%s-%s.png" % [item_type, subtype, quality],
		"foundAt":int(Time.get_unix_time_from_system() * 1000.0)
	}
	if quality == "mythic":
		item["mythicPower"] = RpgRuntime.random_mythic_power(item_type)
	return item

static func roll_regular_loot(stage_index: int, level: int) -> Dictionary:
	var idx := clampi(stage_index, 0, 3)
	var chances := [0.45, 0.55, 0.68, 1.0]
	if randf() > float(chances[idx]):
		return {}
	var pair := _random_pair()
	return _make_item(pair[0], pair[1], _quality(idx), level)

static func roll_mythic_loot(boss: bool, tower_floor: int, level: int) -> Dictionary:
	var chance := mythic_drop_chance(boss, tower_floor)
	if chance <= 0.0 or randf() >= chance:
		return {}
	var pair := _random_pair()
	var item := _make_item(pair[0], pair[1], "mythic", level)
	item["source"] = "boss" if boss else "tower"
	item["towerFloor"] = clampi(tower_floor, 0, 20)
	return item

static func roll_battle_loot(mode: String, stage_index: int, tower_floor: int, level: int, stage_count: int) -> Dictionary:
	if mode == "tower":
		var mythic := roll_mythic_loot(false, tower_floor, level)
		if not mythic.is_empty():
			return mythic
		return roll_regular_loot(tower_regular_loot_stage(tower_floor), level)
	var boss := stage_index >= maxi(0, stage_count - 1)
	var boss_mythic := roll_mythic_loot(boss, 0, level)
	if not boss_mythic.is_empty():
		return boss_mythic
	return roll_regular_loot(mini(3, maxi(0, stage_index)), level)
