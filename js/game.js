// ❄️ WHITEOUT SURVIVAL CLONE 3D — Phone/Tablet + Server Privato ❄️
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ═══════ DEFINIZIONE EDIFICI (stile Whiteout Survival) ═══════ */
const DEFS = {
  furnace: { nome: '🔥 Fornace Centrale', emoji: '🔥', desc: 'Cuore della città. Scalda tutti e sblocca potenziamenti.', baseCost: { legno: 50, carbone: 20 }, prod: {} },
  shelter: { nome: '🏠 Rifugio', emoji: '🏠', desc: '+Sopravvissuti e potenza. Tienilo al caldo!', baseCost: { legno: 40, cibo: 20 }, prod: { surv: 1 } },
  sawmill: { nome: '🪚 Segheria', emoji: '🪚', desc: 'Produce Legno al secondo.', baseCost: { legno: 30 }, prod: { legno: 0.6 } },
  coal:    { nome: '⛏️ Miniera Carbone', emoji: '⛏️', desc: 'Produce Carbone per la fornace.', baseCost: { legno: 50, cibo: 10 }, prod: { carbone: 0.4 } },
  kitchen: { nome: '🍲 Cucina', emoji: '🍲', desc: 'Produce Cibo per i sopravvissuti.', baseCost: { legno: 45 }, prod: { cibo: 0.5 } },
  iron:    { nome: '⚙️ Fonderia Ferro', emoji: '⚙️', desc: 'Produce Ferro (liv. fornace 3).', baseCost: { legno: 120, carbone: 60 }, prod: { ferro: 0.25 }, req: 3 },
  hospital:{ nome: '🏥 Ospedale', emoji: '🏥', desc: 'Cura i malati durante la tormenta.', baseCost: { legno: 100, cibo: 60 }, prod: { surv: 0.5 }, req: 2 },
  barracks:{ nome: '🛡️ Caserma', emoji: '🛡️', desc: 'Addestra truppe. Potenza +++.', baseCost: { legno: 150, ferro: 40 }, prod: {}, req: 3 },
};
const PLOTS = [
  { id: 'furnace', x: 0, z: 0, big: true },
  { id: 'sawmill', x: -9, z: -4 }, { id: 'coal', x: 9, z: -4 },
  { id: 'kitchen', x: -9, z: 5 }, { id: 'shelter', x: 9, z: 5 },
  { id: 'shelter2', x: 0, z: -11, as: 'shelter' }, { id: 'iron', x: -13, z: -11 },
  { id: 'hospital', x: 13, z: -11 }, { id: 'barracks', x: 0, z: 12 },
];

/* ═══════ STATO ═══════ */
const SAVE_KEY = 'wos_save_v1';
function defaultState() {
  const buildings = {};
  for (const p of PLOTS) buildings[p.id] = { key: p.as || p.id, level: p.id === 'furnace' ? 1 : 0 };
  return {
    res: { legno: 120, carbone: 80, cibo: 100, ferro: 20, frostStars: 10 },
    troops: 0, sick: 0,
    buildings, buildQueue: null, // {plotId, endsAt}
    missionsDone: [], expedEndsAt: 0, trainEndsAt: 0, trainQty: 0,
    created: Date.now(),
  };
}
let S;
try { S = JSON.parse(localStorage.getItem(SAVE_KEY)) || defaultState(); }
catch { S = defaultState(); }
if (!S.res || !S.buildings) S = defaultState();
function saveLocal() { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); }
setInterval(saveLocal, 5000);

function power() {
  let p = 0;
  for (const id in S.buildings) p += S.buildings[id].level * 25;
  p += S.troops * 5 + S.res.frostStars * 2;
  p += (S.missionsDone.length || 0) * 15;
  return Math.floor(p);
}
function prodPerSec(kind) {
  let v = 0;
  for (const id in S.buildings) {
    const b = S.buildings[id], d = DEFS[b.key];
    if (b.level > 0 && d.prod[kind]) v += d.prod[kind] * b.level;
  }
  return v;
}
function costFor(plotId) {
  const b = S.buildings[plotId], d = DEFS[b.key];
  const lv = b.level + 1, m = Math.pow(1.55, b.level);
  const cost = {};
  for (const k in d.baseCost) cost[k] = Math.floor(d.baseCost[k] * m) + (lv - 1) * 8;
  return { cost, lv, time: Math.floor(8 + b.level * 14) };
}

