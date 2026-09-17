extends "res://godot/scripts/game_v3.gd"

## Final production-facing Godot UI layer.
## Combat/progression logic remains in game_v3.gd; this file owns interactive
## pet/equipment surfaces so those systems stay out of the battle controller.

func show_setup() -> void:
	mode = "setup"
	_reset_scene()
	_add_background(BG_GAME, 0.88)
	_add_scrim(Color(0.93, 0.91, 0.87, 0.25))

	var role_panel := _panel(Rect2(26, 26, 668, 430), _role_color(GameState.role), 28, Color(1, 1, 1, 0.55), 1)
	hud.add_child(role_panel)
	var role_data: Dictionary = GameData.ROLES[GameState.role]
	role_panel.add_child(_texture(String(role_data["art"]), Rect2(34, 46, 385, 335)))
	role_panel.add_child(_label("%s   Lv.%d" % [GameState.player_name, GameState.level], Rect2(420, 58, 225, 42), 24, HORIZONTAL_ALIGNMENT_CENTER, INK))
	var title_text := GameData.title_name(GameState.level)
	if bool(GameState.collection_unlocks().get("title", false)):
		title_text = "萬象收藏家"
	role_panel.add_child(_label(title_text, Rect2(420, 102, 225, 34), 17, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	var stats: Dictionary = GameData.progression_stats(GameState.role, GameState.pet, GameState.level)
	_add_role_stats(role_panel, stats, Vector2(440, 160))
	_add_tabs(["warrior", "mage", "archer"], ["戰士", "法師", "弓手"], GameState.role, 30, 468, select_role)

	var pet_panel := _panel(Rect2(26, 535, 668, 220), _pet_color(GameState.pet), 26, Color(1, 1, 1, 0.48), 1)
	hud.add_child(pet_panel)
	var pet_data := GameState.pet_display_data(GameState.pet)
	if bool(pet_data.get("awakened", false)):
		var glow := _panel(Rect2(44, 18, 300, 180), Color(0.98, 0.88, 0.52, 0.16), 90, Color(0.94, 0.74, 0.28, 0.58), 3)
		pet_panel.add_child(glow)
		pet_panel.add_child(_label("AWAKEN", Rect2(372, 20, 240, 30), 14, HORIZONTAL_ALIGNMENT_CENTER, Color("9a7529")))
	pet_panel.add_child(_texture(String(pet_data["art"]), Rect2(62, 20, 290, 175)))
	pet_panel.add_child(_label(String(pet_data.get("name", "寵物")), Rect2(365, 54, 250, 40), 23, HORIZONTAL_ALIGNMENT_CENTER, INK))
	pet_panel.add_child(_label("強化 Lv.%d / 4" % GameState.pet_enhance_level(GameState.pet), Rect2(365, 96, 250, 30), 16, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	_add_pet_stats(pet_panel, Vector2(392, 134))
	_add_tabs(["fox", "owl", "dragon"], ["靈狐", "夜梟", "幼龍"], GameState.pet, 30, 770, select_pet)

	var button_size := Vector2(180, 92)
	var x_positions := [56.0, 270.0, 484.0]
	var top_y := 866.0
	var bottom_y := 980.0
	var fight_btn := _image_button("res://images/fight.png", Rect2(x_positions[0], top_y, button_size.x, button_size.y))
	fight_btn.pressed.connect(start_adventure)
	var pk_btn := _image_button("res://images/PK.png", Rect2(x_positions[1], top_y, button_size.x, button_size.y))
	pk_btn.pressed.connect(func() -> void: _notice("PK", "Godot 原生配對正在接 Cloudflare /match；正式 Web 版 PK 可正常使用"))
	var tower_btn := _image_button("res://images/Test.png", Rect2(x_positions[2], top_y, button_size.x, button_size.y))
	tower_btn.pressed.connect(start_tower)
	var pet_btn := _image_button("res://images/pet.png", Rect2(x_positions[0], bottom_y, button_size.x, button_size.y))
	pet_btn.pressed.connect(show_pet_progression)
	var equipment_btn := _image_button("res://images/equipment.png", Rect2(x_positions[1], bottom_y, button_size.x, button_size.y))
	equipment_btn.pressed.connect(show_inventory)
	var collection_btn := _image_button("res://images/Compendium.png", Rect2(x_positions[2], bottom_y, button_size.x, button_size.y))
	collection_btn.pressed.connect(show_collection)
	_hud_label("冒險   ·   PK   ·   試煉\n寵物   ·   裝備   ·   圖鑑", Rect2(80, 1082, 560, 58), 14, HORIZONTAL_ALIGNMENT_CENTER, Color(0.29, 0.34, 0.31, 0.72))
	var back_btn := _image_button("res://images/return.png", Rect2(280, 1160, 160, 66))
	back_btn.pressed.connect(show_home)

func show_pet_progression() -> void:
	mode = "pet-progression"
	_reset_scene()
	_add_background(BG_GAME, 0.76)
	var panel := _panel(Rect2(38, 48, 644, 1080), CREAM, 28, Color(1, 1, 1, 0.70), 1)
	hud.add_child(panel)
	panel.add_child(_label("寵物", Rect2(35, 20, 574, 55), 32, HORIZONTAL_ALIGNMENT_CENTER, INK))
	panel.add_child(_label("結晶  %d" % GameState.crystals(), Rect2(390, 78, 190, 34), 18, HORIZONTAL_ALIGNMENT_RIGHT, Color("8a6b2c")))

	var pet_data := GameState.pet_display_data(GameState.pet)
	var awakened := bool(pet_data.get("awakened", false))
	if awakened:
		var aura := _panel(Rect2(106, 128, 432, 430), Color(0.97, 0.84, 0.42, 0.11), 160, Color(0.92, 0.70, 0.25, 0.52), 3)
		panel.add_child(aura)
	panel.add_child(_texture(String(pet_data.get("art", "")), Rect2(112, 118, 420, 410)))
	panel.add_child(_label(String(pet_data.get("name", "寵物")), Rect2(130, 530, 384, 48), 28, HORIZONTAL_ALIGNMENT_CENTER, INK))
	var level := GameState.pet_enhance_level(GameState.pet)
	panel.add_child(_label("強化 Lv.%d / 4%s" % [level, " · 覺醒" if awakened else ""], Rect2(130, 578, 384, 34), 18, HORIZONTAL_ALIGNMENT_CENTER, Color("8d6d2c") if awakened else MUTED))
	panel.add_child(_label(String(pet_data.get("trait", "")), Rect2(92, 622, 460, 52), 16, HORIZONTAL_ALIGNMENT_CENTER, MUTED))

	_add_tabs(["fox", "owl", "dragon"], ["靈狐", "夜梟", "幼龍"], GameState.pet, 34, 718, _select_pet_from_progression)
	var cost := GameState.pet_enhance_cost(GameState.pet)
	if level < 4:
		var label := "強化  ·  %d 結晶" % cost
		var enhance_btn := _text_button(label, Rect2(188, 810, 344, 78), 23, Color("75633d") if GameState.can_enhance_pet(GameState.pet) else Color("a7a29a"), Color.WHITE)
		enhance_btn.disabled = not GameState.can_enhance_pet(GameState.pet)
		panel.add_child(enhance_btn)
		enhance_btn.pressed.connect(_enhance_current_pet)
		panel.add_child(_label("Lv.4 會自動覺醒；覺醒專屬圖補上後會自動替換", Rect2(95, 900, 454, 48), 15, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	else:
		panel.add_child(_label("✦  覺醒完成  ✦", Rect2(150, 820, 344, 66), 25, HORIZONTAL_ALIGNMENT_CENTER, Color("a77e28")))
		panel.add_child(_label("目前使用覺醒光環 fallback；專屬圖檔上傳後無需改程式", Rect2(90, 900, 464, 48), 15, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	var back_btn := _image_button("res://images/return.png", Rect2(280, 1160, 160, 65))
	back_btn.pressed.connect(show_setup)

func _select_pet_from_progression(id: String) -> void:
	GameState.select_pet(id)
	show_pet_progression()

func _enhance_current_pet() -> void:
	if GameState.enhance_pet(GameState.pet):
		show_pet_progression()

func show_inventory() -> void:
	mode = "inventory"
	_reset_scene()
	_add_background(BG_GAME, 0.72)
	var panel := _panel(Rect2(28, 42, 664, 1094), CREAM, 28, Color(1, 1, 1, 0.70), 1)
	hud.add_child(panel)
	panel.add_child(_label("裝備", Rect2(40, 18, 584, 52), 31, HORIZONTAL_ALIGNMENT_CENTER, INK))
	panel.add_child(_label("結晶 %d" % GameState.crystals(), Rect2(450, 68, 150, 30), 16, HORIZONTAL_ALIGNMENT_RIGHT, Color("8a6b2c")))

	var bonuses := GameState.equipment_bonuses()
	var summary := GameData.bonus_text(bonuses)
	if summary.is_empty():
		summary = "尚未裝備能力加成"
	var equipped := GameState.rpg.get("equipped", {}) as Dictionary
	var slots := "寶石 %d/3   護甲 %d/1   戒指 %d/2" % [
		(equipped.get("gems", []) as Array).size(),
		0 if equipped.get("armor", null) == null else 1,
		(equipped.get("rings", []) as Array).size()
	]
	var summary_panel := _panel(Rect2(42, 110, 580, 112), Color(0.88, 0.90, 0.86, 0.96), 20, Color(0.55, 0.63, 0.56, 0.36), 1)
	panel.add_child(summary_panel)
	summary_panel.add_child(_label(slots, Rect2(22, 12, 536, 36), 17, HORIZONTAL_ALIGNMENT_CENTER, INK))
	summary_panel.add_child(_label(summary, Rect2(22, 53, 536, 42), 16, HORIZONTAL_ALIGNMENT_CENTER, MUTED))

	var scroll := ScrollContainer.new()
	scroll.position = Vector2(34, 245)
	scroll.size = Vector2(596, 760)
	panel.add_child(scroll)
	var list := VBoxContainer.new()
	list.custom_minimum_size = Vector2(575, 0)
	list.add_theme_constant_override("separation", 10)
	scroll.add_child(list)
	if GameState.inventory.is_empty():
		list.add_child(_label("尚未取得裝備\n擊敗怪物有機率掉落", Rect2(0, 0, 570, 180), 21, HORIZONTAL_ALIGNMENT_CENTER, MUTED))
	else:
		for item: Dictionary in GameState.inventory:
			list.add_child(_equipment_row(item))
	var back_btn := _image_button("res://images/return.png", Rect2(280, 1160, 160, 65))
	back_btn.pressed.connect(show_setup)

func _equipment_row(item: Dictionary) -> Control:
	var item_id := String(item.get("id", ""))
	var equipped := GameState.is_equipped(item_id)
	var row := _panel(Rect2(), Color(0.91, 0.89, 0.84, 0.96), 18, Color(0.64, 0.61, 0.55, 0.34), 1)
	row.custom_minimum_size = Vector2(565, 146)
	row.add_child(_texture(String(item.get("art", "")), Rect2(10, 12, 112, 112)))
	var name_color := Color("8b6925") if String(item.get("quality", "")) == "mythic" else INK
	row.add_child(_label(String(item.get("name", "裝備")), Rect2(132, 12, 270, 34), 20, HORIZONTAL_ALIGNMENT_LEFT, name_color))
	var bonuses: Dictionary = item.get("bonuses", {})
	if bonuses.is_empty():
		bonuses = GameData.item_bonuses(String(item.get("type", "")), String(item.get("subtype", "")), String(item.get("quality", "common")))
	row.add_child(_label(GameData.bonus_text(bonuses), Rect2(132, 48, 300, 32), 14, HORIZONTAL_ALIGNMENT_LEFT, MUTED))
	row.add_child(_label("已裝備" if equipped else "未裝備", Rect2(132, 84, 100, 28), 14, HORIZONTAL_ALIGNMENT_LEFT, Color("55745f") if equipped else MUTED))
	var equip_btn := _text_button("卸下" if equipped else "裝上", Rect2(390, 24, 145, 46), 16, Color("61776a"), Color.WHITE)
	row.add_child(equip_btn)
	equip_btn.pressed.connect(_toggle_equipment.bind(item_id))
	var gain := int(GameState.CRYSTAL_VALUE.get(String(item.get("quality", "common")), 1))
	var dismantle_btn := _text_button("分解 +%d" % gain, Rect2(390, 82, 145, 42), 14, Color("9b8a78") if not equipped else Color("b8b2aa"), Color.WHITE)
	dismantle_btn.disabled = equipped
	row.add_child(dismantle_btn)
	dismantle_btn.pressed.connect(_dismantle_equipment.bind(item_id))
	return row

func _toggle_equipment(item_id: String) -> void:
	if GameState.is_equipped(item_id):
		GameState.unequip_item(item_id)
	else:
		GameState.equip_item(item_id)
	show_inventory()

func _dismantle_equipment(item_id: String) -> void:
	GameState.crystallize_item(item_id)
	show_inventory()
