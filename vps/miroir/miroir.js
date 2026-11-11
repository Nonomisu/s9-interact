// S9 Interact' — service de recopie Journée RP → S9 Interact' (sens unique), à lancer sur le VPS avec pm2.
//
//   node miroir.js          écoute Journée RP en direct et recopie chaque changement (mode normal, sous pm2)
//   node miroir.js --tout   recopie une fois tout l'historique, puis s'arrête (à lancer une seule fois au départ)
//
// Clés de service (jamais dans le dépôt) : variables d'environnement SRC_KEY (projet journal-rp)
// et DST_KEY (projet s9-interact), chemins de fichiers JSON dans ~/secrets (droits 600).
// Dans Journée RP, le service n'écrit QUE dans la collection « s9 » (s9/{personnage}/months/{AAAA-MM}) :
// les activités communes acceptées dans S9 Interact' pour Echo et Prism (retour demandé, voir copyBack),
// et la liste des noms des personnages propres à S9 Interact' (s9/_noms/months/liste, voir copyNames).
// Il ne touche jamais aux journées, fiches ou réglages de Journée RP.
'use strict';
process.env.TZ = 'Europe/Paris';
const admin = require('firebase-admin');
const { FieldPath, FieldValue } = require('firebase-admin/firestore');
const T = require('./transform');

const need = k => { const v = process.env[k]; if (!v) { console.error(`Variable ${k} manquante (chemin de la clé de service).`); process.exit(1); } return v; };
const srcKey = require(need('SRC_KEY')), dstKey = require(need('DST_KEY'));
// Garde-fou : on ne lit que journal-rp, on n'écrit que dans s9-interact.
if (srcKey.project_id !== 'journal-rp' || dstKey.project_id !== 's9-interact') {
  console.error(`Clés inattendues (source : ${srcKey.project_id}, destination : ${dstKey.project_id}) : arrêt.`); process.exit(1);
}
const src = admin.initializeApp({ credential: admin.credential.cert(srcKey) }, 'journee-rp').firestore();
const dst = admin.initializeApp({ credential: admin.credential.cert(dstKey) }, 's9-interact').firestore();

const log = (...a) => console.log(new Date().toLocaleString('fr-FR'), ...a);
const J = v => JSON.stringify(v ?? null);
const pad = n => String(n).padStart(2, '0');
// La journée RP commence à 5 h : avant, c'est encore la veille.
const rpDate = () => new Date(Date.now() - 5 * 3600e3);
const isoOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const ymOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const prevMonth = d => new Date(d.getFullYear(), d.getMonth() - 1, 1);

// Dernière valeur écrite, pour ne réécrire que ce qui change.
const written = new Map();
const changed = (key, v) => { const j = J(v); if (written.get(key) === j) return false; written.set(key, j); return true; };

// Écrit seulement les champs indiqués (les autres champs du document, écrits par d'autres, ne bougent pas).
// fields : [[ ['chemin', 'du', 'champ'], valeur ], …]
async function setFields(ref, fields) {
  const todo = fields.filter(([p, v]) => changed(ref.path + ':' + p.join('.'), v));
  if (!todo.length) return 0;
  const data = {};
  for (const [p, v] of todo) { let o = data; p.slice(0, -1).forEach(s => { o = (o[s] ||= {}); }); o[p[p.length - 1]] = v === null || v === undefined ? FieldValue.delete() : v; }
  await ref.set(data, { mergeFields: todo.map(([p]) => new FieldPath(...p)) });
  return todo.length;
}

// Activités toujours masquées dans S9 Interact' (réglées dans Journée RP, shared/global → hideS9), et dernières données lues
// (pour refaire la recopie quand ce réglage change).
let always = {}, priv = null;
const lastChar = {};
const lastMonth = {}, lastToday = {};
const todayEntry = id => { const t = rpDate(); return lastMonth[`${id}:${ymOf(t)}`]?.[String(t.getDate())] || null; };

// ---------- Journées (days/{id}/months/{AAAA-MM}) ----------
async function copyMonth(id, ym, data) {
  let n = 0;
  lastMonth[`${id}:${ym}`] = data || {};
  const days = Object.keys(data || {});
  n += await setFields(dst.doc(`days/${id}/months/${ym}`), days.map(d => [[d], T.publicEntry(data[d], always[id])]));
  const k = T.coupleOf(id);
  // Nuits chaudes passées : dans l'espace du couple (personnages hors couple : pas de nuit chaude dans S9 Interact').
  // La journée en cours vient de shared/day (copyDay) : la fiche du partenaire n'est pas forcément déjà enregistrée.
  const today = rpDate(), todayKey = ym === ymOf(today) ? String(today.getDate()) : null;
  if (k) n += await setFields(dst.doc(`couples/${k.id}/months/${ym}`), days.filter(d => d !== todayKey).map(d => [[d, 'nights', id], T.hotNight(data[d]?.night)]));
  if (n) log(`journées ${id} ${ym} : ${n} champ(s) recopié(s)`);
  await sendWithNews(id, ym, data);
  if (id in lastToday) await copyToday(id, lastToday[id]);   // activités masquées aujourd'hui : l'encart suit
}

