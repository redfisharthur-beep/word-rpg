extends Node2D

const GameData = preload("res://godot/scripts/game_data.gd")
const WordBank = preload("res://godot/scripts/word_bank.gd")
const UiFont = preload("res://godot/scripts/ui_font.gd")
const VIEW := Vector2(720, 1280)
const BG_GAME := "res://images/bg-game.png"
const INK := Color("29332f")
const MUTED := Color("56615b")
const CREAM := Color("f5f0e7")

var socket := WebSocketPeer.new()
var word_bank: WordRpgWordBank = WordBank.new()
var hud: CanvasLayer
var status := "connecting"
var round_no := 1
var hand: Array = []
var used: Array[int] = []
var selected: Array[int] = []
var self_state: Dictionary = {}
var opponent_state: Dictionary = {}
var questions: Array[Dictionary] = []
var q_index := 0
var answers: Array[String] = []
var answer_locked := false
var select_deadline := 0
var question_deadline := 0
var select_label: Label
var question_label: Label
var feedback_serial := 0
var battle_serial := 0

func _ready() -> void:
	word_bank.load_from_web_source()
	_build_base()
	_show_status("連線中…")
	_connect_match()

func _exit_tree() -> void:
	if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		socket.close(1000, "leave")

func _process(_delta: float) -> void:
	socket.poll()
	var state := socket.get_ready_state()
	if state == WebSocketPeer.STATE_OPEN:
		while socket.get_available_packet_count() > 0:
			var text := socket.get_packet().get_string_from_utf8()
			var parsed: Variant = JSON.parse_string(text)
			if parsed is Dictionary:
				_handle_message(parsed)
	elif state == WebSocketPeer.STATE_CLOSED and status not in ["finished", "closed"]:
		status = "closed"
		_show_status("連線中斷", true)

	if status == "cards" and select_deadline > 0:
		var remaining := maxi(0, select_deadline - Time.get_ticks_msec())
		if is_instance_valid(select_label):
			select_label.text = str(int(ceil(float(remaining) / 1000.0)))
		if remaining <= 0:
			select_deadline = 0
			_auto_fill()
			_begin_quiz()
	elif status == "quiz" and question_deadline > 0 and not answer_locked:
		var remaining := maxi(0, question_deadline - Time.get_ticks_msec())
		if is_instance_valid(question_label):
			question_label.text = str(int(ceil(float(remaining) / 1000.0)))
		if remaining <= 0:
			question_deadline = 0
			_answer_question("")

func _connect_match() -> void:
	var base := String(CloudflareClient.base_url)
	if base.is_empty():
		_show_status("Cloudflare URL 尚未設定", true)
		return
	var url := base.replace("https://", "wss://").replace("http://", "ws://") + "/match"
	var err := socket.connect_to_url(url)
	if err != OK:
		_show_status("PK 連線失敗", true)
		return
	await _wait_for_open()
	if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		_send({"type":"join","profile":{"name":GameState.player_name,"role":GameState.role,"pet":GameState.pet,"level":50,"rpg":GameState.rpg}})

func _wait_for_open() -> void:
	for _i in range(180):
		socket.poll()
		if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
			return
		if socket.get_ready_state() == WebSocketPeer.STATE_CLOSED:
			return
		await get_tree().process_frame

func _send(data: Dictionary) -> void:
	if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		socket.send_text(JSON.stringify(data))

