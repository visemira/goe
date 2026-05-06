self.onmessage = function(e) {

  let {G, S, H} = e.data;

  const gStep = 10000;
  const sStep = 100;

  const WG = Math.floor(G / gStep);
  const WS = Math.floor(S / sStep);

  // Sample data (replace with full game dataset)
  const levels = [
  {"level":1,"gold":7000,"sparks":250,"power":22},
  {"level":2,"gold":14500,"sparks":510,"power":44},
  {"level":3,"gold":22500,"sparks":780,"power":66},
  {"level":4,"gold":30500,"sparks":1060,"power":88},
  {"level":5,"gold":39000,"sparks":1350,"power":110},
  {"level":6,"gold":83000,"sparks":2150,"power":176},
  {"level":7,"gold":130500,"sparks":2990,"power":242},
  {"level":8,"gold":182000,"sparks":3870,"power":308},
  {"level":9,"gold":237000,"sparks":4790,"power":374},
  {"level":10,"gold":296000,"sparks":5750,"power":440},
  {"level":11,"gold":416500,"sparks":7250,"power":550},
  {"level":12,"gold":545000,"sparks":8810,"power":660},
  {"level":13,"gold":681500,"sparks":10430,"power":770},
  {"level":14,"gold":826000,"sparks":12110,"power":880},
  {"level":15,"gold":979000,"sparks":13850,"power":990},
  {"level":16,"gold":1218000,"sparks":16150,"power":1144},
  {"level":17,"gold":1470500,"sparks":18530,"power":1298},
  {"level":18,"gold":1737000,"sparks":20990,"power":1452},
  {"level":19,"gold":2017500,"sparks":23530,"power":1606},
  {"level":20,"gold":2312000,"sparks":26150,"power":1760},
  {"level":21,"gold":2717500,"sparks":29350,"power":1958},
  {"level":22,"gold":3143500,"sparks":32650,"power":2156},
  {"level":23,"gold":3590500,"sparks":36050,"power":2354},
  {"level":24,"gold":4059000,"sparks":39550,"power":2552},
  {"level":25,"gold":4549000,"sparks":43150,"power":2750},
  {"level":26,"gold":5176000,"sparks":47350,"power":2992},
  {"level":27,"gold":5826000,"sparks":51650,"power":3234},
  {"level":28,"gold":6501500,"sparks":56050,"power":3476},
  {"level":29,"gold":7201500,"sparks":60550,"power":3718},
  {"level":30,"gold":7926500,"sparks":65150,"power":3960}
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
