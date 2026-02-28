const TW = 32,
  TH = 32,
  COLS = 50,
  ROWS = 30;
const WORLD_W = COLS * TW,
  WORLD_H = ROWS * TH;
const GRAVITY = 900,
  JUMP_VEL = -450,
  MOVE_SPD = 160,
  DASH_SPD = 400,
  DASH_DUR = 0.18,
  DASH_CD = 0.8;
const SAVE_KEY = "dungeon_delver_save_v3";

// Coyote time & jump buffer (in seconds)
const COYOTE_TIME = 0.12;
const JUMP_BUFFER = 0.1;
// Corner correction: nudge pixels when head hits corner
const CORNER_CORRECT = 6;

const RARITIES = {
  common: "#aaaaaa",
  uncommon: "#55ff55",
  rare: "#5555ff",
  epic: "#ff55ff",
  legendary: "#ffaa00",
};
const BIOMES = {
  cave: {
    bg: 0x1a1a2e,
    ground: 0x886644,
    wall: 0x555555,
    platform: 0x997755,
    name: "Cave",
  },
  castle: {
    bg: 0x1a1a30,
    ground: 0x556677,
    wall: 0x667788,
    platform: 0x778899,
    name: "Castle",
  },
  hell: {
    bg: 0x2a0a0a,
    ground: 0x553322,
    wall: 0x662222,
    platform: 0x774433,
    name: "Inferno",
  },
  ice: {
    bg: 0x0a1a2a,
    ground: 0x88aacc,
    wall: 0x6699bb,
    platform: 0x99bbdd,
    name: "Frozen Depths",
  },
  void: {
    bg: 0x0a0a1a,
    ground: 0x443366,
    wall: 0x332255,
    platform: 0x554477,
    name: "The Void",
  },
};
function getBiome(f) {
  if (f <= 4) return BIOMES.cave;
  if (f <= 9) return BIOMES.castle;
  if (f <= 14) return BIOMES.hell;
  if (f <= 19) return BIOMES.ice;
  return BIOMES.void;
}