func _handle_message(message: Dictionary) -> void:
	var type := String(message.get("type", ""))
	match type:
		"connected":
			pass
		"queued":
			status = "queue"
			_show_status("等待玩家挑戰")
		"matched":
			status = "cards"
			round_no = 1
			hand = (message.get("hand", []) as Array).duplicate(true)
			used.clear()
			selected.clear()
			self_state = (message.get("self", {}) as Dictionary).duplicate(true)
			opponent_state = (message.get("opponent", {}) as Dictionary).duplicate(true)
			select_deadline = Time.get_ticks_msec() + 60000
			_show_cards()
		"quiz-started":
			var indices: Array = message.get("questions", [])
			questions.clear()
			for value: Variant in indices:
				questions.append(word_bank.make_question(int(value)))
			q_index = 0
			answers.clear()
			answer_locked = false
			status = "quiz"
			_show_question()
		"waiting-opponent":
			status = "waiting"
			_show_status("等待對手完成答題…")
		"battle-result":
			self_state = (message.get("self", {}) as Dictionary).duplicate(true)
			opponent_state = (message.get("opponent", {}) as Dictionary).duplicate(true)
			battle_serial += 1
			_play_battle_result(message, battle_serial)
		"opponent-left":
			status = "finished"
			_show_end("對手離線", true, {})
		"error":
			status = "closed"
			_show_status(String(message.get("message", "配對失敗")), true)

func _show_cards() -> void:
	_reset_hud()
	_add_background()
	_add_top("線上對戰 · 第 %d 回合" % round_no)
	_show_fighters(self_state, opponent_state)
	select_label = _label("60", Rect2(305, 450, 110, 45), 30, HORIZONTAL_ALIGNMENT_CENTER, INK)
	hud.add_child(select_label)
	var grid := GridContainer.new()
	grid.columns = 3
	grid.position = Vector2(32, 515)
	grid.size = Vector2(656, 575)
	grid.add_theme_constant_override("h_separation", 10)
	grid.add_theme_constant_override("v_separation", 10)
	hud.add_child(grid)
	for i in range(hand.size()):
		if used.has(i):
			continue
		var card: Dictionary = hand[i]
		var order := selected.find(i) + 1
		var button := Button.new()
		button.custom_minimum_size = Vector2(205, 170)
		button.focus_mode = Control.FOCUS_NONE
		button.text = "%s\n%s\n%s" % ["●".repeat(order) if order > 0 else "", String(card.get("name", "技能")), String(card.get("text", ""))]
		button.add_theme_font_size_override("font_size", 16)
		UiFont.apply(button)
		button.add_theme_stylebox_override("normal", _box(_card_color(String(card.get("color", "neutral"))), 18, Color(1,1,1,0.55), 1))
		button.add_theme_stylebox_override("pressed", _box(Color("c9bd9f"), 18, Color("8f7b4d"), 3))
		button.pressed.connect(_toggle_card.bind(i))
		grid.add_child(button)
	var confirm := _button("確認", Rect2(245, 1120, 230, 72), 23, Color("566d62"), Color.WHITE)
	confirm.disabled = selected.size() != 3
	confirm.pressed.connect(_begin_quiz)
	hud.add_child(confirm)

func _toggle_card(index: int) -> void:
	if used.has(index):
		return
	if selected.has(index):
		selected.erase(index)
	elif selected.size() < 3:
		selected.append(index)
	_show_cards()

func _auto_fill() -> void:
	var available: Array[int] = []
	for i in range(hand.size()):
		if not used.has(i) and not selected.has(i):
			available.append(i)
	available.shuffle()
	while selected.size() < 3 and not available.is_empty():
		selected.append(available.pop_back())

func _begin_quiz() -> void:
	if selected.size() != 3:
		return
	select_deadline = 0
	status = "quiz-loading"
	_show_status("準備題目…")
	_send({"type":"quiz-start","selected":selected.duplicate()})

func _show_question() -> void:
	if q_index >= questions.size():
		return
	_reset_hud()
	_add_background()
	_add_top("PK · 第 %d 回合 · %d / 5" % [round_no, q_index + 1])
	_show_fighters(self_state, opponent_state)
	var q: Dictionary = questions[q_index]
	question_label = _label("10", Rect2(565, 465, 80, 40), 25, HORIZONTAL_ALIGNMENT_CENTER, INK)
	hud.add_child(question_label)
	var word_panel := _panel(Rect2(90, 525, 540, 140), Color(0.93,0.92,0.88,0.98), 24, Color(1,1,1,0.65), 1)
	hud.add_child(word_panel)
	word_panel.add_child(_label(String(q.get("word", "")), Rect2(20, 18, 500, 104), 40, HORIZONTAL_ALIGNMENT_CENTER, INK))
	var options: Array = q.get("options", [])
	for i in range(options.size()):
		var x := 48.0 + float(i % 2) * 322.0
		var y := 720.0 + float(i / 2) * 145.0
		var button := _button(String(options[i]), Rect2(x, y, 302, 112), 22, Color("e7e2d9"), INK)
		button.pressed.connect(_answer_question.bind(String(options[i])))
		hud.add_child(button)
	question_deadline = Time.get_ticks_msec() + 10000

