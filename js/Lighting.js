// ============================================================
// LIGHTING SYSTEM — Phaser 3 compatible
// ============================================================
// Light comes from:
//   1) Sky (top down) — white, penetrates until blocked by solid tile
//   2) Point light sources (fire traps, electric floors, decorations)
//   3) Player — small warm radius around the player
// Solid blocks block light propagation.
// On dark floors (every 5th floor) — pitch black outside light sources.

const LIGHT_DECAY = 0.92; // attenuation per air tile
const LIGHT_SOLID_DECAY = 0.3; // attenuation through solid (nearly blocks)
const SKY_LIGHT = 1.0;
const PLAYER_LIGHT_RADIUS = 5;
const PLAYER_LIGHT_INTENSITY = 0.7;
const AMBIENT_LIGHT = 0.34; // minimum light (no pure black on normal floors)
const DARK_FLOOR_AMBIENT = 1.0; // dark floors: absolute darkness

let lightMap = null; // { r, g, b } Float32Arrays, one value per tile

function createLightMap() {
  lightMap = {
    r: new Float32Array(ROWS * COLS),
    g: new Float32Array(ROWS * COLS),
    b: new Float32Array(ROWS * COLS),
  };
}

function getLightIndex(row, col) {
  return row * COLS + col;
}

function isDarkFloor() {
  // Every 5th floor is pitch-dark for atmosphere
  return PD.floor % 5 === 0 && PD.floor > 0;
}

// Which tile types emit light in this game
function isLightSource(tile) {
  return tile === 9 || tile === 11 || tile === 14;
  // 9  = fire_trap   → orange glow
  // 11 = decoration  → warm torch-like glow (includes actual torches)
  // 14 = electric_floor → cyan spark glow
}

function getLightRadius(tile) {
  if (tile === 9) return 7; // fire trap — wide bright glow
  if (tile === 11) return 4; // decoration — moderate warm glow
  if (tile === 14) return 6; // electric — medium blue glow
  return 3;
}

function getLightColor(tile) {
  if (tile === 9) return { r: 255, g: 110, b: 30 }; // deep orange fire
  if (tile === 11) return { r: 255, g: 190, b: 90 }; // warm amber torch
  if (tile === 14) return { r: 80, g: 200, b: 255 }; // cyan electric
  return { r: 255, g: 255, b: 220 };
}

// ---- Main calculation entry point ----
function calculateLighting(map, playerR, playerC) {
  if (!lightMap) createLightMap();

  let ambient = isDarkFloor() ? DARK_FLOOR_AMBIENT : AMBIENT_LIGHT;

  // Step 1: fill with ambient
  for (let i = 0; i < ROWS * COLS; i++) {
    lightMap.r[i] = ambient;
    lightMap.g[i] = ambient;
    lightMap.b[i] = ambient;
  }

  // Step 2: sky light (not on dark floors)
  if (!isDarkFloor()) {
    calculateSkyLight(map);
  }

  // Step 3: tile-based light sources (fire, electric, torches)
  calculateSourceLights(map);

  // Step 4: player — very dim hint only, so nearby ground reacts subtly
  // (not a strong lantern; entities in air tiles are never covered by the overlay anyway)
  addPointLight(map, playerR, playerC, 2, 0.18, { r: 240, g: 220, b: 180 });
}

// ---- Sky light: top-down with horizontal spreading ----
function calculateSkyLight(map) {
  for (let c = 0; c < COLS; c++) {
    let intensity = SKY_LIGHT;
    for (let r = 0; r < ROWS; r++) {
      let idx = getLightIndex(r, c);
      if (isSolid(map[r][c])) {
        intensity *= LIGHT_SOLID_DECAY;
      }
      let skyColor = getSkyLightColor(r);
      lightMap.r[idx] = Math.max(
        lightMap.r[idx],
        (intensity * skyColor.r) / 255,
      );
      lightMap.g[idx] = Math.max(
        lightMap.g[idx],
        (intensity * skyColor.g) / 255,
      );
      lightMap.b[idx] = Math.max(
        lightMap.b[idx],
        (intensity * skyColor.b) / 255,
      );
      if (!isSolid(map[r][c])) intensity *= 0.95;
      if (intensity < 0.01) break;
    }
  }

  // Horizontal spreading: 3 left→right / right→left passes
  for (let pass = 0; pass < 3; pass++) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 1; c < COLS; c++) {
        if (!isSolid(map[r][c]) && !isSolid(map[r][c - 1])) {
          let idx = getLightIndex(r, c),
            prev = getLightIndex(r, c - 1);
          lightMap.r[idx] = Math.max(
            lightMap.r[idx],
            lightMap.r[prev] * LIGHT_DECAY,
          );
          lightMap.g[idx] = Math.max(
            lightMap.g[idx],
            lightMap.g[prev] * LIGHT_DECAY,
          );
          lightMap.b[idx] = Math.max(
            lightMap.b[idx],
            lightMap.b[prev] * LIGHT_DECAY,
          );
        }
      }
      for (let c = COLS - 2; c >= 0; c--) {
        if (!isSolid(map[r][c]) && !isSolid(map[r][c + 1])) {
          let idx = getLightIndex(r, c),
            next = getLightIndex(r, c + 1);
          lightMap.r[idx] = Math.max(
            lightMap.r[idx],
            lightMap.r[next] * LIGHT_DECAY,
          );
          lightMap.g[idx] = Math.max(
            lightMap.g[idx],
            lightMap.g[next] * LIGHT_DECAY,
          );
          lightMap.b[idx] = Math.max(
            lightMap.b[idx],
            lightMap.b[next] * LIGHT_DECAY,
          );
        }
      }
    }
  }
}

