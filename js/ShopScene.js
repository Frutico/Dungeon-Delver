class ShopScene extends Phaser.Scene {
  constructor() {
    super("ShopScene");
  }
  create() {
    PD.floor++;
    PD.phoenixUsed = false;
    PD.tempBuffs = { atk: 0, spd: 0 };
    let stats = getStats();
    PD.hp = Math.min(stats.maxHp, PD.hp + Math.floor(stats.maxHp * 0.3));
    if (PD.floor > PD.bestFloor) PD.bestFloor = PD.floor;
    this.cameras.main.setBackgroundColor("#0a0a15");
    this.add.image(400, 300, "parallax_stars").setAlpha(0.3);
    let biome = getBiome(PD.floor);
    this.add
      .text(400, 22, biome.name + " - Floor " + PD.floor, {
        fontSize: "24px",
        fill: "#ffdd44",
        fontFamily: "monospace",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    for (let i = PD.inventory.length - 1; i >= 0; i--) {
      let it = PD.inventory[i];
      if (!PD.equipment[it.slot]) {
        PD.equipment[it.slot] = it;
        PD.inventory.splice(i, 1);
      }
    }
    saveGame();
    this.refreshUI();
  }
  refreshUI() {
    if (this.uiC) this.uiC.destroy();
    this.uiC = this.add.container(0, 0);
    let stats = getStats();
    this.uiC.add(
      this.add.text(
        20,
        48,
        "HP:" +
          PD.hp +
          "/" +
          stats.maxHp +
          " ATK:" +
          stats.attack +
          " DEF:" +
          stats.defense +
          " SPD:" +
          Math.floor(stats.speed) +
          " CRIT:" +
          stats.crit +
          "%",
        { fontSize: "11px", fill: "#aaccff", fontFamily: "monospace" },
      ),
    );
    this.uiC.add(
      this.add.text(
        20,
        62,
        "Gold:" +
          PD.gold +
          " Lv:" +
          PD.level +
          " XP:" +
          PD.xp +
          "/" +
          PD.xpToNext +
          " TP:" +
          PD.talentPoints,
        { fontSize: "11px", fill: "#ffdd44", fontFamily: "monospace" },
      ),
    );
    let ey = 82;
    this.uiC.add(
      this.add.text(20, ey, "EQUIPPED", {
        fontSize: "12px",
        fill: "#88aaff",
        fontFamily: "monospace",
        fontStyle: "bold",
      }),
    );
    ey += 14;
    for (let sl of ["head", "body", "feet", "weapon"]) {
      let it = PD.equipment[sl];
      let color = it ? RARITIES[it.rarity] || "#aaa" : "#555";
      this.uiC.add(
        this.add.text(28, ey, sl + ": " + (it ? it.name : "(empty)"), {
          fontSize: "10px",
          fill: color,
          fontFamily: "monospace",
        }),
      );
      if (it) {
        let ss = Object.entries(it.stats)
          .map(([k, v]) => k + "+" + v)
          .join(" ");
        this.uiC.add(
          this.add.text(210, ey, ss, {
            fontSize: "9px",
            fill: "#777",
            fontFamily: "monospace",
          }),
        );
        let ub = this.add
          .text(370, ey, "[off]", {
            fontSize: "10px",
            fill: "#f88",
            fontFamily: "monospace",
          })
          .setInteractive({ useHandCursor: true });
        ub.on("pointerdown", () => {
          PD.inventory.push(PD.equipment[sl]);
          PD.equipment[sl] = null;
          this.refreshUI();
        });
        this.uiC.add(ub);
      }
      ey += 13;
    }
    let bonuses = getSetBonusLabels();
    if (bonuses.length > 0) {
      ey += 2;
      bonuses.forEach((b) => {
        this.uiC.add(
          this.add.text(28, ey, "* " + b, {
            fontSize: "9px",
            fill: "#da3",
            fontFamily: "monospace",
          }),
        );
        ey += 11;
      });
    }
    let iy = 82;
    this.uiC.add(
      this.add.text(440, iy, "INVENTORY", {
        fontSize: "12px",
        fill: "#8fa",
        fontFamily: "monospace",
        fontStyle: "bold",
      }),
    );
    iy += 14;
    if (!PD.inventory.length)
      this.uiC.add(
        this.add.text(450, iy, "(empty)", {
          fontSize: "10px",
          fill: "#555",
          fontFamily: "monospace",
        }),
      );
    else
      PD.inventory.forEach((it, idx) => {
        if (iy > 220) return;
        let color = RARITIES[it.rarity] || "#aaa";
        this.uiC.add(
          this.add.text(450, iy, it.name, {
            fontSize: "10px",
            fill: color,
            fontFamily: "monospace",
          }),
        );
        let eq = this.add
          .text(590, iy, "[eq]", {
            fontSize: "10px",
            fill: "#5f5",
            fontFamily: "monospace",
          })
          .setInteractive({ useHandCursor: true });
        eq.on("pointerdown", () => {
          let old = PD.equipment[it.slot];
          PD.equipment[it.slot] = it;
          PD.inventory.splice(idx, 1);
          if (old) PD.inventory.push(old);
          this.refreshUI();
        });
        this.uiC.add(eq);
        let sell = this.add
          .text(630, iy, "[sell:" + Math.floor(it.cost * 0.4) + "g]", {
            fontSize: "9px",
            fill: "#fa4",
            fontFamily: "monospace",
          })
          .setInteractive({ useHandCursor: true });
        sell.on("pointerdown", () => {
          PD.gold += Math.floor(it.cost * 0.4);
          PD.inventory.splice(idx, 1);
          this.refreshUI();
        });
        this.uiC.add(sell);
        iy += 13;
      });
    let sy = 240;
    this.uiC.add(
      this.add.rectangle(400, sy - 3, 760, 1, 0x334455).setOrigin(0.5),
    );
    this.uiC.add(
      this.add.text(20, sy, "SHOP", {
        fontSize: "13px",
        fill: "#fa4",
        fontFamily: "monospace",
        fontStyle: "bold",
      }),
    );
    sy += 16;
    Phaser.Utils.Array.Shuffle([
      ...ITEMS.filter((it) => it.minFloor <= PD.floor + 3),
    ])
      .slice(0, 5)
      .forEach((it) => {
        let color = RARITIES[it.rarity] || "#aaa";
        let ss = Object.entries(it.stats)
          .map(([k, v]) => k + "+" + v)
          .join(" ");
        this.uiC.add(
          this.add.text(28, sy, it.name, {
            fontSize: "10px",
            fill: color,
            fontFamily: "monospace",
          }),
        );
        this.uiC.add(
          this.add.text(185, sy, ss, {
            fontSize: "9px",
            fill: "#777",
            fontFamily: "monospace",
          }),
        );
        this.uiC.add(
          this.add.text(360, sy, "[" + it.set + "]", {
            fontSize: "9px",
            fill: "#556",
            fontFamily: "monospace",
          }),
        );
        let cc = PD.gold >= it.cost ? "#5f5" : "#f55";
        let bb = this.add
          .text(430, sy, "Buy:" + it.cost + "g", {
            fontSize: "10px",
            fill: cc,
            fontFamily: "monospace",
          })
          .setInteractive({ useHandCursor: true });
        bb.on("pointerdown", () => {
          if (PD.gold >= it.cost) {
            PD.gold -= it.cost;
            PD.inventory.push({ ...it });
            saveGame();
            this.refreshUI();
          }
        });
        this.uiC.add(bb);
        sy += 14;
      });
    sy += 4;
    this.uiC.add(
      this.add.text(20, sy, "CONSUMABLES", {
        fontSize: "12px",
        fill: "#8fa",
        fontFamily: "monospace",
        fontStyle: "bold",
      }),
    );
    sy += 14;
    Phaser.Utils.Array.Shuffle([
      ...CONSUMABLES.filter((c) => !c.minFloor || c.minFloor <= PD.floor),
    ])
      .slice(0, 4)
      .forEach((con) => {
        this.uiC.add(
          this.add.text(28, sy, con.name + " - " + con.desc, {
            fontSize: "9px",
            fill: "#ada",
            fontFamily: "monospace",
          }),
        );
        let cc = PD.gold >= con.cost ? "#5f5" : "#f55";
        let bb = this.add
          .text(430, sy, "Buy:" + con.cost + "g", {
            fontSize: "10px",
            fill: cc,
            fontFamily: "monospace",
          })
          .setInteractive({ useHandCursor: true });
        bb.on("pointerdown", () => {
          if (PD.gold >= con.cost && PD.consumables.length < 8) {
            PD.gold -= con.cost;
            PD.consumables.push({ ...con });
            saveGame();
            this.refreshUI();
          }
        });
        this.uiC.add(bb);
        sy += 13;
      });
    let healCost = 15 + PD.floor * 5;
    if (PD.hp < stats.maxHp) {
      sy += 3;
      let hc = PD.gold >= healCost ? "#5f5" : "#f55";
      let hb = this.add
        .text(28, sy, "Full Heal: " + healCost + "g", {
          fontSize: "11px",
          fill: hc,
          fontFamily: "monospace",
        })
        .setInteractive({ useHandCursor: true });
      hb.on("pointerdown", () => {
        if (PD.gold >= healCost) {
          PD.gold -= healCost;
          PD.hp = stats.maxHp;
          saveGame();
          this.refreshUI();
        }
      });
      this.uiC.add(hb);
      sy += 15;
    }
    sy += 4;
    this.uiC.add(
      this.add.rectangle(400, sy, 760, 1, 0x334455).setOrigin(0.5),
    );
    sy += 6;
    this.uiC.add(
      this.add.text(20, sy, "TALENTS (" + PD.talentPoints + ")", {
        fontSize: "12px",
        fill: "#db4",
        fontFamily: "monospace",
        fontStyle: "bold",
      }),
    );
    sy += 14;
    TALENTS.forEach((tal) => {
      let rank = getTalentRank(tal.id);
      let color =
        rank >= tal.maxRank
          ? "#888"
          : PD.talentPoints > 0
            ? "#fd4"
            : "#666";
      this.uiC.add(
        this.add.text(
          28,
          sy,
          tal.name + " [" + rank + "/" + tal.maxRank + "] " + tal.desc,
          { fontSize: "9px", fill: color, fontFamily: "monospace" },
        ),
      );
      if (rank < tal.maxRank && PD.talentPoints > 0) {
        let ub = this.add
          .text(430, sy, "[+]", {
            fontSize: "10px",
            fill: "#5f5",
            fontFamily: "monospace",
          })
          .setInteractive({ useHandCursor: true });
        ub.on("pointerdown", () => {
          PD.talents[tal.id] = (PD.talents[tal.id] || 0) + 1;
          PD.talentPoints--;
          PD.maxHp = getStats().maxHp;
          saveGame();
          this.refreshUI();
        });
        this.uiC.add(ub);
      }
      sy += 12;
    });
    let cont = this.add
      .text(400, 568, "[ CONTINUE TO FLOOR " + PD.floor + " ]", {
        fontSize: "20px",
        fill: "#4f4",
        fontFamily: "monospace",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    cont.on("pointerover", () => cont.setFill("#8f8"));
    cont.on("pointerout", () => cont.setFill("#4f4"));
    cont.on("pointerdown", () => {
      saveGame();
      this.scene.start("GameScene");
    });
    this.uiC.add(cont);
  }
}
