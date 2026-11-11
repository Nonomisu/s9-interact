// Test du service des notifications avec un Firestore et un web-push simulés (aucun accès réseau) : node test-notifs.js
'use strict';
const Module = require('module');
let fails = 0;
const ok = (c, l) => { console.log((c ? '  ok  ' : '  ÉCHEC ') + l); if (!c) fails++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- Firestore simulé ----------
const TS = Symbol('ts');
const st = {}, ls = [];
const ts = ms => ({ toMillis: () => ms });
const snapOf = p => ({ id: p.split('/').pop(), exists: p in st, data: () => st[p] && { ...st[p] }, ref: doc(p) });
const inColl = (p, c) => p.startsWith(c + '/') && p.split('/').length === c.split('/').length + 1;
const inGroup = (p, g) => p.split('/').at(-2) === g;
function emit(p, type) { for (const l of ls) if (l.match(p)) l.cb({ docChanges: () => [{ type, doc: snapOf(p) }] }); }
function write(p, data) { const had = p in st; for (const k in data) if (data[k] === TS) data[k] = ts(Date.now()); st[p] = data; emit(p, had ? 'modified' : 'added'); }
function doc(p) {
  return { path: p, id: p.split('/').pop(), get parent() { const s = p.split('/'); return { id: s.at(-2), parent: s.length > 2 ? { id: s.at(-3) } : null }; },
    get: async () => snapOf(p), set: async d => write(p, { ...d }), update: async d => write(p, { ...st[p], ...d }),
    delete: async () => { if (p in st) { emit(p, 'removed'); delete st[p]; } } };
}
const listen = (match) => (cb) => {
  const l = { match, cb }; ls.push(l);
  setTimeout(() => cb({ docChanges: () => Object.keys(st).filter(match).map(p => ({ type: 'added', doc: snapOf(p) })) }), 0);
  return () => ls.splice(ls.indexOf(l), 1);
};
const db = {
  doc, collection: c => ({ get: async () => ({ docs: Object.keys(st).filter(p => inColl(p, c)).map(snapOf) }), onSnapshot: listen(p => inColl(p, c)) }),
  collectionGroup: g => ({ onSnapshot: listen(p => inGroup(p, g)) }),
  runTransaction: async fn => fn({ get: async r => snapOf(r.path), update: (r, d) => r.update(d) }),
};
const sent = [];
Module._load = (orig => function (req, ...rest) {
  if (req === 'firebase-admin') return { credential: { cert: k => k }, initializeApp: () => ({ firestore: () => db }) };
  if (req === 'firebase-admin/firestore') return { FieldValue: { serverTimestamp: () => TS } };
  if (req === 'web-push') return { setVapidDetails() {}, sendNotification: async (sub, body) => {
    if (sub.endpoint.includes('mort')) { const e = new Error('gone'); e.statusCode = 410; throw e; }
    sent.push({ endpoint: sub.endpoint, ...JSON.parse(body) }); } };
  if (/cle\.json$/.test(req)) return { project_id: 's9-interact' };
  if (/vapid\.json$/.test(req)) return { publicKey: 'p', privateKey: 'k' };
  return orig.call(this, req, ...rest);
})(Module._load);
process.env.DST_KEY = '/x/s9-interact-cle.json'; process.env.VAPID_KEY = '/x/s9-vapid.json'; process.env.WAIT_MS = '80'; process.env.REMIND_EVERY_MS = '999999999';

// ---------- Données de départ ----------
st['pushSubs/eden/subs/a'] = { endpoint: 'https://push/eden-tel', keys: {}, welcomedAt: ts(1) };
st['pushSubs/eden/subs/b'] = { endpoint: 'https://push/eden-mort', keys: {}, welcomedAt: ts(1) };
st['news/vieille'] = { from: 'nono', to: 'eden', text: 'Vieille', charId: 'tala', read: false, createdAt: ts(Date.now() - 3 * 24 * 3600e3) };

(async () => {
  require('./notifs.js');
  await sleep(200);
  ok(sent.length === 0, 'au démarrage : rien d\'envoyé (vieille nouvelle, appareils déjà accueillis)');

  write('news/n1', { from: 'nono', to: 'eden', text: 'Joy a passé la journée avec Tala.', charId: 'tala', read: false, createdAt: TS });
  await sleep(30);
  ok(sent.length === 0, 'pas d\'envoi immédiat (l\'auteur peut encore corriger)');
  write('news/n1', { ...st['news/n1'], text: 'Joy a dansé avec Tala.' });
  await sleep(200);
  ok(sent.length === 1 && sent[0].body === 'Joy a dansé avec Tala.', 'nouvelle envoyée une fois, dans sa dernière version');
  ok(sent[0].url.endsWith('?fiche=tala'), 'la notification ouvre la fiche du personnage');
  write('news/pm:t1:1', { from: 'jynette', to: 'eden', text: 'Pixel Meet · nouveau message', charId: null, key: 'pm:t1:1', read: false, createdAt: TS });
  await sleep(200);
  ok(sent.length === 2 && sent[1].title === 'Pixel Meet' && sent[1].body === 'Nouveau message' && !JSON.stringify(sent[1]).includes('jynette'), 'Pixel Meet : notification discrète, sans texte ni expéditeur');
  ok(!!st['news/n1'].pushedAt, 'nouvelle marquée envoyée');
  ok(!('pushSubs/eden/subs/b' in st), 'abonnement expiré supprimé');

  write('news/n2', { from: 'nono', to: 'eden', text: 'Annulée', charId: 'tala', read: false, createdAt: TS });
  await sleep(20); await doc('news/n2').delete(); await sleep(200);
  ok(!sent.some(s => s.body === 'Annulée'), 'nouvelle annulée avant le délai : rien d\'envoyé');

  write('news/n3', { from: 'nono', to: 'eden', text: 'Déjà lue', charId: 'tala', read: true, createdAt: TS });
  await sleep(200);
  ok(!sent.some(s => s.body === 'Déjà lue'), 'nouvelle déjà lue : rien d\'envoyé');

  st['shared/events'] = { ev1: { type: 'fete', text: 'Naadam', date: '2026-11-09' } };
  write('news/n4', { from: 'nono', to: 'eden', text: 'Fête ou rassemblement : Naadam', charId: null, key: 'event:ev1:eden', read: false, createdAt: TS });
  await sleep(200);
  ok(sent.at(-1).body.includes('Naadam') && sent.at(-1).url.endsWith('?evenements=2026-11-09'), 'événement : la notification ouvre le calendrier sur son jour');

  const before = sent.length;
  write('pushSubs/lou/subs/c', { endpoint: 'https://push/lou-pc', keys: {} });
  await sleep(100);
  ok(sent.length === before + 1 && sent.at(-1).endpoint === 'https://push/lou-pc' && sent.at(-1).tag === 'bienvenue', 'bienvenue envoyée au nouvel appareil seulement');
  ok(!!st['pushSubs/lou/subs/c'].welcomedAt, 'appareil marqué accueilli');
  await sleep(100);
  ok(sent.filter(s => s.tag === 'bienvenue').length === 1, 'bienvenue envoyée une seule fois');

  // Rappel la veille d'un événement, pour les joueurs inscrits
  const { remindEvents } = require('./notifs.js');
  const now = new Date(2026, 10, 6, 19, 0), before2 = sent.length;
  st['shared/events'] = { ev2: { type: 'fete', text: 'Naadam', date: '2026-11-07', going: { echo: 'nono', joy: 'eden', tala: 'idriss' } }, ev3: { type: 'info', text: 'Plus tard', date: '2026-11-20', going: { joy: 'eden' } } };
  ok(await remindEvents(new Date(2026, 10, 6, 10, 0)) === 0, 'pas de rappel avant 18 h');
  ok(await remindEvents(now) === 3 && st['news/event:ev2:rappel:eden']?.to === 'eden' && st['news/event:ev2:rappel:nono']?.text.startsWith('Demain : « Naadam »'), 'rappel la veille : une nouvelle par joueur inscrit');
  ok(await remindEvents(now) === 0, 'rappel envoyé une seule fois');
  await sleep(250);
  ok(sent.slice(before2).some(x => x.body.startsWith('Demain : « Naadam »') && x.url.endsWith('?evenements=2026-11-07')), 'notification du rappel : ouvre le calendrier sur le jour');
  console.log(fails ? `${fails} échec(s)` : 'Tout est bon.');
  process.exit(fails ? 1 : 0);
})();