// Sky color shifts from warm at top to slightly cool at depth
function getSkyLightColor(row) {
  let d = row / ROWS;
  return {
    r: Math.floor(255 - d * 30),
    g: Math.floor(245 - d * 50),
    b: Math.floor(220 + d * 35),
  };
}

// ---- Scan the map for light-emitting tiles ----
function calculateSourceLights(map) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let tile = map[r][c];
      if (!isLightSource(tile)) continue;
      let intensity = 1.0;
      if (tile === 9) intensity = 0.8; // fire trap
      if (tile === 11) intensity = 0.45; // decoration (torches, etc.)
      if (tile === 14) intensity = 0.65; // electric floor
      addPointLight(
        map,
        r,
        c,
        getLightRadius(tile),
        intensity,
        getLightColor(tile),
      );
    }
  }
}

// ---- BFS point light — spreads from source, attenuates each tile ----
function addPointLight(map, srcR, srcC, radius, intensity, color) {
  let queue = [{ r: srcR, c: srcC, light: intensity }];
  let visited = new Set();
  visited.add(srcR * COLS + srcC);

  while (queue.length > 0) {
    let { r, c, light } = queue.shift();
    if (light < 0.02) continue;

    let idx = getLightIndex(r, c);
    lightMap.r[idx] = Math.max(lightMap.r[idx], (light * color.r) / 255);
    lightMap.g[idx] = Math.max(lightMap.g[idx], (light * color.g) / 255);
    lightMap.b[idx] = Math.max(lightMap.b[idx], (light * color.b) / 255);

    for (let [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      let nr = r + dr,
        nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      let nk = nr * COLS + nc;
      if (visited.has(nk)) continue;
      visited.add(nk);
      if (Math.abs(nr - srcR) + Math.abs(nc - srcC) > radius) continue;
      let decay = isSolid(map[nr][nc]) ? LIGHT_SOLID_DECAY : LIGHT_DECAY;
      let newLight = light * decay;
      if (newLight > 0.02) queue.push({ r: nr, c: nc, light: newLight });
    }
  }
}

// ============================================================
// PHASER 3 RENDERING
// ============================================================
// Call this every frame with the scene's Graphics object and main camera.
// The graphics object must have setScrollFactor(0) and high depth.

// map is required so we can skip non-solid tiles — entities live in air tiles
// and should never be darkened by the overlay.
function renderLighting(graphics, camera, map) {
  if (!lightMap) return;
  graphics.clear();

  let camL = camera.scrollX;
  let camT = camera.scrollY;
  let startC = Math.max(0, Math.floor(camL / TW) - 1);
  let startR = Math.max(0, Math.floor(camT / TH) - 1);
  let endC = Math.min(COLS, startC + Math.ceil(camera.width / TW) + 2);
  let endR = Math.min(ROWS, startR + Math.ceil(camera.height / TH) + 2);

  for (let r = startR; r < endR; r++) {
    for (let c = startC; c < endC; c++) {
      // Skip air / non-solid tiles — the player, enemies, items and coins
      // all exist in air cells, so they never get covered by the overlay.
      if (!isSolid(map[r][c])) continue;

      let idx = getLightIndex(r, c);
      let lr = lightMap.r[idx];
      let lg = lightMap.g[idx];
      let lb = lightMap.b[idx];
      let maxLight = Math.max(lr, lg, lb);

      if (maxLight >= 0.98) continue; // fully lit tile — skip

      let sx = Math.round(c * TW - camL);
      let sy = Math.round(r * TH - camT);
      let darkness = 1 - maxLight;

      // Primary dark overlay
      graphics.fillStyle(0x000000, Math.min(1, darkness * 0.88));
      graphics.fillRect(sx, sy, TW, TH);

      // Colored tint from nearby light sources (fire = orange wash, electric = blue wash)
      if (lr > 0.05 || lg > 0.05 || lb > 0.05) {
        let tintAlpha = Math.min(0.3, maxLight * 0.35);
        let tr = Math.floor(Math.min(255, lr * 255));
        let tg = Math.floor(Math.min(255, lg * 255));
        let tb = Math.floor(Math.min(255, lb * 255));
        graphics.fillStyle((tr << 16) | (tg << 8) | tb, tintAlpha);
        graphics.fillRect(sx, sy, TW, TH);
      }
    }
  }
}

function markLightDirty() {
  // Called when the map changes (breakable destroyed, etc.)
  // The throttled recalculation in update() will pick this up automatically.
}
