self.onmessage = function(e) {

  let {G, S, H} = e.data;

  const gStep = 10000;
  const sStep = 100;

  const WG = Math.floor(G / gStep);
  const WS = Math.floor(S / sStep);

  // Sample data (replace with full game dataset)
  const levels = [
    {gold:7000,sparks:250,power:22},
    {gold:7500,sparks:260,power:22},
    {gold:8000,sparks:270,power:22},
    {gold:8000,sparks:280,power:22},
    {gold:8500,sparks:290,power:22},
    {gold:44000,sparks:800,power:66},
    {gold:47500,sparks:840,power:66},
    {gold:51500,sparks:880,power:66},
    {gold:55000,sparks:920,power:66},
    {gold:59000,sparks:960,power:66},
    {gold:120500,sparks:1500,power:110},
    {gold:128500,sparks:1560,power:110},
    {gold:136500,sparks:1620,power:110},
    {gold:144500,sparks:1680,power:110},
    {gold:153000,sparks:1740,power:110},
    {gold:239000,sparks:2300,power:154},
    {gold:252500,sparks:2380,power:154},
    {gold:266500,sparks:2460,power:154},
    {gold:280500,sparks:2540,power:154},
    {gold:294500,sparks:2620,power:154},
    {gold:405500,sparks:3200,power:198},
    {gold:426000,sparks:3300,power:198},
    {gold:447000,sparks:3400,power:198},
    {gold:468500,sparks:3500,power:198},
    {gold:490000,sparks:3600,power:198},
    {gold:627000,sparks:4200,power:242},
    {gold:650000,sparks:4300,power:242},
    {gold:675500,sparks:4400,power:242},
    {gold:700000,sparks:4500,power:242},
    {gold:725000,sparks:4600,power:242}
  ];

  // ------------------------
  // Step 1: Build cumulative items (sequential upgrades)
  // ------------------------
  let items = [];
  for (let h = 0; h < H; h++) {
    let cumG = 0, cumS = 0, cumP = 0;
    for (let i = 0; i < levels.length; i++) {
      cumG += Math.floor(levels[i].gold / gStep);
      cumS += Math.floor(levels[i].sparks / sStep);
      cumP += levels[i].power;
      items.push({
        hero: h,
        lvl: i + 1,
        g: cumG,
        s: cumS,
        p: cumP
      });
    }
  }

  // ------------------------
  // Step 2: Greedy baseline
  // ------------------------
  let remG = WG, remS = WS;
  let heroesGreedy = Array(H).fill(0);
  let powerGreedy = 0;

  let itemsSorted = [...items].sort((a,b)=>
    (b.p / (b.g + b.s + 1)) - (a.p / (a.g + a.s + 1))
  );

  for (let item of itemsSorted) {
    let costG = item.g;
    let costS = item.s;
    let heroLvl = item.lvl;

    if (costG <= remG && costS <= remS && heroLvl > heroesGreedy[item.hero]) {
      remG -= costG - heroesGreedy[item.hero]; // incremental cost
      remS -= costS - heroesGreedy[item.hero];
      powerGreedy += item.p - heroesGreedy[item.hero]*levels[0].power; // incremental power approx
      heroesGreedy[item.hero] = heroLvl;
    }
  }

  // ------------------------
  // Step 3: Sparse DP refinement
  // ------------------------
  let states = new Map();
  states.set("0,0", {g:0,s:0,p:0,heroes:Array(H).fill(0)});

  let total = items.length;
  let done = 0;

  for (let item of items) {
    let newStates = new Map(states);

    for (let st of states.values()) {
      let ng = st.g + item.g;
      let ns = st.s + item.s;

      if (ng <= WG && ns <= WS) {
        let key = ng + "," + ns;
        let existing = newStates.get(key);
        let np = st.p + item.p;

        if (!existing || np > existing.p) {
          let newHeroes = [...st.heroes];
          newHeroes[item.hero] = Math.max(newHeroes[item.hero], item.lvl);

          newStates.set(key, {
            g: ng,
            s: ns,
            p: np,
            heroes: newHeroes
          });
        }
      }
    }

    states = prune(newStates); // Pareto pruning

    done++;
    if (done % 50 === 0) {
      self.postMessage({type:"progress", p: Math.floor(done / total * 100)});
    }
  }

  // ------------------------
  // Step 4: Best state
  // ------------------------
  let best = [...states.values()].sort((a,b)=>b.p - a.p)[0];

  self.postMessage({
    type:"done",
    result:{
      power: Math.max(best.p, powerGreedy),
      goldLeft: G - best.g * gStep,
      sparkLeft: S - best.s * sStep,
      heroes: best.heroes
    }
  });

  // ------------------------
  // Pareto pruning helper
  // ------------------------
  function prune(statesMap) {
    let arr = [...statesMap.values()];
    arr.sort((a,b)=> a.g - b.g || a.s - b.s);

    let filtered = [];
    for (let st of arr) {
      let dominated = false;
      for (let f of filtered) {
        if (f.g <= st.g && f.s <= st.s && f.p >= st.p) {
          dominated = true;
          break;
        }
      }
      if (!dominated) filtered.push(st);
    }

    return new Map(filtered.map(s => [s.g + "," + s.s, s]));
  }

};
