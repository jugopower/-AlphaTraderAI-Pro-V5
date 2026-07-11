
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

  document.getElementById("sampleBtn").click();
});
