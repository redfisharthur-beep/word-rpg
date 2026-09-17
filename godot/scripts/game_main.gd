extends Node2D

const GameData = preload("res://godot/scripts/game_data.gd")
const WordBank = preload("res://godot/scripts/word_bank.gd")
const BattleFx = preload("res://godot/scripts/battle_fx.gd")

const VIEW_SIZE: Vector2 = Vector2(720, 1280)
const BG_TEXTURE: Texture2D = preload("res://images/bg-game.png")

var word_bank: WordRpgWordBank = WordBank.new()
var mode: String = "home"
var hud: CanvasLayer
var camera: Camera2D
var player_sprite: Sprite2D
var enemy_sprite: Sprite2D
var fx: Node
var player_hp_bar: ProgressBar
var enemy_hp_bar: ProgressBar
var status_label: Label
var timer_label: Label

var stage_index: int = 0
var round_no: int = 1
var player: Dictionary = {}
var enemy: Dictionary = {}
var hand: Array[Dictionary] = []
var selected_indices: Array[int] = []
var selected_cards: Array[Dictionary] = []
var questions: Array[Dictionary] = []
var question_index: int = 0
var correct_answers: int = 0
var quiz_locked: bool = false
var battle_busy: bool = false
var selection_deadline: int = 0
var question_deadline: int = 0
var last_reward: Dictionary = {}
var last_loot: Dictionary = {}
var battle_log: Array[String] = []

func _ready() -> void:
	word_bank.load_from_web_source()
	_render_home()
	_refresh_cloud_session()

func _process(_delta: float) -> void:
	if mode == "cards" and selection_deadline > 0 and is_instance_valid(timer_label):
		var remaining_ms: int = maxi(0, selection_deadline - Time.get_ticks_msec())
		var remaining: int = int(ceil(float(remaining_ms) / 1000.0))
		timer_label.text = "%02d" % remaining
		if remaining_ms <= 0:
			selection_deadline = 0
			_auto_select_cards()
			_start_quiz()
	elif mode == "quiz" and question_deadline > 0 and not quiz_locked and is_instance_valid(timer_label):
		var quiz_ms: int = maxi(0, question_deadline - Time.get_ticks_msec())
		var quiz_remaining: int = int(ceil(float(quiz_ms) / 1000.0))
		timer_label.text = "%02d" % quiz_remaining
		if quiz_ms <= 0:
			question_deadline = 0
			_answer_question("")

func _refresh_cloud_session() -> void:
	var ok: bool = await GameState.refresh_cloudflare_session()
	if mode == "home" and is_instance_valid(status_label):
		status_label.text = "LINE 雲端同步已連線" if ok else "本機模式 · Cloudflare 題庫可用"

func _clear_scene() -> void:
	for child: Node in get_children():
		remove_child(child)
		child.queue_free()
	camera = Camera2D.new()
	camera.position = VIEW_SIZE * 0.5
	add_child(camera)
	camera.make_current()
	hud = CanvasLayer.new()
	add_child(hud)
	player_sprite = null
	enemy_sprite = null
	player_hp_bar = null
	enemy_hp_bar = null
	status_label = null
	timer_label = null
	fx = BattleFx.new()
	add_child(fx)

func _render_home() -> void:
	mode = "home"
	_clear_scene()
	_add_background()
	_add_title("WORD RPG", "答題 · 技能 · 成長 · 掉寶")
	var hero: Sprite2D = _sprite_from_path("res://images/warrior.png", Vector2(360, 540), Vector2(390, 570))
	if hero != null:
		fx.start_idle(hero, 0.82)
	var start_button: Button = _make_button("開始冒險", Vector2(170, 890), Vector2(380, 88), 28)
	start_button.pressed.connect(_render_setup)
	var inventory_button: Button = _make_button("背包", Vector2(170, 994), Vector2(180, 70), 22)
	inventory_button.pressed.connect(_render_inventory)
	var demo_button: Button = _make_button("戰鬥測試", Vector2(370, 994), Vector2(180, 70), 22)
	demo_button.pressed.connect(_start_stage.bind(0))
	status_label = _label("連線狀態確認中…", Vector2(90, 1105), Vector2(540, 40), 18, HORIZONTAL_ALIGNMENT_CENTER)
	var profile: String = "%s  Lv.%d  ·  %s" % [GameState.player_name, GameState.level, GameData.title_name(GameState.level)]
	_label(profile, Vector2(80, 1150), Vector2(560, 40), 20, HORIZONTAL_ALIGNMENT_CENTER)

