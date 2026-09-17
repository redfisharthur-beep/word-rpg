extends "res://godot/scripts/pk_native.gd"

var last_status_text: String = ""
var last_end_title: String = ""
var last_end_win: bool = false
var cards_rendered: int = 0
var questions_rendered: int = 0
var battle_steps_rendered: int = 0

func _ready() -> void:
	# Test harness intentionally skips WebSocket connection.
	word_bank.load_from_web_source()

func _show_cards() -> void:
	cards_rendered += 1

func _show_question() -> void:
	questions_rendered += 1

func _show_status(text: String, _allow_back: bool = true) -> void:
	last_status_text = text

func _show_end(title: String, win: bool, _season_value: Variant) -> void:
	last_end_title = title
	last_end_win = win

func _show_battle_step(_step: Dictionary) -> void:
	battle_steps_rendered += 1
