extends Node

signal state_changed
signal cloud_sync_changed(authenticated: bool)

const GameData = preload("res://godot/scripts/game_data.gd")
const SAVE_PATH: String = "user://word_rpg_save.json"
const CRYSTAL_VALUE := {"common":1,"rare":3,"epic":8,"legendary":20,"mythic":60}
const PET_ENHANCE_COST: Array[int] = [5, 10, 20, 40]

var player_name: String = "勇者"
var role: String = "warrior"
var pet: String = "fox"
var level: int = 1
var xp: int = 0
var unlocked_stage: int = 0
var inventory: Array[Dictionary] = []
var rpg: Dictionary = {}
var authenticated: bool = false
var line_profile: Dictionary = {}

func _ready() -> void:
	load_local()

func _ensure_rpg() -> void:
	if not rpg is Dictionary:
		rpg = {}
	if not rpg.has("petEnhance") or not rpg["petEnhance"] is Dictionary:
		rpg["petEnhance"] = {"fox":0,"owl":0,"dragon":0}
	if not rpg.has("petSkills") or not rpg["petSkills"] is Dictionary:
		rpg["petSkills"] = {"fox":[],"owl":[],"dragon":[]}
	var pet_skills: Dictionary = rpg["petSkills"]
	for pet_id: String in ["fox","owl","dragon"]:
		if not pet_skills.has(pet_id) or not pet_skills[pet_id] is Array:
			pet_skills[pet_id] = []
	rpg["petSkills"] = pet_skills
	if not rpg.has("collection") or not rpg["collection"] is Array:
		rpg["collection"] = []
	if not rpg.has("weakWords") or not rpg["weakWords"] is Dictionary:
		rpg["weakWords"] = {}
	if not rpg.has("towerBest"):
		rpg["towerBest"] = 0
	if not rpg.has("crystals"):
		rpg["crystals"] = 0
	if not rpg.has("equipped") or not rpg["equipped"] is Dictionary:
		rpg["equipped"] = {"gems":[],"armor":null,"rings":[]}
	var equipped: Dictionary = rpg["equipped"]
	if not equipped.has("gems") or not equipped["gems"] is Array:
		equipped["gems"] = []
	if not equipped.has("rings") or not equipped["rings"] is Array:
		equipped["rings"] = []
	if not equipped.has("armor"):
		equipped["armor"] = null
	rpg["equipped"] = equipped

func load_local() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		_ensure_rpg()
		return
	var text: String = FileAccess.get_file_as_string(SAVE_PATH)
	var parsed: Variant = JSON.parse_string(text)
	if not parsed is Dictionary:
		_ensure_rpg()
		return
	var data: Dictionary = parsed
	player_name = String(data.get("player_name", player_name)).left(16)
	role = _safe_role(String(data.get("role", role)))
	pet = _safe_pet(String(data.get("pet", pet)))
	level = clampi(int(data.get("level", level)), 1, 50)
	xp = 0 if level >= 50 else maxi(0, int(data.get("xp", xp)))
	unlocked_stage = clampi(int(data.get("unlocked_stage", unlocked_stage)), 0, maxi(0, GameData.STAGES.size() - 1))
	_copy_inventory(data.get("inventory", []))
	var raw_rpg: Variant = data.get("rpg", {})
	rpg = raw_rpg.duplicate(true) if raw_rpg is Dictionary else {}
	_ensure_rpg()

func save_local() -> void:
	_ensure_rpg()
	rpg["inventory"] = inventory.duplicate(true)
	var file: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		return
	file.store_string(JSON.stringify({"player_name":player_name,"role":role,"pet":pet,"level":level,"xp":xp,"unlocked_stage":unlocked_stage,"inventory":inventory,"rpg":rpg}))

func _persist_and_sync() -> void:
	save_local()
	state_changed.emit()
	if authenticated:
		sync_cloudflare_progress()

func select_role(value: String) -> void:
	role = _safe_role(value)
	_persist_and_sync()