func _render_setup() -> void:
	mode = "setup"
	_clear_scene()
	_add_background(0.62)
	_add_title("選擇勇者", "角色與寵物會影響戰鬥加成")
	_label("角色", Vector2(45, 150), Vector2(200, 44), 24)
	var role_ids: Array[String] = ["warrior", "mage", "archer"]
	for i: int in range(role_ids.size()):
		var role_id: String = role_ids[i]
		var role_data: Dictionary = GameData.ROLES[role_id]
		var panel: Button = _image_choice_button(String(role_data["art"]), String(role_data["name"]), Vector2(30 + i * 230, 205), Vector2(205, 330), GameState.role == role_id)
		panel.pressed.connect(_select_role.bind(role_id))
	_label("寵物", Vector2(45, 565), Vector2(200, 44), 24)
	var pet_ids: Array[String] = ["fox", "owl", "dragon"]
	for i: int in range(pet_ids.size()):
		var pet_id: String = pet_ids[i]
		var pet_data: Dictionary = GameData.PETS[pet_id]
		var pet_button: Button = _image_choice_button(String(pet_data["art"]), String(pet_data["name"]), Vector2(30 + i * 230, 620), Vector2(205, 250), GameState.pet == pet_id)
		pet_button.pressed.connect(_select_pet.bind(pet_id))
	var role_trait: String = String(GameData.ROLES[GameState.role]["trait"])
	var pet_trait: String = String(GameData.PETS[GameState.pet]["trait"])
	_label("%s　＋　%s" % [role_trait, pet_trait], Vector2(55, 905), Vector2(610, 70), 18, HORIZONTAL_ALIGNMENT_CENTER)
	var go_button: Button = _make_button("進入冒險", Vector2(185, 1010), Vector2(350, 82), 26)
	go_button.pressed.connect(_render_map)
	var back_button: Button = _make_button("返回", Vector2(260, 1110), Vector2(200, 62), 20)
	back_button.pressed.connect(_render_home)

func _select_role(role_id: String) -> void:
	GameState.select_role(role_id)
	_render_setup()

func _select_pet(pet_id: String) -> void:
	GameState.select_pet(pet_id)
	_render_setup()

func _render_map() -> void:
	mode = "map"
	_clear_scene()
	_add_background(0.52)
	_add_title("冒險地圖", "%s · Lv.%d · %s" % [GameState.player_name, GameState.level, GameData.title_name(GameState.level)])
	var stats: Dictionary = GameData.progression_stats(GameState.role, GameState.pet, GameState.level)
	_label("HP %d　ATK %d　DEF %d　CRIT %d%%" % [int(stats["max_hp"]), int(stats["atk"]), int(stats["def"]), roundi(float(stats["crit"]) * 100.0)], Vector2(45, 120), Vector2(630, 42), 19, HORIZONTAL_ALIGNMENT_CENTER)
	for i: int in range(GameData.STAGES.size()):
		var stage: Dictionary = GameData.STAGES[i]
		var unlocked: bool = i <= GameState.unlocked_stage
		var stage_button: Button = _stage_button(stage, i, unlocked, Vector2(55, 190 + i * 205))
		if unlocked: stage_button.pressed.connect(_start_stage.bind(i))
	var bag: Button = _make_button("背包 %d" % GameState.inventory.size(), Vector2(110, 1045), Vector2(220, 68), 21)
	bag.pressed.connect(_render_inventory)
	var home: Button = _make_button("首頁", Vector2(390, 1045), Vector2(220, 68), 21)
	home.pressed.connect(_render_home)
	var xp_text: String = "MAX" if GameState.level >= 50 else "%d / %d EXP" % [GameState.xp, GameData.xp_need(GameState.level)]
	_label(xp_text, Vector2(150, 1140), Vector2(420, 34), 17, HORIZONTAL_ALIGNMENT_CENTER)