// ---------- Activités communes avec un personnage propre à S9 Interact' : nouvelle dans S9 Interact' ----------
// Seulement la journée RP en cours et la veille (rien pour l'historique). Une activité retirée : la nouvelle part aussi.
const sentNews = {};   // 'id:AAAA-MM:J' → clés envoyées
async function sendWithNews(id, ym, data) {
  const today = rpDate(), yest = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  for (const d of [today, yest].filter(x => ymOf(x) === ym)) {
    const k = String(d.getDate()), slot = `${id}:${ym}:${k}`, prev = sentNews[slot] || new Set();
    const want = T.withNews(id, d, T.publicEntry(data?.[k], always[id]));
    for (const [key, n] of Object.entries(want)) {
      if (prev.has(key)) continue;
      try { await dst.doc(`news/${key.replace(/\//g, '_')}`).create({ ...n, at: Date.now(), createdAt: FieldValue.serverTimestamp() }); log(`nouvelle pour ${n.to} : ${n.text}`); }
      catch (e) { if (e.code !== 6 && !/exist/i.test(e.message || '')) throw e; }   // déjà envoyée
    }
    for (const key of prev) if (!(key in want)) {
      const ref = dst.doc(`news/${key.replace(/\//g, '_')}`), s = await ref.get();
      if (s.exists && s.data()?.from === 'miroir') { await ref.delete(); log(`nouvelle retirée : ${key}`); }
    }
    sentNews[slot] = new Set(Object.keys(want));
  }
}

// ---------- Noms des personnages propres à S9 Interact', déposés dans Journée RP (s9/_noms/months/liste) ----------
async function copyNames() {
  const v = T.s9Names();
  if (!changed('noms', v)) return;
  await src.doc('s9/_noms/months/liste').set(v);
  log(`noms des personnages de S9 Interact' déposés dans Journée RP (${Object.keys(v.chars).length})`);
}

// ---------- Journée en cours : shared/day-AAAA-MM-JJ ----------
async function copyDay(iso, d) {
  const date = new Date(iso + 'T12:00:00'), ym = ymOf(date), day = String(date.getDate());
  let n = 0;
  for (const k of T.COUPLES) {
    n += await setFields(dst.doc(`couples/${k.id}/months/${ym}`), k.chars.flatMap(x => [
      [[day, 'nights', x], T.hotNight(d?.nights?.[x])],
      [[day, 'protect', x], !!d?.protect?.[x]],
      [[day, 'shell', x], !!d?.shell?.[x]],
    ]));
  }
  // Journée jouée en RP et nuit calme : données lues par tout le groupe (rien d'intime).
  n += await setFields(dst.doc(`shared/day-${iso}`), T.MIRROR.flatMap(x => [
    [['rp', x], d?.rp?.[x] ? T.who(d.rp[x]) : null],
    [['calm', x], d?.calm?.[x] ? { with: d.calm[x].with ? T.who(d.calm[x].with) : null } : null],
  ]));
  if (n) log(`journée du ${iso} : ${n} champ(s) recopié(s)`);
}

// ---------- Réglages durables : shared/global ----------
async function copyGlobal(g) {
  let n = 0;
  const nextAlways = g?.hideS9 || {}, nextPriv = g?.privActs || null;
  if (J(nextAlways) !== J(always) || J(nextPriv) !== J(priv)) {
    always = nextAlways; priv = nextPriv; T.setPrivate(priv);
    for (const [id, d] of Object.entries(lastChar)) await copyChar(id, d);
    // Réglage « toujours masquée » changé : on refait les journées déjà lues, puis tout l'historique.
    for (const key of Object.keys(lastMonth)) { const [id, ym] = key.split(':'); await copyMonth(id, ym, lastMonth[key]); }
    if (startedLive) copyHistory().catch(e => console.error('historique', e.message || e));
  }
  for (const k of T.COUPLES) {
    n += await setFields(dst.doc(`couples/${k.id}/state/main`), [
      ...k.chars.map(x => [['lovers', x], T.lovers(g?.lovers?.[x], x)]),
      [['protect'], T.protectFor(g?.protect, k.chars)],
    ]);
  }
  n += await setFields(dst.doc('shared/global'), T.MIRROR.flatMap(x => [
    [['alerts', x], g?.alerts?.[x] || null],
    [['contracts', x], g?.contracts?.[x] || null],
    [['milestones', x], (g?.milestones?.[x] || []).map(m => ({ ...m, with: m.with ? T.who(m.with) : m.with }))],
  ]));
  if (n) log(`réglages : ${n} champ(s) recopié(s)`);
}

