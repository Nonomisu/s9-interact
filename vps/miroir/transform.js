// S9 Interact' — recopie de Journée RP : règles de transformation (sans Firebase, testables seules).
// Sens unique : Journée RP → S9 Interact'. Rien d'intime ne sort de l'espace privé des couples ;
// la Vie intime et les fonctions propres au couple ne sont pas reprises.
'use strict';

// Personnages tenus dans Journée RP et recopiés (mêmes identifiants des deux côtés).
const MIRROR = ['echo', 'prism'];
// Couples de S9 Interact' concernés (identifiant = les deux personnages triés, séparés par un tiret).
const COUPLES = [['echo', 'prism']]
  .map(p => { const chars = [...p].sort(); return { id: chars.join('-'), chars }; });
const coupleOf = id => COUPLES.find(k => k.chars.includes(id)) || null;
// Tous les personnages de S9 Interact' : un identifiant de Journée RP absent d'ici devient un nom (PNJ).
// Liste lue dans noms.json (créé par dev/build.py depuis l'appli) ; celle-ci sert si le fichier manque.
let NOMS = {};
try { NOMS = require('./noms.json').chars || {}; } catch { /* fichier absent : liste par défaut */ }
const ILOH = Object.keys(NOMS).length ? [...new Set([...MIRROR, ...Object.keys(NOMS)])]
  : [...MIRROR, 'joy', 'tala', 'aaron', 'yololo'];
// Personnages propres à S9 Interact' (sans fiche dans Journée RP) : leurs noms sont déposés dans Journée RP (s9/_noms/months/liste)
// pour qu'Echo et Prism puissent les noter sur une activité commune.
const ILOH_ONLY = ILOH.filter(x => !MIRROR.includes(x));
const nameOf = x => NOMS[x]?.name || (x[0].toUpperCase() + x.slice(1));
const s9Names = () => ({ chars: Object.fromEntries(ILOH_ONLY.map(x => [x, { name: nameOf(x), gender: NOMS[x]?.gender || null }])) });
const JRP_NAMES = { eoor: 'Eoor', unegen: 'Unegen', yasmeen: 'Yasmeen', hokkyoku: 'Hokkyoku', viggo: 'Viggo', khopses: 'Khopses', tamachag: 'Tamachag', taiga: 'Taiga' };
const who = x => typeof x !== 'string' || ILOH.includes(x) ? x : (JRP_NAMES[x] || x);

// Champs de la journée qui ne sont pas repris.
const DROP_KEYS = ['intime', 'intimeWith', 'jais', 'set', 'setLate', 'lateAt', 'wait', 'door', 'callPartner', 'returnHour',
  'discordMsg', 'film', 'nefaste', 'night', 'hideIloh', 'hideS9', 'privWith', 'msType', 'msOpen', 'loverMsg', 'violet', 'shell'];
// Activités intimes : « Sexe avec … », « Plaisir en solo sur Moonstone » et celles marquées « intime » dans Journée RP
// (shared/global → privActs, voir setPrivate) : jamais recopiées.
const PRIV = new Set();
const setPrivate = list => { PRIV.clear(); (setList(list) || []).forEach(a => typeof a === 'string' && PRIV.add(a)); };
// Moonstone (vidéos, vues, publications) et le livreur restent dans Journée RP.
const isPrivateAct = a => typeof a === 'string' && (/^Sexe avec /i.test(a) || /moonstone|livreur/i.test(a) || PRIV.has(a));
const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
const setList = v => Array.isArray(v?.$set) ? v.$set : Array.isArray(v) ? v : null;
// Activités masquées dans S9 Interact' depuis Journée RP : ce jour-là (entrée hideS9) ou toujours (shared/global hideS9).
const hiddenOf = (e, always) => new Set([...(setList(e?.hideS9) || []), ...(setList(always) || [])]);
const filterSet = (v, hid = new Set()) => { const l = setList(v); if (!l) return v; const f = l.filter(a => !isPrivateAct(a) && !hid.has(a)); return Array.isArray(v?.$set) ? { $set: f } : f; };
const filterKeys = (o, hid = new Set()) => o && typeof o === 'object' && !Array.isArray(o) ? Object.fromEntries(Object.entries(o).filter(([k]) => !isPrivateAct(k) && !hid.has(k))) : o;

// Journée d'un personnage (champ « jour » d'un document days/{id}/months/{AAAA-MM}), sans rien d'intime
// ni les activités masquées pour S9 Interact'. always : activités toujours masquées pour ce personnage.
function publicEntry(e, always) {
  if (!e || typeof e !== 'object') return null;
  const hid = hiddenOf(e, always);
  const o = clone(e);
  DROP_KEYS.forEach(k => delete o[k]);
  if (o.checked) o.checked = filterSet(o.checked, hid);
  if (o.specials) o.specials = filterSet(o.specials, hid);
  if (o.slots) o.slots = filterKeys(o.slots, hid);
  if (o.details) o.details = filterKeys(o.details, hid);
  if (o.huntSet) o.huntSet = filterKeys(o.huntSet, hid);
  // Activités communes notées dans Journée RP : seulement sur des activités recopiées, avec des personnages présents dans S9 Interact'.
  if (o.withActs) {
    const kept = new Set(setList(o.checked) || []), w = {};
    for (const [l, ids] of Object.entries(filterKeys(o.withActs, hid) || {})) {
      const f = (Array.isArray(ids) ? ids : []).filter(x => ILOH.includes(x));
      if (kept.has(l) && f.length) w[l] = f;
    }
    if (Object.keys(w).length) o.withActs = w; else delete o.withActs;
  }
  if (o.nightNotes && typeof o.nightNotes === 'object') { delete o.nightNotes['Nuit chaude']; }
  if (o.rp) o.rp = who(o.rp);
  if (o.calmWith) o.calmWith = who(o.calmWith);
  return o;
}

