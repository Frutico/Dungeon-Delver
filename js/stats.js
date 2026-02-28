function getTalentRank(id) {
  return PD.talents[id] || 0;
}
function getStats() {
  let s = {
    maxHp: PD.maxHp,
    attack: PD.baseAttack,
    defense: PD.baseDefense,
    speed: PD.baseSpeed,
    crit: PD.baseCrit,
    regen: 0,
    thorns: 0,
    doubleJump: false,
    fireAura: 0,
    lifesteal: 0,
    dashCdReduce: 0,
    goldBonus: 0,
  };
  s.maxHp += (PD.level - 1) * 10;
  s.attack += PD.level - 1;
  s.defense += Math.floor((PD.level - 1) * 0.5);
  let sc = {};
  for (let sl in PD.equipment) {
    let it = PD.equipment[sl];
    if (!it) continue;
    for (let k in it.stats) if (s[k] !== undefined) s[k] += it.stats[k];
    sc[it.set] = (sc[it.set] || 0) + 1;
  }
  for (let sn in sc) {
    let c = sc[sn],
      b = SET_BONUSES[sn];
    if (!b) continue;
    for (let t in b)
      if (c >= parseInt(t)) {
        let bo = b[t];
        for (let k in bo)
          if (k !== "label" && s[k] !== undefined) {
            if (typeof s[k] === "boolean") s[k] = bo[k];
            else s[k] += bo[k];
          }
      }
  }
  for (let tal of TALENTS) {
    let r = getTalentRank(tal.id);
    if (r > 0)
      for (let k in tal.effect)
        if (s[k] !== undefined) s[k] += tal.effect[k] * r;
  }
  s.attack += PD.tempBuffs.atk;
  s.speed += PD.tempBuffs.spd;
  return s;
}
function addXP(a) {
  PD.xp += a;
  let l = false;
  while (PD.xp >= PD.xpToNext) {
    PD.xp -= PD.xpToNext;
    PD.level++;
    PD.xpToNext = PD.level * 100;
    PD.talentPoints++;
    l = true;
  }
  if (l) {
    let st = getStats();
    PD.maxHp = st.maxHp;
    PD.hp = PD.maxHp;
  }
  return l;
}
function getSetBonusLabels() {
  let labels = [],
    sc = {};
  for (let sl in PD.equipment) {
    let it = PD.equipment[sl];
    if (it) sc[it.set] = (sc[it.set] || 0) + 1;
  }
  for (let sn in sc) {
    let c = sc[sn],
      b = SET_BONUSES[sn];
    if (!b) continue;
    for (let t in b) if (c >= parseInt(t)) labels.push(b[t].label);
  }
  return labels;
}
