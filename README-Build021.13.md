# Build021.13 真人機 KataGo 強制連線版

修正內容：
- 人機對弈只採用 KataGo 第一推薦點
- 完全取消本機隨機／Demo 弱棋備援
- KataGo 失敗時 AI 不落子，直接顯示錯誤
- API 預設固定為 Render 正式網址
- API 網址自動保存
- 等待時間延長為 45 秒
- 新增「KataGo 思考中」畫面
- 棋力 Visits：
  - 入門 20
  - 初級 60
  - 高級 200
  - 1-3段 600
  - 高段 1500
  - 職業 3000

已通過 JavaScript 語法檢查；仍需在 GitHub Pages 與 Render 實際測試。
