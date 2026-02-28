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
    g.destroy();
    this.scene.start("MenuScene");
  }
}