/* ═══════ SCENA 3D ═══════ */
const container = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a2038);
scene.fog = new THREE.Fog(0x0a2038, 40, 110);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 300);
camera.position.set(0, 24, 30);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2.6;
controls.minDistance = 12; controls.maxDistance = 60;
// touch: 1 dito ruota, 2 dita zoom/pan (perfetto per phone/tablet)
controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

scene.add(new THREE.HemisphereLight(0xbfe3ff, 0x1a2f4a, 0.9));
const sun = new THREE.DirectionalLight(0xfff2d9, 1.1);
sun.position.set(20, 30, 12); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -30; sun.shadow.camera.right = 30;
sun.shadow.camera.top = 30; sun.shadow.camera.bottom = -30;
scene.add(sun);
const furnaceLight = new THREE.PointLight(0xff7b24, 2.2, 30, 1.6);
furnaceLight.position.set(0, 4, 0); scene.add(furnaceLight);

// terreno innevato
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(34, 48),
  new THREE.MeshStandardMaterial({ color: 0xe8f2fb, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const iceRing = new THREE.Mesh(
  new THREE.RingGeometry(34, 60, 48),
  new THREE.MeshStandardMaterial({ color: 0x9cc8e8, roughness: 0.6 })
);
iceRing.rotation.x = -Math.PI / 2; iceRing.position.y = -0.05; scene.add(iceRing);

// mura + alberi + rocce (contorno città)
function pine(x, z, s = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.25 * s, .35 * s, 1.4 * s, 7),
    new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 1 }));
  trunk.position.y = .7 * s; trunk.castShadow = true; g.add(trunk);
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry((1.6 - i * .4) * s, 1.4 * s, 8),
      new THREE.MeshStandardMaterial({ color: i === 0 ? 0x2e6b46 : 0x3a8256, roughness: 1 }));
    cone.position.y = (1.6 + i * .9) * s; cone.castShadow = true; g.add(cone);
    const snow = new THREE.Mesh(new THREE.ConeGeometry((1.0 - i * .25) * s, .5 * s, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff }));
    snow.position.y = (2.1 + i * .9) * s; g.add(snow);
  }
  g.position.set(x, 0, z); scene.add(g);
}
for (let i = 0; i < 26; i++) {
  const a = (i / 26) * Math.PI * 2;
  pine(Math.cos(a) * (37 + Math.random() * 8), Math.sin(a) * (37 + Math.random() * 8), .8 + Math.random() * .9);
}
for (let i = 0; i < 12; i++) { // mura di legno
  const a = (i / 12) * Math.PI * 2;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(9, 2.2, .8),
    new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 1 }));
  wall.position.set(Math.cos(a) * 28, 1.1, Math.sin(a) * 28);
  wall.rotation.y = -a + Math.PI / 2; wall.castShadow = true; scene.add(wall);
}

/* ── costruzioni 3D ── */
const meshes = {}; // plotId -> Group
const COLORS = { shelter: 0x8fb7d8, sawmill: 0xa9743c, coal: 0x4a4a55, kitchen: 0xc98d5e, iron: 0x7d8a99, hospital: 0xe8e8f0, barracks: 0x5e6e8c, furnace: 0x555c66 };