func _answer_question(value: String) -> void:
	if status != "quiz" or answer_locked or q_index >= questions.size():
		return
	answer_locked = true
	question_deadline = 0
	var q: Dictionary = questions[q_index]
	var correct := value == String(q.get("answer", ""))
	answers.append(value)
	feedback_serial += 1
	var serial := feedback_serial
	_show_answer_feedback(q, value, correct)
	await get_tree().create_timer(0.9).timeout
	if serial != feedback_serial:
		return
	q_index += 1
	answer_locked = false
	if q_index >= 5:
		for index: int in selected:
			if not used.has(index):
				used.append(index)
		status = "waiting"
		_show_status("等待對手完成答題…")
		_send({"type":"ready","answers":answers.duplicate()})
	else:
		_show_question()

func _show_answer_feedback(q: Dictionary, selected_answer: String, correct: bool) -> void:
	_reset_hud()
	_add_background()
	_show_fighters(self_state, opponent_state)
	var panel := _panel(Rect2(100, 590, 520, 240), Color("cbdccb") if correct else Color("e1c4c1"), 28, Color(1,1,1,0.60), 1)
	hud.add_child(panel)
	panel.add_child(_label("正確" if correct else "答案 · %s" % String(q.get("answer", "")), Rect2(30, 55, 460, 72), 31, HORIZONTAL_ALIGNMENT_CENTER, INK))
	if not correct and not selected_answer.is_empty():
		panel.add_child(_label("你的選擇 · %s" % selected_answer, Rect2(40, 140, 440, 44), 17, HORIZONTAL_ALIGNMENT_CENTER, MUTED))

func _play_battle_result(message: Dictionary, serial: int) -> void:
	status = "battle"
	var steps: Array = message.get("steps", [])
	for raw: Variant in steps:
		if serial != battle_serial:
			return
		if not raw is Dictionary:
			continue
		var step: Dictionary = raw
		_show_battle_step(step)
		await get_tree().create_timer(0.72 if bool(step.get("autoDuel", false)) else 1.25).timeout
	if serial != battle_serial:
		return
	if bool(message.get("finished", false)):
		status = "finished"
		var winner := String(message.get("winner", "draw"))
		_show_end("勝利" if winner == "self" else ("失敗" if winner == "opponent" else "平手"), winner == "self", message.get("season", {}))
	else:
		round_no += 1
		selected.clear()
		select_deadline = Time.get_ticks_msec() + 60000
		status = "cards"
		_show_cards()

func _show_battle_step(step: Dictionary) -> void:
	_reset_hud()
	_add_background()
	var mine := String(step.get("who", "self")) == "self"
	var self_view: Dictionary = step.get("self", self_state)
	var opp_view: Dictionary = step.get("opponent", opponent_state)
	_show_fighters(self_view, opp_view)
	var card: Dictionary = step.get("card", {})
	var title := "普通攻擊" if card.is_empty() else String(card.get("name", "技能"))
	var logs: Array = step.get("logs", [])
	var text := ""
	for i in range(maxi(0, logs.size() - 3), logs.size()):
		text += ("\n" if not text.is_empty() else "") + String(logs[i])
	var panel := _panel(Rect2(90, 555, 540, 215), Color("eadbd7") if mine else Color("d9e3e9"), 24, Color(1,1,1,0.55), 1)
	hud.add_child(panel)
	panel.add_child(_label(title, Rect2(25, 20, 490, 48), 27, HORIZONTAL_ALIGNMENT_CENTER, INK))
	panel.add_child(_label(text, Rect2(28, 78, 484, 112), 17, HORIZONTAL_ALIGNMENT_CENTER, MUTED))

