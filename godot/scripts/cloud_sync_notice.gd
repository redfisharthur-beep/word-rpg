extends CanvasLayer

const UiFont = preload("res://godot/scripts/ui_font.gd")

var banner: Panel
var message_label: Label

func _ready() -> void:
	layer = 200
	if GameState.has_signal("cloud_conflict"):
		GameState.cloud_conflict.connect(_on_cloud_conflict)
	if bool(GameState.get("cloud_conflicted")):
		_show_banner()

func _on_cloud_conflict(_server_progress: Dictionary) -> void:
	_show_banner()

func _show_banner() -> void:
	if is_instance_valid(banner):
		banner.visible = true
		return
	banner = Panel.new()
	banner.position = Vector2(28, 22)
	banner.size = Vector2(664, 98)
	banner.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var box := StyleBoxFlat.new()
	box.bg_color = Color(0.18, 0.16, 0.13, 0.94)
	box.border_color = Color(0.88, 0.69, 0.34, 0.95)
	box.border_width_left = 2
	box.border_width_right = 2
	box.border_width_top = 2
	box.border_width_bottom = 2
	box.corner_radius_top_left = 16
	box.corner_radius_top_right = 16
	box.corner_radius_bottom_left = 16
	box.corner_radius_bottom_right = 16
	banner.add_theme_stylebox_override("panel", box)
	add_child(banner)

	message_label = Label.new()
	message_label.position = Vector2(20, 8)
	message_label.size = Vector2(624, 82)
	message_label.text = "雲端進度已在其他裝置更新\n本機進度已保留，雲端同步暫停"
	message_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	message_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	message_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	message_label.add_theme_font_size_override("font_size", 20)
	message_label.add_theme_color_override("font_color", Color(1.0, 0.95, 0.82, 1.0))
	message_label.add_theme_constant_override("outline_size", 1)
	message_label.add_theme_color_override("font_outline_color", Color(0.08, 0.07, 0.06, 0.72))
	UiFont.apply(message_label)
	message_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	banner.add_child(message_label)