func select_pet(value: String) -> void:
	pet = _safe_pet(value)
	_persist_and_sync()

func crystals() -> int:
	_ensure_rpg()
	return maxi(0, int(rpg.get("crystals", 0)))

func grant_crystals(amount: int, persist: bool = true) -> int:
	var gained := maxi(0, amount)
	if gained <= 0:
		return 0
	rpg["crystals"] = crystals() + gained
	if persist:
		_persist_and_sync()
	return gained

func pet_enhance_level(pet_id: String) -> int:
	_ensure_rpg()
	return clampi(int((rpg["petEnhance"] as Dictionary).get(pet_id, 0)), 0, 4)

func pet_enhance_cost(pet_id: String) -> int:
	var current := pet_enhance_level(pet_id)
	if current >= 4:
		return 0
	return PET_ENHANCE_COST[current]

func can_enhance_pet(pet_id: String) -> bool:
	var cost := pet_enhance_cost(pet_id)
	return cost > 0 and crystals() >= cost

func enhance_pet(pet_id: String) -> bool:
	if not can_enhance_pet(pet_id):
		return false
	var cost := pet_enhance_cost(pet_id)
	var enhance: Dictionary = rpg["petEnhance"]
	enhance[pet_id] = pet_enhance_level(pet_id) + 1
	rpg["petEnhance"] = enhance
	rpg["crystals"] = crystals() - cost
	_persist_and_sync()
	return true

func pet_is_awakened(pet_id: String) -> bool:
	return pet_enhance_level(pet_id) >= 4

func pet_display_data(pet_id: String) -> Dictionary:
	var base: Dictionary = (GameData.PETS.get(pet_id, GameData.PETS["fox"]) as Dictionary).duplicate(true)
	if not pet_is_awakened(pet_id):
		return base
	var awakening: Dictionary = base.get("awakening", {})
	if not awakening.is_empty():
		base["name"] = String(awakening.get("name", base.get("name", pet_id)))
		var art := String(awakening.get("art", ""))
		if not art.is_empty() and ResourceLoader.exists(art):
			base["art"] = art
	base["awakened"] = true
	return base

func equipped_ids() -> Array[String]:
	_ensure_rpg()
	var out: Array[String] = []
	var equipped: Dictionary = rpg["equipped"]
	for value: Variant in equipped.get("gems", []):
		out.append(String(value))
	var armor_value: Variant = equipped.get("armor", null)
	if armor_value != null and not String(armor_value).is_empty():
		out.append(String(armor_value))
	for value: Variant in equipped.get("rings", []):
		out.append(String(value))
	return out

func is_equipped(item_id: String) -> bool:
	return equipped_ids().has(item_id)

func _item_by_id(item_id: String) -> Dictionary:
	for item: Dictionary in inventory:
		if String(item.get("id", "")) == item_id:
			return item
	return {}

func equip_item(item_id: String) -> bool:
	var item := _item_by_id(item_id)
	if item.is_empty():
		return false
	_ensure_rpg()
	var equipped: Dictionary = rpg["equipped"]
	var type := String(item.get("type", ""))
	if type == "gem":
		var gems: Array = equipped.get("gems", [])
		gems.erase(item_id)
		gems.append(item_id)
		while gems.size() > 3:
			gems.pop_front()
		equipped["gems"] = gems
	elif type == "armor":
		equipped["armor"] = item_id
	elif type == "ring":
		var rings: Array = equipped.get("rings", [])
		rings.erase(item_id)
		rings.append(item_id)
		while rings.size() > 2:
			rings.pop_front()
		equipped["rings"] = rings
	else:
		return false
	rpg["equipped"] = equipped
	_persist_and_sync()
	return true

