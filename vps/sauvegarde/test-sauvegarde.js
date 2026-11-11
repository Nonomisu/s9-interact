// Test de la sauvegarde avec un Firestore simulé (aucun accès réseau) : node test-sauvegarde.js
'use strict';
const Module = require('module'), fs = require('fs'), os = require('os'), path = require('path'), zlib = require('zlib'), { execFileSync } = require('child_process');
let fails = 0;
const ok = (c, l) => { console.log((c ? '  ok  ' : '  ÉCHEC ') + l); if (!c) fails++; };
class Timestamp { constructor(ms) { this.ms = ms; } toMillis() { return this.ms; } }
const st = {
  'access/nono@x.fr': { player: 'nono', role: 'admin' },
  'days/tamachag/months/2026-11': { '6': { mood: 'Calme', checked: { $set: ['Pêche'] } } },
  'couples/taiga-tamachag': { chars: ['taiga', 'tamachag'] },
  'couples/taiga-tamachag/months/2026-11': { '6': { nights: { tamachag: { hot: true } } } },
  'news/a': { to: 'eden', text: 'Coucou', createdAt: new Timestamp(1762430000000) },
};
const writes = [];
const doc = p => ({ path: p, get: async () => ({ exists: p in st, data: () => st[p] }), set: async () => writes.push(p), update: async () => writes.push(p), delete: async () => writes.push(p),
  listCollections: async () => [...new Set(Object.keys(st).filter(k => k.startsWith(p + '/') && k.split('/').length > p.split('/').length + 1).map(k => k.split('/').slice(0, p.split('/').length + 1).join('/')))].map(coll) });
const coll = c => ({ path: c, listDocuments: async () => [...new Set(Object.keys(st).filter(k => k.startsWith(c + '/')).map(k => k.split('/').slice(0, c.split('/').length + 1).join('/')))].map(doc) });
const db = { listCollections: async () => [...new Set(Object.keys(st).map(k => k.split('/')[0]))].map(coll), doc, collection: coll };
Module._load = (orig => function (req, ...rest) {
  if (req === 'firebase-admin') return { credential: { cert: k => k }, initializeApp: () => ({ firestore: () => db }) };
  if (req === 'firebase-admin/firestore') return { Timestamp };
  if (/cle\.json$/.test(req)) return { project_id: 's9-interact' };
  return orig.call(this, req, ...rest);
})(Module._load);
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 's9-sauv-'));
process.env.DST_KEY = '/x/s9-interact-cle.json'; process.env.BACKUP_DIR = DIR; process.env.KEEP = '3';
for (const d of ['2026-01-04', '2026-01-11', '2026-01-18', '2026-01-25']) fs.writeFileSync(path.join(DIR, `s9-${d}.json.gz`), 'x');
fs.writeFileSync(path.join(DIR, 'autre-fichier.txt'), 'à garder');
process.exit = code => {
  const files = fs.readdirSync(DIR).sort(), today = files.filter(f => f.startsWith('s9-')).at(-1);
  console.log('Sauvegarde (code ' + code + ')');
  ok(code === 0, 'sauvegarde réussie');
  const b = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(DIR, today))));
  ok(b.count === 5 && Object.keys(b.docs).length === 5, 'tous les documents sauvegardés, sous-collections comprises');
  ok(b.docs['couples/taiga-tamachag/months/2026-11']['6'].nights.tamachag.hot === true, 'espace des couples inclus');
  ok(b.docs['news/a'].createdAt.$ts === 1762430000000, 'dates gardées');
  ok(writes.length === 0, 'aucune écriture dans la base');
  ok(files.filter(f => f.startsWith('s9-')).length === 3 && !files.includes('s9-2026-01-04.json.gz') && !files.includes('s9-2026-01-11.json.gz'), 'seules les 3 plus récentes sont gardées');
  ok(files.includes('autre-fichier.txt'), 'les autres fichiers du dossier ne sont pas touchés');
  ok((fs.statSync(path.join(DIR, today)).mode & 0o077) === 0, 'fichier lisible par toi seul');
  const v = execFileSync(process.execPath, [path.join(__dirname, 'verifier.js'), path.join(DIR, today)], { encoding: 'utf8' });
  ok(/5 documents/.test(v) && /couples\/…\/months\s+1/.test(v), 'vérification lisible');
  fs.rmSync(DIR, { recursive: true });
  console.log(fails ? `${fails} échec(s)` : 'Tout est bon.');
  process.reallyExit(fails ? 1 : 0);
};
require('./sauvegarde.js');
