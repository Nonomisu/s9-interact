// Test du service de recopie avec deux Firestore simulés (aucun accès réseau) : node test-miroir.js
'use strict';
const Module = require('module');
const path = require('path');
let fails = 0;
const ok = (c, l) => { console.log((c ? '  ok  ' : '  ÉCHEC ') + l); if (!c) fails++; };

// ---------- Firestore simulé ----------
const DEL = Symbol('delete');
class FieldPath { constructor(...s) { this.s = s; } }
const FieldValue = { delete: () => DEL, serverTimestamp: () => 'TS' };
const stores = {}, listeners = {};
const getAt = (o, segs) => segs.reduce((a, k) => a == null ? undefined : a[k], o);
function fakeDb(name) {
  const st = stores[name] ||= {}, ls = listeners[name] ||= [];
  const fire = p => ls.filter(l => l.path === p).forEach(l => l.cb(snap(p)));
  const snap = p => ({ id: p.split('/').pop(), exists: p in st, data: () => st[p] ? JSON.parse(JSON.stringify(st[p])) : undefined });
  const doc = p => ({
    path: p, id: p.split('/').pop(),
    get: async () => snap(p),
    set: async (data, opt) => {
      if (opt?.mergeFields) {
        const d = st[p] ||= {};
        for (const fp of opt.mergeFields) {
          const v = getAt(data, fp.s); let o = d;
          fp.s.slice(0, -1).forEach(k => { o = (o[k] && typeof o[k] === 'object') ? o[k] : (o[k] = {}); });
          if (v === DEL || v === undefined) delete o[fp.s.at(-1)]; else o[fp.s.at(-1)] = JSON.parse(JSON.stringify(v));
        }
      } else st[p] = JSON.parse(JSON.stringify(data));
      fire(p);
    },
    create: async data => { if (p in st) { const e = new Error('6 ALREADY_EXISTS: document exists'); e.code = 6; throw e; } st[p] = JSON.parse(JSON.stringify(data)); fire(p); },
    delete: async () => { delete st[p]; fire(p); },
    onSnapshot: cb => { const l = { path: p, cb }; ls.push(l); setTimeout(() => cb(snap(p)), 0); return () => { ls.splice(ls.indexOf(l), 1); }; },
  });
  return { doc, collection: p => ({ listDocuments: async () => Object.keys(st).filter(k => k.startsWith(p + '/') && k.split('/').length === p.split('/').length + 1).map(doc) }),
    _store: st, _doc: doc };
}
const fakeAdmin = { credential: { cert: k => k }, initializeApp: (opts, name) => ({ firestore: () => fakeDb(name) }) };
const origLoad = Module._load;
Module._load = function (req, ...rest) {
  if (req === 'firebase-admin') return fakeAdmin;
  if (req === 'firebase-admin/firestore') return { FieldPath, FieldValue };
  if (/(journal-rp|s9)\.json$/.test(req)) return { project_id: req.includes('journal-rp') ? 'journal-rp' : 's9-interact' };
  return origLoad.call(this, req, ...rest);
};
process.env.SRC_KEY = '/x/journal-rp.json'; process.env.DST_KEY = '/x/s9.json';

// ---------- Données de Journée RP ----------
process.env.TZ = 'Europe/Paris';
const pad = n => String(n).padStart(2, '0');
const rp = new Date(Date.now() - 5 * 3600e3), ym = `${rp.getFullYear()}-${pad(rp.getMonth() + 1)}`, day = String(rp.getDate());
const iso = `${ym}-${pad(rp.getDate())}`;
const S = stores['journee-rp'] = {
  'days/echo/months/2026-03': { '4': { mood: 'Ancien', checked: { $set: ['Prépare le set à la maison', 'Sexe avec Prism'] }, night: { hot: true, with: 'prism' }, intime: 'secret', set: true } },
  [`days/echo/months/${ym}`]: { [day]: { mood: "Aujourd'hui", done: true, night: { hot: true, with: 'prism' }, setLate: true, door: 'occupee',
    checked: { $set: ['Verre avec les copains', 'Sexe avec Prism', 'Plaisir en solo sur Moonstone'] }, withActs: { 'Verre avec les copains': ['joy', 'eoor', 'prism'] } } },
  [`days/prism/months/${ym}`]: { [day]: { mood: 'Créative', done: true, checked: { $set: ['Publication Moonstone', 'Commande de malbouffe'] }, details: { 'Commande de malbouffe': 'Pizza' } } },
  'days/eoor/months/2026-03': { '4': { mood: 'Hors S9' } },
  [`shared/day-${iso}`]: { nights: { echo: { hot: true, with: 'prism' }, prism: { hot: true, with: 'echo' }, eoor: { hot: true, with: 'yasmeen' } }, protect: { echo: true }, rp: { echo: 'prism' }, calm: {} },
  'shared/global': { lovers: { prism: ['Un DJ', 'joy'] }, alerts: { echo: 'Tournée', eoor: 'Malade' }, hideIloh: { echo: { $set: ['Verre avec les copains'] } } },
  'characters/echo': { player: 'corentin', addedActs: ['Studio', 'Plaisir en solo sur Moonstone'] },
  'today/prism': { mood: 'ok', activities: ['Publication Moonstone', 'Commande de malbouffe'], place: 'Chez Prism & Echo' },
};
stores['s9-interact'] = { [`extras/echo/months/${ym}`]: { [day]: { added: ['Soirée au club', 'Sexe avec Prism'], withActs: { 'Soirée au club': ['tala'] } } } };
const before = JSON.stringify(Object.fromEntries(Object.entries(S).filter(([k]) => !k.startsWith('s9/'))));

