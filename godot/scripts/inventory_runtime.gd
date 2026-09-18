extends RefCounted
class_name WordRpgInventoryRuntime

const GameData = preload("res://godot/scripts/game_data.gd")
const Shared = preload("res://godot/generated/game_data.gd")

const QUALITY_ORDER: Array[String] = ["common", "rare", "epic", "legendary"]
const ITEM_NAMES := {
	"ruby":"紅曜石",
	"thunder":"雷光石",
	"guardian":"守護甲",
	"bloodspirit":"血靈甲",
	"warbreaker":"破軍戒",
	"battlesoul":"戰魂戒"
}

static func _find_item(inventory: Array, item_id: String) -> Dictionary:
	for raw: Variant in inventory:
		if raw is Dictionary and String((raw as Dictionary).get("id", "")) == item_id:
			return raw as Dictionary
	return {}

static func synthesis_info(inventory: Array, equipped_ids: Array[String], item_id: String) -> Dictionary:
	var item := _find_item(inventory, item_id)
	if item.is_empty():
		return {"can":false,"count":0,"next_quality":"","next_name":"","consume_ids":[]}
	var quality := String(item.get("quality", "common"))
	var quality_index := QUALITY_ORDER.find(quality)
	if quality_index < 0 or quality_index >= QUALITY_ORDER.size() - 1:
		return {"can":false,"count":0,"next_quality":"","next_name":"","consume_ids":[]}
	var matches: Array[String] = []
	for raw: Variant in inventory:
		if not raw is Dictionary:
			continue
		var candidate: Dictionary = raw as Dictionary
		var candidate_id := String(candidate.get("id", ""))
		if equipped_ids.has(candidate_id):
			continue
		if String(candidate.get("type", "")) != String(item.get("type", "")):
			continue
		if String(candidate.get("subtype", "")) != String(item.get("subtype", "")):
			continue
		if String(candidate.get("quality", "")) != quality:
			continue
		matches.append(candidate_id)
	var next_quality := QUALITY_ORDER[quality_index + 1]
	var quality_def: Dictionary = Shared.QUALITIES.get(next_quality, {})
	return {
		"can":matches.size() >= 3,
		"count":matches.size(),
		"next_quality":next_quality,
		"next_name":String(quality_def.get("name", next_quality)),
		"consume_ids":matches.slice(0, 3)
	}

static func synthesize(inventory: Array, equipped_ids: Array[String], item_id: String) -> Dictionary:
	var info := synthesis_info(inventory, equipped_ids, item_id)
	if not bool(info.get("can", false)):
		return {"ok":false,"remaining":inventory.duplicate(true),"item":{}}
	var source := _find_item(inventory, item_id)
	if source.is_empty():
		return {"ok":false,"remaining":inventory.duplicate(true),"item":{}}
	var consume_ids: Array = info.get("consume_ids", [])
	var remaining: Array[Dictionary] = []
	for raw: Variant in inventory:
		if not raw is Dictionary:
			continue
		var candidate: Dictionary = raw as Dictionary
		if consume_ids.has(String(candidate.get("id", ""))):
			continue
		remaining.append(candidate.duplicate(true))
	var item_type := String(source.get("type", ""))
	var subtype := String(source.get("subtype", ""))
	var quality := String(info.get("next_quality", ""))
	var quality_def: Dictionary = Shared.QUALITIES.get(quality, {})
	var item_name := String(ITEM_NAMES.get(subtype, subtype))
	var made := {
		"id":"craft-%d-%d" % [int(Time.get_unix_time_from_system()), randi()],
		"type":item_type,
		"subtype":subtype,
		"quality":quality,
		"name":"%s%s" % [String(quality_def.get("name", quality)), item_name],
		"level":int(source.get("level", 1)),
		"bonuses":GameData.item_bonuses(item_type, subtype, quality),
		"art":"res://images/loot-%s-%s-%s.png" % [item_type, subtype, quality],
		"crafted":true,
		"foundAt":int(Time.get_unix_time_from_system() * 1000.0)
	}
	return {"ok":true,"remaining":remaining,"item":made,"consume_ids":consume_ids,"next_quality":quality}