function buildMesh(plotId) {
  const plot = PLOTS.find(p => p.id === plotId);
  const st = S.buildings[plotId], def = DEFS[st.key];
  if (meshes[plotId]) { scene.remove(meshes[plotId]); }
  const g = new THREE.Group();
  const lv = st.level, big = plot.big ? 1.7 : 1;

  // basamento pietra
  const base = new THREE.Mesh(new THREE.CylinderGeometry(3 * big, 3.4 * big, .7, 10),
    new THREE.MeshStandardMaterial({ color: 0x6b7684, roughness: 1 }));
  base.position.y = .35; base.receiveShadow = true; g.add(base);

  if (lv === 0) { // cantiere vuoto: paletti + cartello
    for (let i = 0; i < 4; i++) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(.3, 2, .3),
        new THREE.MeshStandardMaterial({ color: 0x9a6b3f }));
      const a = i * Math.PI / 2 + .4;
      post.position.set(Math.cos(a) * 2, 1, Math.sin(a) * 2); g.add(post);
    }
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1, .15),
      new THREE.MeshStandardMaterial({ color: 0xffd75e, emissive: 0x6b5200, emissiveIntensity: .4 }));
    sign.position.y = 1.8; g.add(sign);
  } else if (st.key === 'furnace') {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.6 * big, 2.3 * big, 4.5 * big + lv * .35, 10),
      new THREE.MeshStandardMaterial({ color: COLORS.furnace, roughness: .8, metalness: .35 }));
    tower.position.y = 2.6 * big; tower.castShadow = true; g.add(tower);
    const glow = new THREE.Mesh(new THREE.CylinderGeometry(1.65 * big, 1.65 * big, .8, 10),
      new THREE.MeshStandardMaterial({ color: 0xff6a00, emissive: 0xff5500, emissiveIntensity: 2 }));
    glow.position.y = 1.4 * big; g.add(glow); g.userData.glow = glow;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.1 * big, 1.6 * big, 1.2 * big, 10),
      new THREE.MeshStandardMaterial({ color: 0x333a44, roughness: .7 }));
    top.position.y = (5.2 * big + lv * .35); g.add(top);
    // fumo
    const smoke = new THREE.Mesh(new THREE.SphereGeometry(.8 * big, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, transparent: true, opacity: .5 }));
    smoke.position.y = 6.5 * big + lv * .35; g.add(smoke); g.userData.smoke = smoke;
    // anello calore
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.6 * big, 3.9 * big, 40),
      new THREE.MeshBasicMaterial({ color: 0xff8c2e, transparent: true, opacity: .55, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .75; g.add(ring);
  } else {
    const w = 2.6 * big, h = (1.6 + lv * .28) * big, dd = 2.2 * big;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd),
      new THREE.MeshStandardMaterial({ color: COLORS[st.key] || 0x8fb7d8, roughness: .9 }));
    body.position.y = .7 + h / 2; body.castShadow = true; g.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(w * .78, 1.4 * big, 4),
      new THREE.MeshStandardMaterial({ color: 0xf4f9ff, roughness: 1 }));
    roof.position.y = .7 + h + .7 * big; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
    // finestre accese
    const winMat = new THREE.MeshStandardMaterial({ color: 0x332200, emissive: 0xffb545, emissiveIntensity: 1.6 });
    for (let i = -1; i <= 1; i++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(.5, .6, .1), winMat);
      win.position.set(i * .8 * big, .7 + h * .55, dd / 2 + .06); g.add(win);
    }
    // stelle livello
    for (let i = 0; i < Math.min(lv, 5); i++) {
      const star = new THREE.Mesh(new THREE.SphereGeometry(.16, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0xffd75e, emissive: 0xaa7700, emissiveIntensity: 1 }));
      star.position.set((i - Math.min(lv, 5) / 2 + .5) * .6, .7 + h + 1.6 * big, 0); g.add(star);
    }
  }
  g.position.set(plot.x, 0, plot.z);
  g.userData.plotId = plotId;
  scene.add(g); meshes[plotId] = g;
}
function rebuildAll() { for (const p of PLOTS) buildMesh(p.id); }
rebuildAll();

/* ── neve particellare ── */
const SNOW_N = 900;
const snowGeo = new THREE.BufferGeometry();
const snowPos = new Float32Array(SNOW_N * 3);
for (let i = 0; i < SNOW_N; i++) {
  snowPos[i * 3] = (Math.random() - .5) * 90;
  snowPos[i * 3 + 1] = Math.random() * 30;
  snowPos[i * 3 + 2] = (Math.random() - .5) * 90;
}
snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, size: .22, transparent: true, opacity: .9 }));
scene.add(snow);