func unequip_item(item_id: String) -> bool:
	_ensure_rpg()
	var equipped: Dictionary = rpg["equipped"]
	var changed := false
	var gems: Array = equipped.get("gems", [])
	if gems.has(item_id):
		gems.erase(item_id)
		equipped["gems"] = gems
		changed = true
	var rings: Array = equipped.get("rings", [])
	if rings.has(item_id):
		rings.erase(item_id)
		equipped["rings"] = rings
		changed = true
	if String(equipped.get("armor", "")) == item_id:
		equipped["armor"] = null
		changed = true
	if changed:
		rpg["equipped"] = equipped
		_persist_and_sync()
	return changed

func crystallize_item(item_id: String) -> int:
	if is_equipped(item_id):
		return 0
	var item := _item_by_id(item_id)
	if item.is_empty():
		return 0
	var quality := String(item.get("quality", "common"))
	var gain := int(CRYSTAL_VALUE.get(quality, 1))
	for i in range(inventory.size() - 1, -1, -1):
		if String(inventory[i].get("id", "")) == item_id:
			inventory.remove_at(i)
			break
	rpg["crystals"] = crystals() + gain
	_persist_and_sync()
	return gain

func apply_synthesis(result: Dictionary) -> bool:
	if not bool(result.get("ok", false)):
		return false
	var remaining: Variant = result.get("remaining", [])
	var made: Variant = result.get("item", {})
	if not remaining is Array or not made is Dictionary or (made as Dictionary).is_empty():
		return false
	_copy_inventory(remaining)
	_register_loot(made as Dictionary)
	_persist_and_sync()
	return true

func equipment_bonuses() -> Dictionary:
	var hp_pct := 0.0
	var atk_pct := 0.0
	var def_pct := 0.0
	var crit := 0.0
	for item_id: String in equipped_ids():
		var item := _item_by_id(item_id)
		if item.is_empty():
			continue
		var bonuses: Dictionary = item.get("bonuses", {})
		if bonuses.is_empty():
			bonuses = GameData.item_bonuses(String(item.get("type", "")), String(item.get("subtype", "")), String(item.get("quality", "common")))
		hp_pct += float(bonuses.get("hpPct", 0.0))
		atk_pct += float(bonuses.get("atkPct", 0.0))
		def_pct += float(bonuses.get("defPct", 0.0))
		crit += float(bonuses.get("crit", 0.0))
	return {"hpPct":hp_pct,"atkPct":atk_pct,"defPct":def_pct,"crit":crit}

func collection_count() -> int:
	_ensure_rpg()
	return (rpg["collection"] as Array).size()

func collection_unlocks() -> Dictionary:
	var owned := collection_count()
	return {"frame":owned >= 10,"background":owned >= 20,"title":owned >= 30}

func tower_best() -> int:
	_ensure_rpg()
	return clampi(int(rpg.get("towerBest", 0)), 0, 20)

func record_tower_floor(floor: int) -> void:
	_ensure_rpg()
	var best := maxi(tower_best(), clampi(floor, 0, 20))
	if best == tower_best():
		return
	rpg["towerBest"] = best
	_persist_and_sync()

func weak_words() -> Array[Dictionary]:
	_ensure_rpg()
	var out: Array[Dictionary] = []
	var raw: Dictionary = rpg["weakWords"]
	for key: Variant in raw.keys():
		var value: Variant = raw[key]
		if value is Dictionary:
			var item: Dictionary = (value as Dictionary).duplicate(true)
			item["index"] = int(item.get("index", int(String(key))))
			out.append(item)
	out.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		var am := int(a.get("misses", 0))
		var bm := int(b.get("misses", 0))
		if am == bm:
			return int(a.get("lastWrong", 0)) > int(b.get("lastWrong", 0))
		return am > bm
	)
	return out

func record_word_result(question: Dictionary, correct: bool) -> void:
	_ensure_rpg()
	var index := int(question.get("index", -1))
	if index < 0:
		return
	var key := str(index)
	var store: Dictionary = rpg["weakWords"]
	var old: Dictionary = (store.get(key, {}) as Dictionary).duplicate(true)
	if correct:
		if old.is_empty():
			return
		var streak := int(old.get("streak", 0)) + 1
		if streak >= 3:
			store.erase(key)
		else:
			old["streak"] = streak
			store[key] = old
	else:
		store[key] = {"index":index,"word":String(question.get("word", "")),"answer":String(question.get("answer", "")),"streak":0,"misses":int(old.get("misses", 0)) + 1,"lastWrong":Time.get_unix_time_from_system()}
	rpg["weakWords"] = store
	save_local()

