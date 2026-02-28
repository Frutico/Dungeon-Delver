try {
  let r = localStorage.getItem(SAVE_KEY);
  if (r) {
    let d = JSON.parse(r);
    if (d) {
      PD.bestFloor = d.bestFloor || 0;
      PD.totalRuns = d.totalRuns || 0;
    }
  }
} catch (e) {}

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#1a1a2e",
  physics: {
    default: "arcade",
    arcade: { gravity: { y: GRAVITY }, debug: false, tileBias: 32 },
  },
  scene: [BootScene, MenuScene, GameScene, ShopScene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  pixelArt: true,
  roundPixels: true,
});