/* ── tap edifici (touch + mouse) ── */
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let downAt = 0, downX = 0, downY = 0;
renderer.domElement.addEventListener('pointerdown', e => { downAt = Date.now(); downX = e.clientX; downY = e.clientY; });
renderer.domElement.addEventListener('pointerup', e => {
  if (Date.now() - downAt > 350 || Math.hypot(e.clientX - downX, e.clientY - downY) > 12) return; // era un drag
  ptr.x = (e.clientX / innerWidth) * 2 - 1; ptr.y = -(e.clientY / innerHeight) * 2 + 1;
  ray.setFromCamera(ptr, camera);
  const hits = ray.intersectObjects(Object.values(meshes), true);
  if (hits.length) {
    let o = hits[0].object;
    while (o && !o.userData.plotId) o = o.parent;
    if (o) openBuilding(o.userData.plotId);
  }
});
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* ═══════ CICLO GIORNO/NOTTE + TEMPERATURA + TORMENTA ═══════ */
let blizzard = false, blizzardServer = null;
async function pollBlizzard() {
  try {
    const r = await fetch(serverURL('/api/blizzard'));
    const j = await r.json();
    if (typeof j.blizzard === 'boolean') { blizzardServer = j.blizzard; return; }
  } catch { /* offline: ciclo locale */ }
  blizzardServer = null;
}
setInterval(pollBlizzard, 15000); pollBlizzard();
const dayLen = 150; // secondi per giorno intero
const t0 = Date.now();
function env() {
  const t = ((Date.now() - t0) / 1000) % dayLen / dayLen; // 0..1
  const night = (t < .22 || t > .78);
  const localBlizz = (Math.floor(Date.now() / 90000) % 3 === 2);
  blizzard = blizzardServer !== null ? blizzardServer : localBlizz;
  let temp = night ? -38 : -18;
  if (blizzard) temp -= 22;
  const furnaceLv = S.buildings.furnace.level;
  const heat = furnaceLv * 6 + (S.res.carbone > 0 ? 4 : 0);
  const feels = temp + heat;
  return { t, night, temp, feels, heat };
}

/* ═══════ GAME LOOP ═══════ */
let last = Date.now();
setInterval(() => { // tick risorse 1s
  const now = Date.now(), dt = Math.min(5, (now - last) / 1000); last = now;
  const { feels } = env();
  const eff = feels < -25 ? 0.45 : feels < -10 ? 0.8 : 1; // freddo = -produzione
  S.res.legno += prodPerSec('legno') * eff * dt;
  S.res.carbone += prodPerSec('carbone') * eff * dt;
  S.res.cibo += prodPerSec('cibo') * eff * dt;
  S.res.ferro += prodPerSec('ferro') * eff * dt;
  // consumo: sopravvissuti mangiano, fornace brucia carbone
  const surv = survivors();
  S.res.cibo = Math.max(0, S.res.cibo - surv * 0.008 * dt);
  S.res.carbone = Math.max(0, S.res.carbone - S.buildings.furnace.level * 0.02 * dt);
  if (blizzard && Math.random() < .02) { S.sick = Math.min(20, S.sick + 1); toast('🤧 Un sopravvissuto si è ammalato! Potenzia Ospedale.'); }
  if (S.sick > 0 && S.buildings.hospital.level > 0 && Math.random() < .05) S.sick--;
  // coda costruzione
  if (S.buildQueue && now >= S.buildQueue.endsAt) {
    const b = S.buildings[S.buildQueue.plotId];
    b.level++;
    toast(`${DEFS[b.key].emoji} ${DEFS[b.key].nome} ora liv. ${b.level}!`);
    if (b.key === 'furnace' && (b.level === 3 || b.level === 5)) {
      S.res.frostStars += 5; toast('⭐ +5 Stelle del Gelo Infinito! (fornace)');
    }
    S.buildQueue = null; buildMesh(S.buildQueue?.plotId || 'furnace'); rebuildAll(); saveLocal(); syncSave();
    refreshMissions();
  }
  // spedizione / addestramento completati
  if (S.expedEndsAt && now >= S.expedEndsAt) {
    S.expedEndsAt = 0;
    const loot = { legno: 60 + rnd(80), cibo: 40 + rnd(60), carbone: 30 + rnd(50) };
    for (const k in loot) S.res[k] += loot[k];
    S.res.frostStars += 2;
    toast(`🧭 Spedizione tornata! +risorse e ⭐+2 Stelle del Gelo!`);
    refreshMissions();
  }
  if (S.trainEndsAt && now >= S.trainEndsAt) {
    S.troops += S.trainQty; S.trainEndsAt = 0; S.trainQty = 0;
    toast(`🛡️ Truppe pronte! Esercito: ${S.troops}`);
    refreshMissions();
  }
  updateHUD();
}, 1000);
function rnd(n) { return Math.floor(Math.random() * n); }
function survivors() {
  let v = 5;
  for (const id in S.buildings) {
    const b = S.buildings[id];
    if (DEFS[b.key].prod.surv) v += DEFS[b.key].prod.surv * b.level * 2;
  }
  return Math.floor(v);
}

