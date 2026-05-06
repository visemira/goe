// ===============================
// GoE DATA (cumulative from level 0 → N)
// ===============================
const GOE = [
  { level: 0, gold: 0, sparks: 0, power: 0 },
  { level: 1, gold: 7000, sparks: 250, power: 22 },
  { level: 2, gold: 14500, sparks: 510, power: 44 },
  { level: 3, gold: 22500, sparks: 780, power: 66 },
  { level: 4, gold: 30500, sparks: 1060, power: 88 },
  { level: 5, gold: 39000, sparks: 1350, power: 110 },
  { level: 10, gold: 296000, sparks: 5750, power: 440 },
  { level: 20, gold: 2312000, sparks: 26150, power: 1760 },
  { level: 30, gold: 7926500, sparks: 65150, power: 3960 }
];

// fill missing levels quickly (simple linear interpolation fallback)
for (let i = 1; i <= 30; i++) {
  if (!GOE.find(x => x.level === i)) {
    GOE.push({
      level: i,
      gold: i * 250000,
      sparks: i * 5000,
      power: i * 130
    });
  }
}
GOE.sort((a,b)=>a.level-b.level);

// ===============================
// CONFIG
// ===============================
const HEROES = 67;
const currentLevel = new Array(HEROES).fill(0); // assume all start 0

// ===============================
// CORE HELPERS
// ===============================
function delta(a, b) {
  return {
    gold: b.gold - a.gold,
    sparks: b.sparks - a.sparks,
    power: b.power - a.power
  };
}

// get option per hero
function getOptions(current) {
  const base = GOE[current];
  let options = [];

  for (let i = current; i <= 30; i++) {
    const d = delta(base, GOE[i]);
    options.push({
      level: i,
      gold: d.gold,
      sparks: d.sparks,
      power: d.power
    });
  }

  return options;
}

// ===============================
// MAX MODE
// ===============================
function maxMode() {
  let gold = 0, spark = 0, power = 0;
  let plan = [];

  for (let i = 0; i < HEROES; i++) {
    const opt = delta(GOE[0], GOE[30]);
    gold += opt.gold;
    spark += opt.sparks;
    power += opt.power;
    plan.push(30);
  }

  return { mode: "MAX", gold, spark, power, plan };
}

// ===============================
// OPTIMAL MODE (simplified greedy DP)
// ===============================
function optimalMode(maxGold, maxSpark) {
  let plan = [];
  let goldUsed = 0;
  let sparkUsed = 0;
  let power = 0;

  for (let i = 0; i < HEROES; i++) {
    let best = { level: 0, ratio: 0, g: 0, s: 0, p: 0 };

    for (let l = 1; l <= 30; l++) {
      const d = delta(GOE[0], GOE[l]);
      const cost = d.gold + d.sparks * 100;
      const ratio = d.power / cost;

      if (ratio > best.ratio) {
        best = { level: l, ratio, g: d.gold, s: d.sparks, p: d.power };
      }
    }

    if (goldUsed + best.g <= maxGold && sparkUsed + best.s <= maxSpark) {
      goldUsed += best.g;
      sparkUsed += best.s;
      power += best.p;
      plan.push(best.level);
    } else {
      plan.push(0);
    }
  }

  return {
    mode: "OPTIMAL",
    goldUsed,
    sparkUsed,
    power,
    plan
  };
}

// ===============================
// SPARK FIXED MODE
// ===============================
function sparkMode(maxSpark) {
  let sparkUsed = 0;
  let goldUsed = 0;
  let power = 0;
  let plan = [];

  for (let i = 0; i < HEROES; i++) {
    let best = 0;

    for (let l = 1; l <= 30; l++) {
      const d = delta(GOE[0], GOE[l]);
      if (sparkUsed + d.sparks <= maxSpark) {
        best = l;
      }
    }

    const d = delta(GOE[0], GOE[best]);
    sparkUsed += d.sparks;
    goldUsed += d.gold;
    power += d.power;
    plan.push(best);
  }

  return {
    mode: "SPARK FIXED",
    sparkUsed,
    goldUsed,
    extraGoldNeeded: 0,
    power,
    plan
  };
} 

// ===============================
// RUN
// ===============================
function run() {
  const gold = parseInt(document.getElementById("gold").value);
  const spark = parseInt(document.getElementById("spark").value);
  const mode = document.getElementById("mode").value;

  let result;

  if (mode === "max") result = maxMode();
  if (mode === "opt") result = optimalMode(gold, spark);
  if (mode === "spark") result = sparkMode(spark);

  document.getElementById("output").innerText =
    JSON.stringify(result, null, 2);
}
