# Word RPG 圖像資產

正式圖檔直接依照下列路徑與檔名放入，不需要修改玩法程式。

## 共通規格

- PNG 透明背景
- 建議 1024 × 1024 原圖（遊戲內會自動縮放）
- 莫蘭迪低飽和色系
- 線條乾淨、輪廓清楚、手機小尺寸仍可辨識
- 同一類角色保持一致視角與比例
- 圖內不要放文字

## 角色 `images/roles/`

- `warrior.png` — 戰士
- `mage.png` — 法師
- `archer.png` — 弓手

建議：全身或 3/4 身，角色朝右前方，透明背景。

## 寵物 `images/pets/`

- `fox.png` — 霧尾狐
- `owl.png` — 暮光鴞
- `dragon.png` — 青芽龍

建議：Q 版、辨識度高、約佔畫布 80%。

## 怪物 `images/enemies/`

- `moss.png` — 苔球獸
- `rabbit.png` — 霧角兔
- `bubble.png` — 泡泡怪
- `beetle.png` — 木甲蟲
- `shadow-king.png` — 影語王 Boss

建議：一般怪可愛但有戰鬥感；Boss 體型與氣勢明顯高一階。

## 裝備 / 素材 `images/items/`

- `mist-blade.png` — 霧鋒
- `echo-ring.png` — 回音戒
- `memory-leaf.png` — 記憶葉
- `break-charm.png` — 裂紋符
- `star-stone.png` — 星語石
- `core.png` — 進化核心

建議：物件置中，輪廓簡單，透明背景。

## 技能 `images/skills/`

- `strike.png` — 斬擊
- `break.png` — 破陣
- `guard.png` — 守護

建議：正方形圖示感，主體填滿約 75%，不放文字。

所有路徑集中在 `src/assets.js`，未來換圖只換檔案，不把路徑散落到戰鬥或 UI 邏輯。
