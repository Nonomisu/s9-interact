
// ---------- Persistance : ce que sync.js lit et enregistre dans Firestore ----------
// Journée d'un personnage (champs enregistrés ; le reste de state[id] ne sert qu'à l'affichage).
const ENTRY_KEYS = ['mood', 'checked', 'specials', 'slots', 'places', 'region', 'zone', 'trip', 'done', 'doneAt', 'phys', 'physNote',
  'details', 'mental', 'stateNotes', 'nightStates', 'nightNote', 'nightNotes', 'huntSet', 'faits', 'dayEvents', 'infos', 'violet', 'contractOff', 'discordMsg', 'withActs'];
const freshEntry = () => ({ mood:'', checked:new Set(), specials:[], slots:{}, places:new Set(), done:false, phys:new Set(), mental:new Set(), stateNotes:{}, nightStates:new Set() });
// Firestore ne connaît ni les Set ni les Date : on les encode.
const enc = v => v instanceof Set ? { $set: [...v].map(enc) } : v instanceof Date ? { $date: v.toISOString() }
  : Array.isArray(v) ? v.map(enc)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => [k, enc(x)]))
  : v === undefined ? null : v;
const dec = v => Array.isArray(v) ? v.map(dec)
  : v && typeof v === 'object' ? (Array.isArray(v.$set) ? new Set(v.$set.map(dec)) : typeof v.$date === 'string' ? new Date(v.$date)
    : typeof v.toDate === 'function' ? v.toDate() : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, dec(x)])))
  : v;
const replaceObj = (target, src) => { Object.keys(target).forEach(k => delete target[k]); Object.assign(target, src || {}); };
const replaceArr = (target, src) => { target.length = 0; (src || []).forEach(x => target.push(x)); };
const owns = id => C.find(c => c.id === id)?.player === me && !isMirror(id);
// Activités et lieux privés : jamais copiés dans l'encart public « Aujourd'hui » des fiches.
const isPrivateAct = a => /^Sexe avec /i.test(a);

const entryOf = id => {
  const s = state[id], o = {};
  ENTRY_KEYS.forEach(k => { if (s[k] !== undefined) o[k] = s[k]; });
  // La nuit chaude n'est pas sur la fiche (lue par tout le groupe) : elle est dans l'espace du couple.
  o.rp = rpPlayed[id] || null;
  o.calmWith = calmBy[id]?.with || null;
  return enc(o);
};
const isEmptyVal = v => v === '' || v === false || v === null || v === undefined || (Array.isArray(v) && !v.length)
  || (v && typeof v === 'object' && (Array.isArray(v.$set) ? !v.$set.length : !Object.keys(v).length));
const meaningful = e => !!e && (e.night?.hot || Object.entries(e).some(([k, v]) => k !== 'night' && !isEmptyVal(v)));
const applyEntry = (id, e) => {
  const s = state[id];
  ENTRY_KEYS.forEach(k => delete s[k]);
  const d = dec(e || {}); delete d.night; delete d.rp; delete d.calmWith;
  Object.assign(s, freshEntry(), d);
  // Anciennes fiches : le moral était rangé avec l'état physique.
  MORAL.forEach(m => { if (s.phys?.has?.(m)) { s.phys.delete(m); s.mental.add(m); } });
};
const charDocOf = c => enc({ addedActs: c.addedActs || [], removedActs: [...(c.removedActs || [])],
  addedRegions: [...(c.added || [])], customPlaces: c.customPlaces || [], customCats: c.customCats || [], actCat: c.actCat || {}, catNames: c.catNames || {} });
