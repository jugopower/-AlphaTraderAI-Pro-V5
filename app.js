
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("goBoard");
  const board = new window.GoBoard(canvas, { size: 13 });

  const title = document.getElementById("boardTitle");
  const turnIndicator = document.getElementById("turnIndicator");
  const message = document.getElementById("message");
  const blackCaptures = document.getElementById("blackCaptures");
  const whiteCaptures = document.getElementById("whiteCaptures");
  const sizeButtons = [...document.querySelectorAll("[data-size]")];

  function updateUI(detail) {
    const isBlack = detail.currentColor === 1;
    turnIndicator.innerHTML = `
      <span class="turn-dot ${isBlack ? "black" : "white"}"></span>
      ${isBlack ? "黑棋落子" : "白棋落子"}
    `;
    message.textContent = detail.message || "";
    blackCaptures.textContent = detail.captures.black;
    whiteCaptures.textContent = detail.captures.white;
  }

  canvas.addEventListener("boardchange", event => updateUI(event.detail));
  document.getElementById("undoBtn").addEventListener("click", () => board.undo());
  document.getElementById("clearBtn").addEventListener("click", () => {
    if (window.confirm("確定要清空棋盤嗎？")) board.clear();
  });

  sizeButtons.forEach(button => {
    button.addEventListener("click", () => {
      const size = Number(button.dataset.size);
      sizeButtons.forEach(item => item.classList.toggle("active", item === button));
      title.textContent = `${size} 路棋盤`;
      board.setSize(size);
    });
  });
});
