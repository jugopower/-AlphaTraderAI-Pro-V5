
class GoBoard {
  constructor(canvas, options = {}) {
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error("找不到棋盤 canvas。");

    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.size = options.size || 13;
    this.paddingRatio = 0.065;
    this.board = this.createEmptyBoard(this.size);
    this.currentColor = 1; // 1 black, -1 white
    this.history = [];
    this.positionHistory = [this.serializeBoard(this.board)];
    this.captures = { black: 0, white: 0 };

    this.handlePointer = this.handlePointer.bind(this);
    this.resize = this.resize.bind(this);

    this.canvas.addEventListener("pointerup", this.handlePointer);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(this.canvas.parentElement);
    this.resize();
    this.emitChange("請黑棋落子");
  }

  createEmptyBoard(size) {
    return Array.from({ length: size }, () => Array(size).fill(0));
  }

  cloneBoard(board) {
    return board.map(row => [...row]);
  }

  serializeBoard(board) {
    return board.map(row => row.join(",")).join("|");
  }

  setSize(size) {
    if (![9, 13, 19].includes(size)) return;
    this.size = size;
    this.clear();
  }

  clear() {
    this.board = this.createEmptyBoard(this.size);
    this.currentColor = 1;
    this.history = [];
    this.positionHistory = [this.serializeBoard(this.board)];
    this.captures = { black: 0, white: 0 };
    this.draw();
    this.emitChange("棋盤已清空");
  }

  undo() {
    const previous = this.history.pop();
    if (!previous) {
      this.emitChange("目前沒有可悔的棋");
      return;
    }

    this.board = this.cloneBoard(previous.board);
    this.currentColor = previous.currentColor;
    this.captures = { ...previous.captures };
    this.positionHistory.pop();
    this.draw();
    this.emitChange("已悔棋");
  }

