extends "res://godot/scripts/game_state.gd"

signal cloud_conflict(server_progress: Dictionary)

const CLOUD_META_PATH: String = "user://word_rpg_cloud_meta.json"

var cloud_revision: int = 0
var cloud_conflicted: bool = false

func _ready() -> void:
	super._ready()
	_load_cloud_meta()

func save_local() -> void:
	super.save_local()
	_save_cloud_meta()

func _load_cloud_meta() -> void:
	cloud_revision = 0
	cloud_conflicted = false
	if not FileAccess.file_exists(CLOUD_META_PATH):
		return
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(CLOUD_META_PATH))
	if not parsed is Dictionary:
		return
	var data: Dictionary = parsed
	cloud_revision = maxi(0, int(data.get("revision", 0)))
	cloud_conflicted = bool(data.get("conflicted", false))

func _save_cloud_meta() -> void:
	var file := FileAccess.open(CLOUD_META_PATH, FileAccess.WRITE)
	if file == null:
		return
	file.store_string(JSON.stringify({"revision":cloud_revision,"conflicted":cloud_conflicted}))

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
		cloud_revision = maxi(0, int(progress.get("revision", 0)))
		cloud_conflicted = false
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
	if not authenticated or cloud_conflicted:
		return false
	_ensure_rpg()
	var next_rpg: Dictionary = rpg.duplicate(true)
	next_rpg["inventory"] = inventory.duplicate(true)
	var payload := {
		"role":role,
		"pet":pet,
		"level":level,
		"xp":xp,
		"rpg":next_rpg,
		"baseRevision":cloud_revision
	}
	var result: Dictionary = await CloudflareClient.save_progress(payload)
	var status := int(result.get("status", 0))
	var data: Dictionary = result.get("data", {})
	if status == 409:
		cloud_conflicted = true
		_save_cloud_meta()
		var server_value: Variant = data.get("progress", {})
		var server_progress: Dictionary = server_value.duplicate(true) if server_value is Dictionary else {}
		cloud_conflict.emit(server_progress)
		return false
	if not bool(result.get("ok", false)):
		return false
	var saved_value: Variant = data.get("progress", {})
	if saved_value is Dictionary:
		cloud_revision = maxi(cloud_revision, int((saved_value as Dictionary).get("revision", cloud_revision)))
	cloud_conflicted = false
	_save_cloud_meta()
	return true
