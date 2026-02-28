const PD = {
  level: 1,
  xp: 0,
  xpToNext: 100,
  floor: 1,
  gold: 0,
  hp: 100,
  maxHp: 100,
  baseAttack: 5,
  baseDefense: 2,
  baseSpeed: MOVE_SPD,
  baseCrit: 5,
  equipment: { head: null, body: null, feet: null, weapon: null },
  inventory: [],
  consumables: [],
  talents: {},
  talentPoints: 0,
  tempBuffs: { atk: 0, spd: 0 },
  shieldHits: 0,
  phoenixUsed: false,
  kills: 0,
  totalGold: 0,
  bestFloor: 0,
  totalRuns: 0,
  reset() {
    this.level = 1;
    this.xp = 0;
    this.xpToNext = 100;
    this.floor = 1;
    this.gold = 0;
    this.hp = 100;
    this.maxHp = 100;
    this.baseAttack = 5;
    this.baseDefense = 2;
    this.baseSpeed = MOVE_SPD;
    this.baseCrit = 5;
    this.equipment = { head: null, body: null, feet: null, weapon: null };
    this.inventory = [];
    this.consumables = [];
    this.talents = {};
    this.talentPoints = 0;
    this.tempBuffs = { atk: 0, spd: 0 };
    this.shieldHits = 0;
    this.phoenixUsed = false;
    this.kills = 0;
    this.totalGold = 0;
    this.totalRuns++;
  },
};
