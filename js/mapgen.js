// ============================================================
// TILE TYPES
// ============================================================
// 0=air, 1=ground, 2=wall, 3=platform, 4=spike, 5=ladder, 6=breakable,
// 7=ice, 8=crumble, 9=fire_trap, 10=moving_platform, 11=decor,
// 12=pop_spike, 13=turret, 14=electric, 15=spear_floor, 16=falling_slab,
// 17=rock, 18=sb_static_up, 19=sb_static_dn, 20=sb_static_rt,
// 21=sb_timer_up, 22=sb_timer_dn, 23=sb_trig, 24=press_trap,
// 25=spring, 26=sticky_wall, 27=conveyor_l, 28=conveyor_r,
// 29=lava, 30=lava_body, 31=cobweb, 32=quicksand,
// 33=switch_off, 34=switch_on, 35=gate_closed, 36=gate_open,
// 37=teleporter, 38=steam_vent, 39=torch, 40=mushroom,
// 41=acid_drip, 42=wind_left, 43=wind_right, 44=phantom_block

function isSolid(v) {
  return (
    v === 1 ||
    v === 2 ||
    v === 3 ||
    v === 6 ||
    v === 7 ||
    v === 8 ||
    v === 15 ||
    v === 18 ||
    v === 21 ||
    v === 23 ||
    v === 25 ||
    v === 26 ||
    v === 27 ||
    v === 28 ||
    v === 32 ||
    v === 35 ||
    v === 37 ||
    v === 38 ||
    v === 40 ||
    v === 44
  );
}

function isLethal(v) {
  return v === 4 || v === 29 || v === 30;
}

function isLightSource(v) {
  return v === 9 || v === 29 || v === 30 || v === 39 || v === 14 || v === 37;
}

function getLightRadius(v) {
  if (v === 39) return 6; // torch
  if (v === 29) return 5; // lava surface
  if (v === 30) return 4; // lava body
  if (v === 9) return 4; // fire trap
  if (v === 14) return 3; // electric
  if (v === 37) return 5; // teleporter
  return 0;
}

function getLightColor(v) {
  if (v === 39) return { r: 255, g: 200, b: 100 }; // тёплый
  if (v === 29 || v === 30) return { r: 255, g: 80, b: 20 }; // красный
  if (v === 9) return { r: 255, g: 150, b: 50 }; // оранжевый
  if (v === 14) return { r: 100, g: 150, b: 255 }; // синий
  if (v === 37) return { r: 180, g: 80, b: 255 }; // фиолетовый
  return { r: 255, g: 255, b: 255 };
}

// ============================================================
// ROOM GRID CONSTANTS
// ============================================================
const ROOM_GRID_COLS = 4;
const ROOM_GRID_ROWS = 4;
const EXIT_LEFT = 1,
  EXIT_RIGHT = 2,
  EXIT_UP = 4,
  EXIT_DOWN = 8;

function getRoomW() {
  return Math.floor((COLS - 2) / ROOM_GRID_COLS);
}
function getRoomH() {
  return Math.floor((ROWS - 2) / ROOM_GRID_ROWS);
}

// Глобальные массивы для интерактивных объектов
let switchGateLinks = [];
let teleporterPairs = [];
let steamVents = [];
let acidDrips = [];
let phantomBlocks = [];
let mushroomAnims = {};
let lavaParticles = [];
let acidPuddles = [];

function resetInteractiveObjects() {
  switchGateLinks = [];
  teleporterPairs = [];
  steamVents = [];
  acidDrips = [];
  phantomBlocks = [];
  mushroomAnims = {};
  lavaParticles = [];
  acidPuddles = [];
}

// ============================================================
// FLOOD REACHABILITY
// ============================================================
function floodReachable(map, startR, startC) {
  let visited = new Set();
  let key = (r, c) => r * COLS + c;
  let queue = [key(startR, startC)];
  visited.add(key(startR, startC));
  let canPass = (r, c) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
    return !isSolid(map[r][c]);
  };
  let solidBelow = (r, c) => {
    if (r + 1 >= ROWS) return true;
    return isSolid(map[r + 1][c]);
  };
  let canStandAt = (r, c) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
    if (isSolid(map[r][c])) return false;
    if (solidBelow(r, c)) return true;
    if (map[r][c] === 5) return true;
    return false;
  };
  let landingRow = (r, c) => {
    let lr = r;
    while (lr < ROWS - 1 && !isSolid(map[lr + 1][c]) && map[lr][c] !== 5) lr++;
    return lr;
  };
  while (queue.length > 0) {
    let k = queue.shift();
    let r = Math.floor(k / COLS),
      c = k % COLS;
    let tryAdd = (nr, nc) => {
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
      let nk = key(nr, nc);
      if (visited.has(nk)) return;
      if (isSolid(map[nr][nc])) return;
      visited.add(nk);
      queue.push(nk);
    };
    if (map[r][c] === 5) {
      if (r > 0 && canPass(r - 1, c)) tryAdd(r - 1, c);
      if (r < ROWS - 1 && canPass(r + 1, c)) tryAdd(r + 1, c);
      tryAdd(r, c - 1);
      tryAdd(r, c + 1);
    }
    if (!canStandAt(r, c) && map[r][c] !== 5) {
      let lr = landingRow(r, c);
      if (lr !== r && canPass(lr, c)) tryAdd(lr, c);
      continue;
    }
    for (let dc of [-1, 1]) {
      let nc = c + dc;
      if (nc < 1 || nc >= COLS - 1) continue;
      if (!canPass(r, nc)) continue;
      let lr = landingRow(r, nc);
      tryAdd(lr, nc);
    }
    for (let dy = 0; dy <= 4; dy++) {
      let jumpR = r - dy;
      if (jumpR < 1) break;
      let blocked = false;
      for (let cr = r - 1; cr >= jumpR; cr--) {
        if (!canPass(cr, c)) {
          blocked = true;
          break;
        }
      }
      if (blocked) break;
      let maxDx = dy <= 1 ? 2 : dy <= 2 ? 4 : 5;
      for (let dx = -maxDx; dx <= maxDx; dx++) {
        let nc = c + dx;
        if (nc < 1 || nc >= COLS - 1) continue;
        if (!canPass(jumpR, nc)) continue;
        let pathClear = true,
          stepC = c,
          stepDir = dx > 0 ? 1 : -1;
        for (let s = 0; s < Math.abs(dx); s++) {
          stepC += stepDir;
          if (!canPass(r, stepC) && !canPass(jumpR, stepC)) {
            pathClear = false;
            break;
          }
        }
        if (!pathClear) continue;
        let lr = landingRow(jumpR, nc);
        if (canPass(lr, nc)) tryAdd(lr, nc);
        tryAdd(jumpR, nc);
      }
    }
  }
  return visited;
}