func _show_end(title: String, win: bool, season_value: Variant) -> void:
	_reset_hud()
	_add_background()
	var panel := _panel(Rect2(92, 280, 536, 650), CREAM, 30, Color(1,1,1,0.72), 1)
	hud.add_child(panel)
	panel.add_child(_label(title, Rect2(45, 55, 446, 90), 42, HORIZONTAL_ALIGNMENT_CENTER, Color("54785f") if win else INK))
	if season_value is Dictionary and not (season_value as Dictionary).is_empty():
		var season: Dictionary = season_value
		panel.add_child(_label("%s · %d pts\n%d勝 %d敗 %d和" % [String(season.get("season", "")), int(season.get("points", 0)), int(season.get("wins", 0)), int(season.get("losses", 0)), int(season.get("draws", 0))], Rect2(70, 180, 396, 92), 20, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	var again := _button("再次配對", Rect2(118, 370, 300, 72), 23, Color("566d62"), Color.WHITE)
	panel.add_child(again)
	again.pressed.connect(_reconnect)
	var back := _button("返回", Rect2(118, 470, 300, 64), 20, Color("d5d0c7"), INK)
	panel.add_child(back)
	back.pressed.connect(_back_to_game)

func _reconnect() -> void:
	if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		socket.close(1000, "requeue")
	socket = WebSocketPeer.new()
	status = "connecting"
	_show_status("連線中…")
	_connect_match()

func _show_status(text: String, allow_back: bool = true) -> void:
	_reset_hud()
	_add_background()
	var panel := _panel(Rect2(95, 390, 530, 410), CREAM, 28, Color(1,1,1,0.70), 1)
	hud.add_child(panel)
	panel.add_child(_label("PK", Rect2(40, 50, 450, 70), 40, HORIZONTAL_ALIGNMENT_CENTER, INK))
	panel.add_child(_label(text, Rect2(45, 150, 440, 80), 22, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	if allow_back:
		var back := _button("返回", Rect2(145, 285, 240, 62), 20, Color("d5d0c7"), INK)
		panel.add_child(back)
		back.pressed.connect(_back_to_game)

func _show_fighters(me: Dictionary, opp: Dictionary) -> void:
	var me_profile: Dictionary = me.get("profile", {})
	var opp_profile: Dictionary = opp.get("profile", {})
	var my_role := String(me_profile.get("role", GameState.role))
	var their_role := String(opp_profile.get("role", "warrior"))
	var my_art := String((GameData.ROLES.get(my_role, GameData.ROLES["warrior"]) as Dictionary).get("art", ""))
	var their_art := String((GameData.ROLES.get(their_role, GameData.ROLES["warrior"]) as Dictionary).get("art", ""))
	_texture_to_hud(my_art, Rect2(45, 110, 280, 280))
	_texture_to_hud(their_art, Rect2(395, 110, 280, 280))
	_hud_label(String(me_profile.get("name", "我方")), Rect2(55, 385, 260, 32), 18, HORIZONTAL_ALIGNMENT_CENTER, INK)
	_hud_label(String(opp_profile.get("name", "對手")), Rect2(405, 385, 260, 32), 18, HORIZONTAL_ALIGNMENT_CENTER, INK)
	_add_hp(Rect2(65, 425, 240, 14), me, Color("718f7c"))
	_add_hp(Rect2(415, 425, 240, 14), opp, Color("b86e67"))
	_hud_label("VS", Rect2(325, 225, 70, 50), 30, HORIZONTAL_ALIGNMENT_CENTER, Color("816e55"))

func _add_hp(rect: Rect2, fighter: Dictionary, color: Color) -> void:
	var bg := ColorRect.new()
	bg.position = rect.position
	bg.size = rect.size
	bg.color = Color(0.18,0.18,0.18,0.25)
	hud.add_child(bg)
	var max_hp := maxf(1.0, float(fighter.get("maxHp", fighter.get("max_hp", 1))))
	var hp := maxf(0.0, float(fighter.get("hp", 0)))
	var fill := ColorRect.new()
	fill.position = rect.position
	fill.size = Vector2(rect.size.x * clampf(hp / max_hp, 0.0, 1.0), rect.size.y)
	fill.color = color
	hud.add_child(fill)

func _build_base() -> void:
	var camera := Camera2D.new()
	camera.position = VIEW * 0.5
	add_child(camera)
	camera.make_current()
	hud = CanvasLayer.new()
	add_child(hud)

func _reset_hud() -> void:
	if is_instance_valid(hud):
		for child in hud.get_children():
			child.queue_free()

func _add_background() -> void:
	var texture := _load_texture(BG_GAME)
	if texture == null:
		return
	var sprite := Sprite2D.new()
	sprite.texture = texture
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	sprite.position = VIEW * 0.5
	var size := texture.get_size()
	if size.x > 0.0 and size.y > 0.0:
		sprite.scale = Vector2.ONE * maxf(VIEW.x / size.x, VIEW.y / size.y)
	sprite.modulate.a = 0.86
	sprite.z_index = -100
	add_child(sprite)

func _add_top(text: String) -> void:
	_hud_label(text, Rect2(120, 25, 480, 46), 22, HORIZONTAL_ALIGNMENT_CENTER, INK)
	var back := _button("返回", Rect2(18, 18, 95, 48), 15, Color("d5d0c7"), INK)
	hud.add_child(back)
	back.pressed.connect(_back_to_game)

func _back_to_game() -> void:
	status = "finished"
	if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		socket.close(1000, "leave")
	get_tree().change_scene_to_file("res://godot/scenes/game.tscn")

func _card_color(id: String) -> Color:
	match id:
		"green": return Color("d8e7dc")
		"blue": return Color("d6e2ec")
		"red": return Color("ead7d4")
		"yellow": return Color("eee4b9")
		_: return Color("e4e1da")

func _panel(rect: Rect2, color: Color, radius: int, border: Color, width: int) -> Panel:
	var panel := Panel.new()
	panel.position = rect.position
	panel.size = rect.size
	panel.add_theme_stylebox_override("panel", _box(color, radius, border, width))
	return panel

func _box(color: Color, radius: int, border: Color, width: int) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = color
	box.corner_radius_top_left = radius
	box.corner_radius_top_right = radius
	box.corner_radius_bottom_left = radius
	box.corner_radius_bottom_right = radius
	box.border_width_left = width
	box.border_width_right = width
	box.border_width_top = width
	box.border_width_bottom = width
	box.border_color = border
	return box

func _label(text: String, rect: Rect2, font_size: int, align: int, color: Color) -> Label:
	var label := Label.new()
	label.text = text
	label.position = rect.position
	label.size = rect.size
	label.horizontal_alignment = align
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	UiFont.apply(label)
	return label

func _hud_label(text: String, rect: Rect2, font_size: int, align: int, color: Color) -> Label:
	var label := _label(text, rect, font_size, align, color)
	hud.add_child(label)
	return label

func _button(text: String, rect: Rect2, font_size: int, bg: Color, fg: Color) -> Button:
	var button := Button.new()
	button.text = text
	button.position = rect.position
	button.size = rect.size
	button.focus_mode = Control.FOCUS_NONE
	button.add_theme_font_size_override("font_size", font_size)
	button.add_theme_color_override("font_color", fg)
	UiFont.apply(button)
	button.add_theme_stylebox_override("normal", _box(bg, 16, Color(1,1,1,0.30), 1))
	button.add_theme_stylebox_override("pressed", _box(bg.darkened(0.07), 16, Color(1,1,1,0.50), 2))
	return button

func _texture_to_hud(path: String, rect: Rect2) -> TextureRect:
	var view := TextureRect.new()
	view.position = rect.position
	view.size = rect.size
	view.texture = _load_texture(path)
	view.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	view.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	view.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	view.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud.add_child(view)
	return view

func _load_texture(path: String) -> Texture2D:
	if path.is_empty() or not ResourceLoader.exists(path):
		return null
	return load(path) as Texture2D