// ---------- Fiches et encarts publics ----------
async function copyChar(id, d) {
  lastChar[id] = d;
  const c = T.charDoc(d); if (!c) return;
  const n = await setFields(dst.doc(`characters/${id}`), Object.entries(c).map(([k, v]) => [[k], v]));
  if (n) log(`fiche ${id} : ${n} champ(s) recopié(s)`);
}
async function copyToday(id, t) {
  lastToday[id] = t;
  const v = T.todayDoc(t, todayEntry(id), always[id]);
  if (!changed('today/' + id, v)) return;
  if (v) await dst.doc(`today/${id}`).set(v); else await dst.doc(`today/${id}`).delete();
  log(`encart « Aujourd'hui » ${id} recopié`);
}

// ---------- Retour : activités communes acceptées dans S9 Interact' → Journée RP (s9/{id}/months/{AAAA-MM}) ----------
async function copyBack(id, ym, data) {
  if (!T.MIRROR.includes(id)) return;
  const back = T.s9BackMonth(data), ref = src.doc(`s9/${id}/months/${ym}`);
  if (!changed('back:' + ref.path, back)) return;
  const n = Object.keys(back).length;
  if (n) await ref.set(back); else if ((await ref.get()).exists) await ref.delete(); else return;
  log(`retour vers Journée RP : ${id} ${ym} (${n} jour(s) avec des activités communes)`);
}

// ---------- Écoute en direct ----------
let subs = [], watchingIso = null;
const guard = label => fn => async snap => { try { await fn(snap); } catch (e) { console.error(new Date().toLocaleString('fr-FR'), label, e.message || e); } };
async function watch() {
  subs.forEach(u => u()); subs = []; written.clear();
  // D'abord les réglages (activités masquées ou intimes) : rien d'intime ne doit passer, même un instant, au démarrage.
  const g0 = (await src.doc('shared/global').get()).data();
  always = g0?.hideS9 || {}; priv = g0?.privActs || null; T.setPrivate(priv);
  const today = rpDate(), iso = isoOf(today);
  watchingIso = iso;
  const months = [ymOf(prevMonth(today)), ymOf(today)];   // le mois précédent aussi : la « nuit précédente » se corrige le lendemain
  for (const id of T.MIRROR) {
    for (const ym of months) subs.push(src.doc(`days/${id}/months/${ym}`).onSnapshot(guard(`days ${id} ${ym}`)(s => copyMonth(id, ym, s.data()))));
    subs.push(src.doc(`characters/${id}`).onSnapshot(guard(`fiche ${id}`)(s => copyChar(id, s.data()))));
    subs.push(src.doc(`today/${id}`).onSnapshot(guard(`today ${id}`)(s => copyToday(id, s.data() || null))));
    for (const ym of months) subs.push(dst.doc(`extras/${id}/months/${ym}`).onSnapshot(guard(`retour ${id} ${ym}`)(s => copyBack(id, ym, s.data()))));
  }
  subs.push(src.doc(`shared/day-${iso}`).onSnapshot(guard('journée')(s => copyDay(iso, s.data()))));
  subs.push(src.doc('shared/global').onSnapshot(guard('réglages')(s => copyGlobal(s.data()))));
  copyNames().catch(e => console.error('noms', e.message || e));
  log(`écoute de Journée RP pour la journée du ${iso} (${subs.length} documents)`);
}

// ---------- Recopie complète de l'historique ----------
let startedLive = false;
async function copyHistory() {
  for (const id of T.MIRROR) {
    const refs = await src.collection(`days/${id}/months`).listDocuments();
    for (const ref of refs) await copyMonth(id, ref.id, (await ref.get()).data());
  }
}
async function copyAll() {
  await copyGlobal((await src.doc('shared/global').get()).data());   // d'abord : activités toujours masquées
  for (const id of T.MIRROR) {
    const refs = await src.collection(`days/${id}/months`).listDocuments();
    for (const ref of refs) await copyMonth(id, ref.id, (await ref.get()).data());
    await copyChar(id, (await src.doc(`characters/${id}`).get()).data());
    await copyToday(id, (await src.doc(`today/${id}`).get()).data() || null);
    for (const ref of await dst.collection(`extras/${id}/months`).listDocuments()) await copyBack(id, ref.id, (await ref.get()).data());
  }
  await copyGlobal((await src.doc('shared/global').get()).data());
  await copyNames();
  const iso = isoOf(rpDate());
  await copyDay(iso, (await src.doc(`shared/day-${iso}`).get()).data());
}

if (process.argv.includes('--tout')) {
  copyAll().then(() => { log('historique recopié'); process.exit(0); }, e => { console.error(e); process.exit(1); });
} else {
  startedLive = true;
  const start = () => watch().catch(e => { console.error('démarrage', e.message || e); setTimeout(start, 30e3); });
  start();
  // Nouvelle journée RP (5 h) : on suit les nouveaux documents du jour (et du mois).
  setInterval(() => { if (isoOf(rpDate()) !== watchingIso) start(); }, 5 * 60e3);
  process.on('SIGINT', () => { subs.forEach(u => u()); process.exit(0); });
}