// ============================================================
// CRITICAL PATH
// ============================================================
function generateCriticalPath() {
  let grid = [];
  for (let gr = 0; gr < ROOM_GRID_ROWS; gr++) {
    grid[gr] = [];
    for (let gc = 0; gc < ROOM_GRID_COLS; gc++) {
      grid[gr][gc] = {
        onPath: false,
        exits: 0,
        distFromStart: 999,
        type: "empty",
      };
    }
  }
  let col = Math.floor(Math.random() * ROOM_GRID_COLS);
  let row = 0;
  grid[row][col].onPath = true;
  grid[row][col].distFromStart = 0;
  grid[row][col].type = "start";
  let startCol = col;
  let pathOrder = [{ r: row, c: col }];
  let step = 1;

  while (row < ROOM_GRID_ROWS - 1) {
    let dir = Math.floor(Math.random() * 3);
    if (dir === 0 && col > 0 && !grid[row][col - 1].onPath) {
      grid[row][col].exits |= EXIT_LEFT;
      col--;
      grid[row][col].onPath = true;
      grid[row][col].exits |= EXIT_RIGHT;
    } else if (
      dir === 1 &&
      col < ROOM_GRID_COLS - 1 &&
      !grid[row][col + 1].onPath
    ) {
      grid[row][col].exits |= EXIT_RIGHT;
      col++;
      grid[row][col].onPath = true;
      grid[row][col].exits |= EXIT_LEFT;
    } else {
      grid[row][col].exits |= EXIT_DOWN;
      row++;
      grid[row][col].onPath = true;
      grid[row][col].exits |= EXIT_UP;
    }
    grid[row][col].distFromStart = step++;
    pathOrder.push({ r: row, c: col });
  }
  grid[row][col].type = "exit";
  return { grid, startCol, endCol: col, endRow: row, pathOrder };
}

// ============================================================
// OPEN SIDE ROOMS (75%+)
// ============================================================
function openSideRooms(grid) {
  let totalRooms = ROOM_GRID_ROWS * ROOM_GRID_COLS;
  let openCount = () => {
    let n = 0;
    for (let gr = 0; gr < ROOM_GRID_ROWS; gr++)
      for (let gc = 0; gc < ROOM_GRID_COLS; gc++)
        if (grid[gr][gc].exits !== 0) n++;
    return n;
  };
  let minOpen = Math.ceil(totalRooms * 0.75);
  let attempts = 0;

  while (openCount() < minOpen && attempts < 300) {
    attempts++;
    let gr = Math.floor(Math.random() * ROOM_GRID_ROWS);
    let gc = Math.floor(Math.random() * ROOM_GRID_COLS);
    if (grid[gr][gc].exits !== 0) continue;

    let neighbors = [];
    if (gr > 0 && grid[gr - 1][gc].exits !== 0)
      neighbors.push({ dr: -1, dc: 0, my: EXIT_UP, their: EXIT_DOWN });
    if (gr < ROOM_GRID_ROWS - 1 && grid[gr + 1][gc].exits !== 0)
      neighbors.push({ dr: 1, dc: 0, my: EXIT_DOWN, their: EXIT_UP });
    if (gc > 0 && grid[gr][gc - 1].exits !== 0)
      neighbors.push({ dr: 0, dc: -1, my: EXIT_LEFT, their: EXIT_RIGHT });
    if (gc < ROOM_GRID_COLS - 1 && grid[gr][gc + 1].exits !== 0)
      neighbors.push({ dr: 0, dc: 1, my: EXIT_RIGHT, their: EXIT_LEFT });
    if (neighbors.length === 0) continue;

    let n = neighbors[Math.floor(Math.random() * neighbors.length)];
    grid[gr][gc].exits |= n.my;
    grid[gr + n.dr][gc + n.dc].exits |= n.their;
    grid[gr][gc].distFromStart = grid[gr + n.dr][gc + n.dc].distFromStart + 1;
    grid[gr][gc].type = "side";

    // Второй выход для перекрёстков
    if (neighbors.length > 1 && Math.random() < 0.4) {
      let n2 = neighbors[Math.floor(Math.random() * neighbors.length)];
      grid[gr][gc].exits |= n2.my;
      grid[gr + n2.dr][gc + n2.dc].exits |= n2.their;
    }
  }

  // Петли между уже открытыми комнатами
  for (let gr = 0; gr < ROOM_GRID_ROWS; gr++) {
    for (let gc = 0; gc < ROOM_GRID_COLS - 1; gc++) {
      if (
        grid[gr][gc].exits &&
        grid[gr][gc + 1].exits &&
        !(grid[gr][gc].exits & EXIT_RIGHT) &&
        Math.random() < 0.3
      ) {
        grid[gr][gc].exits |= EXIT_RIGHT;
        grid[gr][gc + 1].exits |= EXIT_LEFT;
      }
    }
  }
  for (let gr = 0; gr < ROOM_GRID_ROWS - 1; gr++) {
    for (let gc = 0; gc < ROOM_GRID_COLS; gc++) {
      if (
        grid[gr][gc].exits &&
        grid[gr + 1][gc].exits &&
        !(grid[gr][gc].exits & EXIT_DOWN) &&
        Math.random() < 0.25
      ) {
        grid[gr][gc].exits |= EXIT_DOWN;
        grid[gr + 1][gc].exits |= EXIT_UP;
      }
    }
  }
}

