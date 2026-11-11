// S9 Interact' — connexion Google et synchronisation avec Firestore.
// app.js (chargé avant) expose window.RP_APP ; ce module charge les données, lance l'appli,
// enregistre les changements et applique ceux des autres joueurs en direct.
import { firebaseConfig, FIREBASE_SDK } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut }
  from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js';
import { initializeFirestore, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot,
  FieldPath, deleteField, serverTimestamp, runTransaction, arrayUnion, orderBy, limit } from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js';

void FIREBASE_SDK;
const sha256 = async t => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))].map(b => b.toString(16).padStart(2, '0')).join('');
const A = window.RP_APP;
const $ = id => document.getElementById(id);
const fb = initializeApp(firebaseConfig);
const auth = getAuth(fb);
const db = initializeFirestore(fb, { ignoreUndefinedProperties: true });

const J = v => JSON.stringify(v ?? null);
// Texte stable d'une valeur (clés triées) : même résultat d'un lancement à l'autre.
const stableJ = v => JSON.stringify(v ?? null, (k, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(y => [y, x[y]])) : x);
const clone = v => v === undefined ? undefined : JSON.parse(J(v));
const isMap = v => v && typeof v === 'object' && !Array.isArray(v) && !Array.isArray(v.$set) && typeof v.$date !== 'string';
const ymOf = (y, m) => `${y}-${String(m + 1).padStart(2, '0')}`;
const prevYm = ym => { const [y, m] = ym.split('-').map(Number); return m === 1 ? ymOf(y - 1, 11) : ymOf(y, m - 2); };
const rpIso = () => { const d = new Date(Date.now() - 5 * 3600e3); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

const gRef = doc(db, 'shared', 'global');
const dRef = doc(db, 'shared', 'day-' + A.iso);
const monthRef = (id, ym) => doc(db, 'days', id, 'months', ym);
// Compléments S9 Interact' des fiches recopiées de Journée RP (personnages présents, activités communes) : à part, jamais écrasés.
const extrasRef = (id, ym) => doc(db, 'extras', id, 'months', ym);
const EXTRA = {}, RAWM = {};   // mois en cours : compléments et mois bruts (tels que recopiés) des fiches recopiées
const mergedMonth = (id, raw, ex) => { const out = { ...(raw || {}) }; Object.entries(ex || {}).forEach(([d, x]) => { out[d] = A.mergeExtra(id, raw?.[d], x); }); return out; };
const charRef = id => doc(db, 'characters', id);
const todayRef = id => doc(db, 'today', id);
// Espace privé d'un couple : couples/{couple}, puis months/{AAAA-MM} (un champ par jour) et state/main.
const coupleRef = cid => doc(db, 'couples', cid);
const coupleMonthRef = (cid, ym) => doc(db, 'couples', cid, 'months', ym);
const coupleStateRef = cid => doc(db, 'couples', cid, 'state', 'main');
// Notifications push : clé publique VAPID du service du VPS (la clé privée reste sur le VPS).
// Clé propre à S9 Interact' (~/secrets/s9-vapid.json sur le VPS, service s9-notifs) : à renseigner à l'étape 6.
// Vide : le bouton des notifications ne s'affiche pas.
const VAPID_PUBLIC = '';
const pushSupported = () => !!VAPID_PUBLIC && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const swReg = pushSupported() ? navigator.serviceWorker.register('sw.js').catch(e => { console.error(e); return null; }) : Promise.resolve(null);
const b64u = s => { const b = atob((s + '='.repeat((4 - s.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c => c.charCodeAt(0)); };
const subRef = async endpoint => doc(db, 'pushSubs', me, 'subs', (await sha256(endpoint)).slice(0, 40));
const wrapsRef = y => doc(db, 'shared', 'wraps-' + y);
const recapsRef = () => doc(db, 'shared', 'recaps-' + A.iso);
const evRef = doc(db, 'shared', 'events');
const newsRef = key => doc(db, 'news', String(key).replace(/\//g, '_'));

let me = null, started = false, timer = null, base = null, viewAs = null;
// Copie de test (test/index.html) : même base, mais rien n'y est jamais enregistré ni envoyé.
const TEST_COPY = !!window.RP_TEST_COPY, noWrites = TEST_COPY;
const loaded = new Set();               // mois déjà chargés (AAAA-MM)
const seenToday = {};                   // dernière version distante de la journée du jour, par personnage
const seenCouple = {};                  // idem pour la journée de chaque couple

// ---------------------------------------------------------------- écran de connexion
const login = (msg, { button = true, logout = false, err = false } = {}) => {
  $('login').hidden = false;
  $('login-msg').textContent = msg; $('login-msg').className = err ? 'err' : '';
  $('login-btn').hidden = !button; $('logout-btn').hidden = !logout;
};
$('login-btn').addEventListener('click', async () => {
  const p = new GoogleAuthProvider();
  try { await signInWithPopup(auth, p); }
  catch (e) {
    if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/cancelled-popup-request'].includes(e.code)) return signInWithRedirect(auth, p);
    if (e.code !== 'auth/popup-closed-by-user') login('Connexion impossible : ' + (e.message || e.code), { err: true });
  }
});
$('logout-btn').addEventListener('click', () => signOut(auth));
getRedirectResult(auth).catch(e => login('Connexion impossible : ' + (e.message || e.code), { err: true }));

// ---------------------------------------------------------------- indicateur d'enregistrement
let stateTimer = null;
const showState = (txt, err = false) => {
  const el = $('sync-state'); el.textContent = txt; el.className = 'sync-state on' + (err ? ' err' : '');
  clearTimeout(stateTimer); if (!err) stateTimer = setTimeout(() => el.className = 'sync-state', 1600);
};
const report = e => { console.error(e); showState(e?.code === 'permission-denied' ? 'Non autorisé' : 'Non enregistré — vérifie la connexion', true); };

// ---------------------------------------------------------------- API utilisée par app.js
window.RP_SYNC = {
  signOut: async () => { await flush(); await signOut(auth); location.reload(); },
  dropNews: keys => { if (!started || noWrites) return; keys.forEach(k => { base?.news.delete(k); deleteDoc(newsRef(k)).catch(report); }); },
  hasMonth: (y, m) => loaded.has(ymOf(y, m)),
  loadMonth: (y, m) => loadMonth(ymOf(y, m)),
  save: () => schedule(),
  saveNow: () => flush(),
  // Nuit précédente : complète la journée d'hier (même nuit) sur la fiche du personnage.
  patchPast: (id, d, patch) => {
    if (noWrites) return;
    if (!A.owned().includes(id)) return;
    const ym = ymOf(d.getFullYear(), d.getMonth());
    setDoc(monthRef(id, ym), { [String(d.getDate())]: JSON.parse(J(patch)) }, { merge: true }).catch(report);
  },
  // Nuit précédente, partie « nuit chaude » : dans l'espace du couple.
  patchPastNight: (id, d, night) => {
    if (noWrites) return;
    const k = A.myCouples().find(x => x.chars.includes(id)); if (!k) return;
    const ym = ymOf(d.getFullYear(), d.getMonth());
    setDoc(coupleMonthRef(k.id, ym), { [String(d.getDate())]: { nights: { [id]: JSON.parse(J(night)) } } }, { merge: true }).catch(report);
  },
  // Administration (admin seulement, garanti par les règles) : accès des joueurs.
  listAccess: async () => (await getDocs(collection(db, 'access'))).docs.map(x => ({ email: x.id, ...x.data() })),
  invite: async (email, p) => {
    await setDoc(doc(db, 'access', email), { player: p.id, role: 'joueur', invitedAt: serverTimestamp() });
    await setDoc(doc(db, 'players', p.id), { name: p.name, color: p.color, role: p.admin ? 'admin' : 'joueur' }, { merge: true });
  },
  revoke: email => deleteDoc(doc(db, 'access', email)),
  // Webhook Discord (salon commun) : rangé dans Firestore, lisible par les joueurs, modifiable par l'admin ; jamais dans le code.
  // Inscription d'un personnage à un événement (champ par champ : deux inscriptions simultanées ne s'écrasent pas).
  setGoing: (evId, cid, player) => noWrites ? Promise.resolve() : updateDoc(evRef, new FieldPath(evId, 'going', cid), player || deleteField()).catch(report),
  // Nouvelle créée une seule fois (même clé depuis plusieurs appareils) : si elle existe déjà, l'écriture est refusée, sans erreur affichée.
  newsOnce: (key, n) => noWrites ? Promise.resolve() : setDoc(newsRef(key), { ...n, key, read: false, from: me, createdAt: serverTimestamp() }).catch(() => {}),
  saveEvent: (id, e) => noWrites ? Promise.resolve() : setDoc(evRef, { [id]: e === null ? deleteField() : e }, { merge: true }).catch(report),
  setWebhook: url => setDoc(doc(db, 'shared', 'discord'), { webhook: url }, { merge: true }),
  // Toute l'année (pour le wrap) : douze mois, tous personnages.
  loadYear: y => Promise.all(Array.from({ length: 12 }, (_, m) => ymOf(y, m)).filter(ym => ym <= A.ym).map(loadMonth)),
  // Wraps du 26 décembre : verrou partagé (shared/wraps-AAAA) pour qu'un seul appareil les envoie.
  // Renvoie null si c'est déjà fait ou en cours ailleurs ; sinon, les personnages déjà envoyés (reprise).
  wrapClaim: y => runTransaction(db, async tx => {
    const ref = wrapsRef(y), s = await tx.get(ref), d = s.data() || {};
    if (d.done) return null;
    if (d.claimedAt && Date.now() - d.claimedAt < 10 * 60e3) return null;   // envoi en cours sur un autre appareil
    tx.set(ref, { claimedBy: me, claimedAt: Date.now() }, { merge: true });
    return d.sent || {};
  }),
  // Signature de la journée telle que recopiée dans la base (et non telle qu'affichée, que l'affichage peut retoucher).
  entrySig: id => stableJ(seenToday[id]),
  rawToday: id => RAWM[id]?.[A.day],
  saveExtra: (id, x) => {
    EXTRA[id] = { ...(EXTRA[id] || {}), [A.day]: x };
    const e = mergedMonth(id, RAWM[id], EXTRA[id])[A.day]; seenToday[id] = clone(e); A.applyMonth(id, A.ym, { [A.day]: e }, false);
    window.RP_DISCORD?.sendMirrors?.();
    if (noWrites) return Promise.resolve();
    const ref = extrasRef(id, A.ym);
    return setDoc(ref, {}, { merge: true }).then(() => updateDoc(ref, new FieldPath(A.day), JSON.parse(J(x)))).catch(report);
  },
  // Fiches recopiées de Journée RP : un message Discord par fiche et par journée, envoyé une fois puis mis à jour
  // seulement quand la fiche change ; verrou partagé par fiche (shared/recaps-AAAA-MM-JJ → { [id]: { msg, sig, claimedBy, claimedAt } }).
  // Renvoie 'done' si la fiche est déjà envoyée telle quelle, null si un autre appareil l'envoie, sinon { msg, batch }.
  recapClaim: (id, sig) => runTransaction(db, async tx => {
    const ref = recapsRef(), d = (await tx.get(ref)).data() || {}, r = d[id] || {};
    if (r.msg && r.sig === sig) return 'done';
    if (r.claimedAt && Date.now() - r.claimedAt < 120e3 && r.claimedBy !== me) return null;
    tx.set(ref, { [id]: { ...r, claimedBy: me, claimedAt: Date.now() } }, { merge: true });
    return { msg: r.msg || null, batch: d._batch?.msg || null };   // batch : ancien message groupé du jour, à supprimer
  }),
  recapSent: (id, sig, msg) => setDoc(recapsRef(), { [id]: { msg, sig, claimedBy: null, claimedAt: 0, sentBy: me, sentAt: Date.now() } }, { merge: true }),
  recapFailed: id => setDoc(recapsRef(), { [id]: { claimedAt: 0 } }, { merge: true }),
  recapBatchGone: () => setDoc(recapsRef(), { _batch: { msg: null } }, { merge: true }),
  wrapSent: (y, id, msg) => setDoc(wrapsRef(y), { sent: { [id]: msg } }, { merge: true }),
  // Notifications push sur cet appareil : 'unsupported' | 'denied' | 'off' | 'on'
  pushState: async () => {
    if (!pushSupported()) return 'unsupported';
    if (Notification.permission === 'denied') return 'denied';
    const reg = await swReg; if (!reg) return 'unsupported';
    return Notification.permission === 'granted' && await reg.pushManager.getSubscription() ? 'on' : 'off';
  },
  enablePush: async () => {
    const perm = await Notification.requestPermission();      // doit partir pendant le geste (iOS)
    if (perm !== 'granted') throw new Error('autorisation refusée');
    const reg = await swReg; if (!reg) throw new Error('service worker indisponible');
    await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(VAPID_PUBLIC) });
    const j = sub.toJSON();
    await setDoc(await subRef(j.endpoint), { endpoint: j.endpoint, keys: j.keys, device: navigator.userAgent.slice(0, 200), createdAt: serverTimestamp() });
  },
  disablePush: async () => {
    const reg = await swReg, sub = await reg?.pushManager.getSubscription(); if (!sub) return;
    await deleteDoc(await subRef(sub.endpoint)).catch(report);
    await sub.unsubscribe();
  },
  wrapDone: y => setDoc(wrapsRef(y), { done: true, doneAt: Date.now() }, { merge: true }),
  // ---------- S9 : Flash Actu, Wondereye, Pixel Meet (voir dev/s9-modules.js) ----------
  s9Flash: (id, f) => noWrites ? Promise.resolve() : (f ? setDoc(doc(db, 'flash', id), f) : deleteDoc(doc(db, 'flash', id))).catch(report),
  s9Account: (h, a) => noWrites ? Promise.resolve() : setDoc(doc(db, 'we_accounts', h), { ...a, player: me }, { merge: true }).catch(report),
  s9Post: (id, p) => noWrites ? Promise.resolve() : (p ? setDoc(doc(db, 'we_posts', id), { ...p, player: me }) : deleteDoc(doc(db, 'we_posts', id))).catch(report),
  s9Like: (id, h, on) => noWrites ? Promise.resolve() : updateDoc(doc(db, 'we_posts', id), new FieldPath('likes', h), on ? true : deleteField()).catch(report),
  s9Comment: (id, c) => noWrites ? Promise.resolve() : updateDoc(doc(db, 'we_posts', id), { comments: arrayUnion(c) }).catch(report),
  s9PmProfile: (id, p, full = false) => noWrites ? Promise.resolve() : setDoc(doc(db, 'pm_profiles', id), full ? p : p, { merge: !full }).catch(report),
  s9PmSend: async (id, th, m) => {
    if (noWrites) return;
    const { players, a, b, npc } = th;
    await setDoc(doc(db, 'pm_threads', id), { players, a, b: b ?? null, ...(npc ? { npc } : {}), last: th.last, at: th.at, lastBy: me, seen: { [me]: th.at } }, { merge: true }).catch(report);
    await setDoc(doc(db, 'pm_threads', id, 'msgs', m.at + '-' + me), m).catch(report);
    S9open(id);
  },
  s9PmSeen: id => noWrites ? Promise.resolve() : updateDoc(doc(db, 'pm_threads', id), new FieldPath('seen', me), Date.now()).catch(() => {}),
  s9PmOpen: id => S9open(id),
};
// Messages d'une conversation Pixel Meet : écoutés seulement une fois la conversation ouverte.
const pmOpen = new Set();
const S9open = id => { if (pmOpen.has(id)) return; pmOpen.add(id);
  onSnapshot(query(collection(db, 'pm_threads', id, 'msgs'), orderBy('at')), s => { window.S9.applyPmMsgs(id, s.docs.map(x => x.data())); A.rerender(); },
    e => console.warn('Pixel Meet illisible :', e.message)); };

// ---------------------------------------------------------------- chargement
async function loadMonth(ym) {
  if (loaded.has(ym)) return;
  loaded.add(ym);
  await Promise.all(A.ids.map(async id => {
    const s = await getDoc(monthRef(id, ym));
    let data = s.data() || {};
    if (A.mirrors().includes(id)) {
      const ex = (await getDoc(extrasRef(id, ym))).data() || {};
      if (ym === A.ym) { RAWM[id] = data; EXTRA[id] = ex; }
      data = mergedMonth(id, data, ex);
    }
    A.applyMonth(id, ym, data, ym === A.ym && !started);
    if (ym === A.ym) seenToday[id] = clone(data[A.day]);
  }));
  // Nuits chaudes : seulement les couples dont on joue l'un des personnages.
  await Promise.all(A.myCouples().map(async k => {
    const data = (await getDoc(coupleMonthRef(k.id, ym))).data() || {};
    A.applyCoupleMonth(k.id, ym, data, ym === A.ym && !started);
    if (ym === A.ym) seenCouple[k.id] = clone(data[A.day]);
  }));
}

async function boot() {
  A.setMe(me);
  const [g, d, cs, ns, dc, ev] = await Promise.all([
    getDoc(gRef), getDoc(dRef), getDocs(collection(db, 'characters')),
    viewAs ? { docs: [] } : getDocs(query(collection(db, 'news'), where('to', '==', me))),   // aperçu : nouvelles d'un autre joueur illisibles pour l'admin
    getDoc(doc(db, 'shared', 'discord')), getDoc(evRef),
  ]);
  if (window.RP_DISCORD) window.RP_DISCORD.webhook = dc.data()?.webhook || null;
  if (!g.exists() && !noWrites) await setDoc(gRef, {});
  if (!d.exists() && !noWrites) await setDoc(dRef, {});
  const chars = {};
  cs.forEach(x => { chars[x.id] = x.data(); });
  const mine = A.owned();
  // Fiches manquantes dans la base : l'admin les crée d'après la configuration (les règles réservent la création à l'admin).
  if (window.RP_ADMIN) await Promise.all(A.ids.filter(id => !chars[id]).map(id => {
    chars[id] = { player: A.playerOf(id), addedActs: [], removedActs: [], addedRegions: [], customPlaces: [] };
    return setDoc(charRef(id), chars[id]);
  }));
  mine.forEach(id => { chars[id] ||= { player: me }; });
  // Espaces des couples : créés par l'admin d'après la configuration (personnages et joueurs).
  if (window.RP_ADMIN) await Promise.all(A.couples().map(async k => {
    if (!(await getDoc(coupleRef(k.id))).exists()) await setDoc(coupleRef(k.id), { chars: k.chars, players: k.players });
  }));
  const coupleStates = Object.fromEntries(await Promise.all(A.myCouples().map(async k => [k.id, (await getDoc(coupleStateRef(k.id))).data() || {}])));
  Object.entries(coupleStates).forEach(([cid, d]) => A.applyCoupleState(cid, d));
  A.hydrate({ global: g.data() || {}, day: d.data() || {}, chars, news: ns.docs.map(x => x.data()) });
  A.applyEvents(ev.data() || {});
  await loadMonth(prevYm(A.ym));
  await loadMonth(A.ym);
  if (!noWrites) await Promise.all(mine.map(id => setDoc(monthRef(id, A.ym), {}, { merge: true })));
  if (!noWrites) await Promise.all(A.myCouples().filter(k => !k.mirror).flatMap(k => [setDoc(coupleMonthRef(k.id, A.ym), {}, { merge: true }), setDoc(coupleStateRef(k.id), {}, { merge: true })]));
  base = {
    global: clone(g.data() || {}), day: clone(d.data() || {}),
    entries: Object.fromEntries(mine.map(id => [id, clone(seenToday[id])])),
    chars: Object.fromEntries(mine.map(id => { const { player, ...rest } = chars[id]; void player; return [id, clone(rest)]; })),
    today: {},
    couples: Object.fromEntries(A.myCouples().map(k => [k.id, { day: clone(seenCouple[k.id]) || {}, state: clone(coupleStates[k.id]) }])),
    news: new Map(ns.docs.map(x => [x.data().key, !!x.data().read])),
  };
  started = true;
  $('login').hidden = true;
  A.start();
  window.RP_PUSH?.refresh();
  if (window.RP_ADMIN) window.RP_ADMIN_UI?.refresh();
  // « Mise à jour des fiches » : fiches recopiées de Journée RP validées, envoyées sur le salon commun avant de rendre la main.
  await window.RP_DISCORD?.updateMirrors?.();
  setTimeout(() => window.RP_DISCORD?.autoWraps?.(), 2000);   // à partir du 26 décembre : envoi des wraps (une seule fois)
  listen();
  ['click', 'change', 'input'].forEach(t => document.addEventListener(t, schedule, true));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
    else if (rpIso() !== A.iso) location.reload();       // nouvelle journée RP (5 h) : on recharge
  });
  window.addEventListener('pagehide', () => flush());
}

onAuthStateChanged(auth, async user => {
  if (!user) { if (started) location.reload(); else login('Connecte-toi avec ton compte Google pour rejoindre la tribu.'); return; }
  if (started) return;
  login('Chargement du journal…', { button: false });
  const noAccess = () => login(`Le compte ${user.email} n'a pas accès à S9 Interact'. Demande à l'admin de t'inviter.`, { button: false, logout: true, err: true });
  try {
    // Qui est qui : access/{adresse Google en minuscules} = { player, role }, rempli par l'admin.
    const acc = await getDoc(doc(db, 'access', (user.email || '').trim().toLowerCase()));
    if (!acc.exists() || !A.isPlayer(acc.data().player)) return noAccess();
    me = acc.data().player; window.RP_ADMIN = acc.data().role === 'admin';
    // Copie de test : l'admin peut voir l'appli comme un autre joueur (?voir=eden) ; pas d'administration ni de réglages.
    if (TEST_COPY) {
      window.RP_TEST_ADMIN = window.RP_ADMIN; window.RP_ADMIN = false;
      const want = new URLSearchParams(location.search).get('voir');
      if (want && window.RP_TEST_ADMIN && A.isPlayer(want) && want !== me) { viewAs = want; me = want; window.RP_VIEW_AS = want; }
    }
    await boot();
  }
  catch (e) {
    console.error(e);
    if (e.code === 'permission-denied') noAccess();
    else login('Erreur de chargement : ' + (e.message || e), { button: false, logout: true, err: true });
  }
});

// ---------------------------------------------------------------- changements des autres joueurs (en direct)
const changedKeys = (remote, prev) => Object.fromEntries(Object.entries(remote).filter(([k, v]) => J(v) !== J(prev?.[k])));
function listen() {
  onSnapshot(gRef, s => {
    if (s.metadata.hasPendingWrites) return;
    const d = s.data() || {}, ch = changedKeys(d, base.global);
    if (!Object.keys(ch).length) return;
    A.applyGlobal(ch); base.global = { ...base.global, ...clone(ch) }; A.rerender();
  });
  onSnapshot(dRef, s => {
    if (s.metadata.hasPendingWrites) return;
    const d = s.data() || {}, ch = changedKeys(d, base.day);
    if (!Object.keys(ch).length) return;
    A.applyDay(ch); base.day = { ...base.day, ...clone(ch) }; A.rerender();
    // Une nuit (ou une journée RP) cochée par un autre joueur sur l'un de nos personnages : on met à jour sa fiche enregistrée.
    if ('rp' in ch || 'calm' in ch) schedule();
  });
  onSnapshot(evRef, s => { if (s.metadata.hasPendingWrites) return; A.applyEvents(s.data() || {}); A.rerender(); });
  // S9 : Flash Actu (les 60 derniers), Wondereye (comptes, 80 dernières publications), Pixel Meet (profils visibles, conversations du joueur)
  const warn = n => e => console.warn(n + ' illisible :', e.message);
  onSnapshot(query(collection(db, 'flash'), orderBy('at', 'desc'), limit(60)), s => { window.S9.applyFlash(s.docs.map(x => [x.id, x.data()])); A.rerender(); }, warn('Flash Actu'));
  onSnapshot(collection(db, 'we_accounts'), s => { window.S9.applyWe(s.docs.map(x => [x.id, x.data()]), null); A.rerender(); }, warn('Wondereye'));
  onSnapshot(query(collection(db, 'we_posts'), orderBy('at', 'desc'), limit(80)), s => { window.S9.applyWe(null, s.docs.map(x => [x.id, x.data()])); A.rerender(); }, warn('Wondereye'));
  if (!viewAs) {
    onSnapshot(query(collection(db, 'pm_profiles'), where('visibleTo', 'array-contains', me)), s => { window.S9.applyPm(s.docs.map(x => [x.id, x.data()]), null); A.rerender(); }, warn('Pixel Meet'));
    onSnapshot(query(collection(db, 'pm_threads'), where('players', 'array-contains', me)), s => { window.S9.applyPm(null, s.docs.map(x => [x.id, x.data()])); A.rerender(); }, warn('Pixel Meet'));
  }
  if (!viewAs) onSnapshot(query(collection(db, 'news'), where('to', '==', me)), s => {
    if (s.metadata.hasPendingWrites) return;
    const list = s.docs.map(x => x.data()).filter(n => !base.news.has(n.key) || base.news.get(n.key) !== !!n.read);
    if (!list.length) return;
    list.forEach(n => base.news.set(n.key, !!n.read));
    A.applyNews(list); A.rerender();
  });
  A.myCouples().forEach(k => {
    onSnapshot(coupleMonthRef(k.id, A.ym), s => {
      if (s.metadata.hasPendingWrites) return;
      const data = s.data() || {}, e = data[A.day] || {};
      A.applyCoupleMonth(k.id, A.ym, data, false);
      if (J(e) === J(seenCouple[k.id])) return;
      seenCouple[k.id] = clone(e);
      A.applyCoupleMonth(k.id, A.ym, { [A.day]: e }, true);
      base.couples[k.id].day = clone(e); A.rerender();
    });
    onSnapshot(coupleStateRef(k.id), s => {
      if (s.metadata.hasPendingWrites) return;
      const d = s.data() || {}, ch = changedKeys(d, base.couples[k.id].state);
      if (!Object.keys(ch).length) return;
      A.applyCoupleState(k.id, ch); base.couples[k.id].state = { ...base.couples[k.id].state, ...clone(ch) }; A.rerender();
    });
  });
  const onMonth = (id, data) => {
    const e = data[A.day];
    A.applyMonth(id, A.ym, data, false);
    if (J(e) === J(seenToday[id])) return;
    seenToday[id] = clone(e);
    if (base.entries[id] !== undefined && J(e) === J(base.entries[id])) return;   // notre propre écriture
    A.applyMonth(id, A.ym, { [A.day]: e }, true);
    if (id in base.entries) base.entries[id] = clone(e);
    A.rerender();
    window.RP_DISCORD?.sendMirrors?.();
  };
  A.ids.forEach(id => onSnapshot(monthRef(id, A.ym), s => {
    if (s.metadata.hasPendingWrites) return;
    let data = s.data() || {};
    if (A.mirrors().includes(id)) { RAWM[id] = data; data = mergedMonth(id, data, EXTRA[id]); }
    onMonth(id, data);
  }));
  A.mirrors().forEach(id => onSnapshot(extrasRef(id, A.ym), s => {
    if (s.metadata.hasPendingWrites) return;
    EXTRA[id] = s.data() || {};
    onMonth(id, mergedMonth(id, RAWM[id], EXTRA[id]));
  }));
}

// ---------------------------------------------------------------- enregistrement
function schedule() { if (!started || noWrites) return; clearTimeout(timer); timer = setTimeout(flush, 700); }

// Différences sur deux niveaux, pour ne réécrire que ce qui a changé (et ne pas écraser les modifications des autres).
function diff2(prev = {}, next = {}, at = []) {
  const ups = [];
  for (const k of Object.keys(next)) {
    const a = prev[k], b = next[k];
    if (J(a) === J(b)) continue;
    if (isMap(a) && isMap(b)) {
      for (const sk of new Set([...Object.keys(a), ...Object.keys(b)])) {
        if (!(sk in b)) ups.push(new FieldPath(...at, k, sk), deleteField());
        else if (J(a[sk]) !== J(b[sk])) ups.push(new FieldPath(...at, k, sk), b[sk]);
      }
    } else ups.push(new FieldPath(...at, k), b ?? null);
  }
  return ups;
}

let flushing = Promise.resolve();
function flush() {
  if (noWrites) return Promise.resolve();   // copie de test : rien n'est enregistré
  if (!started) return Promise.resolve();
  clearTimeout(timer); timer = null;
  flushing = flushing.then(doFlush).catch(report);
  return flushing;
}
async function doFlush() {
  const snap = A.snapshot(), ops = [];
  for (const [key, ref] of [['global', gRef], ['day', dRef]]) {
    const ups = diff2(base[key], snap[key]);
    if (ups.length) { base[key] = { ...base[key], ...clone(snap[key]) }; ops.push(updateDoc(ref, ...ups)); }
  }
  // Espaces des couples : seulement ce qui a changé (l'autre joueur du couple écrit dans les mêmes documents).
  for (const [cid, c] of Object.entries(snap.couples)) {
    const b = base.couples[cid];
    const dayUps = diff2(b.day, c.day, [A.day]);
    if (dayUps.length) { b.day = clone(c.day); seenCouple[cid] = clone(c.day); ops.push(updateDoc(coupleMonthRef(cid, A.ym), ...dayUps)); }
    const stUps = diff2(b.state, c.state);
    if (stUps.length) { b.state = clone(c.state); ops.push(updateDoc(coupleStateRef(cid), ...stUps)); }
  }
  for (const id of A.owned()) {
    const e = snap.entries[id];
    if (J(e) !== J(base.entries[id]) && (base.entries[id] || A.meaningful(e))) {
      base.entries[id] = clone(e); seenToday[id] = clone(e);
      ops.push(updateDoc(monthRef(id, A.ym), new FieldPath(A.day), e));
    }
    if (J(snap.chars[id]) !== J(base.chars[id])) {
      base.chars[id] = clone(snap.chars[id]);
      ops.push(setDoc(charRef(id), { ...snap.chars[id], player: me }, { merge: true }));
    }
    const t = snap.today[id];
    if (t && J(t) !== J(base.today[id])) {
      base.today[id] = clone(t);
      ops.push(setDoc(todayRef(id), { ...t, updatedAt: serverTimestamp() }));
    }
  }
  for (const n of snap.news) {
    if (!base.news.has(n.key)) { base.news.set(n.key, n.read); if (n.to !== me) ops.push(setDoc(newsRef(n.key), { ...n, from: me, createdAt: serverTimestamp() })); }
    else if (n.to === me && base.news.get(n.key) !== n.read) { base.news.set(n.key, n.read); ops.push(updateDoc(newsRef(n.key), { read: n.read })); }
  }
  if (!ops.length) return;
  showState('Enregistrement…');
  const res = await Promise.allSettled(ops);
  const bad = res.find(r => r.status === 'rejected');
  if (bad) report(bad.reason); else showState('Enregistré');
}