func add_xp(amount: int) -> Dictionary:
	var gained: int = maxi(0, amount)
	var old_level: int = level
	var levels: Array[int] = []
	if level < 50:
		xp += gained
		while level < 50 and xp >= GameData.xp_need(level):
			xp -= GameData.xp_need(level)
			level += 1
			levels.append(level)
	if level >= 50:
		level = 50
		xp = 0
	_persist_and_sync()
	return {"amount":gained,"old_level":old_level,"new_level":level,"levels":levels}

func unlock_next_stage(cleared_stage: int) -> void:
	unlocked_stage = maxi(unlocked_stage, mini(maxi(0, GameData.STAGES.size() - 1), cleared_stage + 1))
	_persist_and_sync()

func _register_loot(item: Dictionary) -> void:
	if item.is_empty():
		return
	_ensure_rpg()
	inventory.append(item.duplicate(true))
	if inventory.size() > 60:
		inventory.pop_front()
	var type := String(item.get("type", ""))
	var subtype := String(item.get("subtype", ""))
	var quality := String(item.get("quality", ""))
	if not type.is_empty() and not subtype.is_empty() and not quality.is_empty():
		var key := "%s:%s:%s" % [type, subtype, quality]
		var collection: Array = rpg["collection"]
		if not collection.has(key):
			collection.append(key)
		rpg["collection"] = collection

func add_loot(item: Dictionary) -> void:
	_register_loot(item)
	_persist_and_sync()

func refresh_cloudflare_session() -> bool:
	var result: Dictionary = await CloudflareClient.get_session()
	if not bool(result.get("ok", false)):
		authenticated = false
		cloud_sync_changed.emit(false)
		return false
	var data: Dictionary = result.get("data", {})
	authenticated = bool(data.get("authenticated", false))
	if authenticated:
		var profile_value: Variant = data.get("profile", {})
		line_profile = profile_value.duplicate(true) if profile_value is Dictionary else {}
		var progress_value: Variant = data.get("progress", {})
		var progress: Dictionary = progress_value if progress_value is Dictionary else {}
		player_name = String(line_profile.get("name", player_name)).left(16)
		role = _safe_role(String(progress.get("role", role)))
		pet = _safe_pet(String(progress.get("pet", pet)))
		level = clampi(int(progress.get("level", level)), 1, 50)
		xp = 0 if level >= 50 else maxi(0, int(progress.get("xp", xp)))
		var server_rpg: Variant = progress.get("rpg", {})
		if server_rpg is Dictionary:
			rpg = server_rpg.duplicate(true)
			_copy_inventory(rpg.get("inventory", []))
		_ensure_rpg()
		save_local()
		state_changed.emit()
	cloud_sync_changed.emit(authenticated)
	return authenticated

func sync_cloudflare_progress() -> bool:
	if not authenticated:
		return false
	_ensure_rpg()
	var next_rpg: Dictionary = rpg.duplicate(true)
	next_rpg["inventory"] = inventory.duplicate(true)
	var result: Dictionary = await CloudflareClient.save_progress({"role":role,"pet":pet,"level":level,"xp":xp,"rpg":next_rpg})
	return bool(result.get("ok", false))

func _copy_inventory(raw_value: Variant) -> void:
	inventory.clear()
	if not raw_value is Array:
		return
	for value: Variant in raw_value:
		if value is Dictionary:
			inventory.append(value.duplicate(true))

func _safe_role(value: String) -> String:
	return value if ["warrior","mage","archer"].has(value) else "warrior"

func _safe_pet(value: String) -> String:
	return value if ["fox","owl","dragon"].has(value) else "fox"