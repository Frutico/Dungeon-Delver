function saveGame() {
  try {
    let d = {
      level: PD.level,
      xp: PD.xp,
      xpToNext: PD.xpToNext,
      floor: PD.floor,
      gold: PD.gold,
      hp: PD.hp,
      maxHp: PD.maxHp,
      baseAttack: PD.baseAttack,
      baseDefense: PD.baseDefense,
      baseSpeed: PD.baseSpeed,
      baseCrit: PD.baseCrit,
      equipment: {},
      inventory: [],
      consumables: [],
      talents: { ...PD.talents },
      talentPoints: PD.talentPoints,
      shieldHits: PD.shieldHits,
      kills: PD.kills,
      totalGold: PD.totalGold,
      bestFloor: PD.bestFloor,
      totalRuns: PD.totalRuns,
      timestamp: Date.now(),
    };
    for (let s in PD.equipment)
      d.equipment[s] = PD.equipment[s] ? { ...PD.equipment[s] } : null;
    d.inventory = PD.inventory.map((i) => ({ ...i }));
    d.consumables = PD.consumables.map((c) => ({ ...c }));
    localStorage.setItem(SAVE_KEY, JSON.stringify(d));
    return true;
  } catch (e) {
    return false;
  }
}
function loadGame() {
  try {
    let r = localStorage.getItem(SAVE_KEY);
    if (!r) return false;
    let d = JSON.parse(r);
    if (!d || !d.timestamp) return false;
    PD.level = d.level || 1;
    PD.xp = d.xp || 0;
    PD.xpToNext = d.xpToNext || 100;
    PD.floor = d.floor || 1;
    PD.gold = d.gold || 0;
    PD.hp = d.hp || 100;
    PD.maxHp = d.maxHp || 100;
    PD.baseAttack = d.baseAttack || 5;
    PD.baseDefense = d.baseDefense || 2;
    PD.baseSpeed = d.baseSpeed || MOVE_SPD;
    PD.baseCrit = d.baseCrit || 5;
    PD.talentPoints = d.talentPoints || 0;
    PD.talents = d.talents || {};
    PD.shieldHits = d.shieldHits || 0;
    PD.kills = d.kills || 0;
    PD.totalGold = d.totalGold || 0;
    PD.bestFloor = d.bestFloor || 0;
    PD.totalRuns = d.totalRuns || 0;
    PD.tempBuffs = { atk: 0, spd: 0 };
    PD.phoenixUsed = false;
    for (let s in d.equipment) PD.equipment[s] = d.equipment[s] || null;
    PD.inventory = (d.inventory || []).map((i) => ({ ...i }));
    PD.consumables = (d.consumables || []).map((c) => ({ ...c }));
    return true;
  } catch (e) {
    return false;
  }
}
function hasSave() {
  try {
    let r = localStorage.getItem(SAVE_KEY);
    if (!r) return false;
    let d = JSON.parse(r);
    return d && d.timestamp && d.floor > 0;
  } catch (e) {
    return false;
  }
}
function deleteSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {}
}
function getSaveInfo() {
  try {
    let r = localStorage.getItem(SAVE_KEY);
    if (!r) return null;
    let d = JSON.parse(r);
    if (!d) return null;
    let m = Math.floor((Date.now() - d.timestamp) / 60000);
    return {
      floor: d.floor,
      level: d.level,
      gold: d.gold,
      time: m < 60 ? m + "m ago" : Math.floor(m / 60) + "h ago",
    };
  } catch (e) {
    return null;
  }
}
