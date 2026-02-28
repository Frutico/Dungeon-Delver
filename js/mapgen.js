function isSolid(v) {
  return v === 1 || v === 2 || v === 3 || v === 6 || v === 7 || v === 8;
}
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
    while (lr < ROWS - 1 && !isSolid(map[lr + 1][c]) && map[lr][c] !== 5)
      lr++;
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
      let maxDx;
      if (dy <= 1) maxDx = 2;
      else if (dy <= 2) maxDx = 4;
      else maxDx = 5;
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

// map cell types:
// 0=air, 1=ground, 2=wall, 3=platform, 4=spike, 5=ladder, 6=breakable,
// 7=ice, 8=crumble, 9=fire_trap, 10=moving_platform(marker), 11=decor,
// 12=pop_spike, 13=turret, 14=electric
function generateMapData() {
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
  let pits = 1 + Math.floor(PD.floor / 5);
  for (let i = 0; i < pits; i++) {
    let pw = 2 + Math.floor(Math.random() * 2),
      pc = 8 + Math.floor(Math.random() * (COLS - 16));
    for (let c = pc; c < pc + pw && c < COLS - 2; c++)
      map[ROWS - 2][c] = 0;
  }
  let layerRows = [],
    y = ROWS - 5;
  while (y > 3) {
    layerRows.push(y);
    y -= 2 + Math.floor(Math.random() * 2);
  }
  let allSegments = [];
  let biome = getBiome(PD.floor);
  let biomeKey = Object.keys(BIOMES).find((k) => BIOMES[k] === biome);
  for (let ly of layerRows) {
    let c = 1 + Math.floor(Math.random() * 3);
    while (c < COLS - 3) {
      let pw = 3 + Math.floor(Math.random() * 6);
      if (c + pw > COLS - 2) pw = COLS - 2 - c;
      if (pw < 2) break;
      let actualY = ly;
      if (Math.random() < 0.3) {
        let shift = Math.random() < 0.5 ? -1 : 1;
        let ny = ly + shift;
        if (ny > 2 && ny < ROWS - 3) actualY = ny;
      }
      // Choose platform type based on biome and randomness
      let platType = 3; // normal
      if (biomeKey === "ice" && Math.random() < 0.4)
        platType = 7; // ice
      else if (PD.floor >= 3 && Math.random() < 0.15) platType = 7; // ice in other biomes
      if (PD.floor >= 4 && Math.random() < 0.12) platType = 8; // crumbling
      for (let cc = c; cc < c + pw; cc++) {
        if (map[actualY][cc] === 0) map[actualY][cc] = platType;
      }
      allSegments.push({ r: actualY, c: c, w: pw, type: platType });
      c += pw + 2 + Math.floor(Math.random() * 3);
    }
  }
  // Terrain features
  let featureCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < featureCount; i++) {
    let fc = 5 + Math.floor(Math.random() * (COLS - 10)),
      fr = 5 + Math.floor(Math.random() * (ROWS - 10)),
      fh = 2 + Math.floor(Math.random() * 3);
    for (let r = fr; r < fr + fh && r < ROWS - 2; r++) {
      if (map[r][fc] === 0) map[r][fc] = 1;
    }
  }
  // Ladders for unreachable segments
  for (let li = 0; li < layerRows.length; li++) {
    let layerR = layerRows[li];
    let belowR = li === 0 ? ROWS - 2 : layerRows[li - 1];
    let layerSegs = allSegments.filter(
      (s) => Math.abs(s.r - layerR) <= 1,
    );
    for (let seg of layerSegs) {
      let belowSegs =
        li === 0
          ? [{ r: ROWS - 2, c: 1, w: COLS - 2 }]
          : allSegments.filter((s) => Math.abs(s.r - belowR) <= 1);
      let reachable = false;
      for (let bs of belowSegs) {
        let hDiff = bs.r - seg.r;
        if (hDiff < 0 || hDiff > 4) continue;
        let bL = bs.c,
          bR = bs.c + bs.w,
          sL = seg.c,
          sR = seg.c + seg.w;
        let hDist = 0;
        if (sR <= bL) hDist = bL - sR;
        else if (sL >= bR) hDist = sL - bR;
        if (hDist <= 5 && hDiff <= 3) {
          reachable = true;
          break;
        }
      }
      if (!reachable) {
        let lc = seg.c + Math.floor(seg.w / 2);
        if (lc < 2) lc = 2;
        if (lc > COLS - 3) lc = COLS - 3;
        for (let r = seg.r; r <= belowR && r < ROWS - 1; r++) {
          if (map[r][lc] === 0) map[r][lc] = 5;
          else if (isSolid(map[r][lc])) break;
        }
      }
    }
  }
  // Extra ladders & ropes
  let el = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < el; i++) {
    let lc = 3 + Math.floor(Math.random() * (COLS - 6));
    for (let r = 3; r < ROWS - 4; r++) {
      if (isSolid(map[r][lc]) && map[r + 1][lc] === 0) {
        let len = 3 + Math.floor(Math.random() * 5);
        for (let rr = r + 1; rr < r + 1 + len && rr < ROWS - 2; rr++) {
          if (map[rr][lc] === 0) map[rr][lc] = 5;
          else break;
        }
        break;
      }
    }
  }
  let gl = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < gl; i++) {
    let lc = 4 + Math.floor(Math.random() * (COLS - 8));
    if (layerRows.length > 0) {
      let tR = layerRows[0];
      for (let r = tR; r < ROWS - 2; r++) {
        if (map[r][lc] === 0) map[r][lc] = 5;
        else if (isSolid(map[r][lc])) break;
      }
    }
  }
  // Spikes
  let spkCh = 0.01 + PD.floor * 0.004;
  for (let r = 2; r < ROWS - 2; r++)
    for (let c = 3; c < COLS - 3; c++) {
      if (
        isSolid(map[r][c]) &&
        r > 1 &&
        map[r - 1][c] === 0 &&
        Math.random() < spkCh
      ) {
        if (r >= ROWS - 4 && c < 7) continue;
        map[r - 1][c] = 4;
      }
    }
  // Pop spikes
  if (PD.floor >= 2) {
    let popCh = 0.01 + PD.floor * 0.003;
    for (let r = 2; r < ROWS - 2; r++)
      for (let c = 3; c < COLS - 3; c++) {
        if (
          isSolid(map[r][c]) &&
          r > 1 &&
          map[r - 1][c] === 0 &&
          Math.random() < popCh
        ) {
          map[r - 1][c] = 12;
        }
      }
  }
  // Fire traps
  if (PD.floor >= 5) {
    let ftCount = 1 + Math.floor(PD.floor / 5);
    for (let i = 0; i < ftCount; i++) {
      let fc = 5 + Math.floor(Math.random() * (COLS - 10));
      for (let r = ROWS - 3; r > 3; r--) {
        if (isSolid(map[r][fc]) && map[r - 1][fc] === 0) {
          map[r - 1][fc] = 9;
          break;
        }
      }
    }
  }
  // Turrets
  if (PD.floor >= 6) {
    let tCount = 1 + Math.floor(PD.floor / 6);
    for (let i = 0; i < tCount; i++) {
      let tc = 4 + Math.floor(Math.random() * (COLS - 8));
      for (let r = 4; r < ROWS - 3; r++) {
        if (isSolid(map[r][tc]) && map[r - 1][tc] === 0) {
          map[r - 1][tc] = 13;
          break;
        }
      }
    }
  }
  // Electric floor
  if (PD.floor >= 8) {
    let eCount = 1 + Math.floor(PD.floor / 6);
    for (let i = 0; i < eCount; i++) {
      let ec = 4 + Math.floor(Math.random() * (COLS - 8));
      for (let r = ROWS - 3; r > 3; r--) {
        if (isSolid(map[r][ec]) && map[r - 1][ec] === 0) {
          map[r - 1][ec] = 14;
          break;
        }
      }
    }
  }
  // Moving platform markers
  if (PD.floor >= 3) {
    let mpCount = 1 + Math.floor(PD.floor / 4);
    for (let i = 0; i < mpCount; i++) {
      let mc = 5 + Math.floor(Math.random() * (COLS - 10));
      let mr = 5 + Math.floor(Math.random() * (ROWS - 10));
      if (
        map[mr][mc] === 0 &&
        map[mr][mc + 1] === 0 &&
        map[mr][mc + 2] === 0
      ) {
        map[mr][mc] = 10;
        map[mr][mc + 1] = 10;
        map[mr][mc + 2] = 10;
      }
    }
  }
  // Decorations
  let decoCount = 5 + Math.floor(Math.random() * 8);
  for (let i = 0; i < decoCount; i++) {
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
  return map;
}

