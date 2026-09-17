extends Node

const Harness = preload("res://godot/tests/pk_protocol_harness.gd")

var failures: Array[String] = []

func _ready() -> void:
	_run()

func _check(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _fatal(message: String) -> void:
	push_error(message)
	get_tree().quit(1)

func _fighter(name: String, role: String, hp: int = 500) -> Dictionary:
	return {
		"profile":{"name":name,"role":role,"pet":"fox","level":50},
		"maxHp":500,
		"hp":hp,
		"atk":100,
		"def":50,
		"crit":0.10,
		"shield":0
	}

func _hand() -> Array:
	var out: Array = []
	for i in range(9):
		out.append({"id":"card-%d" % i,"name":"技能%d" % i,"text":"測試","color":"red"})
	return out

func _run() -> void:
	print("PKTEST: autoloads ready = %s / %s" % [get_node_or_null("/root/CloudflareClient") != null, get_node_or_null("/root/GameState") != null])
	if get_node_or_null("/root/CloudflareClient") == null or get_node_or_null("/root/GameState") == null:
		_fatal("PK protocol scene requires project autoloads")
		return

	print("PKTEST: create harness")
	var pk = Harness.new()
	if pk == null or not pk.has_method("_handle_message"):
		_fatal("PK harness could not instantiate native handler")
		return
	add_child(pk)
	var bank: Variant = pk.get("word_bank")
	if bank == null or not bank.has_method("load_from_web_source"):
		_fatal("PK harness word bank unavailable")
		return
	bank.load_from_web_source()
	print("PKTEST: word bank ready")

	pk.call("_handle_message", {"type":"queued"})
	print("PKTEST: queued")
	_check(String(pk.get("status")) == "queue", "queued should enter queue state")
	_check(String(pk.get("last_status_text")) == "等待玩家挑戰", "queued status copy")

	pk.call("_handle_message", {
		"type":"matched",
		"hand":_hand(),
		"self":_fighter("Arthur", "warrior"),
		"opponent":_fighter("Rival", "mage")
	})
	print("PKTEST: matched")
	_check(String(pk.get("status")) == "cards", "matched should enter card selection")
	_check(int(pk.get("round_no")) == 1, "matched should reset round to 1")
	_check((pk.get("hand") as Array).size() == 9, "matched should receive nine cards")
	_check((pk.get("used") as Array).is_empty(), "matched should reset used cards")
	_check((pk.get("selected") as Array).is_empty(), "matched should reset selected cards")
	_check(int(pk.get("cards_rendered")) == 1, "matched should render cards")
	_check(int(pk.get("select_deadline")) > 0, "matched should start 60 second selection timer")

	pk.call("_handle_message", {"type":"quiz-started","questions":[0,1,2,3,4]})
	print("PKTEST: quiz-started")
	_check(String(pk.get("status")) == "quiz", "quiz-started should enter quiz")
	_check((pk.get("questions") as Array).size() == 5, "quiz-started should build five questions")
	_check(int(pk.get("q_index")) == 0, "quiz should start from first question")
	_check((pk.get("answers") as Array).is_empty(), "quiz-started should clear previous answers")
	_check(int(pk.get("questions_rendered")) == 1, "quiz-started should render first question")

	pk.call("_handle_message", {"type":"waiting-opponent"})
	print("PKTEST: waiting-opponent")
	_check(String(pk.get("status")) == "waiting", "waiting-opponent should enter waiting state")
	_check(String(pk.get("last_status_text")) == "等待對手完成答題…", "waiting-opponent status copy")

	pk.call("_handle_message", {
		"type":"battle-result",
		"self":_fighter("Arthur", "warrior", 430),
		"opponent":_fighter("Rival", "mage", 350),
		"steps":[],
		"finished":false
	})
	print("PKTEST: battle-result next round")
	_check(String(pk.get("status")) == "cards", "unfinished battle should return to card selection")
	_check(int(pk.get("round_no")) == 2, "unfinished battle should advance to round 2")
	_check((pk.get("selected") as Array).is_empty(), "next round should clear selection")
	_check(int(pk.get("cards_rendered")) == 2, "next round should render cards again")
	_check(int((pk.get("self_state") as Dictionary).get("hp", 0)) == 430, "battle-result should update self fighter")
	_check(int((pk.get("opponent_state") as Dictionary).get("hp", 0)) == 350, "battle-result should update opponent fighter")

	pk.call("_handle_message", {
		"type":"battle-result",
		"self":_fighter("Arthur", "warrior", 220),
		"opponent":_fighter("Rival", "mage", 0),
		"steps":[],
		"finished":true,
		"winner":"self",
		"season":{"season":"2026-09","points":118,"wins":3,"losses":1,"draws":0}
	})
	print("PKTEST: battle-result finished")
	_check(String(pk.get("status")) == "finished", "finished battle should enter finished state")
	_check(String(pk.get("last_end_title")) == "勝利", "self winner should render victory")
	_check(bool(pk.get("last_end_win")), "self winner should be marked as win")

	pk.call("_handle_message", {"type":"opponent-left"})
	print("PKTEST: opponent-left")
	_check(String(pk.get("status")) == "finished", "opponent-left should finish match")
	_check(String(pk.get("last_end_title")) == "對手離線", "opponent-left title")
	_check(bool(pk.get("last_end_win")), "opponent-left should count as local win display")

	pk.call("_handle_message", {"type":"error","message":"fixture error"})
	print("PKTEST: error")
	_check(String(pk.get("status")) == "closed", "error should close PK state")
	_check(String(pk.get("last_status_text")) == "fixture error", "server error message should be shown")

	pk.queue_free()
	if failures.is_empty():
		print("Godot PK protocol tests: PASS")
		get_tree().quit(0)
	else:
		for message: String in failures:
			push_error(message)
		print("Godot PK protocol tests: FAIL (%d)" % failures.size())
		get_tree().quit(1)