func _stage_button(stage: Dictionary, index: int, unlocked: bool, at: Vector2) -> Button:
	var button: Button = Button.new()
	button.position = at
	button.size = Vector2(610, 175)
	button.text = "%d　%s\n%s" % [index + 1, String(stage["name"]), String(stage["skill"])] if unlocked else "%d　???\n尚未解鎖" % [index + 1]
	button.add_theme_font_size_override("font_size", 22)
	button.disabled = not unlocked
	var texture: Texture2D = _load_texture(String(stage["art"]))
	if texture != null:
		button.icon = texture
		button.expand_icon = true
		button.add_theme_constant_override("icon_max_width", 125)
	button.add_theme_stylebox_override("normal", _box(Color(0.12, 0.13, 0.14, 0.88), 20, Color(0.50, 0.52, 0.50, 0.45), 2))
	button.add_theme_stylebox_override("disabled", _box(Color(0.10, 0.10, 0.11, 0.60), 20, Color(0.25, 0.25, 0.25, 0.3), 1))
	hud.add_child(button)
	return button

func _start_stage(index: int) -> void:
	stage_index = clampi(index, 0, 3)
	round_no = 1
	player = GameData.progression_stats(GameState.role, GameState.pet, GameState.level)
	enemy = GameData.stage_stats(stage_index, GameState.level)
	battle_log.clear()
	_prepare_card_round()

func _prepare_card_round() -> void:
	if int(player.get("hp", 0)) <= 0 or int(enemy.get("hp", 0)) <= 0:
		_finish_battle()
		return
	hand = GameData.deal_hand(9, GameState.role, GameState.level)
	selected_indices.clear()
	selected_cards.clear()
	correct_answers = 0
	question_index = 0
	questions.clear()
	selection_deadline = Time.get_ticks_msec() + 60000
	_render_cards()

func _render_cards() -> void:
	mode = "cards"
	_clear_scene()
	_build_battle_arena()
	_label("ROUND %d　選 3 張" % round_no, Vector2(210, 510), Vector2(300, 42), 23, HORIZONTAL_ALIGNMENT_CENTER)
	timer_label = _label("60", Vector2(610, 510), Vector2(70, 42), 23, HORIZONTAL_ALIGNMENT_CENTER)
	var grid: GridContainer = GridContainer.new()
	grid.columns = 3
	grid.position = Vector2(30, 565)
	grid.size = Vector2(660, 510)
	grid.add_theme_constant_override("h_separation", 10)
	grid.add_theme_constant_override("v_separation", 10)
	hud.add_child(grid)
	for i: int in range(hand.size()):
		var card: Dictionary = hand[i]
		var selected: bool = selected_indices.has(i)
		var button: Button = _card_button(card, selected)
		button.pressed.connect(_toggle_card.bind(i))
		grid.add_child(button)
	var confirm: Button = _make_button("確認出牌 %d / 3" % selected_indices.size(), Vector2(200, 1100), Vector2(320, 70), 23)
	confirm.disabled = selected_indices.size() != 3
	confirm.pressed.connect(_start_quiz)

func _card_button(card: Dictionary, selected: bool) -> Button:
	var button: Button = Button.new()
	button.custom_minimum_size = Vector2(210, 160)
	button.text = "%s%s\n%s" % ["✓ " if selected else "", String(card.get("name", "技能")), String(card.get("text", ""))]
	button.add_theme_font_size_override("font_size", 15)
	button.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	var art_path: String = String(card.get("art", ""))
	var texture: Texture2D = _load_texture(art_path)
	if texture != null:
		button.icon = texture
		button.expand_icon = true
		button.add_theme_constant_override("icon_max_width", 78)
	var fill: Color = Color(0.25, 0.31, 0.28, 0.96) if selected else Color(0.11, 0.12, 0.13, 0.93)
	var border: Color = Color(0.86, 0.74, 0.45, 0.95) if selected else Color(0.50, 0.50, 0.49, 0.45)
	button.add_theme_stylebox_override("normal", _box(fill, 16, border, 3 if selected else 1))
	return button