  resize() {
    const parentWidth = this.canvas.parentElement.clientWidth;
    const cssSize = Math.max(280, Math.min(parentWidth, 980));
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    this.canvas.style.width = `${cssSize}px`;
    this.canvas.style.height = `${cssSize}px`;
    this.canvas.width = Math.round(cssSize * dpr);
    this.canvas.height = Math.round(cssSize * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.cssSize = cssSize;
    this.draw();
  }

  getGeometry() {
    const outer = this.cssSize;
    const padding = outer * this.paddingRatio;
    const boardMin = padding;
    const boardMax = outer - padding;
    const cell = (boardMax - boardMin) / (this.size - 1);
    return { outer, boardMin, boardMax, cell };
  }

  neighbors(x, y) {
    return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]
      .filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < this.size && ny < this.size);
  }

  getGroupAndLiberties(board, x, y) {
    const color = board[y][x];
    const stack = [[x, y]];
    const visited = new Set();
    const group = [];
    const liberties = new Set();

    while (stack.length) {
      const [cx, cy] = stack.pop();
      const key = `${cx},${cy}`;
      if (visited.has(key)) continue;
      visited.add(key);
      group.push([cx, cy]);

      for (const [nx, ny] of this.neighbors(cx, cy)) {
        const value = board[ny][nx];
        if (value === 0) liberties.add(`${nx},${ny}`);
        else if (value === color && !visited.has(`${nx},${ny}`)) stack.push([nx, ny]);
      }
    }

    return { group, liberties };
  }

  removeGroup(board, group) {
    for (const [x, y] of group) board[y][x] = 0;
  }

  tryPlayMove(x, y) {
    if (this.board[y][x] !== 0) return { ok: false, message: "這個交叉點已有棋子" };

    const nextBoard = this.cloneBoard(this.board);
    nextBoard[y][x] = this.currentColor;
    const opponent = -this.currentColor;
    let captured = 0;

    for (const [nx, ny] of this.neighbors(x, y)) {
      if (nextBoard[ny][nx] !== opponent) continue;
      const result = this.getGroupAndLiberties(nextBoard, nx, ny);
      if (result.liberties.size === 0) {
        captured += result.group.length;
        this.removeGroup(nextBoard, result.group);
      }
    }

    const own = this.getGroupAndLiberties(nextBoard, x, y);
    if (own.liberties.size === 0) {
      return { ok: false, message: "不能下自殺棋" };
    }

    const newPosition = this.serializeBoard(nextBoard);
    const previousPrevious = this.positionHistory[this.positionHistory.length - 2];

    if (previousPrevious && newPosition === previousPrevious) {
      return { ok: false, message: "打劫：不能立即回提" };
    }

    return { ok: true, nextBoard, captured, newPosition };
  }

  playMove(x, y) {
    const result = this.tryPlayMove(x, y);
    if (!result.ok) {
      this.emitChange(result.message);
      return;
    }

    this.history.push({
      board: this.cloneBoard(this.board),
      currentColor: this.currentColor,
      captures: { ...this.captures }
    });

    this.board = result.nextBoard;
    this.positionHistory.push(result.newPosition);

    if (result.captured > 0) {
      if (this.currentColor === 1) this.captures.black += result.captured;
      else this.captures.white += result.captured;
    }

    const playedColor = this.currentColor;
    this.currentColor = -this.currentColor;
    this.draw();

    const colorName = playedColor === 1 ? "黑棋" : "白棋";
    const message = result.captured > 0
      ? `${colorName}提掉 ${result.captured} 子`
      : `${colorName}已落子`;

    this.emitChange(message);
  }

  handlePointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    const localX = (event.clientX - rect.left) * (this.cssSize / rect.width);
    const localY = (event.clientY - rect.top) * (this.cssSize / rect.height);
    const { boardMin, cell } = this.getGeometry();

    const x = Math.round((localX - boardMin) / cell);
    const y = Math.round((localY - boardMin) / cell);

    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return;

    const exactX = boardMin + x * cell;
    const exactY = boardMin + y * cell;
    if (Math.hypot(localX - exactX, localY - exactY) > cell * 0.48) return;

    this.playMove(x, y);
  }

  draw() {
    if (!this.cssSize) return;
    const ctx = this.ctx;
    const { outer, boardMin, boardMax, cell } = this.getGeometry();

    ctx.clearRect(0, 0, outer, outer);

    const wood = ctx.createLinearGradient(0, 0, outer, outer);
    wood.addColorStop(0, "#efc57d");
    wood.addColorStop(.5, "#dca253");
    wood.addColorStop(1, "#bd7731");
    ctx.fillStyle = wood;
    ctx.fillRect(0, 0, outer, outer);

    this.drawWoodGrain(ctx, outer);
    this.drawGrid(ctx, boardMin, boardMax, cell);
    this.drawStarPoints(ctx, boardMin, cell);
    this.drawStones(ctx, boardMin, cell);
  }

  drawWoodGrain(ctx, outer) {
    ctx.save();
    ctx.globalAlpha = .08;
    ctx.strokeStyle = "#6a3b16";
    ctx.lineWidth = 1;

    for (let i = 0; i < 26; i++) {
      const x = (outer / 26) * i + Math.sin(i * 1.7) * 5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 9, outer * .28, x - 8, outer * .7, x + 4, outer);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawGrid(ctx, boardMin, boardMax, cell) {
    ctx.save();
    ctx.strokeStyle = "#3e2a17";
    ctx.lineWidth = Math.max(1, this.cssSize / 720);

    for (let i = 0; i < this.size; i++) {
      const p = boardMin + i * cell;
      ctx.beginPath(); ctx.moveTo(boardMin, p); ctx.lineTo(boardMax, p); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p, boardMin); ctx.lineTo(p, boardMax); ctx.stroke();
    }
    ctx.restore();
  }

  getStarIndexes() {
    if (this.size === 9) return [2, 4, 6];
    if (this.size === 13) return [3, 6, 9];
    return [3, 9, 15];
  }

  drawStarPoints(ctx, boardMin, cell) {
    const indexes = this.getStarIndexes();
    const radius = Math.max(2.5, cell * .075);

    ctx.save();
    ctx.fillStyle = "#332110";

    for (const x of indexes) {
      for (const y of indexes) {
        if (this.size === 9 && (x === 4 || y === 4) && !(x === 4 && y === 4)) continue;
        ctx.beginPath();
        ctx.arc(boardMin + x * cell, boardMin + y * cell, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawStones(ctx, boardMin, cell) {
    const radius = cell * .465;
    let moveNumber = 0;

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const value = this.board[y][x];
        if (value === 0) continue;
        moveNumber++;
        this.drawStone(ctx, boardMin + x * cell, boardMin + y * cell, radius, value === 1 ? "black" : "white");
      }
    }
  }

  drawStone(ctx, cx, cy, radius, color) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.42)";
    ctx.shadowBlur = radius * .32;
    ctx.shadowOffsetX = radius * .12;
    ctx.shadowOffsetY = radius * .16;

    const gradient = ctx.createRadialGradient(
      cx - radius * .32, cy - radius * .36, radius * .05, cx, cy, radius
    );

    if (color === "black") {
      gradient.addColorStop(0, "#737373");
      gradient.addColorStop(.25, "#242424");
      gradient.addColorStop(.72, "#080808");
      gradient.addColorStop(1, "#000");
    } else {
      gradient.addColorStop(0, "#fff");
      gradient.addColorStop(.48, "#f7f1e7");
      gradient.addColorStop(.82, "#d7d0c5");
      gradient.addColorStop(1, "#aaa297");
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.strokeStyle = color === "black" ? "#050505" : "#918a80";
    ctx.lineWidth = Math.max(1, radius * .045);
    ctx.stroke();
    ctx.restore();
  }

  emitChange(message) {
    this.canvas.dispatchEvent(new CustomEvent("boardchange", {
      detail: {
        size: this.size,
        currentColor: this.currentColor,
        captures: { ...this.captures },
        message
      }
    }));
  }
}

window.GoBoard = GoBoard;
