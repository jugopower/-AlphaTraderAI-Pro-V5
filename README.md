# AlphaTrader AI Pro V5 — Build024.3.2 Debug

用途：擷取 Render `/analyze` 實際回傳的完整 JSON，以確認 `move_infos` 內推薦落點的真實格式。

## 使用方式
1. 上傳 `index.html` 與 `README.md` 到 GitHub，覆蓋同名檔案。
2. 開啟 9 路人機對弈並讓 AI 思考。
3. 若前端仍找不到推薦落點，畫面會自動開啟「Render 原始 JSON」視窗。
4. 按「複製 JSON」，再把內容貼回 ChatGPT。

## 注意
- 這是診斷版，不會用示範棋力取代 KataGo。
- 棋盤、SGF、數地與計時器維持原功能。
- 找到回傳格式後，應再製作非 Debug 的正式修正版。
