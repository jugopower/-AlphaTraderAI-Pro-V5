# Build022.4 Professional Stable RC3

修正重點：
- 修正「計算勝負」出現 `Can't find variable: currentSnapshot` 的錯誤。
- 新增統一的目前棋盤快照取得函式。
- 本機勝負估算若快照缺失，會重新建立目前局面，不再中斷。
- 保留 RC2 的立即顯示結果與 KataGo 背景更新機制。
- SGF 版本資訊更新為 Build022.4 RC3。

請在 iPad Safari 實機測試；尚未宣稱所有終局局面均已驗證。