func _toggle_card(index: int) -> void:
	if battle_busy: return
	if selected_indices.has(index):
		selected_indices.erase(index)
	elif selected_indices.size() < 3:
		selected_indices.append(index)
	_render_cards()

func _auto_select_cards() -> void:
	var candidates: Array[int] = []
	for i: int in range(hand.size()):
		if not selected_indices.has(i): candidates.append(i)
	candidates.shuffle()
	while selected_indices.size() < 3 and not candidates.is_empty():
		selected_indices.append(candidates.pop_back())

func _start_quiz() -> void:
	if battle_busy: return
	if selected_indices.size() != 3: _auto_select_cards()
	selection_deadline = 0
	selected_cards.clear()
	for index: int in selected_indices:
		selected_cards.append(hand[index])
	battle_busy = true
	mode = "loading"
	_render_quiz_loading()
	var cloud: Dictionary = await CloudflareClient.get_questions(5)
	questions.clear()
	if bool(cloud.get("ok", false)):
		var data: Dictionary = cloud.get("data", {})
		var raw_indices: Variant = data.get("indices", [])
		if raw_indices is Array:
			for value: Variant in raw_indices:
				questions.append(word_bank.make_question(int(value)))
	if questions.size() != 5:
		questions = word_bank.random_questions(5)
	question_index = 0
	correct_answers = 0
	battle_busy = false
	_render_quiz()

func _render_quiz_loading() -> void:
	_clear_scene()
	_build_battle_arena()
	_label("題庫載入中…", Vector2(150, 650), Vector2(420, 70), 28, HORIZONTAL_ALIGNMENT_CENTER)

func _render_quiz() -> void:
	mode = "quiz"
	quiz_locked = false
	question_deadline = Time.get_ticks_msec() + 10000
	_clear_scene()
	_build_battle_arena()
	if question_index >= questions.size():
		_resolve_round()
		return
	var q: Dictionary = questions[question_index]
	_label("%d / 5" % [question_index + 1], Vector2(50, 510), Vector2(110, 42), 20, HORIZONTAL_ALIGNMENT_CENTER)
	timer_label = _label("10", Vector2(610, 510), Vector2(70, 42), 23, HORIZONTAL_ALIGNMENT_CENTER)
	var word_panel: PanelContainer = PanelContainer.new()
	word_panel.position = Vector2(90, 570)
	word_panel.size = Vector2(540, 130)
	word_panel.add_theme_stylebox_override("panel", _box(Color(0.82, 0.82, 0.78, 0.96), 22, Color(0.58, 0.61, 0.57, 0.9), 2))
	hud.add_child(word_panel)
	var word: Label = Label.new()
	word.text = String(q["word"])
	word.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	word.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	word.add_theme_font_size_override("font_size", 38)
	word.add_theme_color_override("font_color", Color(0.12, 0.16, 0.14))
	word_panel.add_child(word)
	var options: Array = q.get("options", [])
	for i: int in range(options.size()):
		var option: String = String(options[i])
		var bx: float = 60.0 + float(i % 2) * 310.0
		var by: float = 740.0 + float(i / 2) * 130.0
		var answer_button: Button = _make_button(option, Vector2(bx, by), Vector2(290, 105), 23)
		answer_button.pressed.connect(_answer_question.bind(option))
	_label("答對 %d 題" % correct_answers, Vector2(220, 1015), Vector2(280, 38), 18, HORIZONTAL_ALIGNMENT_CENTER)

func _answer_question(value: String) -> void:
	if quiz_locked or mode != "quiz": return
	quiz_locked = true
	question_deadline = 0
	var q: Dictionary = questions[question_index]
	var answer: String = String(q["answer"])
	var ok: bool = value == answer
	if ok: correct_answers += 1
	_clear_scene()
	_build_battle_arena()
	var feedback: String = "正確 ✓" if ok else "答案：%s" % answer
	var color: Color = Color(0.55, 0.80, 0.58) if ok else Color(0.90, 0.58, 0.55)
	var feedback_label: Label = _label(feedback, Vector2(120, 675), Vector2(480, 80), 30, HORIZONTAL_ALIGNMENT_CENTER)
	feedback_label.add_theme_color_override("font_color", color)
	await get_tree().create_timer(0.55).timeout
	question_index += 1
	if question_index >= 5:
		_resolve_round()
	else:
		_render_quiz()

