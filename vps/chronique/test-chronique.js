// Test de la chronique avec un Firestore et un Discord simulés (aucun accès réseau) : node test-chronique.js
'use strict';
const Module = require('module');
let fails = 0;
const ok = (c, l) => { console.log((c ? '  ok  ' : '  ÉCHEC ') + l); if (!c) fails++; };
process.env.TZ = 'Europe/Paris';
const st = {}, writes = [];
const doc = p => ({ path: p, get: async () => ({ exists: p in st, data: () => st[p] }), set: async (d, o) => { writes.push(p); st[p] = o?.merge ? { ...(st[p] || {}), ...d } : d; } });
const coll = (c, f = () => true) => ({ get: async () => ({ docs: Object.keys(st).filter(k => k.startsWith(c + '/') && k.split('/').length === 2 && f(st[k])).map(k => ({ data: () => st[k] })) }),
  where: (k, op, v) => coll(c, d => op === '>=' ? d[k] >= v : d[k] === v) });
const db = { doc, collection: c => coll(c) };
Module._load = (orig => function (req, ...rest) {
  if (req === 'firebase-admin') return { credential: { cert: k => k }, initializeApp: () => ({ firestore: () => db }) };
  if (/cle\.json$/.test(req)) return { project_id: 's9-interact' };
  return orig.call(this, req, ...rest);
})(Module._load);
process.env.DST_KEY = '/x/s9-interact-cle.json';
const posts = [];
global.fetch = async (url, o) => { posts.push({ url, body: JSON.parse(o.body) }); return { ok: true, json: async () => ({ id: 'm1' }) }; };
const Ch = require('./chronique.js');

// Semaine du lundi 2 au dimanche 8 novembre 2026, envoyée le dimanche à 20 h
const week = Ch.weekOf(new Date(2026, 10, 8, 20, 10));
ok(week.days[0].getDate() === 2 && week.days[6].getDate() === 8 && week.id === '2026-S45', 'semaine du lundi 2 au dimanche 8 novembre');
const T = (d, h = 12) => new Date(2026, 10, d, h).getTime();
Object.assign(st, {
  'days/joy/months/2026-11': { '3': { done: true, mood: 'Survoltée', checked: { $set: ['Danse'] }, withActs: { 'Danse': ['tala'] } }, '7': { done: true, checked: { $set: ['Soirée en club'] }, withActs: { 'Soirée en club': ['tala', 'aaron'] } } },
  'extras/echo/months/2026-11': { '3': { added: ['Danse'], withActs: { 'Danse': ['joy'] } } },
  'days/tala/months/2026-11': { '3': { done: true, checked: { $set: ['Danse'] }, withActs: { 'Danse': ['joy'] } } },
  'days/aaron/months/2026-11': { '1': { done: true, checked: { $set: ['Salle de sport'] } } },   // dimanche précédent : hors semaine
  'couples/echo-prism/months/2026-11': { '3': { nights: { echo: { hot: true, with: 'prism' } } } },
  'pm_threads/t1': { a: 'joy', last: 'Une seule nuit, aucune promesse', at: T(4) },
  'shared/events': { a: { type: 'soiree', text: "Set d'Echo", date: '2026-11-07', going: { echo: 'nono', joy: 'eden' } }, b: { type: 'info', text: 'Ancien', date: '2026-10-01' } },
  'flash/f1': { cat: 'Rumeur', title: 'Angel Sparkle prépare un single', src: 'Pixel Potins', by: 'eden', at: T(5) },
  'flash/f0': { cat: 'Ville', title: 'Vieille nouvelle', src: 'S9 Infos', by: 'nono', at: T(1) - 3 * 864e5 },
  'we_posts/p1': { acc: 'prism.atelier', char: 'prism', text: 'Veste', at: T(6), likes: { angelsparkle: true, 'echo.live': true } },
  'we_posts/p2': { acc: 'angelsparkle', char: 'joy', text: 'Selfie', at: T(6), likes: {} },
  'shared/discord': { webhook: 'https://discord.test/hook' },
});
(async () => {
  const c = Ch.compose(week, await Ch.gather(week));
  console.log('\n' + c.title + '\n' + c.text + '\n');
  ok(c.title === 'Chronique de Solution 9, semaine du lundi 2 au dimanche 8 novembre', 'titre');
  ok(/3 journées racontées/.test(c.text) && /Joy \(2\)/.test(c.text), 'journées racontées de la semaine seulement');
  ok(/Joy et Tala \(2 jours\)/.test(c.text), 'duo Joy et Tala');
  ok(/Echo et Joy \(1 jour\)/.test(c.text), 'compléments S9 d\'Echo compris');
  ok(/Soirée en club, samedi 7 : Joy, Tala et Aaron/.test(c.text), 'activité à trois');
  ok(/« Set d'Echo » \(samedi 7, 2 participants\)/.test(c.text) && !c.text.includes('Ancien'), 'événement de la semaine');
  ok(/1 flash\. « Angel Sparkle prépare un single » \(Pixel Potins\)/.test(c.text) && !c.text.includes('Vieille'), 'Flash Actu de la semaine');
  ok(/2 publications\. La plus aimée : @prism\.atelier \(2 j'aime\)/.test(c.text), 'Wondereye');
  ok(!/nuit|chaude|Pixel Meet|promesse/i.test(c.text), 'rien des nuits, des couples ni de Pixel Meet');
  await Ch.send(week, c);
  ok(posts.length === 1 && posts[0].url.startsWith('https://discord.test/hook') && posts[0].body.embeds[0].title === c.title, 'envoyée sur le salon Discord commun');
  ok(st['shared/chronique']?.week === '2026-S45' && writes.every(p => p === 'shared/chronique'), 'semaine notée ; aucune autre écriture');
  const long = 'A cuisiner.. Beaucoup... Beaucoup trop. Et a porter de quoi manger ceux qui forme les protection magique.';
  st['days/tala/months/2026-11']['4'] = { done: true, checked: { $set: [long] }, withActs: { [long]: ['joy', 'aaron'] } };
  const c2 = Ch.compose(week, await Ch.gather(week));
  ok(/• A cuisiner\.\. Beaucoup\.\.\. Beaucoup trop\. Et a porter de quoi…, mercredi 4/.test(c2.text), 'activité longue coupée proprement');
  console.log(fails ? `${fails} échec(s)` : 'Tout est bon.');
  process.exit(fails ? 1 : 0);
})();
