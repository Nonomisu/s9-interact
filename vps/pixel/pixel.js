// S9 Interact' — service des accroches de PNJ de Pixel Meet, à lancer sur le VPS avec pm2.
//
//   node pixel.js                 tourne en continu : toutes les 20 minutes, chaque profil a une petite chance de recevoir
//                                 une accroche, selon sa fréquence (calme ~1 par semaine, normal 2 à 3, très demandé·e ~1 par jour)
//   node pixel.js --apercu        affiche 9 accroches tirées au hasard pour chaque profil, sans rien écrire
//   node pixel.js --une joy       envoie tout de suite une accroche au profil de Joy (pour essayer)
//
// Lit pm_profiles ; écrit seulement une conversation (pm_threads/{id} + msgs) et une nouvelle discrète
// (« Pixel Meet · nouveau message », envoyée en notification par s9-notifs) pour le joueur du profil.
// Jamais rien vers Discord, la chronique ou Journée RP. Les PNJ ne répondent pas aux réponses des joueurs.
'use strict';
process.env.TZ = 'Europe/Paris';
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');
const A = require('./accroches.json');

const need = k => { const v = process.env[k]; if (!v) { console.error(`Variable ${k} manquante.`); process.exit(1); } return v; };
const key = require(need('DST_KEY'));
if (key.project_id !== 's9-interact') { console.error(`Clé inattendue (${key.project_id}) : arrêt.`); process.exit(1); }
const db = admin.initializeApp({ credential: admin.credential.cert(key) }, 's9-pixel').firestore();
const log = (...a) => console.log(new Date().toLocaleString('fr-FR'), ...a);

const EVERY = 20 * 60e3;
const ACTIVE_H = 16;                                       // accroches entre 10 h et 2 h : 16 heures par jour
const TICKS_WEEK = 7 * ACTIVE_H * (3600e3 / EVERY);
const RATE = { calme: 1, normal: 2.5, star: 7 };           // accroches par semaine, en moyenne
const GAP = 3 * 3600e3;                                    // jamais deux accroches à moins de 3 h pour un même profil
const quiet = (d = new Date()) => d.getHours() >= 2 && d.getHours() < 10;

const pick = (a, r = Math.random) => a[Math.floor(r() * a.length)];
const pickTone = (mix, r = Math.random) => {
  const m = { classique: 50, taquin: 30, direct: 20, ...(mix || {}) }, tot = m.classique + m.taquin + m.direct;
  if (tot <= 0) return 'classique';
  let x = r() * tot; for (const k of ['classique', 'taquin', 'direct']) { if ((x -= m[k]) < 0) return k; } return 'classique';
};
// Qui écrit : d'après « Cherche » (hommes, femmes, les deux) ; sans précision, n'importe qui.
const gendersFor = p => { const c = String(p.cherche || '').toLowerCase(), h = /homme|mec|gar[cç]on/.test(c), f = /femme|fille/.test(c);
  return h && !f ? ['m'] : f && !h ? ['f'] : ['m', 'f']; };
const femProfile = p => /f[ée]minin|femme/i.test(p.genre || '') || p.gender === 'f';
const passionsOf = p => String(p.passions || '').split(/[,;]| et /).map(x => x.trim()).filter(x => x.length > 2 && x.length < 40);