const applyChar = (c, d) => {
  if (!d) return;
  (d.addedActs || []).forEach(a => { if (!allActs(c).includes(a)) (c.acts.quotidien ||= []).push(a); });
  c.addedActs = [...(d.addedActs || [])];
  c.removedActs = new Set(d.removedActs || []);
  (d.addedRegions || []).forEach(r => { if (REGIONS[r] && !c.regions.includes(r)) { c.regions = REGION_ORDER.filter(x => x === r || c.regions.includes(x)); (c.added ||= new Set()).add(r); } });
  c.customPlaces = [...(d.customPlaces || [])];
  c.customPlaces.forEach(p => { PLACE_REGION[p.name] ||= p.region; if (p.zone) ZONE_OF[p.name] ||= p.zone; if (!c.places.includes(p.name)) c.places.push(p.name); });
  c.customCats = [...(d.customCats || [])]; c.actCat = { ...(d.actCat || {}) }; c.catNames = { ...(d.catNames || {}) }; applyActLayout(c);
};
const globalOf = () => enc({ alerts, events: EVENTS, arcs: ARCS, arcSeq,
  milestones: MILESTONES, contracts: CONTRACTS, workdays: WORKDAYS });
const applyGlobal = g => {
  const d = dec(g || {});
  if ('alerts' in d) replaceObj(alerts, d.alerts);
  if ('events' in d) replaceArr(EVENTS, d.events);
  if ('arcs' in d) replaceObj(ARCS, d.arcs);
  if ('arcSeq' in d) arcSeq = Math.max(arcSeq, d.arcSeq || 1);
  if ('milestones' in d) replaceObj(MILESTONES, d.milestones);
  if ('contracts' in d) replaceObj(CONTRACTS, d.contracts);
  if ('workdays' in d) replaceObj(WORKDAYS, d.workdays);
};
const dayOf = () => enc({ calm: calmBy, weather: weatherOn, rp: rpPlayed });

// ---------- Espace privé des couples (couples/{couple}/…) : lisible par les deux joueurs du couple seulement ----------
// Couples qui ont l'option nuit chaude ; identifiant = les deux personnages, triés, séparés par un tiret.
const COUPLES = PAIRS.filter(p => p.every(hasHot)).map(p => { const chars = [...p].sort(); return { id: chars.join('-'), chars, players: [...new Set(chars.map(playerOf))], mirror: chars.some(isMirror) }; });
const myCouples = () => COUPLES.filter(k => k.players.includes(me));
const COUPLE_NIGHT = {};   // id → { clé du jour → { hot, with } } : nuits chaudes passées (historique, wrap)
const attachNight = (id, key) => { const n = COUPLE_NIGHT[id]?.[key]; if (!n) return; const h = HISTORY[id] ||= {}; (h[key] ||= {}).night = n; };
// Journée du couple : nuits chaudes, « se protège », coquillage offert.
const coupleDayOf = k => enc({
  nights: Object.fromEntries(k.chars.map(x => [x, nightsBy[x]?.hot ? { hot: true, with: nightsBy[x].with ?? null } : null])),
  protect: Object.fromEntries(k.chars.map(x => [x, !!state[x].protect])),
  shell: Object.fromEntries(k.chars.map(x => [x, !!state[x].shell])) });
const applyCoupleDay = (k, d) => {
  d = dec(d || {});
  if (d.nights) k.chars.forEach(x => { if (d.nights[x]?.hot) nightsBy[x] = { hot: true, with: d.nights[x].with ?? null }; else delete nightsBy[x]; });
  if (d.protect) k.chars.forEach(x => { state[x].protect = !!d.protect[x]; });
  if (d.shell) k.chars.forEach(x => { state[x].shell = !!d.shell[x]; });
};
// Réglages durables du couple : amants (PNJ) et dernier choix « se protège ».
const ownProtectKey = (k, key) => k.chars.some(x => key === x || key.startsWith('pnj:' + x + ':'));
const coupleStateOf = k => enc({
  lovers: Object.fromEntries(k.chars.map(x => [x, LOVERS[x] || []])),
  protect: Object.fromEntries(Object.entries(lastProtect).filter(([key]) => ownProtectKey(k, key))) });
