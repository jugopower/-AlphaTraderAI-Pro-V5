
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("goBoard");
  const board = new window.GoBoardViewer(canvas);

  const moveBadge = document.getElementById("moveBadge");
  const moveSlider = document.getElementById("moveSlider");
  const moveCounter = document.getElementById("moveCounter");
  const statusMessage = document.getElementById("statusMessage");
  const playBtn = document.getElementById("playBtn");
  const speedSelect = document.getElementById("speedSelect");

  let game = { size: 19, metadata: {}, setup: [], moves: [] };
  let index = 0;
  let timer = null;

  function render() {
    board.setPosition(game.size, game.setup, game.moves, index);
    moveBadge.textContent = `第 ${index} 手`;
    moveSlider.max = String(game.moves.length);
    moveSlider.value = String(index);
    moveCounter.textContent = `${index} / ${game.moves.length}`;
    document.getElementById("boardTitle").textContent = `${game.size} 路棋盤`;

    const move = index > 0 ? game.moves[index - 1] : null;
    statusMessage.textContent = move?.comment || (index === 0 ? "棋譜起始位置" : "棋譜播放中");
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    playBtn.textContent = "▶ 播放";
  }

  function play() {
    if (timer) {
      stop();
      return;
    }

    if (index >= game.moves.length) index = 0;
    playBtn.textContent = "⏸ 暫停";

    timer = setInterval(() => {
      if (index >= game.moves.length) {
        stop();
        return;
      }
      index += 1;
      render();
    }, Number(speedSelect.value));
  }

  function loadGame(parsed, sourceName) {
    stop();
    game = parsed;
    index = 0;

    document.getElementById("blackName").textContent = parsed.metadata.blackName;
    document.getElementById("whiteName").textContent = parsed.metadata.whiteName;
    document.getElementById("result").textContent = parsed.metadata.result;
    document.getElementById("gameDate").textContent = parsed.metadata.date;
    document.getElementById("eventName").textContent = parsed.metadata.event;
    document.getElementById("komi").textContent = parsed.metadata.komi;

    statusMessage.textContent = `已載入：${sourceName}`;
    render();
  }

  document.getElementById("sgfFile").addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      loadGame(window.SGFParser.parse(text), file.name);
    } catch (error) {
      statusMessage.textContent = `載入失敗：${error.message}`;
    } finally {
      event.target.value = "";
    }
  });

  document.getElementById("sampleBtn").addEventListener("click", () => {
    const sample = `(;GM[1]FF[4]CA[UTF-8]SZ[19]KM[6.5]
PB[朱老師]PW[AI 示範棋手]RE[B+R]DT[2026-07-11]EV[Build001-004 範例棋譜]
;B[pd]C[黑棋右上角小目]
;W[dd]C[白棋左上角小目]
;B[qp]
;W[dq]
;B[fc]
;W[cf]
;B[qf]
;W[nc]
;B[oc]
;W[nd]
;B[oe]
;W[md]
;B[pe]
;W[qc]
;B[pc]
;W[qd]
;B[od]
;W[rc]
;B[qe]
;W[re])`;

    try {
      loadGame(window.SGFParser.parse(sample), "內建範例棋譜");
    } catch (error) {
      statusMessage.textContent = error.message;
    }
  });

  document.getElementById("firstBtn").addEventListener("click", () => { stop(); index = 0; render(); });
  document.getElementById("prevBtn").addEventListener("click", () => { stop(); index = Math.max(0, index - 1); render(); });
  document.getElementById("nextBtn").addEventListener("click", () => { stop(); index = Math.min(game.moves.length, index + 1); render(); });
  document.getElementById("lastBtn").addEventListener("click", () => { stop(); index = game.moves.length; render(); });
  playBtn.addEventListener("click", play);

  moveSlider.addEventListener("input", () => {
    stop();
    index = Number(moveSlider.value);
    render();
  });

  speedSelect.addEventListener("change", () => {
    if (timer) {
      stop();
      play();
    }
  });

  document.getElementById("sampleBtn").click();  // Build019.9：連接 AlphaTrader KataGo Server

  const KATAGO_API_URL =

    "https://alphatrader-katago-server-v2.onrender.com/analyze";

  const aiPanel = document.createElement("section");

  aiPanel.style.margin = "20px auto";

  aiPanel.style.padding = "18px";

  aiPanel.style.maxWidth = "900px";

  aiPanel.style.border = "1px solid #d8dee8";

  aiPanel.style.borderRadius = "14px";

  aiPanel.style.background = "#ffffff";

  aiPanel.innerHTML = `

    <h2 style="margin-top:0;">🤖 KataGo AI 分析</h2>

    <button id="kataGoAnalyzeBtn" type="button"

      style="

        width:100%;

        padding:14px;

        border:0;

        border-radius:10px;

        font-size:18px;

        font-weight:700;

        cursor:pointer;

      ">

      開始 AI 分析目前局面

    </button>

    <div id="kataGoResult"

      style="

        margin-top:14px;

        padding:14px;

        min-height:60px;

        border-radius:10px;

        background:#f5f7fa;

        white-space:pre-wrap;

        line-height:1.7;

      ">

      尚未進行分析

    </div>

  `;

  const aiTarget = document.querySelector("main") || document.body;

  aiTarget.appendChild(aiPanel);

  const kataGoAnalyzeBtn =

    document.getElementById("kataGoAnalyzeBtn");

  const kataGoResult =

    document.getElementById("kataGoResult");

  const GTP_COLUMNS = "ABCDEFGHJKLMNOPQRSTUVWXYZ";

  function moveToGtp(move, boardSize) {

    if (!move) return "pass";

    if (typeof move === "string") {

      return move;

    }

    if (typeof move.gtp === "string") {

      return move.gtp;

    }

    if (typeof move.vertex === "string") {

      return move.vertex;

    }

    let x = move.x;

    let y = move.y;

    if (Array.isArray(move.point)) {

      x = move.point[0];

      y = move.point[1];

    }

    if (Array.isArray(move.coord)) {

      x = move.coord[0];

      y = move.coord[1];

    }

    if (

      !Number.isInteger(x) ||

      !Number.isInteger(y) ||

      x < 0 ||

      y < 0

    ) {

      return "pass";

    }

    const column = GTP_COLUMNS[x];

    const row = boardSize - y;

    return `${column}${row}`;

  }

  kataGoAnalyzeBtn.addEventListener("click", async () => {

    const boardSize = Number(game.size) || 19;

    const currentMoves = game.moves

      .slice(0, index)

      .map(move => moveToGtp(move, boardSize));

    const nextPlayer =

      currentMoves.length % 2 === 0 ? "B" : "W";

    const komi =

      Number.parseFloat(game.metadata?.komi) || 7.5;

    kataGoAnalyzeBtn.disabled = true;

    kataGoAnalyzeBtn.textContent = "KataGo 分析中…";

    kataGoResult.textContent =

      "正在連接 AI 伺服器，免費伺服器第一次啟動可能需要約 30～60 秒。";

    try {

      const response = await fetch(KATAGO_API_URL, {

        method: "POST",

        headers: {

          "Content-Type": "application/json"

        },

        body: JSON.stringify({

          board_size: boardSize,

          moves: currentMoves,

          next_player: nextPlayer,

          komi: komi

        })

      });

      const data = await response.json();

      if (!response.ok || data.status !== "ok") {

        throw new Error(

          data.detail ||

          data.message ||

          data.error ||

          `伺服器錯誤：${response.status}`

        );

      }

      const bestMove =

        data.move_infos?.[0]?.move || "無推薦手";

      const winrate =

        typeof data.winrate === "number"

          ? `${(data.winrate * 100).toFixed(2)}%`

          : "無資料";

      const scoreLead =

        typeof data.score_lead === "number"

          ? `${data.score_lead.toFixed(2)} 目`

          : "無資料";

      const visits =

        data.visits ?? "無資料";

      kataGoResult.textContent =

        `✅ KataGo 分析完成\n\n` +

        `目前手數：${currentMoves.length} 手\n` +

        `下一手：${nextPlayer === "B" ? "黑棋" : "白棋"}\n` +

        `AI 推薦手：${bestMove}\n` +

        `目前執子方勝率：${winrate}\n` +

        `預估目差：${scoreLead}\n` +

        `分析次數：${visits}`;

    } catch (error) {

      kataGoResult.textContent =

        `❌ AI 分析失敗\n\n${error.message}`;

    } finally {

      kataGoAnalyzeBtn.disabled = false;

      kataGoAnalyzeBtn.textContent =

        "重新分析目前局面";

    }

  });
});
