extends Node2D

const BattleFx = preload("res://godot/scripts/battle_fx.gd")
const PLAYER_TEXTURE: Texture2D = preload("res://images/warrior.png")
const ENEMY_TEXTURE: Texture2D = preload("res://images/beetle.png")
const BG_TEXTURE: Texture2D = preload("res://images/bg-game.png")
const VS_TEXTURE: Texture2D = preload("res://images/VS.png")

var player: Sprite2D
var enemy: Sprite2D
var camera: Camera2D
var fx: Node
var fight_button: Button
var cloudflare_status: Label
var cloudflare_test_button: Button
var busy: bool = false

func _ready() -> void:
	_build_scene()
	fx = BattleFx.new()
	add_child(fx)
	fx.start_idle(player)
	fx.start_idle(enemy, 0.92)
	await _test_cloudflare()

func _build_scene() -> void:
	camera = Camera2D.new()
	camera.position = Vector2(360, 640)
	add_child(camera)
	camera.make_current()

	var bg: Sprite2D = Sprite2D.new()
	bg.texture = BG_TEXTURE
	bg.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	bg.position = Vector2(360, 640)
	bg.z_index = -20
	_fit_sprite(bg, Vector2(720, 1280), true)
	add_child(bg)

	player = Sprite2D.new()
	player.name = "Player"
	player.texture = PLAYER_TEXTURE
	player.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	player.position = Vector2(185, 770)
	_fit_sprite(player, Vector2(285, 430))
	add_child(player)

	enemy = Sprite2D.new()
	enemy.name = "Enemy"
	enemy.texture = ENEMY_TEXTURE
	enemy.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	enemy.position = Vector2(545, 685)
	_fit_sprite(enemy, Vector2(285, 390))
	add_child(enemy)

	var versus: Sprite2D = Sprite2D.new()
	versus.texture = VS_TEXTURE
	versus.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	versus.position = Vector2(365, 525)
	versus.modulate.a = 0.86
	_fit_sprite(versus, Vector2(145, 145))
	add_child(versus)

	var hud: CanvasLayer = CanvasLayer.new()
	add_child(hud)

	var title: Label = Label.new()
	title.text = "WORD RPG · GODOT FX"
	title.position = Vector2(36, 42)
	title.add_theme_font_size_override("font_size", 28)
	title.add_theme_color_override("font_color", Color("e9e2d6"))
	hud.add_child(title)

	var subtitle: Label = Label.new()
	subtitle.text = "單張 PNG + 動態戰鬥演出"
	subtitle.position = Vector2(38, 82)
	subtitle.add_theme_font_size_override("font_size", 18)
	subtitle.add_theme_color_override("font_color", Color("c7beb2"))
	hud.add_child(subtitle)

	var status_panel: ColorRect = ColorRect.new()
	status_panel.position = Vector2(32, 122)
	status_panel.size = Vector2(656, 104)
	status_panel.color = Color(0.08, 0.09, 0.10, 0.86)
	hud.add_child(status_panel)

	cloudflare_status = Label.new()
	cloudflare_status.text = "CLOUDFLARE API · 連線測試中…"
	cloudflare_status.position = Vector2(48, 137)
	cloudflare_status.size = Vector2(624, 36)
	cloudflare_status.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	cloudflare_status.add_theme_font_size_override("font_size", 20)
	cloudflare_status.add_theme_color_override("font_color", Color("f0d68c"))
	hud.add_child(cloudflare_status)

	cloudflare_test_button = Button.new()
	cloudflare_test_button.text = "TEST CLOUDFLARE"
	cloudflare_test_button.position = Vector2(220, 177)
	cloudflare_test_button.size = Vector2(280, 40)
	cloudflare_test_button.add_theme_font_size_override("font_size", 16)
	cloudflare_test_button.pressed.connect(_on_cloudflare_test_pressed)
	hud.add_child(cloudflare_test_button)

	fight_button = Button.new()
	fight_button.text = "FIGHT"
	fight_button.position = Vector2(210, 1110)
	fight_button.size = Vector2(300, 92)
	fight_button.add_theme_font_size_override("font_size", 30)
	fight_button.pressed.connect(_on_fight_pressed)
	hud.add_child(fight_button)

func _on_cloudflare_test_pressed() -> void:
	await _test_cloudflare()

func _test_cloudflare() -> void:
	cloudflare_test_button.disabled = true
	cloudflare_status.text = "CLOUDFLARE API · 測試中…"
	cloudflare_status.add_theme_color_override("font_color", Color("f0d68c"))

	var result: Dictionary = await CloudflareClient.test_connection()
	if bool(result.get("ok", false)):
		var data: Dictionary = result.get("data", {})
		var indices: Array = data.get("indices", [])
		cloudflare_status.text = "CLOUDFLARE API · CONNECTED · 題庫 %d 題" % indices.size()
		cloudflare_status.add_theme_color_override("font_color", Color("9ee2a4"))
		print("Cloudflare connected: ", CloudflareClient.base_url, " / questions=", indices)
	else:
		cloudflare_status.text = "CLOUDFLARE API · FAILED · %s" % String(result.get("error", "未知錯誤"))
		cloudflare_status.add_theme_color_override("font_color", Color("f1a39c"))
		print("Cloudflare failed: ", result)

	cloudflare_test_button.disabled = false

func _fit_sprite(sprite: Sprite2D, max_size: Vector2, cover: bool = false) -> void:
	var texture_size: Vector2 = sprite.texture.get_size()
	if texture_size.x <= 0.0 or texture_size.y <= 0.0:
		return
	var scale_x: float = max_size.x / texture_size.x
	var scale_y: float = max_size.y / texture_size.y
	var factor: float = maxf(scale_x, scale_y) if cover else minf(scale_x, scale_y)
	sprite.scale = Vector2.ONE * factor

func _on_fight_pressed() -> void:
	if busy:
		return
	busy = true
	fight_button.disabled = true
	await fx.play_combo(player, enemy, camera)
	fight_button.disabled = false
	busy = false
