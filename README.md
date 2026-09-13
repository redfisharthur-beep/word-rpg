# Word RPG

莫蘭迪風格、手機優先的英語單字 RPG 網頁遊戲。

## 專案原則

1. 所有玩法調整都直接修改原始功能檔，不建立臨時補丁或重複邏輯。
2. 規則與資料集中在 `src/game-data.js`。
3. 戰鬥規則集中在 `src/battle-engine.js`。
4. 存檔集中在 `src/store.js`。
5. 畫面與事件集中在 `src/app.js`。
6. 視覺集中在 `src/styles.css`。
7. 圖像路徑集中在 `src/assets.js`，正式圖檔統一放在 `images/`。
8. 修改既有功能時，先定位原始來源，再直接替換或重構；不要在檔案尾端追加覆蓋式 CSS / JS 補丁。

## 目前內容

- 首頁
- 關卡地圖
- 3 技能戰鬥：斬擊 / Break / 守護
- 怪物意圖
- Combo 與 Break 機制
- 戰鬥傷害 / Break / 護盾動畫回饋
- 寵物選擇
- 背包與掉落
- 單字圖鑑與熟練度
- LocalStorage 存檔
- 手機優先莫蘭迪 UI
- 正式角色 / 怪物 / 寵物 / 裝備 / 技能圖像插槽
- 圖片不存在時自動使用 Emoji fallback，不影響遊戲運作

## 圖像資產

所需正式圖檔、檔名與尺寸規則請看 `images/README.md`。

新增或替換圖片時，優先直接替換既定檔案；若新增全新品項，再修改 `src/assets.js` 與對應 `src/game-data.js`，不要在畫面程式內直接寫死路徑。

## 本機啟動

這是純靜態 ES Modules 專案，請用任一靜態伺服器啟動，例如 VS Code Live Server，或：

```bash
python -m http.server 8080
```

然後開啟 `http://localhost:8080`。

## Cloudflare

目前可直接當靜態網站部署。後續加入帳號、跨裝置存檔、多人 Boss 或排行榜時，再接 Cloudflare Workers / D1 / Durable Objects。
