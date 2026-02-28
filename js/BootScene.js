class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }
  create() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // Player sprites
    g.clear();
    g.fillStyle(0x3399ff);
    g.fillRect(6, 0, 20, 32);
    g.fillStyle(0xffcc99);
    g.fillRect(9, 2, 14, 10);
    g.fillStyle(0x2266cc);
    g.fillRect(8, 12, 16, 14);
    g.fillStyle(0x1a4d99);
    g.fillRect(8, 26, 6, 6);
    g.fillRect(18, 26, 6, 6);
    g.generateTexture("player", 32, 32);
    g.clear();
    g.fillStyle(0x3399ff);
    g.fillRect(6, 0, 20, 32);
    g.fillStyle(0xffcc99);
    g.fillRect(9, 2, 14, 10);
    g.fillStyle(0x2266cc);
    g.fillRect(4, 12, 10, 14);
    g.fillRect(18, 12, 10, 14);
    g.fillStyle(0x1a4d99);
    g.fillRect(6, 26, 8, 6);
    g.fillRect(18, 26, 8, 6);
    g.generateTexture("player_walk1", 32, 32);
    g.clear();
    g.fillStyle(0x3399ff);
    g.fillRect(6, 2, 20, 28);
    g.fillStyle(0xffcc99);
    g.fillRect(9, 4, 14, 10);
    g.fillStyle(0x2266cc);
    g.fillRect(8, 14, 16, 12);
    g.fillStyle(0x1a4d99);
    g.fillRect(8, 26, 6, 4);
    g.fillRect(18, 26, 6, 4);
    g.generateTexture("player_jump", 32, 32);
    // Biome tiles
    for (let bk in BIOMES) {
      let bi = BIOMES[bk];
      g.clear();
      g.fillStyle(bi.ground);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(
        Phaser.Display.Color.IntegerToColor(bi.ground).darken(15).color,
      );
      g.fillRect(0, 0, 16, 16);
      g.fillRect(16, 16, 16, 16);
      g.generateTexture("ground_" + bk, 32, 32);
      g.clear();
      g.fillStyle(bi.wall);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(
        Phaser.Display.Color.IntegerToColor(bi.wall).darken(15).color,
      );
      g.fillRect(0, 0, 16, 16);
      g.fillRect(16, 16, 16, 16);
      g.generateTexture("wall_" + bk, 32, 32);
      g.clear();
      g.fillStyle(bi.platform);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(
        Phaser.Display.Color.IntegerToColor(bi.platform).lighten(15)
          .color,
      );
      g.fillRect(0, 0, 32, 8);
      g.generateTexture("platform_" + bk, 32, 32);
    }
    // Special platform: ice
    g.clear();
    g.fillStyle(0x99ddff);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0xbbeeff);
    g.fillRect(0, 0, 32, 8);
    g.fillStyle(0xffffff, 0.4);
    g.fillRect(4, 4, 8, 3);
    g.fillRect(18, 12, 6, 3);
    g.generateTexture("ice_platform", 32, 32);
    // Special platform: crumbling
    g.clear();
    g.fillStyle(0x998866);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x887755);
    g.fillRect(0, 0, 32, 8);
    g.fillStyle(0x776644);
    g.fillRect(4, 20, 6, 6);
    g.fillRect(22, 16, 5, 5);
    g.lineStyle(1, 0x665533);
    g.lineBetween(8, 10, 24, 14);
    g.lineBetween(2, 18, 14, 22);
    g.generateTexture("crumble_platform", 32, 32);
    // Spike, coin, chest, exit, etc
    g.clear();
    g.fillStyle(0xaaaaaa);
    g.fillTriangle(4, 32, 16, 4, 28, 32);
    g.generateTexture("spike", 32, 32);
    // Pop spike
    g.clear();
    g.fillStyle(0xbbbbbb);
    g.fillTriangle(6, 32, 16, 8, 26, 32);
    g.fillStyle(0x888888);
    g.fillRect(6, 26, 20, 6);
    g.generateTexture("pop_spike", 32, 32);
    // Electric floor
    g.clear();
    g.fillStyle(0x333333);
    g.fillRect(0, 24, 32, 8);
    g.fillStyle(0x44ccff);
    g.fillRect(2, 26, 28, 4);
    g.fillStyle(0x66eeff, 0.6);
    g.fillRect(6, 25, 20, 2);
    g.generateTexture("electric_floor", 32, 32);
    // Turret
    g.clear();
    g.fillStyle(0x666666);
    g.fillRect(0, 8, 24, 12);
    g.fillStyle(0x444444);
    g.fillRect(16, 10, 8, 8);
    g.fillStyle(0xff4444);
    g.fillRect(18, 12, 4, 4);
    g.generateTexture("turret", 24, 24);
    // Spear floor (pressure plate — copper/rust color with nub hints)
    g.clear();
    g.fillStyle(0x7a3a1e);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x9e5530);
    g.fillRect(0, 0, 32, 5);
    g.fillStyle(0x4a2010);
    g.fillRect(4, 8, 3, 8);
    g.fillRect(14, 8, 3, 8);
    g.fillRect(24, 8, 3, 8);
    g.fillStyle(0xc87850);
    g.fillRect(0, 0, 32, 2);
    g.generateTexture("spear_floor", 32, 32);
    // Spear (tall silver spike that erupts from the floor)
    g.clear();
    g.fillStyle(0xbbbbcc);
    g.fillTriangle(10, 32, 16, 0, 22, 32);
    g.fillStyle(0x888899);
    g.fillRect(10, 22, 12, 10);
    g.generateTexture("spear", 32, 32);
    // Falling slab (heavy dark stone)
    g.clear();
    g.fillStyle(0x555566);
    g.fillRect(0, 4, 32, 24);
    g.fillStyle(0x3c3c4e);
    g.fillRect(0, 4, 32, 3);
    g.fillRect(0, 25, 32, 3);
    g.fillStyle(0x6a6a7a);
    g.fillRect(4, 10, 24, 3);
    g.fillRect(2, 16, 6, 5);
    g.fillRect(24, 14, 5, 4);
    g.generateTexture("falling_slab", 32, 32);
    // Falling rock (jagged, heavy)
    g.clear();
    g.fillStyle(0x4a3a2a);
    g.fillRect(4, 2, 24, 28);
    g.fillStyle(0x3a2a1a);
    g.fillRect(0, 8, 32, 4);
    g.fillRect(2, 20, 8, 6);
    g.fillRect(22, 6, 7, 8);
    g.fillStyle(0x6a5a4a);
    g.fillRect(8, 4, 16, 3);
    g.generateTexture("rock", 32, 32);
    // Static spike block - spikes up (brown block + 3 upward silver spikes)
    g.clear();
    g.fillStyle(0x5a4a3a);
    g.fillRect(0, 14, 32, 18);
    g.fillStyle(0x3a2a1a);
    g.fillRect(0, 14, 32, 2);
    g.fillStyle(0xaaaaaa);
    g.fillTriangle(1, 14, 6, 1, 11, 14);
    g.fillTriangle(11, 14, 16, 1, 21, 14);
    g.fillTriangle(21, 14, 26, 1, 31, 14);
    g.fillStyle(0x888888);
    g.fillRect(1, 12, 10, 2);
    g.fillRect(11, 12, 10, 2);
    g.fillRect(21, 12, 10, 2);
    g.generateTexture("sb_static_up", 32, 32);
    // Static spike block - spikes down (ceiling mount)
    g.clear();
    g.fillStyle(0x5a4a3a);
    g.fillRect(0, 0, 32, 18);
    g.fillStyle(0x3a2a1a);
    g.fillRect(0, 16, 32, 2);
    g.fillStyle(0xaaaaaa);
    g.fillTriangle(1, 18, 6, 31, 11, 18);
    g.fillTriangle(11, 18, 16, 31, 21, 18);
    g.fillTriangle(21, 18, 26, 31, 31, 18);
    g.fillStyle(0x888888);
    g.fillRect(1, 18, 10, 2);
    g.fillRect(11, 18, 10, 2);
    g.fillRect(21, 18, 10, 2);
    g.generateTexture("sb_static_dn", 32, 32);
    // Static spike block - spikes right (wall mount; flipX for left)
    g.clear();
    g.fillStyle(0x5a4a3a);
    g.fillRect(0, 0, 18, 32);
    g.fillStyle(0x3a2a1a);
    g.fillRect(16, 0, 2, 32);
    g.fillStyle(0xaaaaaa);
    g.fillTriangle(18, 1, 31, 6, 18, 11);
    g.fillTriangle(18, 11, 31, 16, 18, 21);
    g.fillTriangle(18, 21, 31, 26, 18, 31);
    g.fillStyle(0x888888);
    g.fillRect(18, 1, 2, 10);
    g.fillRect(18, 11, 2, 10);
    g.fillRect(18, 21, 2, 10);
    g.generateTexture("sb_static_rt", 32, 32);
    // Timer spike block base (blue-gray, no spikes baked in)
    g.clear();
    g.fillStyle(0x3a4a5a);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x4a5a6a);
    g.fillRect(2, 2, 28, 28);
    g.fillStyle(0x2a3a4a);
    g.fillRect(0, 0, 32, 2);
    g.fillRect(0, 30, 32, 2);
    g.fillRect(0, 0, 2, 32);
    g.fillRect(30, 0, 2, 32);
    g.generateTexture("sb_base", 32, 32);
    // Spike companion - pointing up (for timer and triggered blocks)
    g.clear();
    g.fillStyle(0xbbbbcc);
    g.fillTriangle(1, 20, 6, 0, 11, 20);
    g.fillTriangle(11, 20, 16, 0, 21, 20);
    g.fillTriangle(21, 20, 26, 0, 31, 20);
    g.fillStyle(0x888899);
    g.fillRect(1, 16, 10, 4);
    g.fillRect(11, 16, 10, 4);
    g.fillRect(21, 16, 10, 4);
    g.generateTexture("sb_sp_up", 32, 20);
    // Spike companion - pointing down (for timer ceiling blocks)
    g.clear();
    g.fillStyle(0xbbbbcc);
    g.fillTriangle(1, 0, 6, 20, 11, 0);
    g.fillTriangle(11, 0, 16, 20, 21, 0);
    g.fillTriangle(21, 0, 26, 20, 31, 0);
    g.fillStyle(0x888899);
    g.fillRect(1, 0, 10, 4);
    g.fillRect(11, 0, 10, 4);
    g.fillRect(21, 0, 10, 4);
    g.generateTexture("sb_sp_dn", 32, 20);
    // Triggered spike block base (purplish-gray, visually distinct)
    g.clear();
    g.fillStyle(0x3d3a50);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x4d4a60);
    g.fillRect(2, 2, 28, 28);
    g.fillStyle(0x2d2a40);
    g.fillRect(0, 0, 32, 2);
    g.fillRect(0, 30, 32, 2);
    g.fillRect(0, 0, 2, 32);
    g.fillRect(30, 0, 2, 32);
    g.generateTexture("sb_trig", 32, 32);
    // Press trap body (heavy stone with ridges)
    g.clear();
    g.fillStyle(0x404050);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x303040);
    g.fillRect(0, 0, 32, 4);
    g.fillRect(0, 28, 32, 4);
    g.fillStyle(0x505060);
    g.fillRect(2, 6, 28, 8);
    g.fillRect(2, 18, 28, 8);
    g.fillStyle(0x606070);
    g.fillRect(4, 8, 24, 4);
    g.fillRect(4, 20, 24, 4);
    g.generateTexture("press_body", 32, 32);
    // Key
    g.clear();
    g.fillStyle(0xffdd55);
    g.fillRect(4, 8, 10, 6);
    g.fillRect(12, 6, 10, 10);
    g.fillStyle(0xffaa00);
    g.fillRect(18, 9, 6, 4);
    g.generateTexture("key", 24, 16);

    g.clear();
    g.fillStyle(0xffdd00);
    g.fillCircle(8, 8, 7);
    g.generateTexture("coin", 16, 16);
    g.clear();
    g.fillStyle(0x885522);
    g.fillRect(0, 6, 24, 18);
    g.fillStyle(0xaa7733);
    g.fillRect(0, 6, 24, 6);
    g.fillStyle(0xffdd00);
    g.fillRect(9, 10, 6, 6);
    g.generateTexture("chest", 24, 24);
    // Golden chest (bright gold with crimson gem)
    g.clear();
    g.fillStyle(0xcc9900);
    g.fillRect(0, 6, 24, 18);
    g.fillStyle(0xffdd22);
    g.fillRect(0, 6, 24, 7);
    g.fillStyle(0xffee88);
    g.fillRect(1, 7, 5, 3);
    g.fillRect(18, 7, 5, 3);
    g.fillStyle(0x885500);
    g.fillRect(0, 13, 24, 2);
    g.fillStyle(0xdd2222);
    g.fillCircle(12, 17, 4);
    g.fillStyle(0xff6666);
    g.fillCircle(11, 16, 2);
    g.generateTexture("golden_chest", 24, 24);
    g.clear();
    g.fillStyle(0x224488);
    g.fillRect(0, 0, 28, 36);
    g.fillStyle(0x3366aa);
    g.fillRect(2, 2, 24, 32);
    g.fillStyle(0xffdd00);
    g.fillCircle(20, 20, 3);
    g.generateTexture("exit", 28, 36);
    g.clear();
    g.fillStyle(0xffffff);
    g.fillRect(2, 2, 12, 12);
    g.fillStyle(0x44aaff);
    g.fillRect(4, 4, 8, 8);
    g.generateTexture("itemdrop", 16, 16);
    g.clear();
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(0, 0, 36, 10);
    g.generateTexture("slash", 36, 10);
    g.clear();
    g.fillStyle(0xff8800, 0.6);
    g.fillCircle(24, 24, 24);
    g.generateTexture("explosion", 48, 48);
    g.clear();
    g.fillStyle(0x44aaff, 0.5);
    g.fillCircle(16, 16, 16);
    g.generateTexture("shield_fx", 32, 32);
    g.clear();
    g.fillStyle(0x775533);
    g.fillRect(0, 0, 8, 32);
    g.fillStyle(0x886644);
    g.fillRect(1, 0, 6, 32);
    g.generateTexture("ladder", 8, 32);
    g.clear();
    g.fillStyle(0x996633);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x664422);
    g.fillRect(4, 4, 24, 24);
    g.generateTexture("breakable", 32, 32);
    // Fire trap
    g.clear();
    g.fillStyle(0x444444);
    g.fillRect(0, 20, 32, 12);
    g.fillStyle(0xff4400);
    g.fillTriangle(4, 20, 16, 2, 28, 20);
    g.fillStyle(0xff8800, 0.6);
    g.fillTriangle(8, 20, 16, 6, 24, 20);
    g.generateTexture("fire_trap", 32, 32);
    // Moving platform
    g.clear();
    g.fillStyle(0x66aa66);
    g.fillRect(0, 0, 96, 16);
    g.fillStyle(0x88cc88);
    g.fillRect(0, 0, 96, 5);
    g.fillStyle(0x558855);
    g.fillRect(2, 8, 4, 4);
    g.fillRect(44, 8, 4, 4);
    g.fillRect(88, 8, 4, 4);
    g.generateTexture("moving_platform", 96, 16);
    // Decorations
    g.clear();
    g.fillStyle(0x666666, 0.5);
    g.fillTriangle(2, 0, 8, 16, 14, 0);
    g.generateTexture("deco_stalactite", 16, 16);
    g.clear();
    g.fillStyle(0x44aa44, 0.6);
    g.fillCircle(6, 10, 5);
    g.fillStyle(0x338833, 0.6);
    g.fillCircle(10, 8, 4);
    g.fillRect(7, 10, 2, 6);
    g.generateTexture("deco_mushroom", 16, 16);
    g.clear();
    g.fillStyle(0xccccaa, 0.4);
    g.fillRect(0, 8, 14, 4);
    g.fillRect(4, 4, 4, 8);
    g.generateTexture("deco_bones", 16, 16);
    // Wall torch
    g.clear();
    g.fillStyle(0x5a3a1a);
    g.fillRect(5, 16, 6, 16);
    g.fillStyle(0x8b5e2a);
    g.fillRect(2, 12, 12, 6);
    g.fillStyle(0x332200);
    g.fillRect(4, 10, 8, 4);
    g.fillStyle(0xff6600);
    g.fillTriangle(3, 14, 8, 1, 13, 14);
    g.fillStyle(0xffaa00, 0.9);
    g.fillTriangle(5, 14, 8, 4, 11, 14);
    g.fillStyle(0xffdd88, 0.7);
    g.fillTriangle(6, 13, 8, 7, 10, 13);
    g.generateTexture("deco_torch", 16, 32);
    // Wooden crate
    g.clear();
    g.fillStyle(0x8b6914);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x6b4f0f);
    g.fillRect(0, 0, 32, 4);
    g.fillRect(0, 14, 32, 4);
    g.fillRect(0, 28, 32, 4);
    g.fillRect(0, 0, 4, 32);
    g.fillRect(28, 0, 4, 32);
    g.fillStyle(0xaa8822);
    g.fillRect(5, 5, 22, 8);
    g.fillRect(5, 19, 22, 8);
    g.generateTexture("deco_crate", 32, 32);
    // Barrel
    g.clear();
    g.fillStyle(0x6b3f0f);
    g.fillRect(4, 0, 20, 32);
    g.fillStyle(0x8a5520);
    g.fillRect(6, 2, 16, 28);
    g.fillStyle(0x3a2008);
    g.fillRect(2, 3, 24, 3);
    g.fillRect(2, 13, 24, 3);
    g.fillRect(2, 23, 24, 3);
    g.fillRect(2, 29, 24, 3);
    g.generateTexture("deco_barrel", 28, 32);
    // Cobweb
    g.clear();
    g.lineStyle(1, 0xbbbbbb, 0.55);
    g.lineBetween(0, 0, 16, 16);
    g.lineBetween(8, 0, 16, 8);
    g.lineBetween(0, 8, 8, 16);
    g.lineBetween(0, 4, 4, 0);
    g.lineBetween(4, 8, 8, 4);
    g.lineBetween(0, 12, 4, 8);
    g.generateTexture("deco_cobweb", 16, 16);
    // Decorative urn
    g.clear();
    g.fillStyle(0x7a3a12);
    g.fillRect(6, 0, 12, 4);
    g.fillRect(2, 4, 20, 14);
    g.fillRect(4, 18, 16, 4);
    g.fillStyle(0xaa6622);
    g.fillRect(8, 1, 8, 3);
    g.fillRect(4, 5, 16, 6);
    g.fillStyle(0x5a2800);
    g.fillRect(2, 10, 20, 2);
    g.generateTexture("deco_urn", 24, 22);
    // Enemies
    for (let en in ENEMY_DEFS) {
      let ed = ENEMY_DEFS[en];
      g.clear();
      g.fillStyle(ed.color);
      g.fillRect(0, 0, ed.w, ed.h);
      g.fillStyle(0xffffff);
      g.fillRect(Math.floor(ed.w * 0.2), Math.floor(ed.h * 0.2), 4, 4);
      g.fillRect(Math.floor(ed.w * 0.6), Math.floor(ed.h * 0.2), 4, 4);
      g.fillStyle(0);
      g.fillRect(Math.floor(ed.w * 0.25), Math.floor(ed.h * 0.25), 2, 2);
      g.fillRect(Math.floor(ed.w * 0.65), Math.floor(ed.h * 0.25), 2, 2);
      g.generateTexture(en, ed.w, ed.h);
    }
    for (let bn in BOSS_DEFS) {
      let bd = BOSS_DEFS[bn];
      g.clear();
      g.fillStyle(bd.color);
      g.fillRect(0, 0, bd.w, bd.h);
      g.fillStyle(0xffffff);
      g.fillRect(Math.floor(bd.w * 0.15), Math.floor(bd.h * 0.15), 6, 6);
      g.fillRect(Math.floor(bd.w * 0.6), Math.floor(bd.h * 0.15), 6, 6);
      g.fillStyle(0xff0000);
      g.fillRect(Math.floor(bd.w * 0.2), Math.floor(bd.h * 0.2), 4, 3);
      g.fillRect(Math.floor(bd.w * 0.65), Math.floor(bd.h * 0.2), 4, 3);
      g.generateTexture(bn, bd.w, bd.h);
    }
    for (let con of CONSUMABLES) {
      g.clear();
      g.fillStyle(con.icon);
      g.fillCircle(8, 8, 7);
      g.generateTexture("cons_" + con.id, 16, 16);
    }
    g.clear();
    g.fillStyle(0xffffff, 0.1);
    for (let i = 0; i < 30; i++)
      g.fillCircle(
        Math.random() * 800,
        Math.random() * 600,
        1 + Math.random() * 2,
      );
    g.generateTexture("parallax_stars", 800, 600);
    g.clear();
    g.fillStyle(0x333355, 0.2);
    g.fillRect(0, 300, 800, 300);
    g.generateTexture("parallax_bg", 800, 600);
    // Spring tile (25) — bright green coiled spring
    g.clear();
    g.fillStyle(0x224422);
    g.fillRect(0, 26, 32, 6);
    g.fillStyle(0x33aa33);
    g.fillRect(2, 20, 28, 5);
    g.fillRect(4, 13, 24, 5);
    g.fillRect(2, 6, 28, 5);
    g.fillStyle(0x66dd66);
    g.fillRect(4, 21, 12, 2);
    g.fillRect(4, 14, 12, 2);
    g.fillRect(4, 7, 12, 2);
    g.generateTexture("spring_tile", 32, 32);
    // Conveyor left (27) — dark grey belt with left-pointing chevrons
    g.clear();
    g.fillStyle(0x445566);
    g.fillRect(0, 18, 32, 14);
    g.fillStyle(0x556677);
    g.fillRect(0, 18, 32, 4);
    g.fillStyle(0x99bbdd);
    g.fillTriangle(28, 22, 20, 26, 28, 30);
    g.fillTriangle(20, 22, 12, 26, 20, 30);
    g.fillTriangle(12, 22, 4, 26, 12, 30);
    g.generateTexture("conveyor_l", 32, 32);
    // Conveyor right (28) — dark grey belt with right-pointing chevrons
    g.clear();
    g.fillStyle(0x445566);
    g.fillRect(0, 18, 32, 14);
    g.fillStyle(0x556677);
    g.fillRect(0, 18, 32, 4);
    g.fillStyle(0x99bbdd);
    g.fillTriangle(4, 22, 12, 26, 4, 30);
    g.fillTriangle(12, 22, 20, 26, 12, 30);
    g.fillTriangle(20, 22, 28, 26, 20, 30);
    g.generateTexture("conveyor_r", 32, 32);
    // Lava (29) — glowing orange-red pool
    g.clear();
    g.fillStyle(0x881100);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0xcc3300);
    g.fillRect(0, 4, 32, 12);
    g.fillRect(4, 16, 24, 6);
    g.fillStyle(0xff6600);
    g.fillRect(2, 2, 8, 5);
    g.fillRect(14, 0, 10, 7);
    g.fillRect(24, 3, 6, 4);
    g.fillStyle(0xff9900, 0.6);
    g.fillRect(4, 0, 4, 3);
    g.fillRect(20, 2, 4, 3);
    g.generateTexture("lava_tile", 32, 32);
    // Lava body (30) — deeper, dimmer lava fill
    g.clear();
    g.fillStyle(0x661100);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0xaa2200);
    g.fillRect(0, 0, 32, 8);
    g.fillRect(4, 8, 24, 6);
    g.fillStyle(0xdd4400, 0.7);
    g.fillRect(6, 2, 5, 4);
    g.fillRect(20, 4, 6, 4);
    g.generateTexture("lava_body_tile", 32, 32);
    // Cobweb tile (31) — translucent web strands
    g.clear();
    g.lineStyle(1, 0xdddddd, 0.65);
    g.lineBetween(0, 0, 32, 32);
    g.lineBetween(32, 0, 0, 32);
    g.lineBetween(16, 0, 16, 32);
    g.lineBetween(0, 16, 32, 16);
    g.lineBetween(0, 8, 24, 32);
    g.lineBetween(8, 0, 32, 24);
    g.generateTexture("cobweb_tile", 32, 32);
    // Steam vent (38) — dark metal plate with vent slits
    g.clear();
    g.fillStyle(0x555555);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x3a3a3a);
    g.fillRect(0, 0, 32, 4);
    g.fillStyle(0x222222);
    g.fillRect(4, 8, 8, 6);
    g.fillRect(14, 8, 8, 6);
    g.fillRect(24, 8, 4, 6);
    g.fillStyle(0x888888);
    g.fillRect(2, 20, 28, 3);
    g.fillRect(2, 26, 28, 2);
    g.generateTexture("steam_vent_tile", 32, 32);
    // Mushroom bounce tile (40) — red cap with white spots
    g.clear();
    g.fillStyle(0x553311);
    g.fillRect(10, 20, 12, 12);
    g.fillStyle(0xcc2222);
    g.fillRect(0, 6, 32, 16);
    g.fillStyle(0xee4444);
    g.fillRect(0, 6, 32, 6);
    g.fillStyle(0xffffff);
    g.fillCircle(8, 14, 3);
    g.fillCircle(20, 12, 2);
    g.fillCircle(26, 16, 2);
    g.generateTexture("mushroom_tile", 32, 32);
    g.destroy();
    this.scene.start("MenuScene");
  }
}
