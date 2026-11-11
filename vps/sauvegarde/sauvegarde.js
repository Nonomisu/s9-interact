// S9 Interact' — sauvegarde de toute la base Firestore (projet s9-interact) dans un fichier sur le VPS.
//
//   node sauvegarde.js      fait une sauvegarde maintenant (pm2 la relance chaque dimanche à 5 h, heure du serveur)
//
// Fichiers : ~/sauvegardes/s9/s9-AAAA-MM-JJ.json.gz (dossier en droits 700), les 12 plus récents sont gardés.
// Le script ne fait que LIRE la base : il n'y écrit jamais rien.
'use strict';
process.env.TZ = 'Europe/Paris';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const admin = require('firebase-admin');
const { Timestamp } = require('firebase-admin/firestore');

const need = k => { const v = process.env[k]; if (!v) { console.error(`Variable ${k} manquante.`); process.exit(1); } return v; };
const key = require(need('DST_KEY'));
if (key.project_id !== 's9-interact') { console.error(`Clé inattendue (${key.project_id}) : arrêt.`); process.exit(1); }
const db = admin.initializeApp({ credential: admin.credential.cert(key) }, 's9-sauvegarde').firestore();
const DIR = process.env.BACKUP_DIR || path.join(process.env.HOME, 'sauvegardes', 's9');
const KEEP = +(process.env.KEEP || 12);
const log = (...a) => console.log(new Date().toLocaleString('fr-FR'), ...a);

// Les dates Firestore sont notées { $ts: millisecondes } pour pouvoir être restaurées telles quelles.
const enc = v => v instanceof Timestamp ? { $ts: v.toMillis() }
  : Array.isArray(v) ? v.map(enc)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) : v;

// Parcourt une collection et toutes ses sous-collections ; out = { 'chemin/du/document': données }.
async function dumpColl(coll, out) {
  for (const ref of await coll.listDocuments()) {
    const s = await ref.get();
    if (s.exists) out[ref.path] = enc(s.data());
    for (const sub of await ref.listCollections()) await dumpColl(sub, out);
  }
}

(async () => {
  const docs = {};
  for (const c of await db.listCollections()) await dumpColl(c, docs);
  const n = Object.keys(docs).length;
  if (!n) throw new Error('base vide : rien n\'a été écrit (la sauvegarde précédente est gardée)');
  fs.mkdirSync(DIR, { recursive: true, mode: 0o700 });
  const d = new Date(), pad = x => String(x).padStart(2, '0');
  const file = path.join(DIR, `s9-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json.gz`);
  const body = zlib.gzipSync(JSON.stringify({ project: key.project_id, at: d.toISOString(), count: n, docs }));
  fs.writeFileSync(file + '.tmp', body, { mode: 0o600 });
  fs.renameSync(file + '.tmp', file);
  // On ne garde que les KEEP sauvegardes les plus récentes.
  const all = fs.readdirSync(DIR).filter(f => /^s9-\d{4}-\d\d-\d\d\.json\.gz$/.test(f)).sort();
  for (const f of all.slice(0, Math.max(0, all.length - KEEP))) fs.unlinkSync(path.join(DIR, f));
  log(`Sauvegarde faite : ${n} documents, ${Math.max(1, Math.round(body.length / 1024))} Ko → ${file} (${Math.min(all.length, KEEP)} gardées)`);
  process.exit(0);
})().catch(e => { log('ÉCHEC de la sauvegarde :', e.message); process.exit(1); });