const applyCoupleState = (k, d) => {
  d = dec(d || {});
  if (d.lovers) k.chars.forEach(x => { LOVERS[x] = [...(d.lovers[x] || [])]; });
  if (d.protect) { Object.keys(lastProtect).filter(key => ownProtectKey(k, key)).forEach(key => delete lastProtect[key]); Object.assign(lastProtect, d.protect); }
};
// Heure de création d'une nouvelle venue de Firestore (horodatage serveur, ou texte ISO dans les tests).
const newsAt = n => n.createdAt?.toMillis?.() ?? (n.createdAt ? Date.parse(n.createdAt) : null);
const applyDay = g => {
  const d = dec(g || {});
  if ('rp' in d) replaceObj(rpPlayed, d.rp);
  if ('calm' in d) { const was = new Set(Object.keys(calmBy)); replaceObj(calmBy, d.calm); C.forEach(c => { if (calmBy[c.id] || was.has(c.id)) syncCalmState(c.id); }); }
  if ('weather' in d) replaceObj(weatherOn, d.weather);
};
// Encart public « Aujourd'hui » : humeur, activités publiques et lieu, seulement une fois la journée validée.
const todayOf = id => {
  const s = state[id]; if (!s.done) return null;
  const place = [...s.places].find(pl => !PRIVATE_PLACES[pl]) || (s.zone && zoneOf(s)?.label) || (s.region && REGIONS[s.region]?.label) || '';
  return { mood: s.mood || '', activities: [...s.checked].filter(a => !isPrivateAct(a)), place };
};
const dayNum = String(rpDay.getDate());
const curYm = `${rpDay.getFullYear()}-${String(rpDay.getMonth() + 1).padStart(2, '0')}`;
let typingDirty = false;
// Données reçues d'un autre joueur : réaffichage, sauf pendant une saisie de texte (repris quand on quitte le champ).
// Une case à cocher ou un bouton qui garde le focus (Firefox) ne bloque pas le réaffichage.
const isTyping = f => f && document.getElementById('view').contains(f)
  && (f.tagName === 'TEXTAREA' || f.tagName === 'SELECT' || (f.tagName === 'INPUT' && !/^(checkbox|radio|button|submit|reset|range|color)$/.test(f.type)));
let pointerDown = false;
document.addEventListener('pointerdown', () => { pointerDown = true; }, true);
document.addEventListener('pointerup', () => { pointerDown = false; if (typingDirty) setTimeout(rerender, 0); }, true);
const rerender = () => {
  if (isTyping(document.activeElement)) { typingDirty = true; return; }
  // Jamais entre l'appui et le relâchement : la fiche serait remplacée sous le pointeur et le clic tomberait à côté.
  if (pointerDown) { typingDirty = true; return; }
  typingDirty = false; renderNav(); current === 'home' ? renderHome() : current === 'events' ? renderEvents() : current === 'iloh' ? renderIloh() : current === 'liens' ? renderLinks() : current === 'search' ? null : renderChar(current);
};
document.addEventListener('focusout', () => setTimeout(() => { if (typingDirty && !pointerDown) rerender(); }, 0));