// ============================================================
// ROOM TEMPLATES
// ============================================================
function fillRoom(
  map,
  rStart,
  cStart,
  roomW,
  roomH,
  exits,
  roomInfo,
  biomeKey,
) {
  let rEnd = Math.min(rStart + roomH, ROWS - 1);
  let cEnd = Math.min(cStart + roomW, COLS - 1);
  let iT = rStart + 1,
    iB = rEnd - 2;
  let iL = cStart + 1,
    iR = cEnd - 2;
  if (iB <= iT || iR <= iL) return;

  let innerW = iR - iL + 1;
  let innerH = iB - iT + 1;
  let midC = Math.floor((iL + iR) / 2);
  let midR = Math.floor((iT + iB) / 2);

  // Периметр комнаты — solid
  for (let r = rStart; r < rEnd; r++) {
    for (let c = cStart; c < cEnd; c++) {
      if (r < ROWS && c < COLS) {
        if (r === rStart || r === rEnd - 1 || c === cStart || c === cEnd - 1) {
          map[r][c] = 1;
        } else {
          map[r][c] = 0;
        }
      }
    }
  }

  // Шаблон внутренности
  let template = Math.floor(Math.random() * 20);

  switch (template) {
    case 0:
      // Пустая комната
      break;

    case 1: {
      // Одна платформа посередине
      for (let c = iL + 1; c <= iR - 1 && c < COLS; c++) {
        if (midR < ROWS) map[midR][c] = 3;
      }
      break;
    }
    case 2: {
      // Лесенка из двух платформ
      let r1 = iT + Math.floor(innerH * 0.33);
      let r2 = iT + Math.floor(innerH * 0.66);
      let halfW = Math.floor(innerW / 2);
      for (let c = iL; c < iL + halfW && c < COLS; c++) {
        if (r2 < ROWS) map[r2][c] = 3;
      }
      for (let c = iR - halfW + 1; c <= iR && c < COLS; c++) {
        if (r1 < ROWS) map[r1][c] = 3;
      }
      break;
    }
    case 3: {
      // Земляной мост с дырой
      let bridgeR = midR;
      let gapStart = midC - 1;
      let gapW = 2 + Math.floor(Math.random() * 2);
      for (let c = iL; c <= iR && c < COLS; c++) {
        if (bridgeR < ROWS) {
          map[bridgeR][c] = c >= gapStart && c < gapStart + gapW ? 0 : 1;
        }
      }
      break;
    }
    case 4: {
      // L-платформа с лестницей
      let platR = iT + Math.floor(innerH * 0.4);
      for (let c = iL; c <= midC && c < COLS; c++) {
        if (platR < ROWS) map[platR][c] = 3;
      }
      for (let r = platR + 1; r <= iB && r < ROWS; r++) {
        if (midC < COLS) map[r][midC] = 5;
      }
      break;
    }
    case 5: {
      // Три маленькие платформы
      let positions = [
        { r: iT + Math.floor(innerH * 0.25), cs: iL, ce: iL + 2 },
        { r: iT + Math.floor(innerH * 0.5), cs: midC - 1, ce: midC + 1 },
        { r: iT + Math.floor(innerH * 0.75), cs: iR - 2, ce: iR },
      ];
      for (let p of positions) {
        for (let c = p.cs; c <= p.ce && c < COLS; c++) {
          if (p.r >= 0 && p.r < ROWS) map[p.r][c] = 3;
        }
      }
      break;
    }
    case 6: {
      // Колонна + боковая платформа
      for (let r = iT + 1; r <= iB - 1 && r < ROWS; r++) {
        if (midC < COLS) map[r][midC] = 1;
      }
      let platR = midR - 1;
      for (let c = iL; c < midC - 1 && c < COLS; c++) {
        if (platR < ROWS) map[platR][c] = 3;
      }
      break;
    }
    case 7: {
      // U-образный каньон
      let wallH = Math.floor(innerH * 0.6);
      for (let r = iT; r < iT + wallH && r < ROWS; r++) {
        if (iL < COLS) map[r][iL] = 1;
        if (iL + 1 < COLS) map[r][iL + 1] = 1;
        if (iR < COLS) map[r][iR] = 1;
        if (iR - 1 >= 0 && iR - 1 < COLS) map[r][iR - 1] = 1;
      }
      break;
    }
    case 8: {
      // Зигзаг платформ
      let rows3 = [
        iT + Math.floor(innerH * 0.2),
        iT + Math.floor(innerH * 0.5),
        iT + Math.floor(innerH * 0.8),
      ];
      let leftSide = true;
      for (let pr of rows3) {
        if (pr >= ROWS) continue;
        let pS = leftSide ? iL : midC;
        let pE = leftSide ? midC - 1 : iR;
        for (let c = pS; c <= pE && c < COLS; c++) map[pr][c] = 3;
        leftSide = !leftSide;
      }
      break;
    }
    case 9: {
      // Лестничная шахта
      for (let r = iT; r <= iB && r < ROWS; r++) {
        if (midC < COLS) map[r][midC] = 5;
      }
      let platR1 = iT + Math.floor(innerH * 0.33);
      let platR2 = iT + Math.floor(innerH * 0.66);
      for (let c = iL; c < midC && c < COLS; c++) {
        if (platR1 < ROWS) map[platR1][c] = 3;
      }
      for (let c = midC + 1; c <= iR && c < COLS; c++) {
        if (platR2 < ROWS) map[platR2][c] = 3;
      }
      break;
    }
    case 10: {
      // Земляные островки
      let islands = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < islands; i++) {
        let ir = iT + 1 + Math.floor(Math.random() * (innerH - 2));
        let ic = iL + 1 + Math.floor(Math.random() * (innerW - 3));
        let iw = 2 + Math.floor(Math.random() * 2);
        for (let c = ic; c < ic + iw && c <= iR && c < COLS; c++) {
          if (ir < ROWS) map[ir][c] = 1;
        }
      }
      break;
    }
    case 11: {
      // Платформа с breakable блоками
      let platR = midR;
      for (let c = iL; c <= iR && c < COLS; c++) {
        if (platR < ROWS) map[platR][c] = Math.random() < 0.4 ? 6 : 3;
      }
      break;
    }
    case 12: {
      // Пещера — земля с вырезанным пространством
      for (let r = iT; r <= iB && r < ROWS; r++) {
        for (let c = iL; c <= iR && c < COLS; c++) {
          map[r][c] = 1;
        }
      }
      // Вырезаем проход
      let caveW = Math.floor(innerW * 0.6);
      let caveH = Math.floor(innerH * 0.6);
      let caveStartC = iL + Math.floor((innerW - caveW) / 2);
      let caveStartR = iT + Math.floor((innerH - caveH) / 2);
      for (let r = caveStartR; r < caveStartR + caveH && r < ROWS; r++) {
        for (let c = caveStartC; c < caveStartC + caveW && c < COLS; c++) {
          map[r][c] = 0;
        }
      }
      break;
    }
    case 13: {
      // Диагональные платформы
      let steps = Math.min(innerW, innerH) - 1;
      let goRight = Math.random() < 0.5;
      for (let s = 0; s < steps; s++) {
        let sr = iT + s;
        let sc = goRight ? iL + s : iR - s;
        if (sr < ROWS && sc >= 0 && sc < COLS) {
          map[sr][sc] = 3;
          if (sc + 1 < COLS && sc + 1 <= iR) map[sr][sc + 1] = 3;
        }
      }
      break;
    }
    case 14: {
      // Three vertical columns of different heights
      let col1 = iL + Math.floor(innerW * 0.2);
      let col2 = iL + Math.floor(innerW * 0.5);
      let col3 = iL + Math.floor(innerW * 0.8);
      let h1 = Math.floor(innerH * 0.7);
      let h2 = Math.floor(innerH * 0.4);
      let h3 = Math.floor(innerH * 0.6);
      for (let r = iB - h1 + 1; r <= iB && r < ROWS; r++)
        if (col1 < COLS) map[r][col1] = 1;
      for (let r = iB - h2 + 1; r <= iB && r < ROWS; r++)
        if (col2 < COLS) map[r][col2] = 1;
      for (let r = iB - h3 + 1; r <= iB && r < ROWS; r++)
        if (col3 < COLS) map[r][col3] = 1;
      break;
    }
    case 15: {
      // Ceiling-hung platforms reachable via central ladder
      let platR = iT + 1;
      let halfW = Math.floor(innerW / 2) - 1;
      for (let c = iL; c <= iL + halfW && c < COLS; c++)
        if (platR < ROWS) map[platR][c] = 3;
      for (let c = iR - halfW; c <= iR && c < COLS; c++)
        if (platR < ROWS) map[platR][c] = 3;
      for (let r = iT; r <= iB && r < ROWS; r++)
        if (midC < COLS && !isSolid(map[r][midC])) map[r][midC] = 5;
      break;
    }
    case 16: {
      // Mostly-solid floor with a gap in the middle and a platform above
      let floorR = iB - 1;
      let gapL = midC - 1;
      let gapR = midC + 1;
      for (let c = iL; c <= iR && c < COLS; c++) {
        if (floorR < ROWS && (c < gapL || c > gapR)) map[floorR][c] = 1;
      }
      // Small platform over the gap to give the player an option
      for (let c = midC - 1; c <= midC + 1 && c < COLS; c++)
        if (midR < ROWS) map[midR][c] = 3;
      break;
    }
    case 17: {
      // Ascending staircase (three steps, left-to-right)
      let steps = 3;
      let stepW = Math.max(2, Math.floor(innerW / steps));
      for (let s = 0; s < steps; s++) {
        let platR = iB - s * Math.max(1, Math.floor(innerH / steps));
        let cs = iL + s * stepW;
        let ce = cs + stepW - 1;
        for (let c = cs; c <= ce && c <= iR && c < COLS; c++)
          if (platR >= iT && platR < ROWS) map[platR][c] = 3;
      }
      break;
    }
    case 18: {
      // Two asymmetric shelves at different heights
      let leftR = iT + Math.floor(innerH * 0.3);
      let rightR = iT + Math.floor(innerH * 0.65);
      let shelfW = Math.floor(innerW * 0.45);
      for (let c = iL; c < iL + shelfW && c < COLS; c++)
        if (leftR < ROWS) map[leftR][c] = 3;
      for (let c = iR - shelfW + 1; c <= iR && c < COLS; c++)
        if (rightR < ROWS) map[rightR][c] = 3;
      break;
    }
    case 19: {
      // T-shaped structure: wide mid-floor + central pillar from above
      let floorR = iB - 1;
      for (let c = iL + 1; c <= iR - 1 && c < COLS; c++)
        if (floorR < ROWS) map[floorR][c] = 1;
      for (let r = iT + 1; r <= midR && r < ROWS; r++)
        if (midC < COLS && map[r][midC] === 0) map[r][midC] = 1;
      break;
    }
  }

  // ---- Прорезаем выходы ----
  let exitMidR = Math.floor((iT + iB) / 2);
  let exitPassH = Math.min(3, innerH - 1);

  if (exits & EXIT_LEFT) {
    let topR = exitMidR - Math.floor(exitPassH / 2);
    for (let r = topR; r < topR + exitPassH && r < ROWS; r++) {
      if (r >= 0 && cStart < COLS) map[r][cStart] = 0;
      if (r >= 0 && iL < COLS) {
        if (isSolid(map[r][iL])) map[r][iL] = 0;
      }
    }
    let floorR = topR + exitPassH;
    if (floorR < ROWS && floorR < rEnd && cStart < COLS)
      map[floorR][cStart] = 1;
  }

  if (exits & EXIT_RIGHT) {
    let topR = exitMidR - Math.floor(exitPassH / 2);
    let rc = cEnd - 1;
    for (let r = topR; r < topR + exitPassH && r < ROWS; r++) {
      if (r >= 0 && rc < COLS) map[r][rc] = 0;
      if (r >= 0 && iR < COLS) {
        if (isSolid(map[r][iR])) map[r][iR] = 0;
      }
    }
    let floorR = topR + exitPassH;
    if (floorR < ROWS && floorR < rEnd && rc < COLS) map[floorR][rc] = 1;
  }

  if (exits & EXIT_UP) {
    let passW = Math.min(3, innerW - 1);
    let leftC = midC - Math.floor(passW / 2);
    for (let c = leftC; c < leftC + passW && c < COLS; c++) {
      if (c >= 0 && rStart < ROWS) map[rStart][c] = 0;
    }
    let ladderLen = Math.min(3, innerH);
    for (let r = rStart; r < rStart + ladderLen && r < ROWS; r++) {
      if (midC < COLS) {
        if (isSolid(map[r][midC])) map[r][midC] = 0;
        map[r][midC] = 5;
      }
    }
  }

  if (exits & EXIT_DOWN) {
    let passW = Math.min(3, innerW - 1);
    let leftC = midC - Math.floor(passW / 2);
    for (let c = leftC; c < leftC + passW && c < COLS; c++) {
      if (c >= 0 && rEnd - 1 >= 0 && rEnd - 1 < ROWS) map[rEnd - 1][c] = 0;
    }
    let ladderStart = Math.max(iB - 2, iT);
    for (let r = ladderStart; r < rEnd && r < ROWS; r++) {
      if (midC < COLS) {
        if (map[r][midC] === 1) map[r][midC] = 0;
        map[r][midC] = 5;
      }
    }
  }

  // ---- Биомные замены ----
  if (biomeKey === "ice") {
    for (let r = rStart; r < rEnd && r < ROWS; r++)
      for (let c = cStart; c < cEnd && c < COLS; c++)
        if (map[r][c] === 3 && Math.random() < 0.35) map[r][c] = 7;
  }
  if (PD.floor >= 4) {
    for (let r = rStart; r < rEnd && r < ROWS; r++)
      for (let c = cStart; c < cEnd && c < COLS; c++)
        if (map[r][c] === 3 && Math.random() < 0.08) map[r][c] = 8;
  }
  if (PD.floor >= 2) {
    for (let r = iT; r <= iB && r < ROWS; r++)
      for (let c = iL; c <= iR && c < COLS; c++)
        if (map[r][c] === 1 && Math.random() < 0.05) map[r][c] = 6;
  }
}

