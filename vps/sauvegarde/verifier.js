// Affiche le contenu d'une sauvegarde sans rien toucher : node verifier.js [fichier]
// Sans fichier : la plus récente de ~/sauvegardes/s9.
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const DIR = process.env.BACKUP_DIR || path.join(process.env.HOME, 'sauvegardes', 's9');
const file = process.argv[2] || (() => { const l = (fs.existsSync(DIR) ? fs.readdirSync(DIR) : []).filter(f => f.endsWith('.json.gz')).sort(); return l.length ? path.join(DIR, l.at(-1)) : null; })();
if (!file) { console.log('Aucune sauvegarde pour l\'instant dans ' + DIR + ' (la première prend quelques secondes).'); process.exit(1); }
const b = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)));
const by = {};
for (const p of Object.keys(b.docs)) { const c = p.split('/').filter((_, i) => i % 2 === 0).join('/…/'); by[c] = (by[c] || 0) + 1; }
console.log(`${path.basename(file)} : projet ${b.project}, faite le ${new Date(b.at).toLocaleString('fr-FR')}, ${b.count} documents`);
for (const [c, n] of Object.entries(by).sort()) console.log(`  ${c.padEnd(28)} ${n}`);