window.RP_APP = {
  ids: C.map(c => c.id),
  owned: () => C.filter(c => c.player === me && !c.mirror).map(c => c.id),   // les fiches recopiées de Journée RP ne s'écrivent pas d'ici
  setMe: m => { me = m; },
  isPlayer: p => PLAYERS.some(x => x.id === p),
  playerOf: id => C.find(c => c.id === id)?.player || null,
  iso: isoDay(rpDay), ym: curYm, day: dayNum,
  meaningful,
  hydrate: ({ global, day, chars, news }) => {
    applyGlobal(global); applyDay(day);
    C.forEach(c => applyChar(c, chars[c.id]));
    replaceArr(NEWS, (news || []).map(n => ({ to: n.to, text: n.text, charId: n.charId, key: n.key, read: !!n.read, at: newsAt(n) })));
  },
  // data : { '30': entrée, … } d'un document days/{id}/months/{AAAA-MM}
  applyMonth: (id, ym, data, withToday) => {
    const [y, m] = ym.split('-').map(Number);
    const h = HISTORY[id] ||= {};
    Object.entries(data || {}).forEach(([d, e]) => { const key = `${y}-${m}-${+d}`; h[key] = dec(e); attachNight(id, key); });
    if (withToday && ym === curYm && data?.[dayNum]) applyEntry(id, data[dayNum]);
  },
  applyGlobal, applyDay,
  couples: () => COUPLES, myCouples,
  // data : { '30': { nights, protect, shell }, … } d'un document couples/{couple}/months/{AAAA-MM}
  applyCoupleMonth: (cid, ym, data, withToday) => {
    const k = COUPLES.find(x => x.id === cid); if (!k) return;
    const [y, m] = ym.split('-').map(Number);
    Object.entries(data || {}).forEach(([d, v]) => {
      const key = `${y}-${m}-${+d}`, nights = dec(v)?.nights || {};
      k.chars.forEach(x => { (COUPLE_NIGHT[x] ||= {})[key] = nights[x]?.hot ? { hot: true, with: nights[x].with ?? null } : null; attachNight(x, key);
        if (!nights[x]?.hot && HISTORY[x]?.[key]) delete HISTORY[x][key].night; });
    });
    if (withToday && ym === curYm) applyCoupleDay(k, data?.[dayNum]);
  },
  applyCoupleState: (cid, d) => { const k = COUPLES.find(x => x.id === cid); if (k) applyCoupleState(k, d); },
  mirrors: () => C.filter(c => c.mirror).map(c => c.id),
  // Fiche recopiée + compléments Iloh (forme enregistrée : ensembles en { $set: [...] }).
  mergeExtra: (id, e, x) => {
    if (!x || (!x.added?.length && !Object.keys(x.withActs || {}).length)) return e;
    const out = JSON.parse(JSON.stringify(e || {})), c = C.find(k => k.id === id), set = new Set(out.checked?.$set || []);
    (x.added || []).forEach(l => { set.add(l); if (!allActs(c).includes(l)) { out.specials ||= []; if (!out.specials.includes(l)) out.specials.push(l); } });
    out.checked = { $set: [...set] };
    if (x.slots) out.slots = { ...(out.slots || {}), ...x.slots };
    out.withActs = { ...(out.withActs || {}), ...(x.withActs || {}) };
    return out;
  },
  applyRequests: list => { Object.keys(REQUESTS).forEach(k => delete REQUESTS[k]); list.forEach(({ id, ...r }) => { REQUESTS[id] = r; }); },
  applyIloh: d => { if (d?.guests) { Object.keys(ILOH_GUESTS).forEach(k => delete ILOH_GUESTS[k]); Object.assign(ILOH_GUESTS, d.guests); } },
  applyEvents: d => { Object.keys(GROUP_EVENTS).forEach(k => delete GROUP_EVENTS[k]); Object.assign(GROUP_EVENTS, d || {}); },
  applyNews: list => {
    list.forEach(n => {
      const x = NEWS.find(o => o.key === n.key);
      if (x) x.read = !!n.read; else NEWS.unshift({ to: n.to, text: n.text, charId: n.charId, key: n.key, read: !!n.read, at: newsAt(n) || Date.now() });
    });
  },
  snapshot: () => {
    const mine = C.filter(c => c.player === me);
    return {
      global: globalOf(), day: dayOf(),
      // Couples recopiés de Journée RP : lus ici, écrits seulement par le service du VPS.
      couples: Object.fromEntries(myCouples().filter(k => !k.chars.some(isMirror)).map(k => [k.id, { day: coupleDayOf(k), state: coupleStateOf(k) }])),
      entries: Object.fromEntries(mine.map(c => [c.id, entryOf(c.id)])),
      chars: Object.fromEntries(mine.map(c => [c.id, charDocOf(c)])),
      today: Object.fromEntries(mine.map(c => [c.id, todayOf(c.id)])),
      news: NEWS.filter(newsReady).map(n => ({ to: n.to, text: n.text, charId: n.charId, key: n.key, read: !!n.read })),
    };
  },
  rerender,
  start: () => { if (!openFromLink()) go('home'); },
};
