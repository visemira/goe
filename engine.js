self.onmessage = function(e) {

let {G, S, H} = e.data;

// scaling (fast + stable)
const gStep = 10000;
const sStep = 100;

let WG = Math.floor(G / gStep);
let WS = Math.floor(S / sStep);

// sample data (you can move full dataset here)
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
{gold:294500,sparks:2620,power:154}
];

// sparse DP (FAST ENGINE)
let states = new Map();
states.set("0,0", {g:0,s:0,p:0,heroes:Array(H).fill(0)});

let items = [];

// build items
for (let h=0; h<H; h++) {
for (let i=0; i<levels.length; i++) {
items.push({
hero:h,
lvl:i,
g:Math.floor(levels[i].gold/gStep),
s:Math.floor(levels[i].sparks/sStep),
p:levels[i].power
});
}
}

// sort efficiency
items.sort((a,b)=> (b.p/(b.g+a.s+1)) - (a.p/(a.g+a.s+1)));

let total = items.length;
let done = 0;

// main loop
for (let item of items) {

let newStates = new Map(states);

for (let st of states.values()) {

let ng = st.g + item.g;
let ns = st.s + item.s;

if (ng <= WG && ns <= WS) {

let key = ng+","+ns;

let existing = newStates.get(key);

let np = st.p + item.p;

if (!existing || np > existing.p) {

newStates.set(key, {
g:ng,
s:ns,
p:np,
heroes:[...st.heroes]
});
newStates.get(key).heroes[item.hero] =
Math.max(newStates.get(key).heroes[item.hero], item.lvl);
}

}

}

states = newStates;

done++;

if (done % 50 === 0) {
self.postMessage({
type:"progress",
p: Math.floor((done/total)*100)
});
}

}

// best state
let best = [...states.values()]
.sort((a,b)=>b.p-a.p)[0];

self.postMessage({
type:"done",
result:{
power:best.p,
goldLeft: G - best.g*gStep,
sparkLeft: S - best.s*sStep,
heroes: best.heroes
}
});

};