// Une accroche pour un profil : PNJ inventé (pseudo, âge, métier) et message tiré de la bibliothèque.
function makeHook(p, r = Math.random) {
  const tone = pickTone(p.mix, r), g = pick(gendersFor(p), r), P = A.pnj[g];
  const passions = passionsOf(p), lieux = [p.traine, p.vit, ...A.pnj.lieux].filter(x => x && x.length < 40);
  const text = pick(A[tone], r)
    .replaceAll('{passion}', passions.length ? pick(passions, r) : 'la musique').replaceAll('{lieu}', pick(lieux, r))
    .replaceAll('{metier}', String(p.metier || 'ton métier').split(/[,;]/)[0].trim().toLowerCase()).replaceAll('{pseudo}', p.pseudo || '')
    .replaceAll('{e}', g === 'f' ? 'e' : '').replaceAll('{f}', femProfile(p) ? 'e' : '')
    .replace(/(^|\s)à Les /g, '$1aux ').replace(/(^|\s)à Le /g, '$1au ').replace(/(^|\s)de Les /g, '$1des ').replace(/(^|\s)de Le /g, '$1du ')
    .replace(/\s+([!?,.])/g, (m, c) => '!?'.includes(c) ? ' ' + c : c).replace(/\s{2,}/g, ' ').trim();
  const age = 21 + Math.floor(r() * 18);
  return { tone, npc: { name: pick(P.noms, r), age, job: pick(P.metiers, r), g, tone }, text: text[0].toUpperCase() + text.slice(1) };
}

async function sendHook(id, p, h = makeHook(p)) {
  const at = Date.now(), tid = `pnj-${id}-${at.toString(36)}`, player = p.player;
  if (!player) return null;
  const b = db.batch();
  b.set(db.doc(`pm_threads/${tid}`), { a: id, b: null, npc: h.npc, players: [player], last: h.text.slice(0, 120), at, lastBy: 'pnj', seen: {} });
  b.set(db.doc(`pm_threads/${tid}/msgs/${at}-pnj`), { from: 'npc', text: h.text, at });
  const nk = `pm:${tid}:${at}`;
  b.set(db.doc(`news/${nk}`), { from: 's9-pixel', to: player, text: 'Pixel Meet · nouveau message', charId: null, key: nk, read: false, at, createdAt: FieldValue.serverTimestamp() });
  b.set(db.doc(`pm_state/${id}`), { lastAt: at }, { merge: true });
  await b.commit();
  log(`accroche ${h.tone} pour ${p.pseudo || id} (${player}) de ${h.npc.name}`);
  return tid;
}

async function tick(now = new Date(), r = Math.random) {
  if (quiet(now)) return 0;
  const [ps, st] = await Promise.all([db.collection('pm_profiles').get(), db.collection('pm_state').get()]);
  const last = Object.fromEntries(st.docs.map(x => [x.id, x.data()?.lastAt || 0]));
  let n = 0;
  for (const d of ps.docs) {
    const p = d.data(), rate = RATE[p.freq || 'normal'] || 0;
    if (!rate || now.getTime() - (last[d.id] || 0) < GAP) continue;
    if (r() < rate / TICKS_WEEK) { await sendHook(d.id, p); n++; }
  }
  return n;
}

const main = async () => {
  const args = process.argv.slice(2);
  if (args.includes('--apercu')) {
    for (const d of (await db.collection('pm_profiles').get()).docs) {
      console.log(`\n${d.data().pseudo || d.id} (fréquence : ${d.data().freq || 'normal'})`);
      for (let i = 0; i < 9; i++) { const h = makeHook(d.data()); console.log(`  [${h.tone}] ${h.npc.name}, ${h.npc.age} ans, ${h.npc.job} : ${h.text}`); }
    }
    process.exit(0);
  }
  const one = args[args.indexOf('--une') + 1];
  if (args.includes('--une')) {
    const s = await db.doc(`pm_profiles/${one}`).get();
    if (!s.exists) { console.error(`Pas de profil Pixel Meet pour « ${one} ».`); process.exit(1); }
    await sendHook(one, s.data()); process.exit(0);
  }
  log('Service des accroches Pixel Meet démarré.');
  const run = () => tick().catch(e => log('erreur', e.message));
  run(); setInterval(run, EVERY);
};
if (require.main === module) main().catch(e => { log('ÉCHEC :', e.message); process.exit(1); });
module.exports = { makeHook, tick, sendHook, pickTone, gendersFor, passionsOf, quiet, TICKS_WEEK };
