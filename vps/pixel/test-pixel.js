// Test des accroches Pixel Meet avec un Firestore simulé (aucun accès réseau) : node test-pixel.js
'use strict';
const Module = require('module');
let fails = 0;
const ok = (c, l) => { console.log((c ? '  ok  ' : '  ÉCHEC ') + l); if (!c) fails++; };
const st = {};
const doc = p => ({ path: p, id: p.split('/').pop(), get: async () => ({ id: p.split('/').pop(), exists: p in st, data: () => st[p] }) });
const db = { doc, collection: c => ({ get: async () => ({ docs: Object.keys(st).filter(k => k.startsWith(c + '/') && k.split('/').length === 2).map(k => ({ id: k.split('/')[1], data: () => st[k] })) }) }),
  batch: () => { const ops = []; return { set: (r, d, o) => ops.push([r.path, d, o]), commit: async () => ops.forEach(([p, d, o]) => { st[p] = o?.merge ? { ...(st[p] || {}), ...d } : d; }) }; } };
Module._load = (orig => function (req, ...rest) {
  if (req === 'firebase-admin') return { credential: { cert: k => k }, initializeApp: () => ({ firestore: () => db }) };
  if (req === 'firebase-admin/firestore') return { FieldValue: { serverTimestamp: () => 'TS' } };
  if (/cle\.json$/.test(req)) return { project_id: 's9-interact' };
  return orig.call(this, req, ...rest);
})(Module._load);
process.env.DST_KEY = '/x/s9-interact-cle.json';
const P = require('./pixel.js'), A = require('./accroches.json');

const joy = { char: 'joy', player: 'eden', pseudo: 'AngelSparkle007', genre: 'Féminin', metier: 'Chanteuse et compositrice', traine: 'Vraie-Vision',
  cherche: 'Hommes, Femmes. La fête n\'a pas de genre !!!', passions: 'la musique, le chant, la danse, le clubbing, le nail art, les tatouages', freq: 'normal', mix: { classique: 0, taquin: 0, direct: 100 } };
ok(['classique', 'taquin', 'direct'].every(t => A[t].length >= 30), 'au moins 30 accroches par ton');
ok(Array.from({ length: 200 }, () => P.makeHook(joy)).every(h => h.tone === 'direct'), 'dosage du ton respecté (100 % direct)');
const all = ['classique', 'taquin', 'direct'].flatMap(t => A[t].map(x => ({ t, x })));
const filled = all.map(({ x }) => P.makeHook({ ...joy, mix: { classique: 1, taquin: 1, direct: 1 } }, (() => { let i = 0; return () => [0.5, 0, 0.3, 0.2, 0.7, 0.1, 0.9][i++ % 7]; })()));
ok(Array.from({ length: 300 }, () => P.makeHook({ ...joy, mix: { classique: 1, taquin: 1, direct: 1 } }).text).every(t => !/[{}]/.test(t) && t.length > 10), 'aucune variable laissée vide dans les messages');
ok(JSON.stringify(P.gendersFor({ cherche: 'Hommes' })) === '["m"]' && JSON.stringify(P.gendersFor({ cherche: 'Femmes' })) === '["f"]' && P.gendersFor(joy).length === 2, '« Cherche » décide qui écrit');
ok(Array.from({ length: 100 }, () => P.makeHook({ ...joy, cherche: 'Femmes' }).npc.g).every(g => g === 'f'), 'profil qui cherche des femmes : seulement des PNJ femmes');
ok(P.passionsOf(joy).includes('la musique') && P.passionsOf(joy).includes('les tatouages'), 'passions lues dans le profil');
ok(P.quiet(new Date(2026, 10, 11, 3)) && !P.quiet(new Date(2026, 10, 11, 23)), 'rien entre 2 h et 10 h');
(async () => {
  st['pm_profiles/joy'] = joy; st['pm_profiles/tala'] = { char: 'tala', player: 'idriss', freq: 'off' };
  ok(await P.tick(new Date(2026, 10, 11, 4), () => 0) === 0, 'la nuit : aucune accroche');
  ok(await P.tick(new Date(2026, 10, 11, 21), () => 0) === 1, 'tirage favorable : une accroche, et rien pour un profil réglé sur « Aucune »');
  const th = Object.entries(st).find(([k]) => /^pm_threads\/[^/]+$/.test(k));
  ok(th && th[1].a === 'joy' && th[1].b === null && JSON.stringify(th[1].players) === '["eden"]' && th[1].npc?.name, 'conversation créée, visible d\'Eden seulement');
  ok(Object.keys(st).some(k => k.startsWith(th[0] + '/msgs/')), 'message du PNJ enregistré');
  const n = Object.entries(st).find(([k]) => k.startsWith('news/pm:'));
  ok(n && n[1].to === 'eden' && n[1].text === 'Pixel Meet · nouveau message' && n[1].charId === null, 'nouvelle discrète pour Eden');
  ok(await P.tick(new Date(Date.now() + 3600e3), () => 0) === 0, 'jamais deux accroches à moins de 3 h');
  ok(Object.keys(st).every(k => /^(pm_profiles|pm_threads|news|pm_state)\//.test(k)), 'écriture seulement dans Pixel Meet et les nouvelles');
  console.log(fails ? `${fails} échec(s)` : 'Tout est bon.');
  process.exit(fails ? 1 : 0);
})();
