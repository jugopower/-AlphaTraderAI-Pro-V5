# AlphaTrader AI Pro V5 — Build024.3 Real KataGo

## 本版重點

- 嚴格真實 KataGo 模式：連線失敗時不再顯示本機示範勝率或推薦手。
- 分析 API 同時送出 camelCase 與 snake_case 欄位，提高 Render 後端相容性。
- 同時支援棋步陣列格式與物件格式。
- 傳送規則、貼目、手番、Visits、Ownership 與 Policy 要求。
- AI 人機對弈仍採真實 KataGo 回傳結果；失敗時停止落子，不使用假 AI。
- 保留 Build024.2 的棋盤、SGF、正式數地、計時器及 iPad 介面。

## 部署後測試

1. 開啟 KataGo 設定。
2. 確認 API：`https://alphatrader-katago-server-v2.onrender.com/analyze`
3. 先以 9 路空棋盤、30 visits 測試。
4. 顯示「真實 KataGo Online」後，再測試人機對弈。

## 重要限制

本 ZIP 是前端完整部署版。Render 服務本身必須已部署可運作的 KataGo API，並允許 GitHub Pages 網域的 CORS 請求。若 Render 後端未啟動、網址錯誤或 API JSON 規格不符，前端會顯示連線失敗，不會偽造分析結果。
