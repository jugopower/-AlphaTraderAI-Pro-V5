
class GoBoardViewer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.size = 19;
    this.board = this.emptyBoard(19);
    this.lastMove = null;
    this.paddingRatio = 0.065;

    this.resize = this.resize.bind(this);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(canvas.parentElement);
    this.resize();
  }

  emptyBoard(size) {
    return Array.from({ length: size }, () => Array(size).fill(0));
  }

  setPosition(size, setup, moves, moveIndex) {
    this.size = size;
    this.board = this.emptyBoard(size);
    this.lastMove = null;

    for (const stone of setup) {
      if (!stone.pass && this.inBounds(stone.x, stone.y)) {
        this.board[stone.y][stone.x] = stone.color === "black" ? 1 : -1;
      }
    }

    for (let i = 0; i < moveIndex; i += 1) {
      this.applyMove(moves[i]);
    }

    this.draw();
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.size && y < this.size;
  }

  neighbors(x, y) {
    return [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]
      .filter(([nx,ny]) => this.inBounds(nx,ny));
  }

  groupAndLiberties(x, y) {
    const color = this.board[y][x];
    const stack = [[x,y]];
    const visited = new Set();
    const group = [];
    const liberties = new Set();

    while (stack.length) {
      const [cx,cy] = stack.pop();
      const key = `${cx},${cy}`;
      if (visited.has(key)) continue;
      visited.add(key);
      group.push([cx,cy]);

      for (const [nx,ny] of this.neighbors(cx,cy)) {
        const value = this.board[ny][nx];
        if (value === 0) liberties.add(`${nx},${ny}`);
        else if (value === color && !visited.has(`${nx},${ny}`)) stack.push([nx,ny]);
      }
    }
    return { group, liberties };
  }

  removeGroup(group) {
    for (const [x,y] of group) this.board[y][x] = 0;
  }

  applyMove(move) {
    if (!move || move.pass || !this.inBounds(move.x, move.y)) {
      this.lastMove = null;
      return;
    }

    const color = move.color === "black" ? 1 : -1;
    this.board[move.y][move.x] = color;

    for (const [nx,ny] of this.neighbors(move.x, move.y)) {
      if (this.board[ny][nx] !== -color) continue;
      const result = this.groupAndLiberties(nx,ny);
      if (result.liberties.size === 0) this.removeGroup(result.group);
    }

    this.lastMove = { x: move.x, y: move.y, color };
  }

  resize() {
    const parentWidth = this.canvas.parentElement.clientWidth;
    const cssSize = Math.max(280, Math.min(parentWidth, 900));
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    this.canvas.style.width = `${cssSize}px`;
    this.canvas.style.height = `${cssSize}px`;
    this.canvas.width = Math.round(cssSize * dpr);
    this.canvas.height = Math.round(cssSize * dpr);
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.cssSize = cssSize;
    this.draw();
  }

  geometry() {
    const outer = this.cssSize;
    const pad = outer * this.paddingRatio;
    const min = pad;
    const max = outer - pad;
    const cell = (max - min) / (this.size - 1);
    return { outer, min, max, cell };
  }

  draw() {
    if (!this.cssSize) return;
    const ctx = this.ctx;
    const { outer, min, max, cell } = this.geometry();

    ctx.clearRect(0,0,outer,outer);

    const wood = ctx.createLinearGradient(0,0,outer,outer);
    wood.addColorStop(0,"#efc57d");
    wood.addColorStop(.5,"#dca253");
    wood.addColorStop(1,"#bd7731");
    ctx.fillStyle = wood;
    ctx.fillRect(0,0,outer,outer);

    this.drawWood(ctx, outer);
    this.drawGrid(ctx, min, max, cell);
    this.drawStars(ctx, min, cell);
    this.drawStones(ctx, min, cell);
  }

  drawWood(ctx, outer) {
    ctx.save();
    ctx.globalAlpha = .08;
    ctx.strokeStyle = "#6a3b16";

    for (let i=0;i<26;i++) {
      const x=(outer/26)*i+Math.sin(i*1.7)*5;
      ctx.beginPath();
      ctx.moveTo(x,0);
      ctx.bezierCurveTo(x+9,outer*.28,x-8,outer*.7,x+4,outer);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawGrid(ctx, min, max, cell) {
    ctx.save();
    ctx.strokeStyle="#3e2a17";
    ctx.lineWidth=Math.max(1,this.cssSize/720);

    for(let i=0;i<this.size;i++) {
      const p=min+i*cell;
      ctx.beginPath();ctx.moveTo(min,p);ctx.lineTo(max,p);ctx.stroke();
      ctx.beginPath();ctx.moveTo(p,min);ctx.lineTo(p,max);ctx.stroke();
    }
    ctx.restore();
  }

  starIndexes() {
    if(this.size===9) return [2,4,6];
    if(this.size===13) return [3,6,9];
    return [3,9,15];
  }

  drawStars(ctx,min,cell) {
    const indexes=this.starIndexes();
    const r=Math.max(2.5,cell*.075);
    ctx.fillStyle="#332110";

    for(const x of indexes) {
      for(const y of indexes) {
        if(this.size===9&&(x===4||y===4)&&!(x===4&&y===4)) continue;
        ctx.beginPath();
        ctx.arc(min+x*cell,min+y*cell,r,0,Math.PI*2);
        ctx.fill();
      }
    }
  }

  drawStones(ctx,min,cell) {
    const radius=cell*.465;

    for(let y=0;y<this.size;y++) {
      for(let x=0;x<this.size;x++) {
        const value=this.board[y][x];
        if(value===0) continue;
        this.drawStone(ctx,min+x*cell,min+y*cell,radius,value===1?"black":"white");
      }
    }

    if(this.lastMove) {
      const cx=min+this.lastMove.x*cell;
      const cy=min+this.lastMove.y*cell;
      ctx.fillStyle="#e5483f";
      ctx.beginPath();
      ctx.arc(cx,cy,radius*.16,0,Math.PI*2);
      ctx.fill();
    }
  }

  drawStone(ctx,cx,cy,radius,color) {
    ctx.save();
    ctx.shadowColor="rgba(0,0,0,.42)";
    ctx.shadowBlur=radius*.32;
    ctx.shadowOffsetX=radius*.12;
    ctx.shadowOffsetY=radius*.16;

    const g=ctx.createRadialGradient(cx-radius*.32,cy-radius*.36,radius*.05,cx,cy,radius);

    if(color==="black") {
      g.addColorStop(0,"#737373");g.addColorStop(.25,"#242424");
      g.addColorStop(.72,"#080808");g.addColorStop(1,"#000");
    } else {
      g.addColorStop(0,"#fff");g.addColorStop(.48,"#f7f1e7");
      g.addColorStop(.82,"#d7d0c5");g.addColorStop(1,"#aaa297");
    }

    ctx.fillStyle=g;
    ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fill();
    ctx.shadowColor="transparent";
    ctx.strokeStyle=color==="black"?"#050505":"#918a80";
    ctx.lineWidth=Math.max(1,radius*.045);
    ctx.stroke();
    ctx.restore();
  }
}

window.GoBoardViewer = GoBoardViewer;