/* rendering */
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const e = env(), dt = clock.getDelta();
  // neve cade (più veloce in tormenta)
  const p = snowGeo.attributes.position.array;
  const fall = (blizzard ? 14 : 4) * dt;
  for (let i = 0; i < SNOW_N; i++) {
    p[i * 3 + 1] -= fall * (0.5 + (i % 5) / 5);
    p[i * 3] += (blizzard ? 8 : 1) * dt;
    if (p[i * 3 + 1] < 0) { p[i * 3 + 1] = 30; p[i * 3] = (Math.random() - .5) * 90; }
    if (p[i * 3] > 45) p[i * 3] = -45;
  }
  snowGeo.attributes.position.needsUpdate = true;
  // luce giorno/notte
  const dayF = e.night ? .25 : 1;
  sun.intensity = (blizzard ? .35 : 1.1) * dayF;
  scene.background.setHex(e.night ? 0x050f1e : blizzard ? 0x5a6b7d : 0x0a2038);
  scene.fog.color.setHex(e.night ? 0x050f1e : blizzard ? 0x5a6b7d : 0x0a2038);
  furnaceLight.intensity = 1.8 + Math.sin(Date.now() / 300) * .5 + S.buildings.furnace.level * .25;
  // fumo fornace
  const fm = meshes.furnace;
  if (fm?.userData.smoke) {
    fm.userData.smoke.position.y += dt * 1.2;
    fm.userData.smoke.scale.setScalar(1 + (fm.userData.smoke.position.y % 3) * .25);
    if (fm.userData.smoke.position.y > 11) fm.userData.smoke.position.y = 6.5;
  }
  controls.update();
  renderer.render(scene, camera);
}
animate();

/* ═══════ UI / HUD ═══════ */
const $ = id => document.getElementById(id);
function fmt(n) { n = Math.floor(n); return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : '' + n; }
function updateHUD() {
  $('r-legno').textContent = fmt(S.res.legno);
  $('r-carbone').textContent = fmt(S.res.carbone);
  $('r-cibo').textContent = fmt(S.res.cibo);
  $('r-ferro').textContent = fmt(S.res.ferro);
  $('r-frost').textContent = fmt(S.res.frostStars);
  const e = env();
  $('tempval').textContent = `${Math.round(e.temp)}°C → percepiti ${Math.round(e.feels)}°C`;
  $('tempfill').style.width = Math.max(4, Math.min(100, (e.feels + 60) / 60 * 100)) + '%';
  $('power').textContent = `⚔️ Potenza ${power()} · 🧍 ${survivors()} · 🛡️ ${S.troops}` + (S.sick ? ` · 🤧 ${S.sick}` : '');
  // banner tormenta
  const bz = $('blizzard');
  if (blizzard) { bz.classList.add('show'); bz.innerHTML = `🌪️ TORMENTA DI GELO! 🌪️<br><small>Produzione -55% · Resta vicino alla Fornace 🔥</small>`; }
  else bz.classList.remove('show');
  // bottone coda
  if (S.buildQueue) {
    const s = Math.max(0, Math.ceil((S.buildQueue.endsAt - Date.now()) / 1000));
    $('queueinfo').textContent = `🚧 In costruzione… ${s}s`;
    $('queueinfo').style.display = 'block';
  } else { $('queueinfo').style.display = 'none'; }
  if (S.expedEndsAt) {
    const s = Math.max(0, Math.ceil((S.expedEndsAt - Date.now()) / 1000));
    $('expedinfo').textContent = `🧭 Spedizione… ${s}s`;
    $('expedinfo').style.display = 'block';
  } else $('expedinfo').style.display = 'none';
}
setInterval(updateHUD, 500); updateHUD();