// ============================================================
// TRAP PLACEMENT (ALL TYPES)
// ============================================================
function placeRoomTraps(
  map,
  rStart,
  cStart,
  roomW,
  roomH,
  biomeKey,
  difficulty,
  roomInfo,
) {
  let rEnd = Math.min(rStart + roomH, ROWS - 1);
  let cEnd = Math.min(cStart + roomW, COLS - 1);
  let iT = rStart + 1,
    iB = rEnd - 2,
    iL = cStart + 1,
    iR = cEnd - 2;
  if (iB <= iT || iR <= iL) return;

  let midC = Math.floor((iL + iR) / 2);
  let trapBudget = 2 + Math.floor(difficulty * 0.4);
  let placed = 0;

  // Утилиты поиска позиций
  let findFloor = () => {
    for (let att = 0; att < 20; att++) {
      let c = iL + Math.floor(Math.random() * (iR - iL + 1));
      for (let r = iT; r <= iB; r++) {
        if (
          r < ROWS &&
          c < COLS &&
          isSolid(map[r][c]) &&
          r > 0 &&
          map[r - 1][c] === 0
        )
          return { r: r - 1, c, groundR: r };
      }
    }
    return null;
  };

  let findCeil = () => {
    for (let att = 0; att < 20; att++) {
      let c = iL + Math.floor(Math.random() * (iR - iL + 1));
      for (let r = iT; r <= iB; r++) {
        if (
          r < ROWS &&
          c < COLS &&
          isSolid(map[r][c]) &&
          r + 1 < ROWS &&
          map[r + 1][c] === 0
        )
          return { r: r + 1, c, ceilR: r };
      }
    }
    return null;
  };

  let findAir = () => {
    for (let att = 0; att < 25; att++) {
      let r = iT + Math.floor(Math.random() * (iB - iT + 1));
      let c = iL + Math.floor(Math.random() * (iR - iL + 1));
      if (r < ROWS && c < COLS && map[r][c] === 0) return { r, c };
    }
    return null;
  };

  let findWall = () => {
    for (let att = 0; att < 15; att++) {
      let r = iT + Math.floor(Math.random() * (iB - iT + 1));
      let c = Math.random() < 0.5 ? cStart : cEnd - 1;
      if (r < ROWS && c < COLS && map[r][c] === 1) {
        let adjC = c === cStart ? c + 1 : c - 1;
        if (adjC >= 0 && adjC < COLS && map[r][adjC] === 0)
          return { r, c, adjC };
      }
    }
    return null;
  };

  // Макрос для попытки размещения
  let tryPlace = (minFloor, chance, fn) => {
    if (
      difficulty >= minFloor &&
      Math.random() < chance &&
      placed < trapBudget
    ) {
      if (fn()) placed++;
    }
  };

  // ---- КЛАССИЧЕСКИЕ ЛОВУШКИ ----

  // Шипы (0+)
  tryPlace(0, 0.35, () => {
    let count = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      let s = findFloor();
      if (s && map[s.r][s.c] === 0) map[s.r][s.c] = 4;
    }
    return true;
  });

  // Pop spikes (2+)
  tryPlace(2, 0.25, () => {
    let s = findFloor();
    if (s && map[s.r][s.c] === 0) {
      map[s.r][s.c] = 12;
      return true;
    }
    return false;
  });

  // Fire traps (5+)
  tryPlace(5, 0.2, () => {
    let s = findFloor();
    if (s && map[s.r][s.c] === 0) {
      map[s.r][s.c] = 9;
      return true;
    }
    return false;
  });

  // Turret (6+)
  tryPlace(6, 0.15, () => {
    let s = findFloor();
    if (s && map[s.r][s.c] === 0) {
      map[s.r][s.c] = 13;
      return true;
    }
    return false;
  });

  // Electric (8+)
  tryPlace(8, 0.15, () => {
    let s = findFloor();
    if (s && map[s.r][s.c] === 0) {
      map[s.r][s.c] = 14;
      return true;
    }
    return false;
  });

  // Spear floor (3+)
  tryPlace(3, 0.2, () => {
    let s = findFloor();
    if (s && map[s.groundR][s.c] === 1) {
      map[s.groundR][s.c] = 15;
      return true;
    }
    return false;
  });

  // Falling slab (2+)
  tryPlace(2, 0.2, () => {
    let s = findCeil();
    if (s && map[s.r][s.c] === 0 && s.r + 1 < ROWS && map[s.r + 1][s.c] === 0) {
      map[s.r][s.c] = 16;
      return true;
    }
    return false;
  });

  // Falling rock (1+)
  tryPlace(1, 0.15, () => {
    let s = findCeil();
    if (s && map[s.r][s.c] === 0 && s.r + 1 < ROWS && map[s.r + 1][s.c] === 0) {
      map[s.r][s.c] = 17;
      return true;
    }
    return false;
  });

  // Static spike blocks floor (1+)
  tryPlace(1, 0.2, () => {
    let s = findFloor();
    if (s && (map[s.groundR][s.c] === 1 || map[s.groundR][s.c] === 3)) {
      map[s.groundR][s.c] = 18;
      for (let dc = 1; dc <= 2; dc++) {
        let nc = s.c + dc;
        if (
          nc <= iR &&
          nc < COLS &&
          map[s.groundR][nc] === 1 &&
          map[s.r][nc] === 0
        )
          map[s.groundR][nc] = 18;
      }
      return true;
    }
    return false;
  });

  // Ceiling spike blocks (3+)
  tryPlace(3, 0.15, () => {
    let s = findCeil();
    if (s && isSolid(map[s.ceilR][s.c])) {
      map[s.r][s.c] = 19;
      return true;
    }
    return false;
  });

  // Wall spike blocks (4+)
  tryPlace(4, 0.15, () => {
    let s = findWall();
    if (s) {
      map[s.r][s.adjC] = 20;
      if (s.r + 1 <= iB && s.r + 1 < ROWS && map[s.r + 1][s.adjC] === 0)
        map[s.r + 1][s.adjC] = 20;
      return true;
    }
    return false;
  });

  // Timer spike blocks (3+)
  tryPlace(3, 0.2, () => {
    let s = findFloor();
    if (s && (map[s.groundR][s.c] === 1 || map[s.groundR][s.c] === 3)) {
      map[s.groundR][s.c] = 21;
      let nc = s.c + 1;
      if (
        nc <= iR &&
        nc < COLS &&
        (map[s.groundR][nc] === 1 || map[s.groundR][nc] === 3)
      )
        map[s.groundR][nc] = 21;
      return true;
    }
    return false;
  });

  // Hidden ceiling timer (3+)
  tryPlace(3, 0.12, () => {
    let s = findCeil();
    if (s && isSolid(map[s.ceilR][s.c])) {
      map[s.r][s.c] = 22;
      return true;
    }
    return false;
  });

  // Triggered spike blocks (2+)
  tryPlace(2, 0.2, () => {
    let s = findFloor();
    if (s && (map[s.groundR][s.c] === 1 || map[s.groundR][s.c] === 3)) {
      map[s.groundR][s.c] = 23;
      return true;
    }
    return false;
  });

  // Press trap (3+)
  tryPlace(3, 0.15, () => {
    let s = findCeil();
    if (s && map[s.r][s.c] === 0 && s.r + 1 < ROWS && map[s.r + 1][s.c] === 0) {
      map[s.r][s.c] = 24;
      return true;
    }
    return false;
  });

  // ---- НОВЫЕ БЛОКИ ----

  // Пружина (2+) — иногда ловушка с шипами на потолке
  tryPlace(2, 0.18, () => {
    let s = findFloor();
    if (s && map[s.groundR][s.c] === 1) {
      map[s.groundR][s.c] = 25;
      // Ловушка: шипы над пружиной
      if (Math.random() < 0.4) {
        for (let cr = s.r - 1; cr >= iT; cr--) {
          if (isSolid(map[cr][s.c])) {
            if (cr + 1 < ROWS && map[cr + 1][s.c] === 0) map[cr + 1][s.c] = 19;
            break;
          }
        }
      }
      return true;
    }
    return false;
  });

  // Липкие стены (3+)
  tryPlace(3, 0.2, () => {
    let s = findWall();
    if (s && map[s.r][s.c] === 1) {
      map[s.r][s.c] = 26;
      // Группа 2-3 по вертикали
      for (let dr = 1; dr <= 2; dr++) {
        if (s.r + dr <= iB && s.r + dr < ROWS && map[s.r + dr][s.c] === 1)
          map[s.r + dr][s.c] = 26;
      }
      return true;
    }
    return false;
  });

  // Конвейеры (3+)
  tryPlace(3, 0.18, () => {
    let s = findFloor();
    if (s && map[s.groundR][s.c] === 1) {
      let dir = Math.random() < 0.5 ? 27 : 28;
      let len = 2 + Math.floor(Math.random() * 3);
      for (let dc = 0; dc < len; dc++) {
        let c = s.c + dc;
        if (c <= iR && c < COLS && map[s.groundR][c] === 1)
          map[s.groundR][c] = dir;
      }
      return true;
    }
    return false;
  });

  // Лава (5+ или вулканический биом)
  if (
    (difficulty >= 5 || biomeKey === "volcano") &&
    Math.random() < 0.15 &&
    placed < trapBudget
  ) {
    // Лава в нижней части комнаты, заменяя дно
    let lavaW = 2 + Math.floor(Math.random() * 3);
    let lavaStart =
      iL + Math.floor(Math.random() * Math.max(1, innerW - lavaW));
    for (let dc = 0; dc < lavaW; dc++) {
      let c = lavaStart + dc;
      if (c <= iR && c < COLS) {
        // Убираем пол и ставим лаву
        if (iB < ROWS) map[iB][c] = 29; // поверхность
        if (iB + 1 < rEnd && iB + 1 < ROWS) map[iB + 1][c] = 30; // тело (в полу)
      }
    }
    placed++;
  }

  // Паутина (1+) — в воздухе
  tryPlace(0, 0.3, () => {
    let count = 1 + Math.floor(Math.random() * 3);
    let any = false;
    for (let i = 0; i < count; i++) {
      let s = findAir();
      if (s && map[s.r][s.c] === 0) {
        map[s.r][s.c] = 31;
        any = true;
      }
    }
    return any;
  });

  // Зыбучий песок (3+ или пустынный биом)
  if (
    (difficulty >= 3 || biomeKey === "desert") &&
    Math.random() < 0.15 &&
    placed < trapBudget
  ) {
    let s = findFloor();
    if (s && map[s.groundR][s.c] === 1) {
      let len = 2 + Math.floor(Math.random() * 3);
      for (let dc = 0; dc < len; dc++) {
        let c = s.c + dc;
        if (c <= iR && c < COLS && map[s.groundR][c] === 1)
          map[s.groundR][c] = 32;
      }
      placed++;
    }
  }

  // Переключатель + ворота (4+)
  tryPlace(4, 0.15, () => {
    let s = findFloor();
    if (!s) return false;
    map[s.r][s.c] = 33;
    // Ворота на противоположной стороне
    let gateC =
      s.c < midC
        ? Math.min(iR - 1, s.c + Math.floor(innerW * 0.6))
        : Math.max(iL + 1, s.c - Math.floor(innerW * 0.6));
    let gates = [];
    for (let dr = -1; dr <= 1; dr++) {
      let gr = s.r + dr;
      if (
        gr >= iT &&
        gr <= iB &&
        gr < ROWS &&
        gateC >= 0 &&
        gateC < COLS &&
        map[gr][gateC] === 0
      ) {
        map[gr][gateC] = 35;
        gates.push({ r: gr, c: gateC });
      }
    }
    if (gates.length > 0) {
      switchGateLinks.push({ switchR: s.r, switchC: s.c, gates });
      return true;
    }
    map[s.r][s.c] = 0; // откат
    return false;
  });

  // Телепортер (6+) — один из пары, второй ставим позже
  tryPlace(6, 0.12, () => {
    let s = findFloor();
    if (s && map[s.groundR][s.c] === 1) {
      map[s.groundR][s.c] = 37;
      // Запоминаем для парного размещения
      teleporterPairs.push({ a: { r: s.groundR, c: s.c }, b: null });
      return true;
    }
    return false;
  });

  // Паровой гейзер (4+)
  tryPlace(4, 0.18, () => {
    let s = findFloor();
    if (s && map[s.groundR][s.c] === 1) {
      map[s.groundR][s.c] = 38;
      steamVents.push({
        r: s.groundR,
        c: s.c,
        period: 150 + Math.floor(Math.random() * 90),
        activeTime: 60 + Math.floor(Math.random() * 40),
        phase: Math.floor(Math.random() * 150),
      });
      return true;
    }
    return false;
  });

  // Гриб-батут (2+)
  tryPlace(2, 0.15, () => {
    let s = findFloor();
    if (!s || map[s.r][s.c] !== 0) return false;
    // Need at least 4 clear air cells above the mushroom so the super-bounce
    // doesn't shoot the player into solid ceiling tiles.
    for (let clearR = s.r - 1; clearR >= s.r - 4; clearR--) {
      if (clearR < 0 || isSolid(map[clearR][s.c])) return false;
    }
    map[s.r][s.c] = 40;
    return true;
  });

  // Капающая кислота (5+)
  tryPlace(5, 0.15, () => {
    let s = findCeil();
    if (s && map[s.r][s.c] === 0) {
      map[s.r][s.c] = 41;
      acidDrips.push({
        r: s.ceilR,
        c: s.c,
        dropTimer: 60 + Math.floor(Math.random() * 120),
        drops: [],
      });
      return true;
    }
    return false;
  });

  // Ветер (3+)
  tryPlace(3, 0.12, () => {
    let dir = Math.random() < 0.5 ? 42 : 43;
    let count = 3 + Math.floor(Math.random() * 4);
    let any = false;
    // Ветер заполняет вертикальную полосу
    let wc = iL + Math.floor(Math.random() * (iR - iL + 1));
    for (let r = iT; r <= iB && count > 0; r++) {
      if (r < ROWS && wc < COLS && map[r][wc] === 0) {
        map[r][wc] = dir;
        count--;
        any = true;
      }
    }
    return any;
  });

  // Фантомный блок (4+)
  tryPlace(4, 0.15, () => {
    let count = 2 + Math.floor(Math.random() * 2);
    let any = false;
    for (let i = 0; i < count; i++) {
      let s = findFloor();
      if (s && map[s.groundR][s.c] === 1) {
        map[s.groundR][s.c] = 44;
        phantomBlocks.push({ r: s.groundR, c: s.c, state: "solid", timer: 0 });
        any = true;
      }
    }
    return any;
  });

  // Факелы — в каждой комнате на тёмных этажах, + иногда на обычных
  let isDark = PD.floor % 5 === 0 && PD.floor > 0;
  if (isDark || Math.random() < 0.15) {
    let torchCount = isDark ? 2 + Math.floor(Math.random() * 2) : 1;
    for (let i = 0; i < torchCount; i++) {
      let s = findWall();
      if (s && map[s.r][s.adjC] === 0) {
        map[s.r][s.adjC] = 39;
      }
    }
  }
}

