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
var busy := false

func _ready() -> void:
	_build_scene()
	fx = BattleFx.new()
	add_child(fx)
	fx.start_idle(player)
	fx.start_idle(enemy, 0.92)

func _build_scene() -> void:
	camera = Camera2D.new()
	camera.position = Vector2(360, 640)
	add_child(camera)
	camera.make_current()

	var bg := Sprite2D.new()
	bg.texture = BG_TEXTURE
	bg.position = Vector2(360, 640)
	bg.z_index = -20
	_fit_sprite(bg, Vector2(720, 1280), true)
	add_child(bg)

	player = Sprite2D.new()
	player.name = "Player"
	player.texture = PLAYER_TEXTURE
	player.position = Vector2(185, 770)
	_fit_sprite(player, Vector2(285, 430))
	add_child(player)

	enemy = Sprite2D.new()
	enemy.name = "Enemy"
	enemy.texture = ENEMY_TEXTURE
	enemy.position = Vector2(545, 685)
	_fit_sprite(enemy, Vector2(285, 390))
	add_child(enemy)

	var versus := Sprite2D.new()
	versus.texture = VS_TEXTURE
	versus.position = Vector2(365, 525)
	versus.modulate.a = 0.86
	_fit_sprite(versus, Vector2(145, 145))
	add_child(versus)

	var hud := CanvasLayer.new()
	add_child(hud)

	var title := Label.new()
	title.text = "WORD RPG · GODOT FX"
	title.position = Vector2(36, 48)
	title.add_theme_font_size_override("font_size", 28)
	title.add_theme_color_override("font_color", Color("e9e2d6"))
	hud.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "單張 PNG + 動態戰鬥演出"
	subtitle.position = Vector2(38, 90)
	subtitle.add_theme_font_size_override("font_size", 18)
	subtitle.add_theme_color_override("font_color", Color("c7beb2"))
	hud.add_child(subtitle)

	fight_button = Button.new()
	fight_button.text = "FIGHT"
	fight_button.position = Vector2(210, 1110)
	fight_button.size = Vector2(300, 92)
	fight_button.add_theme_font_size_override("font_size", 30)
	fight_button.pressed.connect(_on_fight_pressed)
	hud.add_child(fight_button)

func _fit_sprite(sprite: Sprite2D, max_size: Vector2, cover := false) -> void:
	var texture_size := sprite.texture.get_size()
	if texture_size.x <= 0.0 or texture_size.y <= 0.0:
		return
	var scale_x := max_size.x / texture_size.x
	var scale_y := max_size.y / texture_size.y
	var factor := max(scale_x, scale_y) if cover else min(scale_x, scale_y)
	sprite.scale = Vector2.ONE * factor

func _on_fight_pressed() -> void:
	if busy:
		return
	busy = true
	fight_button.disabled = true
	await fx.play_combo(player, enemy, camera)
	fight_button.disabled = false
	busy = false
