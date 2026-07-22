# Build021.15 KataGo move_infos 修正版

後端實際回傳欄位包含：
- status
- mode
- board_size
- move_count
- next_player
- winrate
- score_lead
- visits
- move_infos
- build

本版修正：
- 支援 `move_infos`
- 支援 `score_lead`
- 支援 `win_rate`
- 支援 `black_winrate`
- 支援 `policy_prob`
- 支援 `move_gtp` / `gtp_move`

這版是針對目前 Render 後端實際 JSON 格式修正。