// ============================================================
// PAIR TELEPORTERS POST-GENERATION
// ============================================================
function pairTeleporters(map) {
  let unpaired = teleporterPairs.filter((p) => p.b === null);
  for (let i = 0; i < unpaired.length; i++) {
    // Ищем другой телепортер для пары
    let partner = null;
    for (let j = i + 1; j < unpaired.length; j++) {
      if (unpaired[j].b === null) {
        partner = j;
        break;
      }
    }
    if (partner !== null) {
      unpaired[i].b = unpaired[partner].a;
      unpaired[partner].b = unpaired[i].a;
    } else {
      // Нет пары — создаём второй телепортер в случайном месте
      for (let att = 0; att < 50; att++) {
        let r = 3 + Math.floor(Math.random() * (ROWS - 6));
        let c = 3 + Math.floor(Math.random() * (COLS - 6));
        if (map[r][c] === 1 && r > 0 && map[r - 1][c] === 0) {
          map[r][c] = 37;
          unpaired[i].b = { r, c };
          break;
        }
      }
    }
  }
}

// ============================================================
// DECORATIONS
// ============================================================
function placeDecorations(map) {
  let count = 5 + Math.floor(Math.random() * 8);
  for (let i = 0; i < count; i++) {
    let dc = 2 + Math.floor(Math.random() * (COLS - 4));
    let dr = 2 + Math.floor(Math.random() * (ROWS - 4));
    if (map[dr][dc] === 0) {
      let nearSolid = false;
      for (let dd of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]) {
        let nr = dr + dd[0],
          nc = dc + dd[1];
        if (
          nr >= 0 &&
          nr < ROWS &&
          nc >= 0 &&
          nc < COLS &&
          isSolid(map[nr][nc])
        )
          nearSolid = true;
      }
      if (nearSolid) map[dr][dc] = 11;
    }
  }
}

