# Build021.24 終局與 Pass 修正版

本版適用 9 路、13 路、19 路棋盤。

## 修正內容
- 玩家按 Pass 後會立即呼叫 KataGo 回應。
- KataGo 可正常回傳落子或 Pass。
- 雙方連續 Pass 時自動結束對局並計算結果。
- 終局後禁止繼續落子；按悔棋可恢復對局。
- 計算勝負優先使用 KataGo 的目差與勝率。
- KataGo 無法連線時，改用含貼目的中國規則面積估算。
- 悔棋可撤回一般落子或 Pass，並清除終局狀態。

## GitHub 上傳
覆蓋 index.html，並可一併上傳本說明檔。

Commit：Build021.24 pass and final scoring fix