// Nuit chaude d'une journée (pour l'espace du couple), ou null.
function hotNight(n) {
  return n && n.hot ? { hot: true, with: n.with ? who(n.with) : null } : null;
}

// Liste d'amants : seulement des PNJ (un personnage du groupe autre que le partenaire n'a pas sa place ici).
function lovers(list, id) {
  const k = coupleOf(id), partner = k && k.chars.find(x => x !== id);
  return (Array.isArray(list) ? list : []).map(who).filter(x => x !== partner && !ILOH.includes(x));
}

// « Se protège » retenu : clés du personnage (« tamachag ») et de ses PNJ (« pnj:tamachag:Nom »).
function protectFor(protect, chars) {
  return Object.fromEntries(Object.entries(protect || {}).filter(([key]) => chars.some(x => key === x || key.startsWith('pnj:' + x + ':'))));
}

// Fiche d'un personnage : listes d'activités, régions et lieux ajoutés.
function charDoc(d) {
  if (!d) return null;
  return {
    addedActs: (d.addedActs || []).filter(a => !isPrivateAct(a)),
    removedActs: d.removedActs || [],
    addedRegions: d.addedRegions || [],
    customPlaces: d.customPlaces || [],
    customCats: d.customCats || [],
    actCat: filterKeys(d.actCat || {}),
    catNames: d.catNames || {},
  };
}

// Encart public « Aujourd'hui » (entry : journée du jour, pour les activités masquées ce jour-là).
function todayDoc(t, entry, always) {
  if (!t) return null;
  const hid = hiddenOf(entry, always), o = clone(t);
  if (Array.isArray(o.activities)) o.activities = o.activities.filter(a => !isPrivateAct(a) && !hid.has(a));
  return o;
}

// ---------- Retour vers Journée RP : compléments acceptés dans S9 Interact' (extras/{id}/months) ----------
// Seulement les activités communes : activités ajoutées dans S9 Interact' et personnages présents sur une activité.
// Personnages connus de Journée RP : identifiant ; personnages propres à S9 Interact' : leur nom.
const backName = x => MIRROR.includes(x) ? x : typeof x === 'string' && x ? x[0].toUpperCase() + x.slice(1) : null;
function s9Back(x) {
  if (!x || typeof x !== 'object') return null;
  const added = (Array.isArray(x.added) ? x.added : []).filter(a => typeof a === 'string' && a && !isPrivateAct(a)).slice(0, 30);
  const w = {};
  for (const [l, ids] of Object.entries(x.withActs || {})) {
    if (isPrivateAct(l) || !Array.isArray(ids)) continue;
    const names = ids.map(backName).filter(Boolean);
    if (names.length) w[l] = names;
  }
  return added.length || Object.keys(w).length ? { added, with: w } : null;
}
const s9BackMonth = data => { const out = {}; for (const [d, x] of Object.entries(data || {})) { const b = s9Back(x); if (b) out[d] = b; } return out; };

// ---------- Nouvelles dans S9 Interact' pour ses personnages propres, notés sur une activité commune dans Journée RP ----------
// Leurs joueurs ne sont pas dans Journée RP : la nouvelle (verte) naît ici. Seulement une fois la journée validée
// (le bouton « L'ajouter à la fiche » n'apparaît qu'à ce moment-là). pub : journée déjà filtrée par publicEntry.
// Renvoie { clé: nouvelle } ; clé au format de l'appli S9 Interact' (with:AAAA-M-J:de:pour:activité).
function withNews(id, date, pub) {
  const out = {};
  if (!pub?.done || !pub.withActs) return out;
  const from = NOMS[id]?.player || null, checked = new Set(setList(pub.checked) || []);
  for (const [l, ids] of Object.entries(pub.withActs)) {
    if (!checked.has(l) || isPrivateAct(l) || l === 'Voyage') continue;
    for (const o of ids) {
      const to = NOMS[o]?.player;
      if (!ILOH_ONLY.includes(o) || !to || to === from) continue;
      const key = `with:${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}:${id}:${o}:${l}`;
      out[key] = { to, text: `${nameOf(id)} a noté « ${l} » avec ${nameOf(o)}.`, charId: o, key, read: false, src: id, from: 'miroir' };
    }
  }
  return out;
}

module.exports = { setPrivate, MIRROR, ILOH_ONLY, s9Names, withNews, COUPLES, ILOH, coupleOf, who, publicEntry, hotNight, lovers, protectFor, charDoc, todayDoc, isPrivateAct, hiddenOf, s9Back, s9BackMonth };