// ============================================================
// CONNECTIVITY LADDERS
// ============================================================
function addConnectivityLadders(map) {
  let count = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    let lc = 3 + Math.floor(Math.random() * (COLS - 6));
    for (let r = 3; r < ROWS - 4; r++) {
      if (isSolid(map[r][lc]) && r + 1 < ROWS && map[r + 1][lc] === 0) {
        let len = 3 + Math.floor(Math.random() * 5);
        for (let rr = r + 1; rr < r + 1 + len && rr < ROWS - 2; rr++) {
          if (map[rr][lc] === 0) map[rr][lc] = 5;
          else break;
        }
        break;
      }
    }
  }
}

// ============================================================
// MOVING PLATFORMS
// ============================================================
function placeMovingPlatforms(map) {
  if (PD.floor < 3) return;
  let mpCount = 1 + Math.floor(PD.floor / 4);
  for (let i = 0; i < mpCount; i++) {
    for (let att = 0; att < 25; att++) {
      let mc = 3 + Math.floor(Math.random() * (COLS - 8));
      let mr = 3 + Math.floor(Math.random() * (ROWS - 8));
      let ok = true;
      for (let dc = 0; dc < 3; dc++) {
        if (mc + dc >= COLS - 1 || map[mr][mc + dc] !== 0) ok = false;
        if (ok && mr > 0 && isSolid(map[mr - 1][mc + dc])) ok = false;
        if (ok && mr + 1 < ROWS && isSolid(map[mr + 1][mc + dc])) ok = false;
      }
      if (ok) {
        map[mr][mc] = 10;
        map[mr][mc + 1] = 10;
        map[mr][mc + 2] = 10;
        break;
      }
    }
  }
}