process.argv.push('--tout');
const realExit = process.exit;
process.exit = code => {
  process.exit = realExit;
  const D = stores['s9-interact'], all = JSON.stringify(Object.fromEntries(Object.entries(D).filter(([k]) => !k.startsWith('extras/'))));   // extras : écrit par l'appli
  console.log('Recopie complète (code ' + code + ')');
  ok(JSON.stringify(Object.fromEntries(Object.entries(S).filter(([k]) => !k.startsWith('s9/')))) === before, 'Journée RP : journées, fiches et réglages jamais modifiés');
  ok(Object.keys(S).filter(k => k.startsWith('s9/')).sort().join() === `s9/_noms/months/liste,s9/echo/months/${ym}`, 'retour : seulement dans s9/…');
  ok(Object.keys(S['s9/_noms/months/liste']?.chars || {}).sort().join() === 'aaron,joy,tala,yololo', 'noms des 4 personnages propres à S9 déposés dans Journée RP');
  ok(JSON.stringify(S[`s9/echo/months/${ym}`]) === JSON.stringify({ [day]: { added: ['Soirée au club'], with: { 'Soirée au club': ['Tala'] } } }), 'retour sans rien d\'intime');
  ok(!/Moonstone|Sexe avec|livreur|"intime"|setLate|"door"/.test(all), 'rien d\'intime, ni Moonstone, ni sets tardifs, ni livreur dans S9');
  ok(D[`days/prism/months/${ym}`]?.[day]?.details?.['Commande de malbouffe'] === 'Pizza', 'commande de malbouffe recopiée (partie publique)');
  ok(JSON.stringify(D[`days/echo/months/${ym}`]?.[day]?.withActs) === '{"Verre avec les copains":["joy","prism"]}', 'activité commune recopiée (réglage « masqué » d\'Iloh sans effet ici)');
  ok(Object.values(D).some(v => v?.to === 'eden' && v?.charId === 'joy' && /Echo a noté/.test(v.text)), 'nouvelle pour Eden (Joy)');
  ok(D['couples/echo-prism/months/2026-03']?.['4']?.nights?.echo?.hot === true && D[`couples/echo-prism/months/${ym}`]?.[day]?.protect?.echo === true, 'nuits chaudes et protection dans l\'espace du couple');
  ok(!JSON.stringify(D[`shared/day-${iso}`] || {}).match(/hot|protect/) && D[`shared/day-${iso}`]?.rp?.echo === 'prism', 'journée partagée : journée jouée en RP, rien d\'intime');
  ok(JSON.stringify(D['couples/echo-prism/state/main']?.lovers?.prism) === '["Un DJ"]', 'amants : PNJ seulement, dans l\'espace du couple');
  ok(D['shared/global']?.alerts?.echo === 'Tournée' && !all.includes('Malade'), 'alertes : Echo et Prism seulement');
  ok(!Object.keys(D).some(k => k.includes('eoor')), 'personnage hors S9 jamais recopié');
  ok(D['characters/echo']?.addedActs?.join() === 'Studio' && !('player' in D['characters/echo']), 'fiche recopiée sans activité intime ni joueur');
  ok(D['today/prism']?.activities?.join() === 'Commande de malbouffe', 'encart public filtré');
  ok(Object.keys(D).every(k => /^(days|couples|shared|characters|today|extras|news)\//.test(k)), 'écriture seulement dans les collections prévues');
  live(D);
};
require('./miroir.js');

async function live(D) {
  console.log('Écoute en direct');
  process.argv.pop();
  delete require.cache[require.resolve('./miroir.js')];
  const src = fakeDb('journee-rp');
  require('./miroir.js');
  await new Promise(r => setTimeout(r, 50));
  await src._doc(`days/echo/months/${ym}`).set({ [day]: { mood: 'Changé', done: true, checked: { $set: ['Studio', 'Salle'] }, hideS9: { $set: ['Salle'] } } });
  await new Promise(r => setTimeout(r, 50));
  ok(D[`days/echo/months/${ym}`]?.[day]?.mood === 'Changé' && JSON.stringify(D[`days/echo/months/${ym}`][day].checked) === '{"$set":["Studio"]}', 'modification recopiée aussitôt, activité masquée pour S9 retirée');
  ok(!Object.values(D).some(v => v?.key?.startsWith?.('with:') && v.charId === 'joy'), 'activité commune retirée : nouvelle retirée');
  console.log(fails ? `${fails} échec(s)` : 'Tout est bon.');
  process.exit(fails ? 1 : 0);
}
