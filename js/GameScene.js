class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }
  create() {
    this.gameOver = false;
    this.attackTimer = 0;
    this.invTimer = 0;
    this.regenTimer = 0;
    this.auraTimer = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.extraJumps = 0;
    this.facingRight = true;
    this.walkFrame = 0;
    this.walkTimer = 0;
    this._exitMsgCd = 0;
    this.hasKey = false;
    this.playerOnPlatform = null;
    this.enemyMinDist = 12;
    // Movement feel
    this.coyoteTimer = 0; // time since last grounded
    this.jumpBufferTimer = 0; // time since jump pressed
    this.wasOnFloor = false;
    this.onIce = false;
    this.playerVx = 0; // smoothed velocity for ice
    this.isBossFloor = getBoss(PD.floor) !== null;
    let biome = getBiome(PD.floor);
    this.currentBiome = biome;
    this.biomeKey = Object.keys(BIOMES).find((k) => BIOMES[k] === biome);
    this.cameras.main.setBackgroundColor(biome.bg);
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.add
      .image(400, 300, "parallax_stars")
      .setScrollFactor(0.05)
      .setAlpha(0.3)
      .setDepth(-3);
    this.add
      .image(400, 300, "parallax_bg")
      .setScrollFactor(0.15)
      .setAlpha(0.2)
      .setDepth(-2);
    this.platforms = this.physics.add.staticGroup();
    this.icePlatforms = this.physics.add.staticGroup();
    this.crumblePlatforms = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.popSpikes = this.physics.add.staticGroup();
    this.fireTraps = this.physics.add.staticGroup();
    this.electrics = this.physics.add.staticGroup();
    this.turrets = this.physics.add.staticGroup();
    this.ladders = this.physics.add.staticGroup();
    this.breakables = this.physics.add.staticGroup();
    this.movingPlatforms = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.spearFloors = this.physics.add.staticGroup();
    this.spears = this.physics.add.staticGroup();
    this.fallingSlabs = this.physics.add.group();
    this.sbStatic = this.physics.add.staticGroup();
    this.sbTimerBase = this.physics.add.staticGroup();
    this.sbTimerSpikes = this.physics.add.staticGroup();
    this.sbTrigBase = this.physics.add.staticGroup();
    this.sbTrigSpikes = this.physics.add.staticGroup();
    this.fallingRocks = this.physics.add.group();
    this.presses = this.physics.add.group();
    this.goldenChests = this.physics.add.staticGroup();

    let levelData = null;
    for (let attempt = 0; attempt < 50; attempt++) {
      this.platforms.clear(true, true);
      this.icePlatforms.clear(true, true);
      this.crumblePlatforms.clear(true, true);
      this.spikes.clear(true, true);
      this.popSpikes.clear(true, true);
      this.fireTraps.clear(true, true);
      this.electrics.clear(true, true);
      this.turrets.clear(true, true);
      this.ladders.clear(true, true);
      this.breakables.clear(true, true);
      this.movingPlatforms.clear(true, true);
      this.spearFloors.clear(true, true);
      this.spears.clear(true, true);
      this.fallingSlabs.clear(true, true);
      this.sbStatic.clear(true, true);
      this.sbTimerBase.clear(true, true);
      this.sbTimerSpikes.clear(true, true);
      this.sbTrigBase.clear(true, true);
      this.sbTrigSpikes.clear(true, true);
      this.fallingRocks.clear(true, true);
      this.presses.clear(true, true);
      this.goldenChests.clear(true, true);
      let map = generateMapData();
      let v = validateLevel(map);
      if (v && v.valid) {
        levelData = { map, v };
        break;
      }
    }
    if (!levelData) {
      this.platforms.clear(true, true);
      this.icePlatforms.clear(true, true);
      this.crumblePlatforms.clear(true, true);
      this.spikes.clear(true, true);
      this.popSpikes.clear(true, true);
      this.fireTraps.clear(true, true);
      this.electrics.clear(true, true);
      this.turrets.clear(true, true);
      this.ladders.clear(true, true);
      this.breakables.clear(true, true);
      this.movingPlatforms.clear(true, true);
      this.spearFloors.clear(true, true);
      this.spears.clear(true, true);
      this.fallingSlabs.clear(true, true);
      this.sbStatic.clear(true, true);
      this.sbTimerBase.clear(true, true);
      this.sbTimerSpikes.clear(true, true);
      this.sbTrigBase.clear(true, true);
      this.sbTrigSpikes.clear(true, true);
      this.fallingRocks.clear(true, true);
      this.presses.clear(true, true);
      this.goldenChests.clear(true, true);
      let map = generateFallbackMap();
      levelData = {
        map,
        v: {
          valid: true,
          playerR: ROWS - 3,
          playerC: 3,
          exitR: ROWS - 3,
          exitC: COLS - 5,
          enemySpots: [
            { r: ROWS - 3, c: 20 },
            { r: ROWS - 3, c: 30 },
            { r: ROWS - 3, c: 40 },
          ],
          itemSpots: [],
          coinSpots: [{ r: ROWS - 3, c: 15 }],
          reachable: new Set(),
        },
      };
    }
    let map = levelData.map,
      v = levelData.v;
    this.mapData = map;
    this.validEnemySpots = v.enemySpots;
    this.validItemSpots = v.itemSpots;
    this.validCoinSpots = v.coinSpots;
    let bc2 = 2 + Math.floor(PD.floor * 0.5);
    let breakSpots = [...this.validItemSpots];
    Phaser.Utils.Array.Shuffle(breakSpots);
    for (let i = 0; i < bc2 && breakSpots.length > 0; i++) {
      let spot = breakSpots.pop();
      if (map[spot.r][spot.c] === 0) map[spot.r][spot.c] = 6;
    }

    let bk = this.biomeKey;
    let decoTextures = ["deco_stalactite", "deco_mushroom", "deco_bones", "deco_crate", "deco_barrel", "deco_cobweb", "deco_urn", "deco_torch"];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        let tx = c * TW + TW / 2,
          ty = r * TH + TH / 2;
        switch (map[r][c]) {
          case 1:
            this.platforms.create(tx, ty, "ground_" + bk);
            break;
          case 2:
            this.platforms.create(tx, ty, "wall_" + bk);
            break;
          case 3:
            this.platforms.create(tx, ty, "platform_" + bk);
            break;
          case 4: {
            let sp = this.spikes.create(tx, ty, "spike");
            sp.body.setSize(24, 12);
            sp.body.setOffset(4, 20);
            break;
          }
          case 5: {
            let ld = this.ladders.create(tx, ty, "ladder");
            ld.body.setSize(8, 32);
            ld.setAlpha(0.7);
            break;
          }
          case 6: {
            let br = this.breakables.create(tx, ty, "breakable");
            br.hp = 3;
            br.tileR = r;
            br.tileC = c;
            break;
          }
          case 7: {
            let ip = this.icePlatforms.create(tx, ty, "ice_platform");
            ip.isIce = true;
            break;
          }
          case 8: {
            let cp = this.crumblePlatforms.create(
              tx,
              ty,
              "crumble_platform",
            );
            cp.crumbleTimer = -1;
            break;
          }
          case 9: {
            let ft = this.fireTraps.create(tx, ty, "fire_trap");
            ft.fireTimer = 0;
            ft.fireActive = false;
            ft.fireCycle = 2 + Math.random() * 2;
            break;
          }
          case 10: {
            if (c > 0 && map[r][c - 1] === 10) break;
            let mw = 0;
            for (let cc = c; cc < COLS && map[r][cc] === 10; cc++) mw++;
            let mp = this.movingPlatforms.create(
              tx + ((mw - 1) * TW) / 2,
              ty,
              "moving_platform",
            );
            mp.setDisplaySize(mw * TW, 16);
            mp.body.setSize(mw * TW, 12);
            mp.body.setImmovable(true);
            mp.body.setAllowGravity(false);
            mp.moveSpeed = 25 + Math.random() * 20;
            mp.startX = mp.x;
            mp.moveRange = 2 * TW + Math.random() * 2 * TW;
            mp.movePhase = Math.random() * Math.PI * 2;
            break;
          }
          case 11: {
            let dtex = decoTextures[Math.floor(Math.random() * decoTextures.length)];
            let dimg = this.add.image(tx, ty, dtex).setAlpha(0.5).setDepth(-1);
            if (dtex === "deco_torch") {
              dimg.setAlpha(0.9);
              this.tweens.add({
                targets: dimg,
                alpha: { from: 0.75, to: 1.0 },
                scaleX: { from: 0.93, to: 1.07 },
                duration: 130 + Math.random() * 90,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
              });
              let glow = this.add.circle(tx, ty - 6, 12, 0xff7700, 0.18).setDepth(-1);
              this.tweens.add({
                targets: glow,
                alpha: { from: 0.1, to: 0.32 },
                scaleX: { from: 0.8, to: 1.25 },
                scaleY: { from: 0.8, to: 1.25 },
                duration: 180 + Math.random() * 120,
                yoyo: true,
                repeat: -1,
              });
            }
            break;
          }
          case 12: {
            let ps = this.popSpikes.create(tx, ty, "pop_spike");
            ps.popTimer = Math.random() * 2;
            ps.popActive = false;
            ps.popCycle = 2 + Math.random() * 2;
            ps.body.setSize(24, 12);
            ps.body.setOffset(4, 20);
            ps.setAlpha(0.5);
            break;
          }
          case 13: {
            let tr = this.turrets.create(tx, ty, "turret");
            tr.body.setSize(22, 16);
            tr.body.setOffset(1, 6);
            tr.shotTimer = 0;
            tr.shotInterval = 1.2 + Math.random();
            tr.dir =
              map[r][c + 1] === 0 ? 1 : map[r][c - 1] === 0 ? -1 : 1;
            if (tr.dir < 0) tr.setFlipX(true);
            break;
          }
          case 14: {
            let el = this.electrics.create(tx, ty, "electric_floor");
            el.eTimer = Math.random() * 2;
            el.eActive = false;
            el.eCycle = 2 + Math.random() * 2;
            el.body.setSize(28, 8);
            el.body.setOffset(2, 24);
            el.setAlpha(0.5);
            break;
          }
          case 15: {
            let sf = this.spearFloors.create(tx, ty, "spear_floor");
            sf.spearDelay = -1;
            sf.spearCooldown = 0;
            let sp = this.spears.create(tx, ty - TH, "spear");
            sp.setAlpha(0);
            sp.spearActive = false;
            sp.body.setSize(16, 24);
            sp.body.setOffset(8, 4);
            sf.spearSprite = sp;
            break;
          }
          case 16: {
            let sl = this.fallingSlabs.create(tx, ty, "falling_slab");
            sl.body.setSize(28, 16);
            sl.body.setOffset(2, 8);
            sl.body.setAllowGravity(false);
            sl.body.setImmovable(true);
            sl.slabState = "idle";
            sl.slabTimer = 0;
            sl._originX = tx;
            // Ray-cast downward to find the first solid tile below this slab
            let floorR = r + 1;
            while (floorR < ROWS && !isSolid(map[floorR][c])) floorR++;
            sl._floorY = floorR * TH;
            break;
          }
          case 17: {
            let rk = this.fallingRocks.create(tx, ty, "rock");
            rk.body.setSize(24, 28);
            rk.body.setOffset(4, 2);
            rk.body.setAllowGravity(false);
            rk.body.setImmovable(true);
            rk.rockState = "idle";
            rk.rockTimer = 0;
            rk._originX = tx;
            let fR = r + 1;
            while (fR < ROWS && !isSolid(map[fR][c])) fR++;
            rk._floorY = fR * TH;
            break;
          }
          case 18: {
            let sb = this.sbStatic.create(tx, ty, "sb_static_up");
            sb.body.setSize(32, 32);
            sb.refreshBody();
            break;
          }
          case 19: {
            let sb = this.sbStatic.create(tx, ty, "sb_static_dn");
            sb.body.setSize(32, 32);
            sb.refreshBody();
            break;
          }
          case 20: {
            let spikesRight = c > 0 && map[r][c - 1] !== 0;
            let sb = this.sbStatic.create(tx, ty, "sb_static_rt");
            if (!spikesRight) sb.setFlipX(true);
            sb.body.setSize(32, 32);
            sb.refreshBody();
            break;
          }
          case 21: {
            let sb = this.sbTimerBase.create(tx, ty, "sb_base");
            sb.setTint(0x99aabb);
            sb.body.setSize(32, 32);
            sb.refreshBody();
            let sp21 = this.sbTimerSpikes.create(tx, ty - TH / 2 - 10, "sb_sp_up");
            sp21.setAlpha(0);
            sp21.spActive = false;
            sp21.body.setSize(30, 18);
            sp21.body.setOffset(1, 0);
            sp21.refreshBody();
            sb.spComp = sp21;
            sb.spTimer = Math.random() * 3;
            sb.spCycle = 2.5 + Math.random() * 1.5;
            break;
          }
          case 22: {
            let sb = this.sbTimerBase.create(tx, ty, "sb_base");
            sb.setTint(0x99aabb);
            sb.body.setSize(32, 32);
            sb.refreshBody();
            let sp22 = this.sbTimerSpikes.create(tx, ty + TH / 2 + 10, "sb_sp_dn");
            sp22.setAlpha(0);
            sp22.spActive = false;
            sp22.body.setSize(30, 18);
            sp22.body.setOffset(1, 2);
            sp22.refreshBody();
            sb.spComp = sp22;
            sb.spTimer = Math.random() * 3;
            sb.spCycle = 2.5 + Math.random() * 1.5;
            break;
          }
          case 23: {
            let sb = this.sbTrigBase.create(tx, ty, "sb_trig");
            sb.body.setSize(32, 32);
            sb.refreshBody();
            sb.spDelay = -1;
            sb.spCooldown = 0;
            let sp23 = this.sbTrigSpikes.create(tx, ty - TH / 2 - 10, "sb_sp_up");
            sp23.setAlpha(0);
            sp23.spActive = false;
            sp23.body.setSize(30, 18);
            sp23.body.setOffset(1, 0);
            sp23.refreshBody();
            sb.spComp = sp23;
            break;
          }
          case 24: {
            let pr = this.presses.create(tx, ty, "press_body");
            pr.body.setSize(28, 28);
            pr.body.setOffset(2, 2);
            pr.body.setAllowGravity(false);
            pr.body.setImmovable(true);
            pr.pressState = "idle_top";
            pr.pressMode = Math.random() < 0.5 ? "timer" : "trigger";
            pr.pressTimer = pr.pressMode === "timer" ? 2 + Math.random() * 3 : 0;
            pr._originX = tx;
            pr._originY = ty;
            let pfR = r + 1;
            while (pfR < ROWS && !isSolid(map[pfR][c])) pfR++;
            pr._floorY = pfR * TH;
            pr._holdY = Math.min(ty + TH * 4, pr._floorY - TH * 0.5);
            break;
          }
        }
      }

    this.platformRows = [];
    for (let r = 2; r < ROWS - 2; r++)
      for (let c = 1; c < COLS - 1; c++) {
        if (map[r][c] === 3 || map[r][c] === 7 || map[r][c] === 8) {
          this.platformRows.push(r);
          break;
        }
      }
    let stats = getStats();
    PD.maxHp = stats.maxHp;
    if (PD.hp > PD.maxHp) PD.hp = PD.maxHp;
    this.player = this.physics.add.sprite(
      v.playerC * TW + TW / 2,
      v.playerR * TH + TH / 2,
      "player",
    );
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(16, 24);
    this.player.body.setOffset(8, 8);
    this.player.setDepth(10);
    // Player drag for normal ground
    this.player.body.setDragX(600);

    this.exit = this.physics.add.sprite(
      v.exitC * TW + TW / 2,
      v.exitR * TH + TH / 2,
      "exit",
    );
    this.exit.body.setAllowGravity(false);
    this.exit.body.setImmovable(true);
    this.exit.setDepth(5);
    this.enemies = this.physics.add.group();
    if (this.isBossFloor) this.spawnBoss();
    else this.spawnEnemies();
    this.coins = this.physics.add.group();
    this.chests = this.physics.add.staticGroup();
    this.itemDrops = this.physics.add.group();
    this.projectiles = this.physics.add.group();
    this.spawnPickups();
    this.spawnGoldenChests();
    this.spawnKey();
    this.shieldSprite = null;
    if (PD.shieldHits > 0)
      this.shieldSprite = this.add
        .image(0, 0, "shield_fx")
        .setAlpha(0.4)
        .setDepth(11);

    // Collisions
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(
      this.player,
      this.icePlatforms,
      (player, ice) => {
        this.onIce = true;
      },
    );
    this.physics.add.collider(
      this.player,
      this.crumblePlatforms,
      (player, cp) => {
        if (cp.crumbleTimer < 0) {
          cp.crumbleTimer = 0.5;
          cp.setTint(0xff8888);
          this.tweens.add({
            targets: cp,
            alpha: 0.3,
            duration: 400,
            onComplete: () => {
              // spawn particles
              for (let i = 0; i < 4; i++) {
                let p = this.add
                  .circle(
                    cp.x + Phaser.Math.Between(-12, 12),
                    cp.y,
                    3,
                    0x887766,
                  )
                  .setDepth(5);
                this.tweens.add({
                  targets: p,
                  y: p.y + 40,
                  alpha: 0,
                  duration: 500,
                  onComplete: () => p.destroy(),
                });
              }
              cp.destroy();
            },
          });
        }
      },
    );
    this.physics.add.collider(this.player, this.breakables);
    this.physics.add.collider(
      this.player,
      this.movingPlatforms,
      (player, mp) => {
        this.playerOnPlatform = mp;
      },
    );

    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.enemies, this.icePlatforms);
    this.physics.add.collider(this.enemies, this.breakables);
    this.physics.add.collider(this.enemies, this.movingPlatforms);
    this.physics.add.collider(this.coins, this.platforms);
    this.physics.add.collider(this.coins, this.icePlatforms);
    this.physics.add.collider(this.itemDrops, this.platforms);

    // Player vs enemies should collide, not overlap
    this.physics.add.collider(
      this.player,
      this.enemies,
      this.hitEnemy,
      null,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.spikes,
      this.hitSpike,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.popSpikes,
      this.hitPopSpike,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.fireTraps,
      this.hitFireTrap,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.electrics,
      this.hitElectric,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.coins,
      this.collectCoin,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.chests,
      this.openChest,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.goldenChests,
      this.openGoldenChest,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.itemDrops,
      this.collectItem,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.exit,
      this.reachExit,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.projectiles,
      this.hitProjectile,
      null,
      this,
    );
    this.physics.add.collider(this.player, this.spearFloors, (player, sf) => {
      if (sf.spearDelay < 0 && sf.spearCooldown <= 0) {
        sf.spearDelay = 0.18;
        sf.setTint(0xff6622);
      }
    });
    this.physics.add.overlap(this.player, this.spears, this.hitSpear, null, this);
    this.physics.add.overlap(this.player, this.fallingSlabs, this.hitFallingSlab, null, this);
    this.physics.add.collider(this.fallingSlabs, this.platforms, (sl) => {
      if (sl.slabState === "falling") {
        sl.slabState = "landed";
        sl.body.setAllowGravity(false);
        sl.body.setVelocity(0, 0);
        sl.body.setImmovable(true);
        for (let i = 0; i < 5; i++) {
          let p = this.add
            .circle(sl.x + Phaser.Math.Between(-14, 14), sl.y + 10, 3, 0x888888)
            .setDepth(5);
          this.tweens.add({
            targets: p,
            y: p.y + 18,
            alpha: 0,
            duration: 380,
            onComplete: () => p.destroy(),
          });
        }
      }
    });
    this.physics.add.collider(this.enemies, this.spearFloors);
    // Static spike blocks — solid + damage on any contact
    this.physics.add.collider(this.player, this.sbStatic, this.hitSpikeBlock, null, this);
    this.physics.add.collider(this.enemies, this.sbStatic);
    // Timer base — solid platform, no direct damage
    this.physics.add.collider(this.player, this.sbTimerBase);
    this.physics.add.collider(this.enemies, this.sbTimerBase);
    // Timer spike companion — overlap damage when active
    this.physics.add.overlap(this.player, this.sbTimerSpikes, this.hitTimerSpike, null, this);
    // Triggered base — solid, triggers delay on contact
    this.physics.add.collider(this.player, this.sbTrigBase, (player, sb) => {
      if (sb.spDelay < 0 && sb.spCooldown <= 0) {
        sb.spDelay = 0.3;
        sb.setTint(0xff9955);
      }
    });
    this.physics.add.collider(this.enemies, this.sbTrigBase);
    // Triggered spike companion — overlap damage when active
    this.physics.add.overlap(this.player, this.sbTrigSpikes, this.hitTrigSpike, null, this);
    // Falling rocks — instant kill on overlap while falling; solid wall when landed
    this.physics.add.overlap(this.player, this.fallingRocks, this.hitFallingRock, null, this);
    this.physics.add.collider(this.player, this.fallingRocks, null, (p, rk) => rk.rockState === "landed", this);
    this.physics.add.collider(this.enemies, this.fallingRocks, null, (e, rk) => rk.rockState === "landed", this);
    // Press traps — damage while falling or held
    this.physics.add.overlap(this.player, this.presses, this.hitPress, null, this);

    this.physics.add.collider(this.projectiles, this.platforms, (proj) =>
      proj.destroy(),
    );
    this.physics.add.collider(
      this.projectiles,
      this.icePlatforms,
      (proj) => proj.destroy(),
    );
    this.physics.add.collider(
      this.projectiles,
      this.breakables,
      (proj, br) => proj.destroy(),
    );

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      w: "W",
      a: "A",
      s: "S",
      d: "D",
      z: "Z",
      j: "J",
      x: "X",
      k: "K",
      one: "ONE",
      two: "TWO",
      three: "THREE",
      four: "FOUR",
    });
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(60, 40);
    this.createHUD();
    let fn =
      biome.name +
      " - Floor " +
      PD.floor +
      (this.isBossFloor ? " [BOSS]" : "");
    let ft = this.add
      .text(400, 280, fn, {
        fontSize: "28px",
        fill: "#ffdd44",
        fontFamily: "monospace",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100);
    this.tweens.add({
      targets: ft,
      alpha: 0,
      y: 240,
      duration: 2500,
      onComplete: () => ft.destroy(),
    });
    this.cameras.main.fadeIn(400);
    saveGame();
    this.applyPlayerTint();
  }

  setMapCell(r, c, v) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    this.mapData[r][c] = v;
  }
  tileIsSolid(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
    return isSolid(this.mapData[r][c]);
  }
  worldToTile(x, y) {
    return {
      r: Math.floor(y / TH),
      c: Math.floor(x / TW),
    };
  }
  hasLineOfSight(x1, y1, x2, y2) {
    let t1 = this.worldToTile(x1, y1);
    let t2 = this.worldToTile(x2, y2);
    let x0 = t1.c,
      y0 = t1.r,
      x1t = t2.c,
      y1t = t2.r;
    let dx = Math.abs(x1t - x0),
      dy = Math.abs(y1t - y0);
    let sx = x0 < x1t ? 1 : -1;
    let sy = y0 < y1t ? 1 : -1;
    let err = dx - dy;
    let steps = 0;
    while (true) {
      if (steps > 0 && this.tileIsSolid(y0, x0)) return false;
      if (x0 === x1t && y0 === y1t) break;
      let e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
      steps++;
      if (steps > 200) break;
    }
    return true;
  }
  findSeekDir(e) {
    let maxScan = 6;
    let r = Math.floor(e.y / TH);
    for (let d = 1; d <= maxScan; d++) {
      let cR = Math.floor((e.x + d * TW) / TW);
      if (!this.tileIsSolid(r, cR)) {
        if (
          this.hasLineOfSight(
            e.x + d * TW,
            e.y,
            this.player.x,
            this.player.y,
          )
        )
          return 1;
      }
      let cL = Math.floor((e.x - d * TW) / TW);
      if (!this.tileIsSolid(r, cL)) {
        if (
          this.hasLineOfSight(
            e.x - d * TW,
            e.y,
            this.player.x,
            this.player.y,
          )
        )
          return -1;
      }
    }
    return 0;
  }
  spawnGoldenChests() {
    let spots = [...(this.validItemSpots || this.validEnemySpots)];
    Phaser.Utils.Array.Shuffle(spots);
    let count = PD.floor >= 10 ? 2 : 1;
    for (let i = 0; i < count && i < spots.length; i++) {
      let s = spots[i];
      let gc = this.goldenChests.create(s.c * TW + TW / 2, s.r * TH + TH / 2 - 4, "golden_chest");
      gc.opened = false;
      gc.setDepth(6);
    }
  }
  openGoldenChest(p, chest) {
    if (chest.opened) return;
    chest.opened = true;
    chest.setTint(0x666666);
    let golden = ITEMS.filter((it) => it.noShop && it.rarity === "mythic");
    if (!golden.length) return;
    let item = { ...golden[Math.floor(Math.random() * golden.length)] };
    PD.inventory.push(item);
    this.floatText(chest.x, chest.y - 22, item.name + "!", RARITIES[item.rarity] || "#ffdd00", "14px");
    this.cameras.main.flash(350, 0xff, 0xdd, 0x00, false);
    this.applyPlayerTint();
  }
  applyPlayerTint() {
    for (let sl of ["head", "body", "feet", "weapon"]) {
      let it = PD.equipment[sl];
      if (!it || !it.cosmetic) continue;
      if (it.cosmetic === "golden") { this.player.setTint(0xffdd44); return; }
      if (it.cosmetic === "shadow") { this.player.setTint(0xcc88ff); return; }
    }
    this.player.clearTint();
  }
  spawnKey() {
    if (this.isBossFloor) return;
    let spots = [...(this.validItemSpots || this.validEnemySpots)];
    Phaser.Utils.Array.Shuffle(spots);
    if (!spots.length) return;
    let s = spots.pop();
    this.keyItem = this.physics.add
      .sprite(s.c * TW + TW / 2, s.r * TH + TH / 2 - 10, "key")
      .setDepth(6);
    this.keyItem.body.setAllowGravity(false);
    this.physics.add.overlap(
      this.player,
      this.keyItem,
      () => {
        this.hasKey = true;
        this.floatText(
          this.player.x,
          this.player.y - 30,
          "Key acquired!",
          "#ffdd55",
        );
        this.keyItem.destroy();
      },
      null,
      this,
    );
  }
  destroyBreakable(br) {
    if (!br || !br.active) return;
    let r = br.tileR ?? Math.floor(br.y / TH);
    let c = br.tileC ?? Math.floor(br.x / TW);
    this.setMapCell(r, c, 0);
    this.scheduleBreakableRespawn(r, c);
    br.destroy();
  }
  scheduleBreakableRespawn(r, c) {
    let delay = 5000 + Math.random() * 5000;
    this.time.delayedCall(delay, () => {
      if (this.tileIsSolid(r, c)) return;
      let wx = c * TW + TW / 2,
        wy = r * TH + TH / 2;
      let rect = new Phaser.Geom.Rectangle(wx - 12, wy - 12, 24, 24);
      let overlapsPlayer =
        this.player &&
        Phaser.Geom.Intersects.RectangleToRectangle(
          rect,
          this.player.getBounds(),
        );
      if (overlapsPlayer) {
        this.scheduleBreakableRespawn(r, c);
        return;
      }
      this.setMapCell(r, c, 6);
      let br = this.breakables.create(wx, wy, "breakable");
      br.hp = 3;
      br.tileR = r;
      br.tileC = c;
    });
  }

  spawnEnemies() {
    let count = 4 + PD.floor * 2;
    let types = ["slime"];
    if (PD.floor >= 2) types.push("bat");
    if (PD.floor >= 4) types.push("skeleton");
    if (PD.floor >= 7) types.push("ghost");
    if (PD.floor >= 10) types.push("demon");
    if (PD.floor >= 14) types.push("golem");
    let spots = [...this.validEnemySpots];
    Phaser.Utils.Array.Shuffle(spots);
    for (let i = 0; i < count && spots.length > 0; i++) {
      let s = spots.pop();
      let t = types[Math.floor(Math.random() * types.length)];
      this.createEnemy(
        t,
        ENEMY_DEFS[t],
        s.c * TW + TW / 2,
        s.r * TH + TH / 2,
      );
    }
  }
  createEnemy(type, ed, px, py) {
    let scale = 1 + PD.floor * 0.06;
    let e = this.enemies.create(px, py, type);
    e.etype = type;
    e.ehp = Math.floor(ed.hp * scale);
    e.emaxhp = e.ehp;
    e.eattack = Math.floor(ed.attack * scale);
    e.edefense = Math.floor(ed.defense * scale);
    e.espeed = ed.speed;
    e.exp = ed.xp + PD.floor * 3;
    e.egold = ed.gold + PD.floor * 2;
    e.dir = Math.random() < 0.5 ? 1 : -1;
    e.moveTimer = 0;
    e.hitFlash = 0;
    e.attackCd = 0;
    e.isBoss = false;
    e.aggroed = false;
    e.aggroRange = ed.aggroRange || 180;
    e.lostSightTimer = 0;
    e._basespeed = ed.speed;
    e.mutated = false;
    e.mutateTimer = 0;
    e.mutateCheckTimer = 2 + Math.random() * 4;
    e.auraGraphics = null;
    e.body.setSize(ed.w - 4, ed.h - 4);
    if (type === "bat" || type === "ghost") {
      e.body.setAllowGravity(false);
      e.baseY = py;
      e.wavt = Math.random() * Math.PI * 2;
    }
    return e;
  }
  spawnBoss() {
    let bt = getBoss(PD.floor),
      bd = BOSS_DEFS[bt];
    let spots = [...this.validEnemySpots];
    Phaser.Utils.Array.Shuffle(spots);
    let bs =
      spots.length > 0
        ? spots.pop()
        : { r: ROWS - 3, c: Math.floor(COLS / 2) };
    let scale = 1 + Math.max(0, PD.floor - 5) * 0.08;
    let e = this.enemies.create(
      bs.c * TW + TW / 2,
      bs.r * TH + TH / 2,
      bt,
    );
    e.etype = bt;
    e.ehp = Math.floor(bd.hp * scale);
    e.emaxhp = e.ehp;
    e.eattack = Math.floor(bd.attack * scale);
    e.edefense = Math.floor(bd.defense * scale);
    e.espeed = bd.speed;
    e.exp = bd.xp;
    e.egold = bd.gold;
    e.dir = 1;
    e.moveTimer = 0;
    e.hitFlash = 0;
    e.attackCd = 0;
    e.isBoss = true;
    e.bossName = bd.name;
    e.aggroed = true;
    e.aggroRange = 400;
    e.body.setSize(bd.w - 4, bd.h - 4);
    let ac = 2 + Math.floor(PD.floor / 10);
    let types = Object.keys(ENEMY_DEFS);
    for (let i = 0; i < ac && spots.length > 0; i++) {
      let sp = spots.pop();
      let t = types[Math.floor(Math.random() * types.length)];
      this.createEnemy(
        t,
        ENEMY_DEFS[t],
        sp.c * TW + TW / 2,
        sp.r * TH + TH / 2,
      );
    }
  }
  spawnPickups() {
    let cs = [...(this.validCoinSpots || this.validEnemySpots)];
    Phaser.Utils.Array.Shuffle(cs);
    let cc = Math.min(10 + PD.floor * 2, cs.length);
    for (let i = 0; i < cc; i++) {
      let s = cs[i];
      let c = this.coins.create(
        s.c * TW + TW / 2,
        s.r * TH + TH / 2,
        "coin",
      );
      c.body.setSize(12, 12);
      c.setBounce(0.3);
      c.goldValue =
        1 + Math.floor(Math.random() * 3) + Math.floor(PD.floor / 2);
    }
    let chS = [...(this.validItemSpots || [])];
    Phaser.Utils.Array.Shuffle(chS);
    let chc = Math.min(1 + Math.floor(PD.floor / 3), chS.length);
    for (let i = 0; i < chc; i++) {
      let s = chS[i];
      let ch = this.chests.create(
        s.c * TW + TW / 2,
        s.r * TH + TH / 2 - 4,
        "chest",
      );
      ch.opened = false;
    }
  }
  createHUD() {
    this.add
      .rectangle(120, 20, 204, 18, 0x000000, 0.5)
      .setScrollFactor(0)
      .setOrigin(0.5)
      .setDepth(50);
    this.hpBarFill = this.add
      .rectangle(20, 12, 200, 14, 0xff3333)
      .setScrollFactor(0)
      .setOrigin(0, 0)
      .setDepth(50);
    this.hpText = this.add
      .text(120, 20, "", {
        fontSize: "11px",
        fill: "#fff",
        fontFamily: "monospace",
        stroke: "#000",
        strokeThickness: 2,
      })
      .setScrollFactor(0)
      .setOrigin(0.5)
      .setDepth(51);
    this.add
      .rectangle(120, 36, 204, 8, 0x000000, 0.5)
      .setScrollFactor(0)
      .setOrigin(0.5)
      .setDepth(50);
    this.xpBarFill = this.add
      .rectangle(20, 33, 200, 6, 0x4444ff)
      .setScrollFactor(0)
      .setOrigin(0, 0)
      .setDepth(50);
    this.infoText = this.add
      .text(10, 48, "", {
        fontSize: "11px",
        fill: "#ccc",
        fontFamily: "monospace",
        lineSpacing: 2,
        stroke: "#000",
        strokeThickness: 2,
      })
      .setScrollFactor(0)
      .setDepth(51);
    this.equipText = this.add
      .text(10, 572, "", {
        fontSize: "10px",
        fill: "#adf",
        fontFamily: "monospace",
        stroke: "#000",
        strokeThickness: 1,
      })
      .setScrollFactor(0)
      .setDepth(51);
    this.bonusText = this.add
      .text(520, 572, "", {
        fontSize: "10px",
        fill: "#fc4",
        fontFamily: "monospace",
        stroke: "#000",
        strokeThickness: 1,
      })
      .setScrollFactor(0)
      .setDepth(51);
    this.consumableText = this.add
      .text(10, 556, "", {
        fontSize: "10px",
        fill: "#8fa",
        fontFamily: "monospace",
        stroke: "#000",
        strokeThickness: 1,
      })
      .setScrollFactor(0)
      .setDepth(51);
  }
  floatText(x, y, text, color = "#fff", size = "14px") {
    let t = this.add
      .text(x, y, text, {
        fontSize: size,
        fill: color,
        fontFamily: "monospace",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(60);
    this.tweens.add({
      targets: t,
      y: y - 45,
      alpha: 0,
      duration: 1200,
      onComplete: () => t.destroy(),
    });
  }
  hitSpike(p) {
    if (this.invTimer > 0 || this.gameOver) return;
    this.takeDamage(10 + PD.floor * 2);
    p.setVelocityY(JUMP_VEL * 0.5);
  }
  hitPopSpike(p, trap) {
    if (this.invTimer > 0 || this.gameOver || !trap.popActive) return;
    this.takeDamage(8 + PD.floor * 2);
    p.setVelocityY(JUMP_VEL * 0.4);
  }
  hitElectric(p, trap) {
    if (this.invTimer > 0 || this.gameOver || !trap.eActive) return;
    this.takeDamage(6 + PD.floor * 2);
    p.setVelocityY(JUMP_VEL * 0.3);
  }
  hitFireTrap(p, trap) {
    if (this.invTimer > 0 || this.gameOver || !trap.fireActive) return;
    this.takeDamage(8 + PD.floor * 3);
    p.setVelocityY(JUMP_VEL * 0.4);
  }
  hitSpear(p, spear) {
    if (this.invTimer > 0 || this.gameOver || !spear.spearActive) return;
    this.takeDamage(9 + PD.floor * 2);
    p.setVelocityY(JUMP_VEL * 0.7);
  }
  hitFallingSlab(p, slab) {
    if (this.invTimer > 0 || this.gameOver || slab.slabState !== "falling") return;
    this.takeDamage(18 + PD.floor * 2);
    p.setVelocityX((p.x < slab.x ? -1 : 1) * 180);
    p.setVelocityY(-180);
  }
  hitSpikeBlock(p, block) {
    if (this.invTimer > 0 || this.gameOver) return;
    this.takeDamage(12 + PD.floor * 2);
    p.setVelocityX((p.x < block.x ? -1 : 1) * 150);
    p.setVelocityY(-160);
  }
  hitTimerSpike(p, spike) {
    if (this.invTimer > 0 || this.gameOver || !spike.spActive) return;
    this.takeDamage(12 + PD.floor * 2);
    p.setVelocityX((p.x < spike.x ? -1 : 1) * 150);
    p.setVelocityY(-160);
  }
  hitTrigSpike(p, spike) {
    if (this.invTimer > 0 || this.gameOver || !spike.spActive) return;
    this.takeDamage(12 + PD.floor * 2);
    p.setVelocityX((p.x < spike.x ? -1 : 1) * 150);
    p.setVelocityY(-160);
  }
  hitFallingRock(p, rock) {
    if (this.gameOver || rock.rockState !== "falling") return;
    this.takeDamage(PD.hp);
    p.setVelocityX((p.x < rock.x ? -1 : 1) * 200);
    p.setVelocityY(-150);
  }
  hitPress(p, press) {
    if (this.invTimer > 0 || this.gameOver) return;
    if (press.pressState !== "falling" && press.pressState !== "holding") return;
    this.takeDamage(22 + PD.floor * 3);
    p.setVelocityX((p.x < press.x ? -1 : 1) * 200);
    p.setVelocityY(-200);
  }
  hitProjectile(p, proj) {
    if (this.invTimer > 0 || this.gameOver) return;
    this.takeDamage(proj.damage || 5);
    proj.destroy();
  }
  hitEnemy(player, enemy) {
    if (this.invTimer > 0 || this.gameOver || !enemy.active) return;
    if (this.dashTimer > 0) {
      this.damageEnemy(enemy, Math.floor(getStats().attack * 0.5), false);
      return;
    }
    enemy.aggroed = true;
    let stats = getStats(),
      dmg = Math.max(1, enemy.eattack - stats.defense);
    if (stats.thorns > 0) this.damageEnemy(enemy, stats.thorns);
    if (PD.shieldHits > 0) {
      PD.shieldHits--;
      dmg = 0;
      this.floatText(player.x, player.y - 20, "BLOCKED!", "#44aaff");
      if (PD.shieldHits <= 0 && this.shieldSprite) {
        this.shieldSprite.destroy();
        this.shieldSprite = null;
      }
    }
    if (dmg > 0) this.takeDamage(dmg);
    let kb = player.x < enemy.x ? -250 : 250;
    player.setVelocityX(kb);
    player.setVelocityY(-200);
  }
  takeDamage(dmg) {
    PD.hp -= dmg;
    this.floatText(
      this.player.x,
      this.player.y - 20,
      "-" + dmg,
      "#ff4444",
    );
    this.invTimer = 1.2;
    this.player.setTint(0xff4444);
    this.cameras.main.shake(120, 0.015);
    if (PD.hp <= 0) {
      PD.hp = 0;
      let stats = getStats();
      if (stats.fireAura > 0 && !PD.phoenixUsed) {
        PD.phoenixUsed = true;
        PD.hp = Math.floor(stats.maxHp * 0.5);
        this.floatText(
          this.player.x,
          this.player.y - 40,
          "PHOENIX!",
          "#ff8800",
          "20px",
        );
        this.cameras.main.flash(500, 0xff, 0x88, 0);
        this.enemies.children.each((e) => {
          if (
            e.active &&
            Phaser.Math.Distance.Between(
              this.player.x,
              this.player.y,
              e.x,
              e.y,
            ) < 120
          )
            this.damageEnemy(e, 20);
        });
        return;
      }
      this.doGameOver();
    }
  }
  doGameOver() {
    this.gameOver = true;
    this.player.setTint(0xff0000);
    this.player.setVelocityY(-300);
    this.player.body.setAllowGravity(false);
    if (PD.floor > PD.bestFloor) PD.bestFloor = PD.floor;
    saveGame();
    this.time.delayedCall(800, () => {
      this.add
        .rectangle(400, 300, 800, 600, 0x000000, 0.75)
        .setScrollFactor(0)
        .setDepth(90);
      this.add
        .text(400, 180, "GAME OVER", {
          fontSize: "48px",
          fill: "#ff2222",
          fontFamily: "monospace",
          fontStyle: "bold",
          stroke: "#000",
          strokeThickness: 8,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(91);
      this.add
        .text(
          400,
          240,
          "Floor:" + PD.floor + " Lv:" + PD.level + " Kills:" + PD.kills,
          { fontSize: "16px", fill: "#ccc", fontFamily: "monospace" },
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(91);
      let retry = this.add
        .text(400, 310, "[ NEW RUN ]", {
          fontSize: "24px",
          fill: "#55ff55",
          fontFamily: "monospace",
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(91)
        .setInteractive({ useHandCursor: true });
      retry.on("pointerdown", () => {
        PD.reset();
        PD.totalRuns++;
        deleteSave();
        saveGame();
        this.scene.start("MenuScene");
      });
      let menu = this.add
        .text(400, 350, "[ MAIN MENU ]", {
          fontSize: "18px",
          fill: "#aaaaff",
          fontFamily: "monospace",
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(91)
        .setInteractive({ useHandCursor: true });
      menu.on("pointerdown", () => {
        deleteSave();
        this.scene.start("MenuScene");
      });
    });
  }
  collectCoin(p, coin) {
    let stats = getStats();
    let v =
      (coin.goldValue || 1) +
      Math.floor(((coin.goldValue || 1) * stats.goldBonus) / 100);
    PD.gold += v;
    PD.totalGold += v;
    this.floatText(coin.x, coin.y, "+" + v + "g", "#ffdd00", "12px");
    coin.destroy();
  }
  openChest(p, chest) {
    if (chest.opened) return;
    chest.opened = true;
    chest.setTint(0x666666);
    let stats = getStats();
    let g = 8 + PD.floor * 3 + Math.floor(Math.random() * 12);
    g += Math.floor((g * stats.goldBonus) / 100);
    PD.gold += g;
    PD.totalGold += g;
    this.floatText(
      chest.x,
      chest.y - 10,
      "+" + g + "g",
      "#ffdd00",
      "14px",
    );
    if (Math.random() < 0.45) this.dropItem(chest.x, chest.y - 20);
    if (Math.random() < 0.3) this.dropConsumable(chest.x, chest.y);
  }
  collectItem(p, item) {
    if (!item.itemData) return;
    PD.inventory.push(item.itemData);
    this.floatText(
      item.x,
      item.y - 10,
      item.itemData.name,
      RARITIES[item.itemData.rarity] || "#fff",
      "12px",
    );
    item.destroy();
  }
  dropItem(x, y) {
    let avail = ITEMS.filter((it) => it.minFloor <= PD.floor + 2 && !it.noShop);
    if (!avail.length) return;
    let w = avail.map((it) => (it.minFloor <= PD.floor ? 3 : 1)),
      total = w.reduce((a, b) => a + b, 0),
      r = Math.random() * total,
      cum = 0,
      chosen = avail[0];
    for (let i = 0; i < avail.length; i++) {
      cum += w[i];
      if (r <= cum) {
        chosen = avail[i];
        break;
      }
    }
    let drop = this.itemDrops.create(x, y, "itemdrop");
    drop.setTint(parseInt(RARITIES[chosen.rarity].replace("#", "0x")));
    drop.itemData = { ...chosen };
    drop.setBounce(0.3);
    drop.body.setSize(14, 14);
  }
  dropConsumable(x, y) {
    let avail = CONSUMABLES.filter(
      (c) => !c.minFloor || c.minFloor <= PD.floor,
    );
    if (!avail.length) return;
    let ch = avail[Math.floor(Math.random() * avail.length)];
    PD.consumables.push({ ...ch });
    if (PD.consumables.length > 8) PD.consumables.length = 8;
    this.floatText(x, y - 10, ch.name, "#88ffaa", "11px");
  }
  useConsumable(idx) {
    if (idx >= PD.consumables.length || this.gameOver) return;
    let con = PD.consumables[idx],
      stats = getStats();
    switch (con.effect) {
      case "heal":
        PD.hp = Math.min(stats.maxHp, PD.hp + con.value);
        this.floatText(
          this.player.x,
          this.player.y - 30,
          "+" + con.value + " HP",
          "#44ff44",
        );
        break;
      case "bomb":
        this.cameras.main.shake(200, 0.03);
        let ex = this.add
          .sprite(this.player.x, this.player.y, "explosion")
          .setDepth(20)
          .setScale(2);
        this.tweens.add({
          targets: ex,
          alpha: 0,
          scale: 3,
          duration: 400,
          onComplete: () => ex.destroy(),
        });
        this.enemies.children.each((e) => {
          if (
            e.active &&
            Phaser.Math.Distance.Between(
              this.player.x,
              this.player.y,
              e.x,
              e.y,
            ) < 120
          )
            this.damageEnemy(e, con.value);
        });
        this.breakables.children.each((b) => {
          if (
            b.active &&
            Phaser.Math.Distance.Between(
              this.player.x,
              this.player.y,
              b.x,
              b.y,
            ) < 100
          ) {
            this.spawnBreakableReward(b.x, b.y);
            this.destroyBreakable(b);
          }
        });
        break;
      case "shield":
        PD.shieldHits = con.value;
        if (this.shieldSprite) this.shieldSprite.destroy();
        this.shieldSprite = this.add
          .image(this.player.x, this.player.y, "shield_fx")
          .setAlpha(0.4)
          .setDepth(11);
        this.floatText(
          this.player.x,
          this.player.y - 30,
          "Shield x" + con.value,
          "#44aaff",
        );
        break;
      case "tempAtk":
        PD.tempBuffs.atk += con.value;
        this.floatText(
          this.player.x,
          this.player.y - 30,
          "+" + con.value + " ATK",
          "#ff8844",
        );
        break;
      case "tempSpd":
        PD.tempBuffs.spd += con.value;
        this.floatText(
          this.player.x,
          this.player.y - 30,
          "+" + con.value + " SPD",
          "#44ffaa",
        );
        break;
    }
    PD.consumables.splice(idx, 1);
  }
  spawnBreakableReward(x, y) {
    let g = 3 + Math.floor(Math.random() * 5) + PD.floor;
    PD.gold += g;
    PD.totalGold += g;
    this.floatText(x, y, "+" + g + "g", "#ffdd00", "12px");
    if (Math.random() < 0.2) this.dropConsumable(x, y);
  }
  reachExit() {
    if (this.gameOver) return;
    if (!this.isBossFloor && !this.hasKey) {
      if (this._exitMsgCd <= 0) {
        this.floatText(
          this.player.x,
          this.player.y - 30,
          "Need a Key!",
          "#ffdd55",
        );
        this._exitMsgCd = 2;
      }
      return;
    }
    if (this.isBossFloor) {
      let alive = false;
      this.enemies.children.each((e) => {
        if (e.active && e.isBoss) alive = true;
      });
      if (alive) {
        if (this._exitMsgCd <= 0) {
          this.floatText(
            this.player.x,
            this.player.y - 30,
            "Defeat the boss!",
            "#ff4444",
          );
          this._exitMsgCd = 2;
        }
        return;
      }
    }
    this.gameOver = true;
    if (PD.floor > PD.bestFloor) PD.bestFloor = PD.floor;
    saveGame();
    this.cameras.main.fade(500);
    this.time.delayedCall(500, () => this.scene.start("ShopScene"));
  }
  doAttack() {
    if (this.attackTimer > 0 || this.gameOver) return;
    let stats = getStats();
    let wp = getWeaponProps();
    this.attackTimer = wp.atkSpeed;
    let dir = this.facingRight ? 1 : -1;
    let slash = this.physics.add.sprite(
      this.player.x + dir * wp.range,
      this.player.y,
      "slash",
    );
    slash.body.setAllowGravity(false);
    slash.setFlipX(!this.facingRight);
    slash.setAlpha(0.8).setDepth(9);
    slash.body.setSize(wp.size.w, wp.size.h);
    slash.setDisplaySize(wp.size.w, wp.size.h);
    let hitSet = new Set();
    let oc = this.physics.add.overlap(slash, this.enemies, (s, enemy) => {
      if (!enemy.active || hitSet.has(enemy)) return;
      hitSet.add(enemy);
      enemy.aggroed = true;
      let dmg = Math.max(1, stats.attack - enemy.edefense);
      let crit = Math.random() * 100 < stats.crit;
      if (crit) dmg = Math.floor(dmg * 2.2);
      let kbDir = this.player.x < enemy.x ? 1 : -1;
      enemy.setVelocityX(kbDir * wp.knockback);
      enemy.setVelocityY(-80 - wp.knockback * 0.2);
      this.damageEnemy(enemy, dmg, crit);
      if (stats.lifesteal > 0 && enemy.active && enemy.ehp > 0) {
        let heal = Math.max(1, Math.floor((dmg * stats.lifesteal) / 100));
        PD.hp = Math.min(stats.maxHp, PD.hp + heal);
        this.floatText(
          this.player.x,
          this.player.y - 35,
          "+" + heal,
          "#44ff44",
          "10px",
        );
      }
    });
    let hitBr = new Set();
    let oc2 = this.physics.add.overlap(
      slash,
      this.breakables,
      (s, br) => {
        if (!br.active || hitBr.has(br)) return;
        hitBr.add(br);
        br.hp = (br.hp || 3) - 1;
        br.setAlpha(0.3 + 0.7 * (br.hp / 3));
        if (br.hp <= 0) {
          this.spawnBreakableReward(br.x, br.y);
          this.destroyBreakable(br);
        }
      },
    );
    this.tweens.add({
      targets: slash,
      alpha: 0,
      duration: Math.floor(wp.atkSpeed * 400),
      onComplete: () => {
        this.physics.world.removeCollider(oc);
        this.physics.world.removeCollider(oc2);
        if (slash && slash.active) slash.destroy();
      },
    });
  }
  doDash() {
    if (this.dashCooldown > 0 || this.dashTimer > 0 || this.gameOver)
      return;
    let stats = getStats();
    this.dashTimer = DASH_DUR;
    this.dashCooldown = DASH_CD - stats.dashCdReduce;
    let dir = this.facingRight ? 1 : -1;
    this.player.setVelocityX(dir * DASH_SPD);
    this.player.setVelocityY(0);
    this.player.body.setAllowGravity(false);
    this.invTimer = Math.max(this.invTimer, DASH_DUR + 0.05);
    this.player.setAlpha(0.5);
    for (let i = 0; i < 3; i++) {
      let gh = this.add
        .image(this.player.x - dir * i * 12, this.player.y, "player")
        .setAlpha(0.3)
        .setDepth(8)
        .setFlipX(!this.facingRight);
      this.tweens.add({
        targets: gh,
        alpha: 0,
        duration: 300,
        onComplete: () => gh.destroy(),
      });
    }
  }
  damageEnemy(enemy, dmg, crit = false) {
    if (enemy.mutated) {
      this.floatText(enemy.x, enemy.y - 15, "IMMUNE!", "#cc44ff");
      return;
    }
    enemy.ehp -= dmg;
    enemy.hitFlash = 0.15;
    enemy.setTint(0xffffff);
    this.floatText(
      enemy.x,
      enemy.y - 15,
      (crit ? "CRIT! " : "") + dmg,
      crit ? "#ffaa00" : "#fff",
    );
    if (enemy.ehp <= 0) this.killEnemy(enemy);
  }
  killEnemy(enemy) {
    let stats = getStats();
    let goldAmt =
      enemy.egold + Math.floor((enemy.egold * stats.goldBonus) / 100);
    this.floatText(
      enemy.x,
      enemy.y - 10,
      "+" + goldAmt + "g",
      "#ffdd00",
      "12px",
    );
    PD.gold += goldAmt;
    PD.totalGold += goldAmt;
    PD.kills++;
    let leveled = addXP(enemy.exp);
    this.floatText(
      enemy.x,
      enemy.y - 28,
      "+" + enemy.exp + "xp",
      "#44aaff",
      "11px",
    );
    if (leveled) {
      this.floatText(
        this.player.x,
        this.player.y - 45,
        "LEVEL UP!",
        "#ffff00",
        "20px",
      );
      this.cameras.main.flash(400, 0xff, 0xff, 0x44);
    }
    if (Math.random() < (enemy.isBoss ? 0.8 : 0.15))
      this.dropItem(enemy.x, enemy.y - 10);
    if (enemy.isBoss || Math.random() < 0.2)
      this.dropConsumable(enemy.x + 10, enemy.y - 10);
    for (let i = 0; i < 8; i++) {
      let angle = Math.random() * Math.PI * 2,
        dist = 5 + Math.random() * 15;
      let px = enemy.x + Math.cos(angle) * dist,
        py = enemy.y + Math.sin(angle) * dist;
      let color = ENEMY_DEFS[enemy.etype]
        ? ENEMY_DEFS[enemy.etype].color
        : BOSS_DEFS[enemy.etype]
          ? BOSS_DEFS[enemy.etype].color
          : 0xffffff;
      let p = this.add
        .circle(px, py, 2 + Math.random() * 3, color)
        .setDepth(15);
      this.tweens.add({
        targets: p,
        alpha: 0,
        x: px + Math.cos(angle) * 25,
        y: py - 15,
        duration: 400,
        onComplete: () => p.destroy(),
      });
    }
    if (enemy.hpBarBg) {
      enemy.hpBarBg.destroy();
      enemy.hpBarBg = null;
    }
    if (enemy.hpBarFill) {
      enemy.hpBarFill.destroy();
      enemy.hpBarFill = null;
    }
    if (enemy.nameTag) {
      enemy.nameTag.destroy();
      enemy.nameTag = null;
    }
    if (enemy.auraGraphics) {
      enemy.auraGraphics.destroy();
      enemy.auraGraphics = null;
    }
    this.enemies.children.each((e) => {
      if (
        e.active &&
        Phaser.Math.Distance.Between(enemy.x, enemy.y, e.x, e.y) < 200
      )
        e.aggroed = true;
    });
    enemy.destroy();
  }

  updateEnemyAI(e, dt) {
    if (!e.active) return;
    if (e.hitFlash > 0) {
      e.hitFlash -= dt;
      if (e.hitFlash <= 0) e.clearTint();
    }
    if (e.attackCd > 0) e.attackCd -= dt;

    // --- Mutation system ---
    if (!e.isBoss) {
      if (e.mutated) {
        e.mutateTimer -= dt;
        if (e.mutateTimer <= 0) {
          e.mutated = false;
          e.espeed = e._basespeed;
          if (e.auraGraphics) { e.auraGraphics.destroy(); e.auraGraphics = null; }
        } else {
          if (!e.auraGraphics) e.auraGraphics = this.add.graphics().setDepth(12);
          let ag = e.auraGraphics;
          ag.clear();
          let pulse = 0.55 + Math.sin(this.time.now * 0.006) * 0.45;
          let aw = e.displayWidth + 10, ah = e.displayHeight + 10;
          ag.lineStyle(3, 0xcc44ff, pulse);
          ag.strokeRect(e.x - aw / 2, e.y - ah / 2, aw, ah);
          ag.lineStyle(1, 0xffffff, pulse * 0.7);
          ag.strokeRect(e.x - aw / 2 + 4, e.y - ah / 2 + 4, aw - 8, ah - 8);
          let sc = 3, sa = pulse > 0.6 ? pulse : 0;
          ag.fillStyle(0xee99ff, sa);
          ag.fillRect(e.x - aw / 2 - 1, e.y - ah / 2 - 1, sc, sc);
          ag.fillRect(e.x + aw / 2 - sc + 1, e.y - ah / 2 - 1, sc, sc);
          ag.fillRect(e.x - aw / 2 - 1, e.y + ah / 2 - sc + 1, sc, sc);
          ag.fillRect(e.x + aw / 2 - sc + 1, e.y + ah / 2 - sc + 1, sc, sc);
        }
      } else {
        e.mutateCheckTimer -= dt;
        if (e.mutateCheckTimer <= 0) {
          e.mutateCheckTimer = 3 + Math.random() * 3;
          let chance = Math.min(0.35, 0.07 + PD.floor * 0.005);
          if (Math.random() < chance) {
            e.mutated = true;
            e.mutateTimer = 5 + Math.random() * 3;
            e.espeed = e._basespeed * 1.5;
            e.aggroed = true;
            this.floatText(e.x, e.y - 22, "MUTATED!", "#cc44ff", "13px");
          }
        }
      }
    }

    let dx = this.player.x - e.x,
      dy = this.player.y - e.y,
      dist = Math.sqrt(dx * dx + dy * dy);
    let type = e.etype;

    let hasLOS = this.hasLineOfSight(
      e.x,
      e.y,
      this.player.x,
      this.player.y,
    );

    if (!e.aggroed && dist < e.aggroRange && hasLOS) {
      e.aggroed = true;
      this.enemies.children.each((o) => {
        if (
          o.active &&
          o !== e &&
          Phaser.Math.Distance.Between(e.x, e.y, o.x, o.y) < 150
        )
          o.aggroed = true;
      });
    }

    if (e.aggroed && !hasLOS) {
      e.lostSightTimer += dt;
      let seekDir = this.findSeekDir(e);
      if (seekDir !== 0) {
        e.setVelocityX(seekDir * e.espeed * 0.8);
        e.lostSightTimer = 0;
      } else if (e.lostSightTimer > 1.2) {
        e.aggroed = false;
        e.lostSightTimer = 0;
      }
    } else if (e.aggroed) {
      e.lostSightTimer = 0;
    }

    if (type === "bat" || type === "ghost") {
      e.wavt = (e.wavt || 0) + dt * 3;
      if (e.aggroed && hasLOS) {
        e.setVelocityX(Math.sign(dx) * e.espeed * 1.3);
        e.setVelocityY((this.player.y - e.y) * 2);
      } else {
        let tY = (e.baseY || e.y) + Math.sin(e.wavt) * 35;
        e.dir = e.dir || 1;
        e.moveTimer += dt;
        if (e.moveTimer > 2) {
          e.moveTimer = 0;
          e.dir *= -1;
        }
        e.setVelocityX(e.dir * e.espeed * 0.3);
        e.setVelocityY((tY - e.y) * 2);
      }
      if (type === "ghost") e.setAlpha(0.5 + Math.sin(e.wavt) * 0.3);
    } else if (e.aggroed) {
      let cs = e.espeed * (type === "golem" ? 0.8 : 1.2);
      if (dist < 300 && hasLOS) {
        e.setVelocityX(Math.sign(dx) * cs);
        if (dy < -40 && e.body.blocked.down && Math.abs(dx) < 150)
          e.setVelocityY(-300);
      } else if (hasLOS) e.setVelocityX(Math.sign(dx) * e.espeed * 0.5);

      if (BOSS_DEFS[type] && e.attackCd <= 0 && dist < 300 && hasLOS) {
        e.attackCd = 1.5;
        let proj = this.projectiles.create(e.x, e.y - 5, "coin");
        proj.setTint(0xff2222);
        proj.body.setAllowGravity(false);
        proj.damage = Math.floor(e.eattack * 0.6);
        let angle = Math.atan2(dy, dx);
        proj.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
        this.time.delayedCall(3000, () => {
          if (proj && proj.active) proj.destroy();
        });
      }
      if (type === "golem" && e.attackCd <= 0 && dist < 60) {
        e.attackCd = 2;
        this.cameras.main.shake(100, 0.01);
        if (
          Math.abs(dx) < 80 &&
          Math.abs(dy) < 60 &&
          this.invTimer <= 0 &&
          !this.gameOver
        )
          this.takeDamage(Math.max(1, e.eattack - getStats().defense));
      }
    } else {
      e.moveTimer += dt;
      if (e.moveTimer > 2) {
        e.moveTimer = 0;
        e.dir = (e.dir || 1) * -1;
      }
      e.setVelocityX(e.dir * e.espeed * 0.3);
      if (e.body.blocked.left) e.dir = 1;
      if (e.body.blocked.right) e.dir = -1;
    }

    // Keep mobs from staying inside player
    if (dist < this.enemyMinDist) {
      let pushDir = e.x < this.player.x ? -1 : 1;
      e.setVelocityX(pushDir * e.espeed);
    }

    e.setFlipX(e.body.velocity.x < 0);
    if (!e.hpBarBg) {
      let bw = e.isBoss ? 60 : 26;
      e.hpBarBg = this.add
        .rectangle(e.x, e.y - 20, bw, e.isBoss ? 5 : 3, 0x000000, 0.6)
        .setDepth(15);
      e.hpBarFill = this.add
        .rectangle(e.x, e.y - 20, bw - 2, e.isBoss ? 4 : 2, 0xff3333)
        .setDepth(16)
        .setOrigin(0, 0.5);
      if (e.isBoss)
        e.nameTag = this.add
          .text(e.x, e.y - 30, e.bossName, {
            fontSize: "10px",
            fill: "#ff6644",
            fontFamily: "monospace",
            stroke: "#000",
            strokeThickness: 2,
          })
          .setOrigin(0.5)
          .setDepth(17);
    }
    let bw = e.isBoss ? 58 : 24,
      bo = e.isBoss ? 28 : 18;
    e.hpBarBg.setPosition(e.x, e.y - bo);
    let ratio = Math.max(0, e.ehp / e.emaxhp);
    e.hpBarFill.setPosition(e.x - bw / 2, e.y - bo);
    e.hpBarFill.width = bw * ratio;
    e.hpBarFill.fillColor =
      ratio > 0.5 ? 0x44cc44 : ratio > 0.25 ? 0xcccc44 : 0xcc4444;
    if (e.nameTag) e.nameTag.setPosition(e.x, e.y - bo - 12);
  }

  performJump() {
    let stats = getStats();
    this.player.setVelocityY(JUMP_VEL);
    this.coyoteTimer = COYOTE_TIME + 1; // consume coyote
    this.jumpBufferTimer = JUMP_BUFFER + 1; // consume buffer
    // Squash & stretch feedback
    this.tweens.add({
      targets: this.player,
      scaleX: 0.85,
      scaleY: 1.15,
      duration: 80,
      yoyo: true,
    });
  }

  update(time, delta) {
    if (this.gameOver) return;
    let dt = delta / 1000,
      stats = getStats();
    if (this._exitMsgCd > 0) this._exitMsgCd -= dt;
    if (this.attackTimer > 0) this.attackTimer -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.player.body.setAllowGravity(true);
        this.player.setAlpha(1);
      }
    }
    if (this.invTimer > 0) {
      this.invTimer -= dt;
      if (this.dashTimer <= 0)
        this.player.setAlpha(Math.sin(time * 0.02) > 0 ? 1 : 0.3);
      if (this.invTimer <= 0) {
        this.player.setAlpha(1);
        this.applyPlayerTint();
      }
    }
    this.regenTimer += dt;
    if (this.regenTimer >= 1 && stats.regen > 0) {
      this.regenTimer = 0;
      PD.hp = Math.min(stats.maxHp, PD.hp + stats.regen);
    }
    if (stats.fireAura > 0) {
      this.auraTimer += dt;
      if (this.auraTimer >= 1.5) {
        this.auraTimer = 0;
        this.enemies.children.each((e) => {
          if (
            e.active &&
            Phaser.Math.Distance.Between(
              this.player.x,
              this.player.y,
              e.x,
              e.y,
            ) < 90
          ) {
            this.damageEnemy(e, stats.fireAura);
            let fx = this.add
              .circle(e.x, e.y, 8, 0xff4400, 0.5)
              .setDepth(12);
            this.tweens.add({
              targets: fx,
              alpha: 0,
              scale: 2,
              duration: 300,
              onComplete: () => fx.destroy(),
            });
          }
        });
      }
    }

    // Update fire traps
    this.fireTraps.children.each((ft) => {
      if (!ft.active) return;
      ft.fireTimer += dt;
      let phase = ft.fireTimer % ft.fireCycle;
      ft.fireActive = phase < 0.8;
      ft.setAlpha(ft.fireActive ? 1 : 0.4);
    });

    // Update pop spikes
    this.popSpikes.children.each((ps) => {
      if (!ps.active) return;
      ps.popTimer += dt;
      let phase = ps.popTimer % ps.popCycle;
      ps.popActive = phase < 0.6;
      ps.setAlpha(ps.popActive ? 1 : 0.35);
    });

    // Update electric floors
    this.electrics.children.each((el) => {
      if (!el.active) return;
      el.eTimer += dt;
      let phase = el.eTimer % el.eCycle;
      el.eActive = phase < 0.9;
      el.setAlpha(el.eActive ? 1 : 0.35);
    });

    // Update turrets
    this.turrets.children.each((tr) => {
      if (!tr.active) return;
      tr.shotTimer += dt;
      if (tr.shotTimer >= tr.shotInterval) {
        tr.shotTimer = 0;
        let dist = Phaser.Math.Distance.Between(
          tr.x,
          tr.y,
          this.player.x,
          this.player.y,
        );
        if (
          dist < 320 &&
          this.hasLineOfSight(tr.x, tr.y, this.player.x, this.player.y)
        ) {
          let proj = this.projectiles.create(tr.x, tr.y, "coin");
          proj.setTint(0xff6666);
          proj.body.setAllowGravity(false);
          proj.damage = 6 + Math.floor(PD.floor * 0.5);
          proj.setVelocity(tr.dir * 240, 0);
          this.time.delayedCall(2500, () => {
            if (proj && proj.active) proj.destroy();
          });
        }
      }
    });

    // Update spear floors
    this.spearFloors.children.each((sf) => {
      if (!sf.active || !sf.spearSprite) return;
      if (sf.spearCooldown > 0) sf.spearCooldown -= dt;
      if (sf.spearDelay >= 0) {
        sf.spearDelay -= dt;
        if (sf.spearDelay <= 0) {
          sf.spearDelay = -1;
          sf.spearSprite.spearActive = true;
          this.tweens.add({
            targets: sf.spearSprite,
            alpha: 1,
            duration: 70,
            onComplete: () => {
              this.time.delayedCall(350, () => {
                if (!sf.active || !sf.spearSprite) return;
                this.tweens.add({
                  targets: sf.spearSprite,
                  alpha: 0,
                  duration: 180,
                  onComplete: () => {
                    if (sf.spearSprite) sf.spearSprite.spearActive = false;
                    sf.clearTint();
                    sf.spearCooldown = 3;
                  },
                });
              });
            },
          });
        }
      }
    });

    // Update falling slabs
    this.fallingSlabs.children.each((sl) => {
      if (!sl.active || sl.slabState === "landed") return;
      if (sl.slabState === "idle") {
        let dx = Math.abs(this.player.x - sl.x);
        if (dx < TW * 0.6 && this.player.y > sl.y && this.player.y < sl._floorY) {
          sl.slabState = "warning";
          sl.slabTimer = 0.35;
          sl.setTint(0xff8844);
          for (let i = 0; i < 4; i++) {
            let p = this.add
              .circle(sl.x + Phaser.Math.Between(-12, 12), sl.y - 6, 2, 0xaaaaaa)
              .setDepth(5);
            this.tweens.add({
              targets: p,
              y: p.y - 12,
              alpha: 0,
              duration: 500,
              onComplete: () => p.destroy(),
            });
          }
        }
      } else if (sl.slabState === "warning") {
        sl.slabTimer -= dt;
        sl.x = sl._originX + Math.sin(this.time.now * 0.025) * 2;
        sl.body.reset(sl.x, sl.y);
        if (sl.slabTimer <= 0) {
          sl.slabState = "falling";
          sl.x = sl._originX;
          sl.body.reset(sl.x, sl.y);
          sl.body.setAllowGravity(true);
          sl.body.setImmovable(false);
          sl.body.setVelocityY(600);
          sl.clearTint();
        }
      }
    });

    // Update timer spike blocks
    this.sbTimerBase.children.each((sb) => {
      if (!sb.active || !sb.spComp) return;
      sb.spTimer += dt;
      let active = (sb.spTimer % sb.spCycle) < sb.spCycle * 0.45;
      sb.spComp.spActive = active;
      sb.spComp.setAlpha(active ? 1 : 0);
    });

    // Update triggered spike blocks
    this.sbTrigBase.children.each((sb) => {
      if (!sb.active || !sb.spComp) return;
      if (sb.spCooldown > 0) sb.spCooldown -= dt;
      if (sb.spDelay >= 0) {
        sb.spDelay -= dt;
        if (sb.spDelay <= 0) {
          sb.spDelay = -1;
          sb.spComp.spActive = true;
          this.tweens.add({
            targets: sb.spComp,
            alpha: 1,
            duration: 60,
            onComplete: () => {
              this.time.delayedCall(550, () => {
                if (!sb.active || !sb.spComp) return;
                this.tweens.add({
                  targets: sb.spComp,
                  alpha: 0,
                  duration: 150,
                  onComplete: () => {
                    if (sb.spComp) sb.spComp.spActive = false;
                    sb.clearTint();
                    sb.spCooldown = 2.5;
                  },
                });
              });
            },
          });
        }
      }
    });

    // Update falling rocks (instant-kill, minimal warning)
    this.fallingRocks.children.each((rk) => {
      if (!rk.active || rk.rockState === "landed") return;
      if (rk.rockState === "idle") {
        let dx = Math.abs(this.player.x - rk.x);
        if (dx < TW * 0.9 && this.player.y > rk.y && this.player.y < rk._floorY) {
          rk.rockState = "warning";
          rk.rockTimer = 0.1;
          rk.setTint(0xff6633);
        }
      } else if (rk.rockState === "warning") {
        rk.rockTimer -= dt;
        rk.x = rk._originX + Math.sin(this.time.now * 0.04) * 1.5;
        rk.body.reset(rk.x, rk.y);
        if (rk.rockTimer <= 0) {
          rk.rockState = "falling";
          rk.x = rk._originX;
          rk.body.reset(rk.x, rk.y);
          rk.body.setAllowGravity(true);
          rk.body.setImmovable(false);
          rk.body.setVelocityY(820);
          rk.clearTint();
        }
      } else if (rk.rockState === "falling") {
        if (rk.y >= rk._floorY - TH / 2) {
          rk.rockState = "landed";
          rk.body.setVelocity(0, 0);
          rk.body.setAllowGravity(false);
          rk.body.setImmovable(true);
          rk.body.reset(rk._originX, rk._floorY - TH / 2);
          this.cameras.main.shake(130, 0.018);
          for (let i = 0; i < 6; i++) {
            let p = this.add
              .circle(rk.x + Phaser.Math.Between(-14, 14), rk.y + 12, 3, 0x6a5a4a)
              .setDepth(5);
            this.tweens.add({
              targets: p,
              y: p.y + 20,
              alpha: 0,
              duration: 400,
              onComplete: () => p.destroy(),
            });
          }
        }
      }
    });

    // Update press traps
    this.presses.children.each((pr) => {
      if (!pr.active) return;
      if (pr.pressState === "idle_top") {
        if (pr.pressMode === "timer") {
          pr.pressTimer -= dt;
          if (pr.pressTimer <= 0) {
            pr.pressState = "warning";
            pr.pressTimer = 0.15;
            pr.setTint(0xff9933);
          }
        } else {
          let dx = Math.abs(this.player.x - pr.x);
          if (dx < TW && this.player.y > pr.y && this.player.y < pr._floorY) {
            pr.pressState = "warning";
            pr.pressTimer = 0.2;
            pr.setTint(0xff9933);
          }
        }
      } else if (pr.pressState === "warning") {
        pr.pressTimer -= dt;
        pr.x = pr._originX + Math.sin(this.time.now * 0.035) * 2;
        pr.body.reset(pr.x, pr.y);
        if (pr.pressTimer <= 0) {
          pr.pressState = "falling";
          pr.x = pr._originX;
          pr.body.reset(pr.x, pr.y);
          pr.body.setImmovable(false);
          pr.clearTint();
        }
      } else if (pr.pressState === "falling") {
        pr.body.setVelocityY(700);
        if (pr.y >= pr._holdY) {
          pr.body.reset(pr.x, pr._holdY);
          pr.body.setVelocity(0, 0);
          pr.pressState = "holding_bottom";
          pr.pressTimer = 0.4;
          this.cameras.main.shake(100, 0.012);
        }
      } else if (pr.pressState === "holding_bottom") {
        pr.pressTimer -= dt;
        if (pr.pressTimer <= 0) pr.pressState = "rising";
      } else if (pr.pressState === "rising") {
        pr.body.setVelocityY(-200);
        if (pr.y <= pr._originY) {
          pr.body.reset(pr.x, pr._originY);
          pr.body.setVelocity(0, 0);
          pr.body.setImmovable(true);
          pr.pressState = "idle_top";
          pr.pressTimer = pr.pressMode === "timer" ? 2 + Math.random() * 3 : 0;
        }
      }
    });

    // Update moving platforms
    this.movingPlatforms.children.each((mp) => {
      if (!mp.active) return;
      mp.movePhase += dt * mp.moveSpeed * 0.03;
      let newX = mp.startX + Math.sin(mp.movePhase) * mp.moveRange;
      mp.body.velocity.x = ((newX - mp.x) / dt) * 0.5;
      if (mp.x < TW * 2 || mp.x > WORLD_W - TW * 2)
        mp.body.velocity.x *= -1;
    });

    // Carry player with moving platform
    if (this.playerOnPlatform && this.player.body.blocked.down) {
      this.player.x += this.playerOnPlatform.body.velocity.x * dt;
    } else if (!this.player.body.blocked.down) {
      this.playerOnPlatform = null;
    }

    let onFloor = this.player.body.blocked.down;
    // Reset ice flag each frame, set by collision callback
    let wasIce = this.onIce;
    this.onIce = false;
    // Check ladder overlap
    let onLadder = false;
    this.ladders.children.each((l) => {
      if (
        l.active &&
        Phaser.Geom.Intersects.RectangleToRectangle(
          this.player.getBounds(),
          l.getBounds(),
        )
      )
        onLadder = true;
    });

    // === COYOTE TIME ===
    if (onFloor || onLadder) {
      this.coyoteTimer = 0;
      this.wasOnFloor = true;
    } else {
      this.coyoteTimer += dt;
    }
    let canCoyoteJump = this.coyoteTimer < COYOTE_TIME;

    // === JUMP BUFFER ===
    let jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.w);
    if (jumpPressed) this.jumpBufferTimer = 0;
    else this.jumpBufferTimer += dt;
    let hasBufferedJump = this.jumpBufferTimer < JUMP_BUFFER;

    // === EXTRA JUMPS ===
    if (onFloor) this.extraJumps = stats.doubleJump ? 1 : 0;

    if (this.dashTimer <= 0) {
      // Horizontal input
      let inputX = 0;
      if (this.cursors.left.isDown || this.keys.a.isDown) {
        inputX = -1;
        this.facingRight = false;
        this.player.setFlipX(true);
      } else if (this.cursors.right.isDown || this.keys.d.isDown) {
        inputX = 1;
        this.facingRight = true;
        this.player.setFlipX(false);
      }

      let targetVx = inputX * stats.speed;

      // === ICE FRICTION: lerp velocity instead of snapping ===
      if (wasIce && onFloor) {
        // Low friction: slow acceleration/deceleration
        let lerpSpeed = inputX === 0 ? 0.02 : 0.04; // very slippery
        this.playerVx = Phaser.Math.Linear(
          this.playerVx,
          targetVx,
          lerpSpeed,
        );
        this.player.setVelocityX(this.playerVx);
        this.player.body.setDragX(0);
      } else {
        // Detect if pressing directly into a wall while airborne (wall slide)
        let onWallL = this.player.body.blocked.left;
        let onWallR = this.player.body.blocked.right;
        let slidingWall = !onFloor && ((inputX < 0 && onWallL) || (inputX > 0 && onWallR));
        if (slidingWall) {
          // Just maintain gentle wall contact — gravity does the sliding
          this.player.setVelocityX(inputX * 8);
          this.player.body.setDragX(0);
        } else {
          // Normal ground: responsive control
          this.player.body.setDragX(inputX === 0 ? 1200 : 0);
          if (inputX !== 0) this.player.setVelocityX(targetVx);
        }
        this.playerVx = this.player.body.velocity.x;
      }

      // === LADDER MOVEMENT ===
      if (onLadder) {
        let climbUp = this.cursors.up.isDown || this.keys.w.isDown;
        let climbDown = this.cursors.down.isDown || this.keys.s.isDown;
        if (climbUp || climbDown) {
          this.player.body.setAllowGravity(false);
          this.player.setVelocityY(climbUp ? -130 : 130);
        } else if (!onFloor) {
          this.player.body.setAllowGravity(false);
          this.player.setVelocityY(0);
        } else {
          this.player.body.setAllowGravity(true);
        }
        // === JUMP FROM LADDER ===
        if (jumpPressed) {
          this.player.body.setAllowGravity(true);
          this.performJump();
        }
      } else {
        this.player.body.setAllowGravity(true);
        // === JUMPING with coyote time + jump buffer ===
        if (hasBufferedJump && !onLadder) {
          if (onFloor || canCoyoteJump) {
            this.performJump();
          } else if (this.extraJumps > 0) {
            this.player.setVelocityY(JUMP_VEL * 0.85);
            this.extraJumps--;
            this.jumpBufferTimer = JUMP_BUFFER + 1;
            for (let i = 0; i < 4; i++) {
              let p = this.add
                .circle(
                  this.player.x + Phaser.Math.Between(-8, 8),
                  this.player.y + 14,
                  2,
                  0xaaaaff,
                  0.6,
                )
                .setDepth(8);
              this.tweens.add({
                targets: p,
                alpha: 0,
                y: p.y + 15,
                duration: 300,
                onComplete: () => p.destroy(),
              });
            }
          }
        }
        // === VARIABLE JUMP HEIGHT: cut jump short if button released ===
        if (!onFloor && this.player.body.velocity.y < -100) {
          if (!(this.cursors.up.isDown || this.keys.w.isDown)) {
            this.player.setVelocityY(this.player.body.velocity.y * 0.85);
          }
        }
      }

      // === ANIMATION ===
      if (inputX !== 0 && onFloor) {
        this.walkTimer += dt;
        if (this.walkTimer > 0.12) {
          this.walkTimer = 0;
          this.walkFrame = 1 - this.walkFrame;
        }
        this.player.setTexture(
          this.walkFrame ? "player_walk1" : "player",
        );
      } else if (!onFloor) this.player.setTexture("player_jump");
      else {
        this.player.setTexture("player");
        this.walkTimer = 0;
        this.walkFrame = 0;
      }

      // === LANDING SQUASH ===
      if (
        onFloor &&
        !this.wasOnFloor &&
        this.player.body.velocity.y >= 0
      ) {
        this.tweens.add({
          targets: this.player,
          scaleX: 1.2,
          scaleY: 0.85,
          duration: 60,
          yoyo: true,
        });
      }
      this.wasOnFloor = onFloor;
    }

    if (
      Phaser.Input.Keyboard.JustDown(this.keys.z) ||
      Phaser.Input.Keyboard.JustDown(this.keys.j)
    )
      this.doAttack();
    if (
      Phaser.Input.Keyboard.JustDown(this.keys.x) ||
      Phaser.Input.Keyboard.JustDown(this.keys.k)
    )
      this.doDash();
    if (Phaser.Input.Keyboard.JustDown(this.keys.one))
      this.useConsumable(0);
    if (Phaser.Input.Keyboard.JustDown(this.keys.two))
      this.useConsumable(1);
    if (Phaser.Input.Keyboard.JustDown(this.keys.three))
      this.useConsumable(2);
    if (Phaser.Input.Keyboard.JustDown(this.keys.four))
      this.useConsumable(3);

    if (this.shieldSprite && PD.shieldHits > 0)
      this.shieldSprite.setPosition(this.player.x, this.player.y);
    this.enemies.children.each((e) => this.updateEnemyAI(e, dt));

    let hpRatio = Math.max(0, PD.hp / stats.maxHp);
    this.hpBarFill.width = 200 * hpRatio;
    this.hpBarFill.fillColor =
      hpRatio > 0.5 ? 0x44cc44 : hpRatio > 0.25 ? 0xcccc44 : 0xcc4444;
    this.hpText.setText(PD.hp + "/" + stats.maxHp);
    this.xpBarFill.width =
      200 * (PD.xpToNext > 0 ? PD.xp / PD.xpToNext : 0);
    this.infoText.setText(
      "Lv." +
        PD.level +
        " Gold:" +
        PD.gold +
        " Floor:" +
        PD.floor +
        (this.isBossFloor
          ? " [BOSS]"
          : " Key:" + (this.hasKey ? "Yes" : "No")) +
        "\nATK:" +
        stats.attack +
        " DEF:" +
        stats.defense +
        " SPD:" +
        Math.floor(stats.speed) +
        " CRIT:" +
        stats.crit +
        "%" +
        (stats.lifesteal > 0 ? " LS:" + stats.lifesteal + "%" : "") +
        (PD.shieldHits > 0 ? " Sh:" + PD.shieldHits : ""),
    );
    let eqL = [];
    let si = {
      head: "\u{1FA96}",
      body: "\u{1F6E1}",
      feet: "\u{1F462}",
      weapon: "\u2694",
    };
    for (let sl in PD.equipment) {
      let it = PD.equipment[sl];
      eqL.push((si[sl] || sl) + ":" + (it ? it.name : "--"));
    }
    this.equipText.setText(eqL.join(" | "));
    this.bonusText.setText(getSetBonusLabels().join(" | "));
    let conL = [];
    for (let i = 0; i < Math.min(4, PD.consumables.length); i++)
      conL.push("[" + (i + 1) + "]" + PD.consumables[i].name);
    this.consumableText.setText(conL.join(" "));
  }
}