function validateLevel(map) {
  let playerC = 3,
    playerR = -1;
  for (let r = 1; r < ROWS; r++) {
    if (isSolid(map[r][playerC]) && !isSolid(map[r - 1][playerC])) {
      playerR = r - 1;
      break;
    }
  }
  if (playerR === -1) return null;
  for (let r = Math.max(1, playerR - 2); r <= playerR; r++)
    for (
      let c = Math.max(1, playerC - 1);
      c <= Math.min(COLS - 2, playerC + 1);
      c++
    ) {
      if (map[r][c] !== 5) map[r][c] = 0;
    }
  if (!isSolid(map[playerR + 1][playerC])) map[playerR + 1][playerC] = 1;
  let exitR = -1,
    exitC = -1;
  for (let r = 3; r < ROWS - 3; r++) {
    for (let c = COLS - 3; c > Math.floor(COLS / 2); c--) {
      if (
        isSolid(map[r][c]) &&
        map[r - 1][c] === 0 &&
        (r < 2 || map[r - 2][c] === 0)
      ) {
        exitR = r - 1;
        exitC = c;
        r = ROWS;
        break;
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
  let reachable = floodReachable(map, playerR, playerC);
  let exitKey = exitR * COLS + exitC;
  if (!reachable.has(exitKey)) {
    let fixed = false;
    for (let r = exitR; r < ROWS - 1; r++) {
      if (reachable.has(r * COLS + exitC)) {
        for (let rr = exitR; rr <= r; rr++) {
          if (map[rr][exitC] === 0) map[rr][exitC] = 5;
        }
        fixed = true;
        break;
      }
    }
    if (!fixed)
      for (let dc = -3; dc <= 3 && !fixed; dc++) {
        let tc = exitC + dc;
        if (tc < 2 || tc >= COLS - 2) continue;
        for (let r = exitR; r < ROWS - 1; r++) {
          if (reachable.has(r * COLS + tc)) {
            for (let rr = exitR; rr <= r; rr++) {
              if (map[rr][tc] === 0) map[rr][tc] = 5;
            }
            let minC = Math.min(tc, exitC),
              maxC = Math.max(tc, exitC);
            for (let cc = minC; cc <= maxC; cc++) {
              if (map[exitR][cc] === 0) map[exitR][cc] = 3;
            }
            map[exitR][exitC] = 0;
            fixed = true;
            break;
          }
        }
      }
    if (!fixed)
      for (let r = exitR; r < ROWS - 1; r++) {
        if (map[r][exitC] === 0) map[r][exitC] = 5;
        else if (isSolid(map[r][exitC])) break;
      }
    reachable = floodReachable(map, playerR, playerC);
    if (!reachable.has(exitKey)) return null;
  }
  let enemySpots = [],
    itemSpots = [],
    coinSpots = [];
  for (let r = 2; r < ROWS - 2; r++)
    for (let c = 2; c < COLS - 2; c++) {
      if (!reachable.has(r * COLS + c)) continue;
      if (map[r][c] !== 0) continue;
      if (r + 1 >= ROWS || !isSolid(map[r + 1][c])) continue;
      if (Math.abs(r - playerR) < 3 && Math.abs(c - playerC) < 4)
        continue;
      if (Math.abs(r - exitR) < 2 && Math.abs(c - exitC) < 2) continue;
      enemySpots.push({ r, c });
      if (map[r - 1] && map[r - 1][c] === 0) itemSpots.push({ r, c });
      coinSpots.push({ r, c });
    }
  if (enemySpots.length < 3) return null;
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
    for (let r = y; r < y + 3 && r < ROWS - 2; r++) {
      if (map[r][x + 3] === 0) map[r][x + 3] = 5;
    }
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
  // Default: bare fists
  return {
    knockback: 120,
    atkSpeed: 0.3,
    range: 26,
    size: { w: 28, h: 10 },
  };
}