let toastT;
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ═══════ MODALI ═══════ */
function openModal(id) { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }
document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); }));

/* ── popup edificio ── */
let selPlot = null;
function openBuilding(plotId) {
  selPlot = plotId;
  const b = S.buildings[plotId], d = DEFS[b.key];
  const { cost, lv, time } = costFor(plotId);
  $('b-title').textContent = `${d.emoji} ${d.nome} — Liv. ${b.level}`;
  $('b-desc').textContent = d.desc + prodText(b.key);
  const req = d.req && S.buildings.furnace.level < d.req
    ? `<div class="reminder">🔒 Richiede Fornace liv. ${d.req} (ora liv. ${S.buildings.furnace.level})</div>` : '';
  const costHtml = b.level >= 10 ? `<div class="reminder">⭐ Livello MAX raggiunto!</div>`
    : 'Costo potenziamento: <b>' + Object.entries(cost).map(([k, v]) => `${ico(k)} ${v}`).join(' · ') + `</b> · ⏱️ ${time}s`;
  $('b-cost').innerHTML = req + costHtml;
  const locked = (d.req && S.buildings.furnace.level < d.req) || b.level >= 10;
  $('b-up').disabled = locked || !!S.buildQueue;
  $('b-up').textContent = S.buildQueue ? '🚧 Cantiere occupato…' : (b.level === 0 ? '🏗️ Costruisci' : `⬆️ Potenzia a liv. ${lv}`);
  $('b-speed').style.display = S.buildQueue?.plotId === plotId ? 'inline-block' : 'none';
  openModal('m-building');
}
function ico(k) { return { legno: '🪵', carbone: '⬛', cibo: '🍖', ferro: '🔩', frostStars: '⭐' }[k] || k; }
function prodText(key) {
  const p = DEFS[key].prod, out = [];
  if (p.legno) out.push('🪵 legno');
  if (p.carbone) out.push('⬛ carbone');
  if (p.cibo) out.push('🍖 cibo');
  if (p.ferro) out.push('🔩 ferro');
  if (p.surv) out.push('🧍 sopravvissuti');
  return out.length ? ` Produce: ${out.join(', ')}.` : '';
}
$('b-up').onclick = () => {
  const b = S.buildings[selPlot], { cost, time } = costFor(selPlot);
  for (const k in cost) if ((S.res[k] || 0) < cost[k]) { toast('❌ Risorse insufficienti! Fai una spedizione 🧭'); return; }
  for (const k in cost) S.res[k] -= cost[k];
  S.buildQueue = { plotId: selPlot, endsAt: Date.now() + time * 1000 };
  toast(`🚧 Costruzione avviata (${time}s). Tocca ⚡ per velocizzare con le Stelle!`);
  closeModal('m-building'); saveLocal(); updateHUD();
};
$('b-speed').onclick = () => {
  if (S.res.frostStars < 3) { toast('❌ Ti servono 3 ⭐ Stelle del Gelo Infinito!'); return; }
  S.res.frostStars -= 3; S.buildQueue.endsAt = Date.now();
  toast('⚡ Velocizzato con le Stelle del Gelo! ⭐');
  closeModal('m-building'); updateHUD();
};