// ============================================================
// MAIN MAP GENERATION
// ============================================================
function generateMapData() {
  resetInteractiveObjects();

  let map = [];
  for (let r = 0; r < ROWS; r++) {
    map[r] = [];
    for (let c = 0; c < COLS; c++) map[r][c] = 0;
  }

  // Внешние границы
  for (let c = 0; c < COLS; c++) {
    map[0][c] = 2;
    map[ROWS - 1][c] = 1;
  }
  for (let r = 0; r < ROWS; r++) {
    map[r][0] = 2;
    map[r][COLS - 1] = 2;
  }

  let biome = getBiome(PD.floor);
  let biomeKey = Object.keys(BIOMES).find((k) => BIOMES[k] === biome);
  let roomW = getRoomW(),
    roomH = getRoomH();

  // Критический путь
  let { grid, startCol, endCol, endRow, pathOrder } = generateCriticalPath();

  // Открываем побочные комнаты
  openSideRooms(grid);

  // Заполняем комнаты
  for (let gr = 0; gr < ROOM_GRID_ROWS; gr++) {
    for (let gc = 0; gc < ROOM_GRID_COLS; gc++) {
      let rStart = 1 + gr * roomH;
      let cStart = 1 + gc * roomW;
      let exits = grid[gr][gc].exits;

      if (exits === 0) {
        // Закрытая — полностью solid
        for (let r = rStart; r < rStart + roomH && r < ROWS - 1; r++)
          for (let c = cStart; c < cStart + roomW && c < COLS - 1; c++)
            map[r][c] = 1;
        continue;
      }

      fillRoom(
        map,
        rStart,
        cStart,
        roomW,
        roomH,
        exits,
        grid[gr][gc],
        biomeKey,
      );
      placeRoomTraps(
        map,
        rStart,
        cStart,
        roomW,
        roomH,
        biomeKey,
        PD.floor,
        grid[gr][gc],
      );
    }
  }

  // Восстанавливаем границы
  for (let c = 0; c < COLS; c++) {
    map[0][c] = 2;
    map[ROWS - 1][c] = 1;
  }
  for (let r = 0; r < ROWS; r++) {
    map[r][0] = 2;
    map[r][COLS - 1] = 2;
  }

  // Пол внизу
  for (let c = 1; c < COLS - 1; c++) {
    if (map[ROWS - 2][c] === 0) map[ROWS - 2][c] = 1;
  }

  // Ямы
  let pits = 1 + Math.floor(PD.floor / 5);
  for (let i = 0; i < pits; i++) {
    let pw = 2 + Math.floor(Math.random() * 2);
    let pc = 8 + Math.floor(Math.random() * (COLS - 16));
    for (let c = pc; c < pc + pw && c < COLS - 2; c++) map[ROWS - 2][c] = 0;
  }

  addConnectivityLadders(map);
  placeMovingPlatforms(map);
  pairTeleporters(map);
  placeDecorations(map);

  return map;
}