func _resolve_round() -> void:
	if battle_busy: return
	battle_busy = true
	mode = "action"
	question_deadline = 0
	_clear_scene()
	_build_battle_arena()
	status_label = _label("答對 %d / 5　技能倍率 %.0f%%" % [correct_answers, GameData.accuracy_multiplier(correct_answers, GameState.pet) * 100.0], Vector2(80, 525), Vector2(560, 45), 20, HORIZONTAL_ALIGNMENT_CENTER)
	var boost: float = 1.0
	for i: int in range(selected_cards.size()):
		if int(enemy.get("hp", 0)) <= 0: break
		var card: Dictionary = selected_cards[i]
		var result: Dictionary = GameData.apply_card(player, enemy, card, correct_answers, selected_cards, i, boost)
		boost = float(result.get("next_boost", 1.0)) if String(card.get("id", "")) == "boost" else 1.0
		var logs: Array = result.get("logs", [])
		for log_value: Variant in logs: battle_log.append(String(log_value))
		_update_battle_hud()
		status_label.text = String(card.get("name", "技能"))
		await fx.play_card(player_sprite, enemy_sprite, camera, card, int(result.get("damage", 0)))
		if stage_index == 2 and int(result.get("damage", 0)) > 0 and int(player.get("hp", 0)) > 0:
			var reflect: int = mini(45, maxi(8, roundi(float(result["damage"]) * 0.10)))
			player["hp"] = maxi(0, int(player["hp"]) - reflect)
			battle_log.append("硬殼反震 %d" % reflect)
			_update_battle_hud()
		await get_tree().create_timer(0.18).timeout
	if int(enemy.get("hp", 0)) > 0 and int(player.get("hp", 0)) > 0:
		status_label.text = "%s 反擊" % String(GameData.STAGES[stage_index]["name"])
		var enemy_logs: Array[String] = GameData.enemy_attack(enemy, player, String(GameData.STAGES[stage_index]["id"]))
		for entry: String in enemy_logs: battle_log.append(entry)
		_update_battle_hud()
		await fx.play_enemy_attack(enemy_sprite, player_sprite, camera)
	var player_end: Array[String] = GameData.end_round(player)
	var enemy_end: Array[String] = GameData.end_round(enemy)
	for entry: String in player_end: battle_log.append(entry)
	for entry: String in enemy_end: battle_log.append(entry)
	if GameState.pet == "owl" and int(player.get("hp", 0)) > 0:
		var stable: int = 0
		for card: Dictionary in selected_cards:
			if ["green", "blue"].has(String(card.get("color", ""))): stable += 1
		if stable >= 2:
			var heal: int = roundi(float(player["max_hp"]) * 0.08)
			var before: int = int(player["hp"])
			player["hp"] = mini(int(player["max_hp"]), before + heal)
			battle_log.append("夜梟守心 +%d" % [int(player["hp"]) - before])
	_update_battle_hud()
	await get_tree().create_timer(0.55).timeout
	battle_busy = false
	if int(player.get("hp", 0)) <= 0 or int(enemy.get("hp", 0)) <= 0:
		_finish_battle()
	else:
		round_no += 1
		_prepare_card_round()

func _finish_battle() -> void:
	selection_deadline = 0
	question_deadline = 0
	var win: bool = int(enemy.get("hp", 0)) <= 0 and int(player.get("hp", 0)) > 0
	if win:
		var exp_gain: int = 80 + stage_index * 25
		last_reward = GameState.add_xp(exp_gain)
		last_loot = GameData.roll_loot(stage_index, GameState.level)
		if not last_loot.is_empty(): GameState.add_loot(last_loot)
		GameState.unlock_next_stage(stage_index)
		if GameState.authenticated: GameState.sync_cloudflare_progress()
	_render_result(win)