/* ── missioni (danno Stelle del Gelo Infinito) ── */
const MISSIONS = [
  { id: 'm1', t: 'Potenzia la Fornace al liv. 2', check: () => S.buildings.furnace.level >= 2, rw: { frostStars: 5 } },
  { id: 'm2', t: 'Costruisci 3 edifici', check: () => Object.values(S.buildings).filter(b => b.level > 0).length >= 4, rw: { frostStars: 5, legno: 100 } },
  { id: 'm3', t: 'Raggiungi 200 potenza', check: () => power() >= 200, rw: { frostStars: 8 } },
  { id: 'm4', t: 'Completa una spedizione 🧭', check: () => (S.missionsDone.includes('exped1') || S.expedEndsAt === 0 && localStorage.getItem('wos_exped_done')), rw: { frostStars: 5 } },
  { id: 'm5', t: 'Addestra 5 truppe 🛡️', check: () => S.troops >= 5, rw: { frostStars: 8, cibo: 100 } },
  { id: 'm6', t: 'Fornace liv. 5 — Signore del Gelo', check: () => S.buildings.furnace.level >= 5, rw: { frostStars: 20 } },
];
function refreshMissions() {
  const box = $('quests'); box.innerHTML = '';
  const next = MISSIONS.find(m => !S.missionsDone.includes(m.id));
  if (next) {
    const done = next.check();
    const d = document.createElement('div'); d.className = 'quest';
    d.innerHTML = `<b>📜 ${next.t}</b><br><small>Ricompensa: ⭐${next.rw.frostStars || 0} Stelle del Gelo</small>`;
    const btn = document.createElement('button');
    btn.textContent = done ? '🎁 RISCUOTI' : '⏳ in corso…'; btn.disabled = !done;
    btn.onclick = () => {
      S.missionsDone.push(next.id);
      for (const k in next.rw) S.res[k] = (S.res[k] || 0) + next.rw[k];
      toast(`🎁 Missione! +⭐${next.rw.frostStars || 0} Stelle del Gelo Infinito!`);
      saveLocal(); refreshMissions(); updateHUD(); syncSave();
    };
    d.appendChild(btn); box.appendChild(d);
  } else box.innerHTML = `<div class="quest"><b>🏆 Tutte le missioni fatte!</b><br><small>Sei un vero Signore del Gelo ❄️</small></div>`;
}
refreshMissions();

/* ── spedizione / esercito / negozio ── */
$('btn-exped').onclick = () => {
  if (S.expedEndsAt) { toast('🧭 Spedizione già in corso…'); return; }
  if (S.res.cibo < 20) { toast('❌ Servono 20 🍖 per partire!'); return; }
  S.res.cibo -= 20; S.expedEndsAt = Date.now() + 30000;
  localStorage.setItem('wos_exped_done', '1');
  toast('🧭 Spedizione partita! Torna tra 30s con bottino + ⭐'); saveLocal();
};
$('btn-train').onclick = () => {
  if (S.trainEndsAt) { toast('🛡️ Addestramento già in corso…'); return; }
  if (S.buildings.barracks.level < 1) { toast('❌ Costruisci prima la 🛡️ Caserma!'); return; }
  if (S.res.cibo < 30 || S.res.ferro < 10) { toast('❌ Servono 30🍖 + 10🔩'); return; }
  S.res.cibo -= 30; S.res.ferro -= 10;
  S.trainQty = 3 + S.buildings.barracks.level * 2; S.trainEndsAt = Date.now() + 25000;
  toast(`🛡️ Addestramento di ${S.trainQty} truppe avviato!`); saveLocal();
};
function shopList() {
  return [
    { n: '🪵 +200 Legno', c: 4, go: () => S.res.legno += 200 },
    { n: '🍖 +200 Cibo', c: 4, go: () => S.res.cibo += 200 },
    { n: '⬛ +150 Carbone', c: 5, go: () => S.res.carbone += 150 },
    { n: '🔩 +100 Ferro', c: 6, go: () => S.res.ferro += 100 },
    { n: '⚡ Finisci costruzione', c: 3, go: () => { if (S.buildQueue) S.buildQueue.endsAt = Date.now(); } },
    { n: '🤧 Cura tutti i malati', c: 3, go: () => S.sick = 0 },
  ];
}
function renderShop() {
  const box = $('shop-items'); box.innerHTML = '';
  shopList().forEach((it, i) => {
    const d = document.createElement('div'); d.className = 'bcard';
    d.innerHTML = `<div class="inf"><b>${it.n}</b><div>Costo: ⭐ ${it.c} Stelle del Gelo Infinito (hai ⭐ ${Math.floor(S.res.frostStars)})</div></div>`;
    const b = document.createElement('button'); b.className = 'btn gold'; b.textContent = 'Compra ⭐';
    b.onclick = () => {
      if (S.res.frostStars < it.c) { toast('❌ Stelle insufficienti! Completa le missioni 📜'); return; }
      S.res.frostStars -= it.c; it.go(); toast('✅ Acquistato!'); saveLocal(); renderShop(); updateHUD();
    };
    d.appendChild(b); box.appendChild(d);
  });
}

