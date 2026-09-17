extends Node

signal state_changed
signal cloud_sync_changed(authenticated: bool)

const GameData = preload("res://godot/scripts/game_data.gd")
const SAVE_PATH: String = "user://word_rpg_save.json"

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
	if not rpg.has("collection") or not rpg["collection"] is Array:
		rpg["collection"] = []
	if not rpg.has("weakWords") or not rpg["weakWords"] is Dictionary:
		rpg["weakWords"] = {}
	if not rpg.has("towerBest"):
		rpg["towerBest"] = 0

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
	var file: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		return
	file.store_string(JSON.stringify({"player_name":player_name,"role":role,"pet":pet,"level":level,"xp":xp,"unlocked_stage":unlocked_stage,"inventory":inventory,"rpg":rpg}))

func select_role(value: String) -> void:
	role = _safe_role(value)
	save_local()
	state_changed.emit()

func select_pet(value: String) -> void:
	pet = _safe_pet(value)
	save_local()
	state_changed.emit()

func pet_enhance_level(pet_id: String) -> int:
	_ensure_rpg()
	return clampi(int((rpg["petEnhance"] as Dictionary).get(pet_id, 0)), 0, 4)

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
	save_local()
	state_changed.emit()
	if authenticated:
		sync_cloudflare_progress()

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
	save_local()
	state_changed.emit()
	return {"amount":gained,"old_level":old_level,"new_level":level,"levels":levels}

func unlock_next_stage(cleared_stage: int) -> void:
	unlocked_stage = maxi(unlocked_stage, mini(maxi(0, GameData.STAGES.size() - 1), cleared_stage + 1))
	save_local()
	state_changed.emit()

func add_loot(item: Dictionary) -> void:
	if item.is_empty():
		return
	inventory.append(item.duplicate(true))
	if inventory.size() > 60:
		inventory.pop_front()
	save_local()
	state_changed.emit()

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
