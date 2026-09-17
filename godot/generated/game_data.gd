# Shared runtime data loader. The single source of truth is data/game-data.json.
extends RefCounted
class_name WordRpgSharedData

static var DATA: Dictionary = _load_data()
static var ROLES: Dictionary = DATA.get("roles", {})
static var PETS: Dictionary = DATA.get("pets", {})
static var STAGES: Array = DATA.get("stages", [])
static var TITLES: Array = DATA.get("titles", [])
static var CARD_POOL: Array = DATA.get("cardPool", [])
static var CARDS: Dictionary = DATA.get("cards", {})
static var ROLE_SKILLS: Dictionary = DATA.get("roleSkills", {})
static var QUALITIES: Dictionary = DATA.get("qualities", {})
static var EQUIPMENT_VALUES: Dictionary = DATA.get("equipmentValues", {})
static var TOWER_RULES: Dictionary = DATA.get("towerRules", {})
static var COLLECTION_REWARDS: Array = DATA.get("collectionRewards", [])
static var SEASON_TIERS: Array = DATA.get("seasonTiers", [])

static func _load_data() -> Dictionary:
	var file := FileAccess.open("res://data/game-data.json", FileAccess.READ)
	if file == null:
		push_error("Missing res://data/game-data.json")
		return {}
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if parsed is Dictionary:
		return parsed
	push_error("Invalid data/game-data.json")
	return {}