// ============================================================
// VALIDATE LEVEL
// ============================================================
function validateLevel(map) {
  let roomW = getRoomW(),
    roomH = getRoomH();

  // Позиция игрока
  let playerC = 3,
    playerR = -1;
  for (let r = 1; r < ROWS; r++) {
    if (isSolid(map[r][playerC]) && !isSolid(map[r - 1][playerC])) {
      playerR = r - 1;
      break;
    }
  }
  if (playerR === -1) {
    playerR = ROWS - 3;
    map[playerR + 1][playerC] = 1;
  }

  // Очищаем спавн
  for (let r = Math.max(1, playerR - 2); r <= playerR; r++)
    for (
      let c = Math.max(1, playerC - 1);
      c <= Math.min(COLS - 2, playerC + 1);
      c++
    )
      if (map[r][c] !== 5) map[r][c] = 0;
  if (playerR + 1 < ROWS && !isSolid(map[playerR + 1][playerC]))
    map[playerR + 1][playerC] = 1;

  // Позиция выхода — максимально далеко от игрока
  let exitR = -1,
    exitC = -1,
    bestDist = 0;
  for (let r = ROWS - 4; r > 2; r--) {
    for (let c = COLS - 4; c > 2; c--) {
      if (
        isSolid(map[r][c]) &&
        r > 1 &&
        map[r - 1][c] === 0 &&
        (r < 2 || map[r - 2][c] === 0)
      ) {
        let dist = Math.abs(r - 1 - playerR) + Math.abs(c - playerC);
        if (dist > bestDist) {
          bestDist = dist;
          exitR = r - 1;
          exitC = c;
        }
      }
    }
  }
  if (exitR === -1) {
    exitC = COLS - 5;
    for (let r = 1; r < ROWS; r++) {
      if (isSolid(map[r][exitC]) && !isSolid(map[r - 1][exitC])) {
        exitR = r - 1;
        break;
      }
    }
  }
  if (exitR === -1) return null;

  map[exitR][exitC] = 0;
  if (exitR > 1) map[exitR - 1][exitC] = 0;

  // Достижимость
  let reachable = floodReachable(map, playerR, playerC);
  let exitKey = exitR * COLS + exitC;

  if (!reachable.has(exitKey)) {
    let fixed = false;
    // Лестница вниз от выхода
    for (let r = exitR; r < ROWS - 1 && !fixed; r++) {
      if (reachable.has(r * COLS + exitC)) {
        for (let rr = exitR; rr <= r; rr++)
          if (map[rr][exitC] === 0) map[rr][exitC] = 5;
        fixed = true;
      }
    }
    // Лестница + мост
    if (!fixed) {
      for (let dc = -5; dc <= 5 && !fixed; dc++) {
        let tc = exitC + dc;
        if (tc < 2 || tc >= COLS - 2) continue;
        for (let r = exitR; r < ROWS - 1; r++) {
          if (reachable.has(r * COLS + tc)) {
            for (let rr = exitR; rr <= r; rr++)
              if (map[rr][tc] === 0) map[rr][tc] = 5;
            let minC = Math.min(tc, exitC),
              maxC = Math.max(tc, exitC);
            for (let cc = minC; cc <= maxC; cc++)
              if (map[exitR][cc] === 0) map[exitR][cc] = 3;
            map[exitR][exitC] = 0;
            fixed = true;
            break;
          }
        }
      }
    }
    // Аварийная лестница
    if (!fixed) {
      for (let r = exitR; r < ROWS - 1; r++) {
        if (map[r][exitC] === 0) map[r][exitC] = 5;
        else if (isSolid(map[r][exitC])) break;
      }
    }
    reachable = floodReachable(map, playerR, playerC);
    if (!reachable.has(exitKey)) return null;
  }

  // Убираем ловушки из недостижимых зон
  let trapTypes = new Set([4, 9, 12, 13, 14, 16, 17, 19, 20, 22, 24, 41]);
  for (let r = 1; r < ROWS - 1; r++)
    for (let c = 1; c < COLS - 1; c++)
      if (trapTypes.has(map[r][c]) && !reachable.has(r * COLS + c))
        map[r][c] = 0;

  // Собираем споты
  let enemySpots = [],
    itemSpots = [],
    coinSpots = [];
  for (let r = 2; r < ROWS - 2; r++) {
    for (let c = 2; c < COLS - 2; c++) {
      if (!reachable.has(r * COLS + c)) continue;
      if (map[r][c] !== 0) continue;
      if (r + 1 >= ROWS || !isSolid(map[r + 1][c])) continue;
      if (Math.abs(r - playerR) < 3 && Math.abs(c - playerC) < 4) continue;
      if (Math.abs(r - exitR) < 2 && Math.abs(c - exitC) < 2) continue;
      enemySpots.push({ r, c });
      if (map[r - 1] && map[r - 1][c] === 0) itemSpots.push({ r, c });
      coinSpots.push({ r, c });
    }
  }
  if (enemySpots.length < 3) return null;

  // Сортируем itemSpots: далёкие от выхода первые (для ключей)
  for (let s of itemSpots) {
    s.distFromExit = Math.abs(s.r - exitR) + Math.abs(s.c - exitC);
  }
  itemSpots.sort((a, b) => b.distFromExit - a.distFromExit);

  return {
    valid: true,
    playerR,
    playerC,
    exitR,
    exitC,
    enemySpots,
    itemSpots,
    coinSpots,
    reachable,
  };
}

// ============================================================
// FALLBACK MAP
// ============================================================
function generateFallbackMap() {
  let map = [];
  for (let r = 0; r < ROWS; r++) {
    map[r] = [];
    for (let c = 0; c < COLS; c++) map[r][c] = 0;
  }
  for (let c = 0; c < COLS; c++) {
    map[0][c] = 2;
    map[ROWS - 1][c] = 1;
  }
  for (let r = 0; r < ROWS; r++) {
    map[r][0] = 2;
    map[r][COLS - 1] = 2;
  }
  for (let c = 1; c < COLS - 1; c++) map[ROWS - 2][c] = 1;
  let y = ROWS - 5,
    x = 4,
    dir = 1;
  while (y > 3) {
    for (let c = x; c < x + 7 && c < COLS - 2; c++) map[y][c] = 3;
    for (let r = y; r < y + 3 && r < ROWS - 2; r++)
      if (map[r][x + 3] === 0) map[r][x + 3] = 5;
    x += dir * 12;
    if (x > COLS - 12) {
      dir = -1;
      x = COLS - 12;
    }
    if (x < 3) {
      dir = 1;
      x = 3;
    }
    y -= 3;
  }
  return map;
}

function getWeaponProps() {
  let wp = PD.equipment.weapon;
  if (wp && wp.weapon) return wp.weapon;
  return { knockback: 120, atkSpeed: 0.3, range: 26, size: { w: 28, h: 10 } };
}
