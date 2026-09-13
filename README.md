# Word RPG

莫蘭迪風格、手機優先的英語單字 RPG 網頁遊戲。

## 專案原則

1. 所有玩法調整都直接修改原始功能檔，不建立臨時補丁或重複邏輯。
2. 規則與資料集中在 `src/game-data.js`。
3. 戰鬥規則集中在 `src/battle-engine.js`。
4. 存檔集中在 `src/store.js`。
5. 畫面與事件集中在 `src/app.js`。
6. 視覺集中在 `src/styles.css`。
7. 未來新增圖片請統一放在 `public/images/`，並以資料欄位引用，不把圖片路徑散落在玩法邏輯中。
8. 修改既有功能時，先定位原始來源，再直接替換或重構；不要在檔案尾端追加覆蓋式 CSS / JS 補丁。

## 第一版內容

- 首頁
- 關卡地圖
- 3 技能戰鬥：斬擊 / Break / 守護
- 怪物意圖
- Combo 與 Break 機制
- 寵物選擇
- 背包與掉落
- 單字圖鑑與熟練度
- LocalStorage 存檔
- 手機優先莫蘭迪 UI

## 本機啟動

這是純靜態 ES Modules 專案，請用任一靜態伺服器啟動，例如 VS Code Live Server，或：

```bash
python -m http.server 8080
```

然後開啟 `http://localhost:8080`。

## Cloudflare

第一版可以直接當靜態網站部署。後續要加入帳號、跨裝置存檔、多人 Boss 或排行榜時，再接 Cloudflare Workers / D1 / Durable Objects。