func _render_result(win: bool) -> void:
	mode = "result"
	_clear_scene()
	_add_background(0.58)
	var banner_path: String = "res://images/victor.png" if win else "res://images/fail.png"
	var banner: Sprite2D = _sprite_from_path(banner_path, Vector2(360, 190), Vector2(420, 160))
	if banner == null:
		_label("VICTORY" if win else "FAILED", Vector2(110, 110), Vector2(500, 100), 42, HORIZONTAL_ALIGNMENT_CENTER)
	var role_path: String = String(GameData.ROLES[GameState.role]["art"])
	_sprite_from_path(role_path, Vector2(250, 530), Vector2(340, 520))
	var enemy_path: String = String(GameData.STAGES[stage_index]["art"])
	var foe: Sprite2D = _sprite_from_path(enemy_path, Vector2(535, 565), Vector2(250, 350))
	if foe != null and win: foe.modulate = Color(0.45, 0.45, 0.45, 0.75)
	if win:
		_label("EXP +%d" % int(last_reward.get("amount", 0)), Vector2(190, 760), Vector2(340, 50), 27, HORIZONTAL_ALIGNMENT_CENTER)
		if not last_loot.is_empty():
			_label("掉落：%s" % String(last_loot.get("name", "裝備")), Vector2(100, 825), Vector2(520, 55), 23, HORIZONTAL_ALIGNMENT_CENTER)
			var loot_path: String = String(last_loot.get("art", ""))
			_sprite_from_path(loot_path, Vector2(360, 940), Vector2(190, 190))
		else:
			_label("本關沒有掉落裝備", Vector2(150, 840), Vector2(420, 44), 19, HORIZONTAL_ALIGNMENT_CENTER)
		var continue_button: Button = _make_button("返回地圖", Vector2(195, 1090), Vector2(330, 74), 24)
		continue_button.pressed.connect(_render_map)
	else:
		_label("挑戰失敗", Vector2(190, 790), Vector2(340, 50), 28, HORIZONTAL_ALIGNMENT_CENTER)
		var retry: Button = _make_button("重新挑戰", Vector2(195, 900), Vector2(330, 74), 24)
		retry.pressed.connect(_start_stage.bind(stage_index))
		var map_button: Button = _make_button("返回地圖", Vector2(195, 995), Vector2(330, 70), 21)
		map_button.pressed.connect(_render_map)
	if not battle_log.is_empty():
		_label("最後紀錄：%s" % battle_log.back(), Vector2(80, 1190), Vector2(560, 36), 16, HORIZONTAL_ALIGNMENT_CENTER)

func _render_inventory() -> void:
	mode = "inventory"
	_clear_scene()
	_add_background(0.48)
	_add_title("背包", "%d / 60" % GameState.inventory.size())
	var scroll: ScrollContainer = ScrollContainer.new()
	scroll.position = Vector2(45, 150)
	scroll.size = Vector2(630, 880)
	hud.add_child(scroll)
	var list: VBoxContainer = VBoxContainer.new()
	list.custom_minimum_size = Vector2(610, 0)
	list.add_theme_constant_override("separation", 10)
	scroll.add_child(list)
	if GameState.inventory.is_empty():
		var empty: Label = Label.new()
		empty.text = "尚未取得裝備\n擊敗怪物會有機率掉落"
		empty.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		empty.add_theme_font_size_override("font_size", 22)
		empty.custom_minimum_size = Vector2(610, 180)
		list.add_child(empty)
	else:
		for item: Dictionary in GameState.inventory:
			var row: Button = Button.new()
			row.custom_minimum_size = Vector2(600, 105)
			row.text = "%s　Lv.%d" % [String(item.get("name", "裝備")), int(item.get("level", 1))]
			row.add_theme_font_size_override("font_size", 19)
			var tex: Texture2D = _load_texture(String(item.get("art", "")))
			if tex != null:
				row.icon = tex
				row.expand_icon = true
				row.add_theme_constant_override("icon_max_width", 82)
			row.add_theme_stylebox_override("normal", _box(Color(0.12, 0.13, 0.14, 0.9), 15, Color(0.52, 0.53, 0.52, 0.4), 1))
			list.add_child(row)
	var back: Button = _make_button("返回", Vector2(245, 1080), Vector2(230, 72), 22)
	back.pressed.connect(_render_map if GameState.unlocked_stage > 0 else _render_home)

