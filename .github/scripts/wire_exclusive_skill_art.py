from pathlib import Path

files = [Path('src/game.js'), Path('src/pk.js')]

replacements = {
    'src/game.js': (
        "function cardArt(c,mini=false){if(c?.exclusive){const r=ROLES[c.role]||ROLES.warrior;return `<span class=\"exclusive-card-art ${mini?'mini':''}\">${uiImg(r.art,c.name,'')}</span>`}return slot('card-'+c.id)}",
        "function cardArt(c,mini=false){if(c?.exclusive){const r=ROLES[c.role]||ROLES.warrior,src=c.role&&c.level?`/images/skill-${c.role}-${c.level}.png`:r.art;return `<span class=\"exclusive-card-art ${mini?'mini':''}\">${uiImg(src,c.name,'')}</span>`}return slot('card-'+c.id)}"
    ),
    'src/pk.js': (
        "  function cardArt(c,mini=false){if(c?.exclusive){const r=ROLES[c.role]||ROLES.warrior;return `<span class=\"exclusive-card-art ${mini?'mini':''}\">${uiImg(r.art,c.name,'')}</span>`}return `<span class=\"asset-slot\" data-asset=\"card-${esc(c.id)}\"></span>`}",
        "  function cardArt(c,mini=false){if(c?.exclusive){const r=ROLES[c.role]||ROLES.warrior,src=c.role&&c.level?`/images/skill-${c.role}-${c.level}.png`:r.art;return `<span class=\"exclusive-card-art ${mini?'mini':''}\">${uiImg(src,c.name,'')}</span>`}return `<span class=\"asset-slot\" data-asset=\"card-${esc(c.id)}\"></span>`}"
    )
}

for path in files:
    text = path.read_text(encoding='utf-8')
    old, new = replacements[str(path)]
    if old not in text:
        raise SystemExit(f'target not found: {path}')
    path.write_text(text.replace(old, new, 1), encoding='utf-8')
