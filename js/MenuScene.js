class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }
  create() {
    this.cameras.main.setBackgroundColor("#0a0a1a");
    this.add.image(400, 300, "parallax_stars").setAlpha(0.5);
    this.add
      .text(400, 80, "DUNGEON DELVER", {
        fontSize: "48px",
        fill: "#ffdd44",
        fontFamily: "monospace",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.add
      .text(400, 135, "Roguelike Platformer", {
        fontSize: "16px",
        fill: "#aaaacc",
        fontFamily: "monospace",
      })
      .setOrigin(0.5);
    let btnY = 220;
    let ng = this.add
      .text(400, btnY, "[ NEW GAME ]", {
        fontSize: "24px",
        fill: "#55ff55",
        fontFamily: "monospace",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    ng.on("pointerover", () => ng.setFill("#88ff88"));
    ng.on("pointerout", () => ng.setFill("#55ff55"));
    ng.on("pointerdown", () => {
      PD.reset();
      PD.totalRuns++;
      saveGame();
      this.scene.start("GameScene");
    });
    if (hasSave()) {
      let info = getSaveInfo();
      let cb = this.add
        .text(400, btnY + 45, "[ CONTINUE ]", {
          fontSize: "24px",
          fill: "#44aaff",
          fontFamily: "monospace",
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      cb.on("pointerover", () => cb.setFill("#88ccff"));
      cb.on("pointerout", () => cb.setFill("#44aaff"));
      cb.on("pointerdown", () => {
        loadGame();
        this.scene.start("GameScene");
      });
      if (info)
        this.add
          .text(
            400,
            btnY + 75,
            "Floor " +
              info.floor +
              " | Lv." +
              info.level +
              " | " +
              info.gold +
              "g | " +
              info.time,
            {
              fontSize: "11px",
              fill: "#7799bb",
              fontFamily: "monospace",
            },
          )
          .setOrigin(0.5);
      let db = this.add
        .text(400, btnY + 100, "[ DELETE SAVE ]", {
          fontSize: "14px",
          fill: "#ff6666",
          fontFamily: "monospace",
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      db.on("pointerdown", () => {
        deleteSave();
        this.scene.restart();
      });
      btnY += 120;
    } else btnY += 50;
    if (PD.bestFloor > 0)
      this.add
        .text(
          400,
          btnY + 10,
          "Best: Floor " + PD.bestFloor + " | Runs: " + PD.totalRuns,
          { fontSize: "12px", fill: "#888", fontFamily: "monospace" },
        )
        .setOrigin(0.5);
    [
      "Arrows/WASD: Move & Jump",
      "Z/J: Attack   X/K: Dash",
      "1-4: Consumables",
      "Jump from ladders! Coyote jump!",
    ].forEach((t, i) =>
      this.add
        .text(400, btnY + 40 + i * 20, t, {
          fontSize: "12px",
          fill: "#6666aa",
          fontFamily: "monospace",
        })
        .setOrigin(0.5),
    );
  }
}