/* ── navigazione ── */
document.querySelectorAll('#bottombar button').forEach(b => b.onclick = () => {
  const tab = b.dataset.tab;
  if (tab === 'city') { document.querySelectorAll('.modal').forEach(m => m.classList.remove('open')); $('hint').textContent = '👆 Tocca un edificio per costruirlo / potenziarlo · 🤏 Pizzica per zoomare'; }
  if (tab === 'shop') { renderShop(); openModal('m-shop'); }
  if (tab === 'missions') { openModal('m-help'); }
  if (tab === 'rank') { loadRanking(); loadChat(); openModal('m-rank'); }
  if (tab === 'settings') openModal('m-settings');
});
$('btn-furnace').onclick = () => openBuilding('furnace');

/* ── impostazioni server (PROMEMORIA IP) ── */
function refreshSettings() {
  $('set-ip').value = localStorage.getItem('wos_server_ip') || SERVER_IP;
  $('set-name').value = PLAYER_NAME;
  $('set-url').textContent = '→ ' + serverURL('/api/ping');
}
$('btn-save-ip').onclick = () => {
  const ip = $('set-ip').value.trim(), name = $('set-name').value.trim() || PLAYER_NAME;
  localStorage.setItem('wos_server_ip', ip);
  localStorage.setItem('wos_player', name); PLAYER_NAME = name;
  toast(`✅ Server impostato su http://${ip}:3001 — ${ip === SERVER_IP ? 'IP di default' : 'IP personalizzato!'}`);
  refreshSettings(); pingServer(); syncSave();
};

/* ═══════ COLLEGAMENTO SERVER PRIVATO ═══════ */
let online = false;
async function pingServer() {
  try {
    const r = await fetch(serverURL('/api/ping'));
    const j = await r.json();
    online = !!j.ok;
    $('motd').textContent = j.motd || '';
  } catch { online = false; }
  const d = $('serverdot');
  d.innerHTML = `<span class="dot ${online ? 'on' : ''}"></span> ${online ? '🟢 ONLINE' : '🔴 OFFLINE'}`;
}
setInterval(pingServer, 10000); pingServer();

async function syncSave() {
  if (!online) return;
  try {
    await fetch(serverURL('/api/save'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: PLAYER_NAME, data: { ...S, power: power() } })
    });
  } catch { }
}
setInterval(syncSave, 20000);

async function loadRanking() {
  const box = $('rank-list'); box.innerHTML = '⏳ carico…';
  try {
    const r = await fetch(serverURL('/api/ranking'));
    const j = await r.json();
    box.innerHTML = '';
    (j.ranking || []).forEach((p, i) => {
      const d = document.createElement('div'); d.className = 'rankrow';
      d.innerHTML = `<span>${i + 1}. <b>${p.name}</b> 🔥${p.furnace}</span><span>⚔️${p.power} ⭐${p.frostStars}</span>`;
      box.appendChild(d);
    });
    if (!(j.ranking || []).length) box.innerHTML = '<small>Nessun giocatore ancora. Sii il primo! ❄️</small>';
  } catch { box.innerHTML = '<small>🔴 Server offline — controlla IP nelle ⚙️ Impostazioni.<br>Ricorda: PC e telefono devono stare sullo stesso WiFi!</small>'; }
}
async function loadChat() {
  const box = $('chatbox'); if (!box) return;
  try {
    const r = await fetch(serverURL('/api/chat'));
    const j = await r.json();
    box.innerHTML = '';
    (j.chat || []).forEach(m => {
      const d = document.createElement('div'); d.innerHTML = `<b>${m.name}:</b> ${m.text}`;
      box.appendChild(d);
    });
  } catch { box.innerHTML = '<div>🔴 chat offline</div>'; }
}
$('btn-chat-send').onclick = async () => {
  const t = $('chat-input').value.trim(); if (!t) return;
  $('chat-input').value = '';
  try { await fetch(serverURL('/api/chat'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: PLAYER_NAME, text: t }) }); } catch { toast('🔴 Server offline'); }
  loadChat();
};
setInterval(() => { if ($('m-rank').classList.contains('open')) { loadChat(); } }, 5000);

refreshSettings();
updateHUD();
setTimeout(() => toast('❄️ Benvenuto! Tocca un cantiere per costruire 🏗️'), 1200);
