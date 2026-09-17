extends Node
class_name WordRpgCloudflareClient

## Godot <-> Cloudflare API gateway.
## Keep every HTTP concern here so scenes never hard-code API routes.

signal request_failed(endpoint: String, message: String)

var base_url: String = ""

func _ready() -> void:
	base_url = _detect_base_url()

func configure(url: String) -> void:
	base_url = url.strip_edges().trim_suffix("/")

func has_base_url() -> bool:
	return not base_url.is_empty()

func get_session() -> Dictionary:
	return await _request_json("/api/session", HTTPClient.METHOD_GET)

func get_questions(count: int = 10) -> Dictionary:
	var safe_count: int = clampi(count, 1, 20)
	var result: Dictionary = await _request_json("/api/questions?count=%d" % safe_count, HTTPClient.METHOD_GET)
	if not bool(result.get("ok", false)):
		return result
	var data_value: Variant = result.get("data", {})
	if not data_value is Dictionary:
		return result
	var data: Dictionary = data_value
	var indices_value: Variant = data.get("indices", [])
	if not indices_value is Array:
		return result
	var indices: Array = (indices_value as Array).duplicate()
	if indices.is_empty():
		return result

	# Reinsert up to two local weak words into every batch. They remain part of the
	# normal 10-question set, so adventure, tower and future modes share one loop.
	var state: Node = get_node_or_null("/root/GameState")
	if state != null and state.has_method("weak_words"):
		var weak_value: Variant = state.call("weak_words")
		if weak_value is Array:
			var preferred: Array[int] = []
			for raw: Variant in weak_value:
				if not raw is Dictionary:
					continue
				var index: int = int((raw as Dictionary).get("index", -1))
				if index >= 0 and not preferred.has(index):
					preferred.append(index)
				if preferred.size() >= mini(2, safe_count):
					break
			for i: int in range(preferred.size() - 1, -1, -1):
				var index: int = preferred[i]
				indices.erase(index)
				indices.push_front(index)
			while indices.size() > safe_count:
				indices.pop_back()
	data["indices"] = indices
	result["data"] = data
	return result

func save_progress(progress: Dictionary) -> Dictionary:
	return await _request_json("/api/progress", HTTPClient.METHOD_POST, progress)

func test_connection() -> Dictionary:
	# /api/questions can be used as a lightweight connectivity test even before LINE login.
	return await get_questions(1)

func _detect_base_url() -> String:
	# When exported to Web and hosted by the same Cloudflare Worker, use the page origin.
	if OS.has_feature("web"):
		var origin_value: Variant = JavaScriptBridge.eval("window.location.origin", true)
		if origin_value is String:
			return String(origin_value).trim_suffix("/")

	# Native Godot builds need an explicit deployed Cloudflare URL during development.
	if ProjectSettings.has_setting("word_rpg/cloudflare_base_url"):
		return String(ProjectSettings.get_setting("word_rpg/cloudflare_base_url", "")).strip_edges().trim_suffix("/")
	return ""

func _request_json(path: String, method: int, payload: Dictionary = {}) -> Dictionary:
	if base_url.is_empty():
		var no_url_message: String = "Cloudflare base URL 尚未設定"
		request_failed.emit(path, no_url_message)
		return {"ok": false, "status": 0, "error": no_url_message, "data": {}}

	var request_node := HTTPRequest.new()
	add_child(request_node)

	var headers := PackedStringArray(["Accept: application/json"])
	var body: String = ""
	if method != HTTPClient.METHOD_GET:
		headers.append("Content-Type: application/json")
		body = JSON.stringify(payload)

	var request_error: Error = request_node.request(base_url + path, headers, method, body)
	if request_error != OK:
		request_node.queue_free()
		var start_message: String = "HTTP request 啟動失敗：%s" % error_string(request_error)
		request_failed.emit(path, start_message)
		return {"ok": false, "status": 0, "error": start_message, "data": {}}

	var result: Array = await request_node.request_completed
	request_node.queue_free()

	var result_code: int = int(result[0])
	var response_code: int = int(result[1])
	var response_bytes: PackedByteArray = result[3]
	var response_text: String = response_bytes.get_string_from_utf8()

	if result_code != HTTPRequest.RESULT_SUCCESS:
		var transport_message: String = "HTTP transport 失敗：%d" % result_code
		request_failed.emit(path, transport_message)
		return {"ok": false, "status": response_code, "error": transport_message, "data": {}}

	var parsed: Variant = JSON.parse_string(response_text)
	var data: Dictionary = parsed if parsed is Dictionary else {}
	var ok: bool = response_code >= 200 and response_code < 300
	if not ok:
		var api_message: String = String(data.get("error", "HTTP %d" % response_code))
		request_failed.emit(path, api_message)
		return {"ok": false, "status": response_code, "error": api_message, "data": data}

	return {"ok": true, "status": response_code, "error": "", "data": data}
