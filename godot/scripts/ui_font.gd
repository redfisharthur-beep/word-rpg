extends RefCounted
class_name WordRpgUiFont

# Noto Sans TC 400 subsets containing every Traditional Chinese glyph currently
# used by Word RPG's Godot UI and vocabulary. TC-209 includes ASCII/Latin and
# acts as the primary face; the other files are glyph fallbacks.
const MERGED_FONT_PATH := "res://godot/fonts/noto-tc/WordRpgNotoSansTC.ttf"

const FONT_PATHS: Array[String] = [
	"res://godot/fonts/noto-tc/TC-209.woff2",
	"res://godot/fonts/noto-tc/TC-115.woff2",
	"res://godot/fonts/noto-tc/TC-124.woff2",
	"res://godot/fonts/noto-tc/TC-125.woff2",
	"res://godot/fonts/noto-tc/TC-130.woff2",
	"res://godot/fonts/noto-tc/TC-131.woff2",
	"res://godot/fonts/noto-tc/TC-134.woff2",
	"res://godot/fonts/noto-tc/TC-138.woff2",
	"res://godot/fonts/noto-tc/TC-145.woff2",
	"res://godot/fonts/noto-tc/TC-146.woff2",
	"res://godot/fonts/noto-tc/TC-148.woff2",
	"res://godot/fonts/noto-tc/TC-150.woff2",
	"res://godot/fonts/noto-tc/TC-153.woff2",
	"res://godot/fonts/noto-tc/TC-161.woff2",
	"res://godot/fonts/noto-tc/TC-162.woff2",
	"res://godot/fonts/noto-tc/TC-164.woff2",
	"res://godot/fonts/noto-tc/TC-177.woff2",
	"res://godot/fonts/noto-tc/TC-186.woff2",
	"res://godot/fonts/noto-tc/TC-187.woff2",
	"res://godot/fonts/noto-tc/TC-188.woff2",
	"res://godot/fonts/noto-tc/TC-189.woff2",
	"res://godot/fonts/noto-tc/TC-190.woff2",
	"res://godot/fonts/noto-tc/TC-191.woff2",
	"res://godot/fonts/noto-tc/TC-192.woff2",
	"res://godot/fonts/noto-tc/TC-193.woff2",
	"res://godot/fonts/noto-tc/TC-194.woff2",
	"res://godot/fonts/noto-tc/TC-195.woff2",
	"res://godot/fonts/noto-tc/TC-196.woff2",
	"res://godot/fonts/noto-tc/TC-197.woff2",
	"res://godot/fonts/noto-tc/TC-198.woff2",
	"res://godot/fonts/noto-tc/TC-199.woff2",
	"res://godot/fonts/noto-tc/TC-200.woff2",
	"res://godot/fonts/noto-tc/TC-201.woff2",
	"res://godot/fonts/noto-tc/TC-202.woff2",
	"res://godot/fonts/noto-tc/TC-203.woff2",
	"res://godot/fonts/noto-tc/TC-204.woff2",
	"res://godot/fonts/noto-tc/TC-205.woff2"
]

static var _cached_font: Font
static var _font_faces: Array[Font] = []

static func _tune_font(font: Font) -> Font:
	if font is FontFile:
		var file := font as FontFile
		# Small Traditional Chinese glyphs are frequently scaled down by the
		# 720x1280 canvas on Web. Render them at a higher internal resolution
		# and use stronger hinting/subpixel positioning for crisper strokes.
		file.antialiasing = TextServer.FONT_ANTIALIASING_GRAY
		file.hinting = TextServer.HINTING_NORMAL
		file.force_autohinter = true
		file.subpixel_positioning = TextServer.SUBPIXEL_POSITIONING_ONE_QUARTER
		file.generate_mipmaps = true
		file.oversampling = 2.0
	return font

static func get_font() -> Font:
	if _cached_font != null:
		return _cached_font

	if ResourceLoader.exists(MERGED_FONT_PATH):
		var merged_resource := load(MERGED_FONT_PATH)
		if merged_resource is Font:
			var merged_font := merged_resource as Font
			var merged_fallbacks: Array[Font] = []
			for path: String in FONT_PATHS:
				if not ResourceLoader.exists(path):
					continue
				var fallback_resource := load(path)
				if fallback_resource is Font:
					merged_fallbacks.append(fallback_resource as Font)
			merged_font.fallbacks = merged_fallbacks
			_cached_font = _tune_font(merged_font)
			_font_faces = [_cached_font]
			for fallback: Font in merged_fallbacks:
				_font_faces.append(fallback)
			return _cached_font

	var loaded: Array[Font] = []
	for path: String in FONT_PATHS:
		if not ResourceLoader.exists(path):
			continue
		var resource := load(path)
		if resource is Font:
			loaded.append(resource as Font)

	if loaded.is_empty():
		push_warning("Word RPG Traditional Chinese font subsets are unavailable; using Godot fallback font.")
		return null

	_font_faces = loaded
	for i: int in range(loaded.size()):
		loaded[i] = _tune_font(loaded[i])
	var primary: Font = loaded[0]
	var fallbacks: Array[Font] = []
	for i: int in range(1, loaded.size()):
		fallbacks.append(loaded[i])
	primary.fallbacks = fallbacks
	_cached_font = primary
	return _cached_font

static func apply(control: Control) -> void:
	var font := get_font()
	if font != null:
		control.add_theme_font_override("font", font)

static func supports_char(codepoint: int) -> bool:
	get_font()
	for face: Font in _font_faces:
		if face.has_char(codepoint):
			return true
	return false
