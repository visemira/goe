self.onmessage = function(e) {

  let { G, S, H } = e.data;

  const gStep = 10000;
  const sStep = 100;

  const WG = Math.floor(G / gStep);
  const WS = Math.floor(S / sStep);

  // Incremental data (per level cost)
  const levels = [
    {gold:0,sparks:0,power:0},
    {gold:7000,sparks:250,power:22},
    {gold:500,sparks:10,power:0},
    {gold:500,sparks:10,power:0},
    {gold:500,sparks:10,power:0},
    {gold:500,sparks:10,power:0},
    {gold:35500,sparks:510,power:44},
    {gold:3500,sparks:40,power:0},
    {gold:4000,sparks:40,power:0},
    {gold:3500,sparks:40,power:0},
    {gold:4000,sparks:40,power:0},
    {gold:61500,sparks:540,power:44},
    {gold:8000,sparks:60,power:0},
    {gold:8000,sparks:60,power:0},
    {gold:8000,sparks:60,power:0},
    {gold:8500,sparks:60,power:0},
    {gold:86000,sparks:560,power:44},
    {gold:13500,sparks:80,power:0},
    {gold:14000,sparks:80,power:0},
    {gold:14000,sparks:80,power:0},
    {gold:14000,sparks:80,power:0},
    {gold:111000,sparks:580,power:44},
    {gold:20500,sparks:100,power:0},
    {gold:21000,sparks:100,power:0},
    {gold:21500,sparks:100,power:0},
    {gold:21500,sparks:100,power:0},
    {gold:137000,sparks:600,power:44},
    {gold:23000,sparks:100,power:0},
    {gold:25500,sparks:100,power:0},
    {gold:24500,sparks:100,power:0},
    {gold:25000,sparks:100,power:0}
  ];

  // ------------------------
  // Step 1: Build per-hero options (prefix sums)
  // ------------------------
  let heroOptions = [];

  for (let h = 0; h < H; h++) {
    let options = [];

    let g = 0, s = 0, p = 0;

    // level 0
    options.push({ g: 0, s: 0, p: 0, lvl: 0 });

    for (let i = 0; i < levels.length; i++) {
      g += Math.floor(levels[i].gold / gStep);
      s += Math.floor(levels[i].sparks / sStep);
      p += levels[i].power;

      options.push({ g, s, p, lvl: i + 1 });
    }

    heroOptions.push(options);
  }

  // ------------------------
  // Step 2: Group Knapsack DP
  // ------------------------
  let states = new Map();
  states.set("0,0", { g: 0, s: 0, p: 0, heroes: Array(H).fill(0) });

  for (let h = 0; h < H; h++) {
    let newStates = new Map();

    for (let st of states.values()) {
      for (let opt of heroOptions[h]) {

        let ng = st.g + opt.g;
        let ns = st.s + opt.s;

        if (ng > WG || ns > WS) continue;

        let key = ng + "," + ns;
        let np = st.p + opt.p;

        let existing = newStates.get(key);

        if (!existing || np > existing.p) {
          let heroes = [...st.heroes];
          heroes[h] = opt.lvl;

          newStates.set(key, {
            g: ng,
            s: ns,
            p: np,
            heroes
          });
        }
      }
    }

    states = prune(newStates);
  }

  // ------------------------
  // Step 3: Get best result
  // ------------------------
  let best = [...states.values()].sort((a,b)=>b.p - a.p)[0];

  self.postMessage({
    type: "done",
    result: {
      power: best.p,
      goldLeft: G - best.g * gStep,
      sparkLeft: S - best.s * sStep,
      heroes: best.heroes
    }
  });

  // ------------------------
  // Pareto pruning
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