func _build_battle_arena() -> void:
	_add_background(0.70)
	var role_path: String = String(GameData.ROLES[GameState.role]["art"])
	var enemy_path: String = String(GameData.STAGES[stage_index]["art"])
	player_sprite = _sprite_from_path(role_path, Vector2(190, 330), Vector2(285, 410))
	enemy_sprite = _sprite_from_path(enemy_path, Vector2(545, 315), Vector2(280, 380))
	if player_sprite != null:
		fx.start_idle(player_sprite, 0.92)
	if enemy_sprite != null:
		fx.start_idle(enemy_sprite, 0.82)
	_sprite_from_path("res://images/VS.png", Vector2(365, 215), Vector2(120, 120))
	_label("Lv.%d %s" % [GameState.level, String(GameData.ROLES[GameState.role]["name"])], Vector2(28, 60), Vector2(290, 35), 18)
	_label(String(GameData.STAGES[stage_index]["name"]), Vector2(430, 60), Vector2(260, 35), 18, HORIZONTAL_ALIGNMENT_RIGHT)
	player_hp_bar = _health_bar(Vector2(28, 100), Vector2(292, 24), player)
	enemy_hp_bar = _health_bar(Vector2(400, 100), Vector2(292, 24), enemy)
	_update_battle_hud()

func _update_battle_hud() -> void:
	if is_instance_valid(player_hp_bar):
		player_hp_bar.max_value = maxf(1.0, float(player.get("max_hp", 1)))
		player_hp_bar.value = float(player.get("hp", 0))
		player_hp_bar.tooltip_text = "HP %d / %d　Shield %d" % [int(player.get("hp", 0)), int(player.get("max_hp", 1)), int(player.get("shield", 0))]
	if is_instance_valid(enemy_hp_bar):
		enemy_hp_bar.max_value = maxf(1.0, float(enemy.get("max_hp", 1)))
		enemy_hp_bar.value = float(enemy.get("hp", 0))
		enemy_hp_bar.tooltip_text = "HP %d / %d　Shield %d" % [int(enemy.get("hp", 0)), int(enemy.get("max_hp", 1)), int(enemy.get("shield", 0))]

func _health_bar(at: Vector2, size_value: Vector2, fighter: Dictionary) -> ProgressBar:
	var bar: ProgressBar = ProgressBar.new()
	bar.position = at
	bar.size = size_value
	bar.show_percentage = false
	bar.max_value = maxf(1.0, float(fighter.get("max_hp", 1)))
	bar.value = float(fighter.get("hp", 0))
	bar.add_theme_stylebox_override("background", _box(Color(0.08, 0.09, 0.09, 0.9), 10, Color(0.3, 0.3, 0.3, 0.5), 1))
	bar.add_theme_stylebox_override("fill", _box(Color(0.52, 0.68, 0.53, 0.95), 10, Color.TRANSPARENT, 0))
	hud.add_child(bar)
	return bar

func _add_background(alpha: float = 1.0) -> void:
	var bg: Sprite2D = Sprite2D.new()
	bg.texture = BG_TEXTURE
	bg.position = VIEW_SIZE * 0.5
	bg.z_index = -50
	_fit_sprite(bg, VIEW_SIZE, true)
	bg.modulate.a = alpha
	bg.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	add_child(bg)
	var shade: ColorRect = ColorRect.new()
	shade.position = Vector2.ZERO
	shade.size = VIEW_SIZE
	shade.color = Color(0.035, 0.04, 0.045, 0.22)
	hud.add_child(shade)
	shade.mouse_filter = Control.MOUSE_FILTER_IGNORE

func _add_title(title: String, subtitle: String) -> void:
	_label(title, Vector2(40, 35), Vector2(640, 60), 34, HORIZONTAL_ALIGNMENT_CENTER)
	_label(subtitle, Vector2(40, 95), Vector2(640, 40), 18, HORIZONTAL_ALIGNMENT_CENTER)

