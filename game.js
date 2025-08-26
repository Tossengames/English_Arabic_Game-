// Ninja Shogi — single-file game logic
// Drop in index.html + style.css and it runs in browser (PC & mobile)

(() => {
  // Config
  const BOARD_N = 8;
  const CANVAS = document.getElementById('board');
  const ctx = CANVAS.getContext('2d');
  const STATUS = document.getElementById('status');
  const PLAYER_HAND_EL = document.getElementById('playerHand');
  const ENEMY_HAND_EL = document.getElementById('enemyHand');
  const BTN_RESTART = document.getElementById('btnRestart');

  const cellSize = CANVAS.width / BOARD_N;
  const playerSide = 'player';
  const enemySide = 'enemy';

  // Piece definitions
  // Each piece: id, name, side, value (AI heuristics), movement generator function
  function pieceDef(id, name, value, movesFunc, options = {}) {
    return { id, name, value, movesFunc, ...options };
  }

  // Simple helper to clone board & coords
  const inside = (x,y) => x>=0 && x<BOARD_N && y>=0 && y<BOARD_N;

  // Movement generators return arrays of coordinates {x,y,range}
  // Range: optional, used for some moves; for capture rules we handle in code.
  const moves = {
    king: (x,y,side,board)=> {
      const out=[];
      for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++){
        if(dx===0 && dy===0) continue;
        const nx=x+dx, ny=y+dy;
        if(inside(nx,ny)) out.push({x:nx,y:ny});
      }
      return out;
    },
    knight: (x,y)=> {
      const deltas=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
      return deltas.map(d => ({x:x+d[0], y:y+d[1]})).filter(p=>inside(p.x,p.y));
    },
    orth1: (x,y)=> {
      const out=[];
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{
        const nx=x+d[0], ny=y+d[1];
        if(inside(nx,ny)) out.push({x:nx,y:ny});
      });
      return out;
    },
    bishop: (x,y)=> {
      const out=[];
      [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(d=>{
        for(let step=1;step<BOARD_N;step++){
          const nx=x+d[0]*step, ny=y+d[1]*step;
          if(!inside(nx,ny)) break;
          out.push({x:nx,y:ny,range:step});
        }
      });
      return out;
    },
    rook: (x,y)=> {
      const out=[];
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{
        for(let step=1;step<BOARD_N;step++){
          const nx=x+d[0]*step, ny=y+d[1]*step;
          if(!inside(nx,ny)) break;
          out.push({x:nx,y:ny,range:step});
        }
      });
      return out;
    },
    spear: (x,y)=> {
      // rook-like but limited to 3 tiles
      const out=[];
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{
        for(let step=1;step<=3;step++){
          const nx=x+d[0]*step, ny=y+d[1]*step;
          if(!inside(nx,ny)) break;
          out.push({x:nx,y:ny,range:step});
        }
      });
      return out;
    },
    pawnPlayer: (x,y,side)=> {
      // player pawns advance upward (towards y=0). They capture diagonally forward.
      const out=[];
      const dir = -1;
      const nx = x, ny = y + dir;
      if(inside(nx,ny)) out.push({x:nx,y:ny});
      // captures diagonally
      if(inside(x-1,y+dir)) out.push({x:x-1,y:y+dir});
      if(inside(x+1,y+dir)) out.push({x:x+1,y:y+dir});
      return out;
    },
    pawnEnemy: (x,y)=> {
      // enemy pawns (dogs) move downwards (toward y=7)
      const dir=1;
      const out=[];
      const nx=x, ny=y+dir;
      if(inside(nx,ny)) out.push({x:nx,y:ny});
      if(inside(x-1,y+dir)) out.push({x:x-1,y:y+dir});
      if(inside(x+1,y+dir)) out.push({x:x+1,y:y+dir});
      return out;
    }
  };

  // Define piece types for both sides
  const PIECE_TYPES = {
    // Player side
    TATSUMARU: pieceDef('T', 'Tatsumaru', 1000, moves.king, {side:playerSide}),
    AYAME: pieceDef('A', 'Ayame', 8, moves.knight, {side:playerSide}),
    RIKI: pieceDef('R', 'Riki', 6, moves.orth1, {side:playerSide}),
    RIN: pieceDef('N', 'Rin', 5, moves.bishop, {side:playerSide}),
    TISSU: pieceDef('S', 'Tissu', 7, moves.rook, {side:playerSide}),
    SOLDIER: pieceDef('P', 'Soldier', 3, moves.pawnPlayer, {side:playerSide}),

    // Enemy side
    DAIMYO: pieceDef('D', 'Daimyo', 1000, moves.king, {side:enemySide}),
    S_SAMURAI: pieceDef('s', 'Samurai S', 6, moves.king, {side:enemySide}),
    S_SPEAR: pieceDef('p', 'Samurai Spear', 7, moves.spear, {side:enemySide}),
    S_NINJA: pieceDef('n', 'Enemy Ninja', 8, moves.knight, {side:enemySide}),
    DOG: pieceDef('d', 'Dog', 2, moves.pawnEnemy, {side:enemySide})
  };

  // Board state: 2D array of null or {typeKey, side}
  let board = [];
  let currentTurn = playerSide; // player starts
  let selected = null; // {x,y}
  let legalMoves = []; // array of {x,y}
  let playerHand = []; // captured enemy pieces available to drop (type keys)
  let enemyHand = []; // enemy captured player pieces
  let gameOver = false;
  let lastMoveSnapshot = null;

  // Utility
  function emptyBoard() {
    board = new Array(BOARD_N);
    for (let y=0;y<BOARD_N;y++){
      board[y] = new Array(BOARD_N).fill(null);
    }
  }

  // Starting setup (mirrored)
  function setupStartingPosition() {
    emptyBoard();
    playerHand = [];
    enemyHand = [];
    gameOver = false;
    currentTurn = playerSide;
    selected=null; legalMoves=[];
    // Player pieces (bottom rows y=6..7)
    const bottom = BOARD_N-1;
    // Row 7 (index 7) back rank: Riki, Tissu, Rin, Tatsumaru, Ayame, Rin, Tissu, Riki
    board[7][0] = {type:'RIKI', side:playerSide};
    board[7][1] = {type:'TISSU', side:playerSide};
    board[7][2] = {type:'RIN', side:playerSide};
    board[7][3] = {type:'TATSUMARU', side:playerSide};
    board[7][4] = {type:'AYAME', side:playerSide};
    board[7][5] = {type:'RIN', side:playerSide};
    board[7][6] = {type:'TISSU', side:playerSide};
    board[7][7] = {type:'RIKI', side:playerSide};

    // row 6 soldiers
    for(let x=0;x<BOARD_N;x++){
      board[6][x] = {type:'SOLDIER', side:playerSide};
    }

    // Enemy pieces mirrored at top
    board[0][0] = {type:'S_SAMURAI', side:enemySide};
    board[0][1] = {type:'S_SPEAR', side:enemySide};
    board[0][2] = {type:'S_NINJA', side:enemySide};
    board[0][3] = {type:'DAIMYO', side:enemySide};
    board[0][4] = {type:'S_NINJA', side:enemySide};
    board[0][5] = {type:'S_SPEAR', side:enemySide};
    board[0][6] = {type:'S_SAMURAI', side:enemySide};
    board[0][7] = {type:'DOG', side:enemySide};

    // enemy pawns row 1
    for(let x=0;x<BOARD_N;x++){
      board[1][x] = {type:'DOG', side:enemySide};
    }

    // small tweak: make sure enemy has daimyo at [0,3]
    render();
    updateHandsUI();
    setStatus("Your turn");
  }

  // Render functions
  function render() {
    // clear
    ctx.clearRect(0,0,CANVAS.width,CANVAS.height);

    // board background
    ctx.fillStyle = '#0e1520';
    ctx.fillRect(0,0,CANVAS.width,CANVAS.height);

    // draw grid
    for (let y=0;y<BOARD_N;y++){
      for (let x=0;x<BOARD_N;x++){
        const sx = x*cellSize, sy = y*cellSize;
        // alternating color
        const light = (x+y)%2===0;
        ctx.fillStyle = light ? '#16202b' : '#0f1720';
        ctx.fillRect(sx, sy, cellSize, cellSize);

        // highlight legal move squares
        if (legalMoves.some(m=>m.x===x && m.y===y)){
          ctx.fillStyle = 'rgba(46,204,113,0.18)';
          ctx.fillRect(sx, sy, cellSize, cellSize);
        }

        // highlight selected
        if (selected && selected.x===x && selected.y===y){
          ctx.strokeStyle = '#ffd166';
          ctx.lineWidth = 3;
          ctx.strokeRect(sx+4, sy+4, cellSize-8, cellSize-8);
        }

        // grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx, sy, cellSize, cellSize);
      }
    }

    // draw pieces
    for (let y=0;y<BOARD_N;y++){
      for (let x=0;x<BOARD_N;x++){
        const p = board[y][x];
        if (!p) continue;
        drawPiece(p, x, y);
      }
    }
  }

  function drawPiece(p, x, y) {
    const sx = x*cellSize + cellSize/2;
    const sy = y*cellSize + cellSize/2;
    const radius = cellSize*0.34;
    // color based on side
    ctx.beginPath();
    ctx.fillStyle = p.side === playerSide ? '#2ecc71' : '#ff6b6b';
    ctx.arc(sx, sy, radius, 0, Math.PI*2);
    ctx.fill();

    // inner round
    ctx.beginPath();
    ctx.fillStyle = '#071018';
    ctx.arc(sx, sy, radius*0.6, 0, Math.PI*2);
    ctx.fill();

    // label
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.floor(cellSize*0.23)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const short = PIECE_TYPES[p.type].id;
    ctx.fillText(short, sx, sy);

    // small HP or marker could be drawn later
  }

  // Helpers for piece definitions mapping
  const PIECE_TYPES = {
    TATSUMARU: { id:'T', name:'Tatsumaru', value:1000, moves: moves.king },
    AYAME: { id:'A', name:'Ayame', value:8, moves: moves.knight },
    RIKI: { id:'R', name:'Riki', value:6, moves: moves.orth1 },
    RIN: { id:'N', name:'Rin', value:5, moves: moves.bishop },
    TISSU: { id:'S', name:'Tissu', value:7, moves: moves.rook },
    SOLDIER: { id:'P', name:'Soldier', value:3, moves: moves.pawnPlayer },

    DAIMYO: { id:'D', name:'Daimyo', value:1000, moves: moves.king },
    S_SAMURAI: { id:'s', name:'Samurai', value:6, moves: moves.king },
    S_SPEAR: { id:'p', name:'Samurai Spear', value:7, moves: moves.spear },
    S_NINJA: { id:'n', name:'Ninja', value:8, moves: moves.knight },
    DOG: { id:'d', name:'Dog', value:2, moves: moves.pawnEnemy }
  };

  // Compute legal moves for a piece at x,y
  function computeLegalMoves(x, y) {
    const p = board[y][x];
    if (!p) return [];
    const t = p.type;
    const def = PIECE_TYPES[t];
    if (!def) return [];
    // get move candidates
    let candidates = def.moves(x, y, p.side, board) || [];
    const movesOut = [];

    // For sliding pieces (rook, bishop, spear), we must stop on first piece encountered
    const slidingTypes = new Set(['TISSU','RIN','S_SPEAR']);
    if (def.moves === moves.rook || def.moves === moves.bishop || def.moves === moves.spear) {
      // moves already contain range steps; we need to process blocked path behavior:
      // Since moves.rook and moves.bishop / spear generated in-order by direction & steps, but not grouped, we
      // will accept candidates but when encountering a blocking piece of any side, later further squares in same direction should not be allowed.
      // Simpler: re-generate per direction:
      candidates = [];
      if (def.moves === moves.rook) {
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(dir=>{
          for(let step=1;step<BOARD_N;step++){
            const nx=x+dir[0]*step, ny=y+dir[1]*step;
            if(!inside(nx,ny)) break;
            candidates.push({x:nx,y:ny,dir:dir,step});
            if (board[ny][nx]) break;
          }
        });
      } else if (def.moves === moves.bishop) {
        [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(dir=>{
          for(let step=1;step<BOARD_N;step++){
            const nx=x+dir[0]*step, ny=y+dir[1]*step;
            if(!inside(nx,ny)) break;
            candidates.push({x:nx,y:ny,dir:dir,step});
            if (board[ny][nx]) break;
          }
        });
      } else if (def.moves === moves.spear) {
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(dir=>{
          for(let step=1;step<=3;step++){
            const nx=x+dir[0]*step, ny=y+dir[1]*step;
            if(!inside(nx,ny)) break;
            candidates.push({x:nx,y:ny,dir:dir,step});
            if (board[ny][nx]) break;
          }
        });
      }
    }

    for (const c of candidates) {
      const nx=c.x, ny=c.y;
      if (!inside(nx,ny)) continue;
      const target = board[ny][nx];
      // Pawn-like movement: allow forward moves only if empty, captures diagonally only if enemy (we earlier included both)
      if (t === 'SOLDIER') {
        // forward cell
        const dir = -1;
        if (nx === x && ny === y+dir) {
          if (!board[ny][nx]) movesOut.push({x:nx,y:ny});
        } else if ((nx === x-1 || nx === x+1) && ny === y+dir) {
          if (board[ny][nx] && board[ny][nx].side !== p.side) movesOut.push({x:nx,y:ny});
        }
        continue;
      }
      if (t === 'DOG') {
        // enemy pawn behavior: forward only if empty, capture diagonals
        const dir = 1;
        if (nx === x && ny === y+dir) {
          if (!board[ny][nx]) movesOut.push({x:nx,y:ny});
        } else if ((nx === x-1 || nx === x+1) && ny === y+dir) {
          if (board[ny][nx] && board[ny][nx].side !== p.side) movesOut.push({x:nx,y:ny});
        }
        continue;
      }
      // For ranged Tissu (rook), allow capture anywhere along line, stop at first blocking piece handled earlier
      if (!target) {
        // empty square — allowed
        movesOut.push({x:nx,y:ny});
      } else if (target.side !== p.side) {
        // capture
        movesOut.push({x:nx,y:ny, capture:true});
      } else {
        // own piece blocks
        // nothing
      }
    }

    // Filter out moves that would leave own leader captured (simple king safety not implemented to keep things snappy)
    return movesOut;
  }

  // Select / move flow
  function onBoardClick(px, py) {
    if (gameOver) return;
    const x = Math.floor(px / cellSize);
    const y = Math.floor(py / cellSize);
    if (!inside(x,y)) return;

    // If we have a hand drop active? We'll implement simple drop by selecting a hand piece then a square.
    if (handDropActive) {
      // attempt to drop at x,y (must be empty)
      if (board[y][x]) {
        setStatus("Drop square must be empty");
        cancelHandDrop();
        return;
      }
      const type = handDropActive;
      board[y][x] = { type, side: playerSide };
      removeFromHand(playerHand, type);
      handDropActive = null;
      render(); updateHandsUI();
      // After drop, end player's turn -> enemy moves
      endPlayerTurn();
      return;
    }

    const cell = board[y][x];
    if (selected && legalMoves.some(m=>m.x===x && m.y===y)) {
      // perform move
      movePiece(selected.x, selected.y, x, y);
      selected = null; legalMoves = [];
      render();
      updateHandsUI();
      // player moved -> enemy's turn
      setTimeout(()=> endPlayerTurn(), 180);
      return;
    }

    // else select if it's player's piece and turn is player
    if (cell && cell.side === playerSide && currentTurn === playerSide) {
      selected = {x,y};
      legalMoves = computeLegalMoves(x,y);
      render();
      return;
    }

    // otherwise clear selection
    selected = null; legalMoves = [];
    render();
  }

  function movePiece(sx, sy, tx, ty) {
    const piece = board[sy][sx];
    if (!piece) return;
    const target = board[ty][tx];
    // capture handling
    if (target) {
      if (target.side === enemySide) {
        // capture enemy -> goes to player hand
        playerHand.push(target.type);
      } else {
        // shouldn't happen (captured own)
      }
    }
    // move
    board[ty][tx] = piece;
    board[sy][sx] = null;

    // promotion: player's soldier reaching y==0 -> promote to Ayame
    if (piece.side === playerSide && piece.type === 'SOLDIER' && ty === 0) {
      board[ty][tx] = { type:'AYAME', side:playerSide };
    }

    // if captured a player piece (rare from enemy moves), move to enemyHand in enemy turn handler
    render();
    checkWinLose();
  }

  // Remove first occurrence from hand
  function removeFromHand(hand, type) {
    const idx = hand.indexOf(type);
    if (idx>=0) hand.splice(idx,1);
  }

  // Simple AI: compute all legal moves for enemy pieces, prefer capturing player's leader, then highest value captures, else random
  function enemyTurn() {
    if (gameOver) return;
    currentTurn = enemySide;
    setStatus("Enemy thinking...");
    // gather moves
    const movesList = [];
    for (let y=0;y<BOARD_N;y++){
      for (let x=0;x<BOARD_N;x++){
        const p = board[y][x];
        if (!p || p.side !== enemySide) continue;
        const lm = computeLegalMoves(x,y);
        lm.forEach(m=>{
          movesList.push({sx:x, sy:y, tx:m.x, ty:m.y, capture: !!board[m.y][m.x], pieceType:p.type});
        });
      }
    }
    // prioritize capturing player's leader (Tatsumaru)
    const captureLeader = movesList.find(m => {
      const t = board[m.ty][m.tx];
      return t && t.side===playerSide && t.type==='TATSUMARU';
    });
    if (captureLeader) {
      applyEnemyMove(captureLeader); return;
    }
    // prefer moves that capture any piece, pick highest-value target
    const captureMoves = movesList.filter(m => m.capture);
    if (captureMoves.length > 0) {
      // score by value of captured piece
      captureMoves.sort((a,b)=>{
        const va = PIECE_TYPES[board[a.ty][a.tx].type].value || 1;
        const vb = PIECE_TYPES[board[b.ty][b.tx].type].value || 1;
        return vb - va; // descending
      });
      applyEnemyMove(captureMoves[0]); return;
    }
    // else pick move that approaches player's leader or random
    // find player's leader
    let leaderLoc = null;
    for (let y=0;y<BOARD_N;y++) for(let x=0;x<BOARD_N;x++){
      if (board[y][x] && board[y][x].side===playerSide && board[y][x].type==='TATSUMARU') leaderLoc = {x,y};
    }
    if (leaderLoc && movesList.length>0) {
      // score moves by reduction in distance to leader
      movesList.forEach(m=>{
        const before = Math.hypot(m.sx - leaderLoc.x, m.sy - leaderLoc.y);
        const after = Math.hypot(m.tx - leaderLoc.x, m.ty - leaderLoc.y);
        m.delta = before - after;
      });
      movesList.sort((a,b)=>{
        if (b.delta !== a.delta) return b.delta - a.delta;
        return Math.random() - 0.5;
      });
      applyEnemyMove(movesList[0]); return;
    }
    // fallback random move
    if (movesList.length>0) {
      applyEnemyMove(movesList[Math.floor(Math.random()*movesList.length)]);
    } else {
      // enemy had no move (rare)
      currentTurn = playerSide;
      setStatus("Your turn");
    }
  }

  function applyEnemyMove(m) {
    // m: {sx,sy,tx,ty}
    const piece = board[m.sy][m.sx];
    if (!piece) { currentTurn = playerSide; setStatus("Your turn"); return; }
    const target = board[m.ty][m.tx];
    if (target && target.side===playerSide) {
      // capture player piece -> enemy gets it in its hand
      enemyHand.push(target.type);
    }
    board[m.ty][m.tx] = piece;
    board[m.sy][m.sx] = null;

    // enemy promotion concept not implemented (keeps simple)
    // small delay before returning to player
    render();
    checkWinLose();
    setTimeout(()=> {
      currentTurn = playerSide;
      setStatus("Your turn");
      render();
      updateHandsUI();
    }, 320);
  }

  function checkWinLose() {
    // check if either leader captured
    let playerLeader=false, enemyLeader=false;
    for (let y=0;y<BOARD_N;y++) for (let x=0;x<BOARD_N;x++){
      const p = board[y][x];
      if (!p) continue;
      if (p.type==='TATSUMARU' && p.side===playerSide) playerLeader=true;
      if (p.type==='DAIMYO' && p.side===enemySide) enemyLeader=true;
    }
    if (!playerLeader) {
      gameOver = true; setStatus("You lost — Tatsumaru captured"); showGameOver(false); return;
    }
    if (!enemyLeader) {
      gameOver = true; setStatus("Victory — Daimyo captured"); showGameOver(true); return;
    }
  }

  function showGameOver(win) {
    setTimeout(()=>{
      if (confirm(win ? "Victory! Play again?" : "Defeat. Play again?")) {
        setupStartingPosition();
      }
    }, 200);
  }

  // Hand UI & drop logic
  let handDropActive = null; // type key if user selected to drop
  function updateHandsUI() {
    PLAYER_HAND_EL.innerHTML = '';
    ENEMY_HAND_EL.innerHTML = '';
    // player hand cards
    const counts = {};
    playerHand.forEach(t => counts[t] = (counts[t]||0)+1);
    Object.keys(counts).forEach(type => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `${PIECE_TYPES[type].id} <div style="font-size:11px;color:#9aa6b2">${PIECE_TYPES[type].name}</div><div style="font-size:11px;color:#9aa6b2">x${counts[type]}</div>`;
      card.onclick = ()=> {
        if (currentTurn !== playerSide || gameOver) return;
        handDropActive = type;
        setStatus(`Drop ${PIECE_TYPES[type].name} — tap empty square`);
        // visually mark active
        Array.from(PLAYER_HAND_EL.children).forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      };
      PLAYER_HAND_EL.appendChild(card);
    });
    if (playerHand.length===0) PLAYER_HAND_EL.innerHTML = '<div style="color:#8b98a6">(none)</div>';

    // enemy hand (read-only)
    const ecounts = {};
    enemyHand.forEach(t => ecounts[t] = (ecounts[t]||0)+1);
    Object.keys(ecounts).forEach(type => {
      const card = document.createElement('div');
      card.className='card disabled';
      card.innerHTML = `${PIECE_TYPES[type].id} <div style="font-size:11px;color:#9aa6b2">${PIECE_TYPES[type].name}</div><div style="font-size:11px;color:#9aa6b2">x${ecounts[type]}</div>`;
      ENEMY_HAND_EL.appendChild(card);
    });
    if (enemyHand.length===0) ENEMY_HAND_EL.innerHTML = '<div style="color:#8b98a6">(none)</div>';
  }

  function cancelHandDrop() {
    handDropActive = null;
    Array.from(PLAYER_HAND_EL.children).forEach(c => c.classList.remove('active'));
    setStatus("Your turn");
  }

  // Status
  function setStatus(txt) {
    STATUS.textContent = txt;
  }

  // Event listeners
  CANVAS.addEventListener('pointerdown', ev=>{
    const rect = CANVAS.getBoundingClientRect();
    const cx = ev.clientX - rect.left;
    const cy = ev.clientY - rect.top;
    onBoardClick(cx, cy);
  });

  BTN_RESTART.addEventListener('click', ()=> {
    if (confirm('Restart the game?')) setupStartingPosition();
  });

  // End player's turn -> run enemy turn
  function endPlayerTurn() {
    if (gameOver) return;
    currentTurn = enemySide;
    setStatus("Enemy turn...");
    // small delay to simulate thinking
    setTimeout(()=> enemyTurn(), 420);
  }

  // Initial setup
  function init() {
    setupStartingPosition();
    updateHandsUI();
    render();
  }

  // expose some helper for debugging
  window._ns = { board, PIECE_TYPES };

  init();
})();