func _sprite_from_path(path: String, at: Vector2, max_size: Vector2) -> Sprite2D:
	var texture: Texture2D = _load_texture(path)
	if texture == null: return null
	var sprite: Sprite2D = Sprite2D.new()
	sprite.texture = texture
	sprite.position = at
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	_fit_sprite(sprite, max_size)
	add_child(sprite)
	return sprite

func _fit_sprite(sprite: Sprite2D, max_size: Vector2, cover: bool = false) -> void:
	if sprite.texture == null: return
	var tex_size: Vector2 = sprite.texture.get_size()
	if tex_size.x <= 0.0 or tex_size.y <= 0.0: return
	var sx: float = max_size.x / tex_size.x
	var sy: float = max_size.y / tex_size.y
	var factor: float = maxf(sx, sy) if cover else minf(sx, sy)
	sprite.scale = Vector2.ONE * factor

func _load_texture(path: String) -> Texture2D:
	if path.is_empty() or not ResourceLoader.exists(path): return null
	var resource: Resource = load(path)
	return resource as Texture2D

func _label(text_value: String, at: Vector2, size_value: Vector2, font_size: int, alignment: HorizontalAlignment = HORIZONTAL_ALIGNMENT_LEFT) -> Label:
	var label: Label = Label.new()
	label.text = text_value
	label.position = at
	label.size = size_value
	label.horizontal_alignment = alignment
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", Color(0.93, 0.90, 0.84))
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	hud.add_child(label)
	return label

func _make_button(text_value: String, at: Vector2, size_value: Vector2, font_size: int) -> Button:
	var button: Button = Button.new()
	button.text = text_value
	button.position = at
	button.size = size_value
	button.add_theme_font_size_override("font_size", font_size)
	button.add_theme_color_override("font_color", Color(0.94, 0.92, 0.87))
	button.add_theme_stylebox_override("normal", _box(Color(0.18, 0.21, 0.20, 0.95), 18, Color(0.63, 0.58, 0.48, 0.75), 2))
	button.add_theme_stylebox_override("hover", _box(Color(0.24, 0.28, 0.26, 0.98), 18, Color(0.80, 0.69, 0.49, 0.95), 2))
	button.add_theme_stylebox_override("pressed", _box(Color(0.12, 0.15, 0.14, 0.98), 18, Color(0.89, 0.72, 0.40, 1.0), 3))
	hud.add_child(button)
	return button

func _image_choice_button(path: String, title: String, at: Vector2, size_value: Vector2, selected: bool) -> Button:
	var button: Button = Button.new()
	button.position = at
	button.size = size_value
	button.text = ("✓ " if selected else "") + title
	button.vertical_icon_alignment = VERTICAL_ALIGNMENT_TOP
	button.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
	button.alignment = HORIZONTAL_ALIGNMENT_CENTER
	button.add_theme_font_size_override("font_size", 19)
	var texture: Texture2D = _load_texture(path)
	if texture != null:
		button.icon = texture
		button.expand_icon = true
		button.add_theme_constant_override("icon_max_width", int(size_value.x - 30.0))
	var fill: Color = Color(0.25, 0.31, 0.27, 0.96) if selected else Color(0.10, 0.11, 0.12, 0.90)
	var edge: Color = Color(0.84, 0.70, 0.42, 1.0) if selected else Color(0.48, 0.49, 0.47, 0.45)
	button.add_theme_stylebox_override("normal", _box(fill, 18, edge, 3 if selected else 1))
	hud.add_child(button)
	return button

func _box(fill: Color, radius: int, border: Color, width: int) -> StyleBoxFlat:
	var style: StyleBoxFlat = StyleBoxFlat.new()
	style.bg_color = fill
	style.corner_radius_top_left = radius
	style.corner_radius_top_right = radius
	style.corner_radius_bottom_left = radius
	style.corner_radius_bottom_right = radius
	style.border_width_left = width
	style.border_width_right = width
	style.border_width_top = width
	style.border_width_bottom = width
	style.border_color = border
	return style