// S9 Interact' — logique de l'appli (générée depuis l'aperçu, voir dev/build.py).
const THEMES = {
  s9:     { cls: 't-s9', bg:'#0a0717', gold:'#d4ff09', text:'#eee9ff', dim:'#a59cc8', rule:'rgba(170,130,255,.32)', display:'"Chakra Petch", sans-serif', glyph:'9' },
  echo:   { cls: 't-s9', bg:'#0a0c1c', gold:'#2b8cff', text:'#eee9ff', dim:'#a59cc8', rule:'#2b8cff55', display:'"Chakra Petch", sans-serif', glyph:'◢' },
  prism:  { cls: 't-s9', bg:'#0e0a1c', gold:'#b24bff', text:'#eee9ff', dim:'#a59cc8', rule:'#b24bff55', display:'"Chakra Petch", sans-serif', glyph:'◆' },
  joy:    { cls: 't-s9', bg:'#08121a', gold:'#2ff5dc', text:'#eee9ff', dim:'#a59cc8', rule:'#2ff5dc55', display:'"Chakra Petch", sans-serif', glyph:'✦' },
  tala:   { cls: 't-s9', bg:'#140c0a', gold:'#ff8a1f', text:'#eee9ff', dim:'#a59cc8', rule:'#ff8a1f55', display:'"Chakra Petch", sans-serif', glyph:'▲' },
  aaron:  { cls: 't-s9', bg:'#08140c', gold:'#3dff6e', text:'#eee9ff', dim:'#a59cc8', rule:'#3dff6e55', display:'"Chakra Petch", sans-serif', glyph:'■' },
  yololo: { cls: 't-s9', bg:'#140a14', gold:'#ff2fa6', text:'#eee9ff', dim:'#a59cc8', rule:'#ff2fa655', display:'"Chakra Petch", sans-serif', glyph:'♥' },
};
const CATS = { quotidien:'Quotidien', metier:'Métier', liens:'Liens' };
// Catégories repliées (par personnage), gardées sur cet appareil.
const FOLDED = (() => { try { return new Set(JSON.parse(localStorage.getItem('rp-folded') || '[]')); } catch { return new Set(); } })();
const withOpen = new Set();   // sélecteurs « Avec d'autres personnages ? » ouverts (le temps de la session)
const isFolded = (id, k) => FOLDED.has(id + ':' + k);
const setFolded = (id, k, on) => { on ? FOLDED.add(id + ':' + k) : FOLDED.delete(id + ':' + k); try { localStorage.setItem('rp-folded', JSON.stringify([...FOLDED])); } catch {} };
// Catégories propres à un personnage (c.customCats) et activités déplacées d'une catégorie à l'autre (c.actCat),
// enregistrées sur la fiche du personnage.
const catsOf = c => [...Object.keys(CATS), ...(c.customCats || []).map(x => x.key)];
const catLabel = (c, k) => c.catNames?.[k] || CATS[k] || c.customCats?.find(x => x.key === k)?.label || k;   // c.catNames : noms changés des catégories de base
const renameCat = (c, k, v) => { const x = c.customCats?.find(y => y.key === k); if (x) x.label = v; else if (v === CATS[k]) delete c.catNames?.[k]; else (c.catNames ||= {})[k] = v; };
const pullAct = (c, a) => Object.values(c.acts).forEach(l => { const i = l.indexOf(a); if (i >= 0) l.splice(i, 1); });
const moveAct = (c, a, k) => { pullAct(c, a); (c.acts[k] ||= []).push(a); (c.actCat ||= {})[a] = k; };
const applyActLayout = c => Object.entries(c.actCat || {}).forEach(([a, k]) => {
  if (!catsOf(c).includes(k) || !Object.values(c.acts).some(l => l.includes(a))) return;
  pullAct(c, a); (c.acts[k] ||= []).push(a);
});
const APP_NAME = "S9 Interact'";
// ── Joueurs ────────────────────────────────────────────────────────────────
// id : identifiant technique (ne jamais le changer une fois des données saisies)
// color : bande des récaps Discord
const PLAYERS = [
  { id:'nono',    name:'Nono',    color:'#2b8cff', admin:true },
  { id:'jynette', name:'Jynette', color:'#b24bff' },
  { id:'eden',    name:'Eden',    color:'#2ff5dc' },
  { id:'idriss',  name:'Idriss',  color:'#ff8a1f' },
  { id:'lou',     name:'Lou',     color:'#ff2fa6' },
];

// ── Groupes (menu et filtres) ──────────────────────────────────────────────
const GROUP_DEFS = [
  { id:'Solution 9', glyph:'9' },
];
const GROUPS = GROUP_DEFS.map(g => g.id);

// ── Personnages ────────────────────────────────────────────────────────────
// gender : 'm' ou 'f' (accords des textes : « Inspiré » / « Inspirée »…)
// hotNights : option nuit chaude / protection / risque de grossesse (couples uniquement)
// mirror : fiche tenue dans Journée RP et recopiée chaque jour dans S9 Interact' par le service du VPS (lecture seule ici)
// acts : activités de base, par catégorie ; chaque joueur peut ensuite en ajouter ou en retirer dans l'appli
const G = ['Solution 9'];
const C = [
  // Nono — fiche tenue dans Journée RP
  { id:'echo', name:'Echo', surname:'', groups:G, theme:'echo', player:'nono', gender:'m', hotNights:true, mirror:true, acts:{
    quotidien:['Va à la salle de muscu', "Bidouille de drones perso'"],
    metier:['Prépare le set à la maison', "En studio avec la prod'", 'Set à Elek\'Trique'],
    liens:['Verre avec les copains', 'Soirée Piscine'] } },
  // Jynette — Prism tenue dans Journée RP
  { id:'prism', name:'Prism', surname:'', groups:G, theme:'prism', player:'jynette', gender:'f', hotNights:true, mirror:true, acts:{
    quotidien:['Shopping en ville'], metier:["Création à l'atelier"], liens:['Verre avec les copines'] } },
  { id:'aaron', name:'Aaron', surname:'', groups:G, theme:'aaron', player:'jynette', gender:'m', acts:{
    quotidien:['Salle de sport', 'Virée en ville'], metier:['Journée de travail'], liens:['Verre avec les copains', 'Soirée au club'] } },
  // Eden
  { id:'joy', name:'Joy', surname:'', groups:G, theme:'joy', player:'eden', gender:'f', acts:{
    quotidien:['Soin de ses deux chats', 'Nail art', 'Lithothérapie'], metier:['Répétition de chant', 'Composition', 'Concert'],
    liens:['Soirée en club', 'Danse', 'Verre avec les copains'] } },
  // Idriss
  { id:'tala', name:'Tala', surname:'', groups:G, theme:'tala', player:'idriss', gender:'f', acts:{
    quotidien:['Balade dans les Faubourgs', 'Salle de sport'], metier:['Journée de travail'], liens:['Verre avec les copains', 'Soirée au club'] } },
  // Lou
  { id:'yololo', name:'Yololo', surname:'', groups:G, theme:'yololo', player:'lou', gender:'f', acts:{
    quotidien:['Shopping en ville', 'Salle de sport'], metier:['Journée de travail'], liens:['Verre avec les copines', 'Soirée au club'] } },
];

// Tranches horaires approximatives ; la journée RP commence à l'aube (5 h).
const SLOTS = [
  { id:'aube', label:'Aube', hint:'5 h – 8 h', icon:'aube' },
  { id:'matin', label:'Matin', hint:'8 h – 12 h', icon:'matin' },
  { id:'midi', label:'Midi', hint:'12 h – 14 h', icon:'midi' },
  { id:'aprem', label:'Après-midi', hint:'14 h – 18 h', icon:'aprem' },
  { id:'soir', label:'Soirée', hint:'18 h – 22 h', icon:'soir' },
  { id:'nuit', label:'Nuit', hint:'22 h – 5 h', icon:'nuit' },
];
// Petites icônes au trait, dessinées dans la couleur du thème.
const ICONS = {
  aube:  '<path d="M3 18h18"/><path d="M7 18a5 5 0 0 1 10 0"/><path d="M12 6v3M5.6 9.6l2 2M18.4 9.6l-2 2"/>',
  matin: '<circle cx="12" cy="13" r="3.5"/><path d="M12 5v2.5M12 18.5V21M4 13h2.5M17.5 13H20M6.3 7.3l1.8 1.8M15.9 16.9l1.8 1.8M17.7 7.3l-1.8 1.8M8.1 16.9l-1.8 1.8"/>',
  midi:  '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8"/>',
  aprem: '<circle cx="9" cy="10" r="3.5"/><path d="M9 3v1.5M3 10h1.5M4.8 5.8l1 1M13.2 5.8l-1 1"/><path d="M10 19h8a3 3 0 0 0 0-6 4.5 4.5 0 0 0-8.3 1.6A2.2 2.2 0 0 0 10 19z"/>',
  soir:  '<path d="M3 17h18M7 21h10"/><path d="M7 17a5 5 0 0 1 10 0"/><path d="M12 3v5M9.8 6l2.2 2.2L14.2 6"/>',
  nuit:  '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/><path d="M17 4l.6 1.4L19 6l-1.4.6L17 8l-.6-1.4L15 6l1.4-.6z"/>',
};
Object.assign(ICONS, {
  clouds:  '<path d="M7 18h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.4 1.8A3.2 3.2 0 0 0 7 18z"/>',
  fog:     '<path d="M4 9h16M6 13h12M4 17h16"/>',
  wind:    '<path d="M3 9h11a3 3 0 1 0-3-3M3 14h15a3 3 0 1 1-3 3M3 19h7"/>',
  rain:    '<path d="M7 14h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.4 1.8A3.2 3.2 0 0 0 7 14z"/><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3"/>',
  thunder: '<path d="M7 13h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.4 1.8A3.2 3.2 0 0 0 7 13z"/><path d="M12.5 13l-2 4h3l-2 4"/>',
});
ICONS.temp = '<path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 9v7.5"/><circle cx="12" cy="17.5" r="1.2"/>';
ICONS.snow = '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="M9.8 4.6 12 6.4l2.2-1.8M9.8 19.4 12 17.6l2.2 1.8"/>';
ICONS.ground = '<path d="M3 19c3-2.2 6-2.2 9 0s6 2.2 9 0"/><path d="M12 4v9M8.1 6.2l7.8 4.6M8.1 10.8l7.8-4.6"/>';
ICONS.lips = '<path style="fill:currentColor;stroke:none" d="M2 12c2.2-3.2 4.6-5 6.6-5 1.4 0 2.4.8 3.4 1.6 1-.8 2-1.6 3.4-1.6 2 0 4.4 1.8 6.6 5-2.6 3.6-6 5.6-10 5.6S4.6 15.6 2 12z"/><path style="stroke:var(--bg)" stroke-width="1.1" d="M4 12.1c2.6.9 5.3 1.1 8 .3 2.7.8 5.4.6 8-.3"/>';
ICONS.shield = '<path d="M12 3l7 3v5c0 4.6-3 8.2-7 10-4-1.8-7-5.4-7-10V6z"/><path d="M9 12l2 2 4-4"/>';
ICONS.globe = '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.3 3.8 8.5s-1.2 6.1-3.8 8.5c-2.6-2.4-3.8-5.3-3.8-8.5s1.2-6.1 3.8-8.5z"/>';
ICONS.route = '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8"/>';
ICONS.warn = '<path d="M12 3.5 21.5 20h-19z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.2" r=".6" style="fill:currentColor"/>';
ICONS.users = '<circle cx="9" cy="8" r="3.2"/><path d="M3 19.5c.6-3.4 3-5.3 6-5.3s5.4 1.9 6 5.3"/><circle cx="16.8" cy="8.8" r="2.6"/><path d="M16.5 14.3c2.4.2 4 1.8 4.5 4.6"/>';
ICONS.calendar = '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h2M14 14h2M8 17h2"/>';
ICONS.box = '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>';
ICONS.search = '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>';
ICONS.map = '<path d="M3.5 6.5l5-2 7 2.5 5-2v13l-5 2-7-2.5-5 2z"/><path d="M8.5 4.5v13M15.5 7v13"/>';
ICONS.flag = '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>';
ICONS.zone = '<path d="M3 19 9.5 8l4 6.5 2.5-4L21 19z"/>';
ICONS.star = '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>';
ICONS.camera = '<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>';
ICONS.plus = '<path d="M12 5v14M5 12h14"/>';
ICONS.minus = '<path d="M5 12h14"/>';
ICONS.gear = '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5"/><circle cx="12" cy="12" r="6.2"/>';
ICONS.pencil = '<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z"/><path d="M13.5 7l3 3"/>';
ICONS.trash = '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5"/>';
ICONS.check = '<path d="M5 12.5l4.5 4.5L19 7.5"/>';
ICONS.checks = '<path d="M2.5 12.5 6.5 16.5 14 8M10 15.5l1 1L21.5 6"/>';
ICONS.cross = '<path d="M6 6l12 12M18 6 6 18"/>';
ICONS.foldall = '<path d="M7 10l5-5 5 5M7 19l5-5 5 5"/>';
ICONS.unfoldall = '<path d="M7 5l5 5 5-5M7 14l5 5 5-5"/>';
ICONS.dice = '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1" style="fill:currentColor"/><circle cx="15" cy="15" r="1" style="fill:currentColor"/><circle cx="15" cy="9" r="1" style="fill:currentColor"/><circle cx="9" cy="15" r="1" style="fill:currentColor"/>';
ICONS.heartbeat = '<path d="M3 12h4l2-4 3 8 2-5 1.5 1H21"/>';
ICONS.brain = '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h1V4H9zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3h-1V4h1z"/>';
ICONS.cake = '<path d="M4 20h16v-7H4z"/><path d="M4 15.5c2 1.3 4 1.3 6 0s4-1.3 6 0 3 1.3 4 0"/><path d="M12 13V9.5M12 7.5c-.9-.9-.9-2 0-3.5.9 1.5.9 2.6 0 3.5z"/>';
ICONS.ring = '<circle cx="12" cy="14.5" r="6"/><path d="M9.5 4.5h5L16 7l-4 2.5L8 7z"/>';
ICONS.target = '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>';
ICONS.eye = '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>';
// Icônes des états de nuit
ICONS.ghost = '<path d="M6 20V10a6 6 0 0 1 12 0v10l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5z"/><circle cx="10" cy="10" r=".9" style="fill:currentColor"/><circle cx="14" cy="10" r=".9" style="fill:currentColor"/>';
ICONS.wakeful = '<path d="M2 13s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 13 2 13z"/><circle cx="12" cy="13" r="2.6"/><path d="M12 2v2.5M5.5 4.5l1.3 2M18.5 4.5l-1.3 2"/>';
ICONS.zigzag = '<path d="M3 8l3-3 3 3 3-3 3 3 3-3 3 3M3 16l3-3 3 3 3-3 3 3 3-3 3 3"/>';
ICONS.cuddle = '<circle cx="8" cy="7" r="2.6"/><circle cx="16" cy="7" r="2.6"/><path d="M3.5 20c0-4 2-7 4.5-7 1.6 0 2.8.9 4 2.6 1.2-1.7 2.4-2.6 4-2.6 2.5 0 4.5 3 4.5 7"/>';
ICONS.feather = '<path d="M20 4c-7 0-12 5-12 12v4M8 16h6M10 12h7c2-2 3-5 3-8"/>';
ICONS.clock = '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>';
ICONS.bell = '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>';
ICONS.phone = '<path d="M7 3h4l1.5 5-2.5 1.5a11 11 0 0 0 4.5 4.5L16 11.5l5 1.5v4a2 2 0 0 1-2 2A16 16 0 0 1 5 5a2 2 0 0 1 2-2z"/>';
ICONS.pacifier = '<path d=\"M10.3 8.6V5.4a1.7 1.7 0 0 1 3.4 0v3.2\"/><path d=\"M4.5 10.6c0-1.6 2.6-2.2 7.5-2.2s7.5.6 7.5 2.2-2.6 2.6-7.5 2.6-7.5-1-7.5-2.6z\"/><circle cx=\"8.3\" cy=\"10.8\" r=\".5\" style=\"fill:currentColor\"/><circle cx=\"15.7\" cy=\"10.8\" r=\".5\" style=\"fill:currentColor\"/><path d=\"M12 13.2v1.4\"/><circle cx=\"12\" cy=\"17.8\" r=\"3.2\"/>';
ICONS.pin = '<path d="M12 21s-6-5.6-6-10.5a6 6 0 0 1 12 0C18 15.4 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.2"/>';
ICONS.disc = '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.2"/><path d="M12 6.2a5.8 5.8 0 0 1 5.8 5.8"/>';
ICONS.delivery = '<path d="M3 7.5h10v8.5H3z"/><path d="M13 10.5h4l3 3v2.5h-7z"/><circle cx="7" cy="17.5" r="1.6"/><circle cx="16.5" cy="17.5" r="1.6"/>';
ICONS.shell = '<path d="M12 20c-4.5 0-8-3.4-8-8.2C4 7.6 7.5 4 12 4s8 3.6 8 7.8c0 4.8-3.5 8.2-8 8.2z"/><path d="M12 20V4M12 20 7.2 6M12 20l4.8-14M12 20 4.6 9.6M12 20l7.4-10.4"/>';
ICONS.cloth = '<path d="M9 3.5 4 6l1.6 4.2L8 9.4V20h8V9.4l2.4.8L20 6l-5-2.5c-.5 1.4-1.6 2.2-3 2.2s-2.5-.8-3-2.2z"/>';
const icon = k => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;
// Tranche proposée par défaut : celle choisie la dernière fois, sinon un indice du libellé.
const lastSlot = {};
const guessSlot = label => lastSlot[label] || (/nuit/i.test(label) ? ['nuit'] : /méditation/i.test(label) ? ['aube'] : null);
// Une activité peut couvrir plusieurs périodes : on les regroupe en une plage pour le résumé.
const spanOf = ids => {
  const idx = SLOTS.map((x, i) => ids.includes(x.id) ? i : -1).filter(i => i >= 0);
  if (!idx.length) return { key:'none', order:99, label:'Sans heure', hint:'', icon:'' };
  const first = SLOTS[idx[0]], last = SLOTS[idx[idx.length - 1]];
  const contiguous = idx[idx.length - 1] - idx[0] === idx.length - 1;
  if (idx.length === 1) return { key:first.id, order:idx[0], label:first.label, hint:first.hint, icon:first.icon };
  return contiguous
    ? { key:idx.join('-'), order:idx[0], label:`${first.label} → ${last.label}`, hint:`${first.hint.split(' – ')[0]} – ${last.hint.split(' – ')[1]}`, icon:first.icon }
    : { key:idx.join('-'), order:idx[0], label:idx.map(i => SLOTS[i].label).join(' + '), hint:'', icon:first.icon };
};

// État local de l'aperçu (non enregistré)
// Lieux du jour proposés par personnage (on peut en ajouter depuis la fiche).
const S9_PLACES = ['S9', "Elek'Trique", 'Les Faubourgs', 'Chez Prism & Echo', 'Tuliyollal', "Yak'Tel", 'Shaaloani'];
const PLACES_OF = {};
const PLACES = Object.fromEntries(C.map(c => [c.id, PLACES_OF[c.id] || S9_PLACES]));
const initPlaces = () => C.forEach(c => {
  const list = PLACES[c.id] || [];
  c.places = list.filter(pl => PLACE_REGION[pl]);
  const regs = list.map(pl => PLACE_REGION[pl] || REGION_NAME[pl]).filter(Boolean);
  // Régions masquées par défaut sur certaines fiches ; elles restent ajoutables depuis « Autres ».
  const hidden = HIDDEN_REGIONS[c.id] || [];
  c.regions = REGION_ORDER.filter(r => !hidden.includes(r));
});
const state = {}; C.forEach(c => state[c.id] = { mood:'', checked:new Set(), specials:[], slots:{}, places:new Set(), done:false });
let current = 'home', filter = 'all', groupFilter = 'all';
// Droits : chacun modifie ses personnages, et ne fait que lire ceux de l'autre.
// « me » vient du compte Google connecté (fixé par sync.js avant le premier affichage).
let me = null;
const PLAYER_NAME = Object.fromEntries(PLAYERS.map(p => [p.id, p.name]));
// Admin : rôle lu dans Firestore par sync.js (window.RP_ADMIN) ; dans l'aperçu, celui de la config.
const isAdminMe = () => window.RP_ADMIN ?? !!PLAYERS.find(p => p.id === me)?.admin;
// ---------- Nouvelles : ce que l'autre joueur a ajouté sur vos personnages ----------
const NEWS = [];   // { to, text, charId, key, read, at (heure de création) }
let newsDayOpen = false;   // menu « Nouvelles du jour » ouvert ou replié (garde l'état entre deux affichages)
const playerOf = id => C.find(c => c.id === id)?.player;
const notify = (from, to, text, key) => {
  if (!isChar(to) || playerOf(from) === playerOf(to)) return;          // seulement d'un joueur à l'autre
  if (NEWS.some(n => n.key === key)) return;
  NEWS.unshift({ to: playerOf(to), text, charId: to, key, read: false, src: from, at: Date.now() });
};
// Phrases tirées au sort (la même pour une même nuit).
const queName = n => (/^[aeiouéèh]/i.test(n) ? "qu'" : 'que ') + n;
const deName = n => (/^[aeiouéèh]/i.test(n) ? "d'" : 'de ') + n;
const pickLine = (list, key) => list[Math.floor(seeded(key) * list.length)];
const NIGHT_LINES = [
  a => `${a} l'assure, la nuit a été chaude !`,
  a => `${a} a passé une nuit brûlante…`,
  a => `Les draps ${deName(a)} s'en souviennent encore.`,
  a => `${a} n'a pas beaucoup dormi cette nuit.`,
  a => `Nuit agitée pour ${a} : personne ne s'en plaindra.`,
  (a, b) => `${a} et ${b} ont fait grimper la température cette nuit.`,
  a => `Le feu de camp s'est éteint, pas celui de ${a}.`,
  a => `${a} affiche ce matin un sourire très satisfait.`,
  (a, b) => `${a} et ${b} n'ont pas vu passer la nuit.`,
  a => `Il paraît que ${a} a encore les joues rouges.`,
  (a, b) => `Nuit de braise pour ${a} et ${b}.`,
];
// Réservées aux couples khurdans (les deux personnages dans la catégorie Khurdans).
const NIGHT_LINES_KHURDAN = [
  (a, b) => `${a} et ${b} ont réveillé les voisins… et peut-être les chevaux.`,
];
// Jours de travail récurrents (réglés par l'admin) : ces soirs-là, le partenaire ne peut pas cocher une nuit avec ce personnage.
const WORKDAYS = {};   // id → Set de jours (1 = lundi … 7 = dimanche)
const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const weekday = d => (d.getDay() + 6) % 7 + 1;
const worksTonight = id => !!WORKDAYS[id]?.has(weekday(rpDay));
const blockedWith = (id, w) => w && isChar(w) && partnerOf(w) === id && worksTonight(w);
const workdaysBlock = id => !WORKDAYS[id] || !partnerOf(id) ? '' : `<section><h2>Jours de travail</h2>
  <div class="place-list" role="group" aria-label="Jours de travail récurrents">${DAY_NAMES.map((d, i) => `<button type="button" data-workday="${i + 1}" aria-pressed="${WORKDAYS[id].has(i + 1)}">${d}</button>`).join('')}</div>
  <p class="reserved">${worksTonight(id) ? `${nameOf(id)} travaille ce soir : ${nameOf(partnerOf(id))} ne pourra pas cocher sa nuit avec ${isFem(id) ? 'elle' : 'lui'}.` : `Ces soirs-là, ${nameOf(partnerOf(id))} ne pourra pas cocher sa nuit avec ${isFem(id) ? 'elle' : 'lui'}.`}</p>
</section>`;
const isKhurdan = id => isChar(id) && C.find(c => c.id === id).groups.includes('Khurdans');
const nightLinesFor = (a, b) => [...NIGHT_LINES, ...(isKhurdan(a) && isKhurdan(b) ? NIGHT_LINES_KHURDAN : [])];
// Nuit sans protection : le joueur de la femme concernée est averti, quel que soit le joueur qui l'a cochée.
const RISK_LINES = [
  (f, m) => `${f} a-t-elle rencontré un champion parmi les compétiteurs de ${m} ?`,
  (f, m) => `${m} ne s'est pas protégé : la course est lancée chez ${f}…`,
  (f, m) => `Les petits nageurs de ${m} ont tenté leur chance chez ${f} cette nuit.`,
  (f, m) => `Faut-il prévoir un berceau pour ${f} ? ${m} ne s'est pas protégé.`,
  (f, m) => `Loterie de la nuit : ${f} a-t-elle tiré le bon numéro avec ${m} ?`,
  (f, m) => `${m} a joué sans filet avec ${f}. Réponse dans neuf lunes ?`,
  (f, m) => `Un petit ${m} est-il en route chez ${f} ?`,
  (f, m) => `Pas de bouclier pour ${m} cette nuit : ${f} gardera-t-elle un souvenir durable ?`,
  (f, m) => `${m} a semé sans compter chez ${f}. La récolte sera-t-elle bonne ?`,
];
// Retire les nouvelles du jour devenues fausses (nuit annulée, partenaire changé, protection cochée).
const dropNews = keys => { for (let i = NEWS.length - 1; i >= 0; i--) if (keys.includes(NEWS[i].key)) NEWS.splice(i, 1); window.RP_SYNC?.dropNews(keys); };
// ---------- Activités communes : d'autres personnages de l'appli cochés sur une activité (withActs[activité] = [ids]) ----------
const withOf = (wa, l) => (wa?.[l] || []).filter(isChar);
const andList = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' et ' + a[a.length - 1];
const withTxt = (wa, l) => (w => w.length ? ' avec ' + andList(w.map(nameOf)) : '')(withOf(wa, l));
const withKey = (id, other, l) => 'with:' + keyOf(rpDay) + ':' + id + ':' + other + ':' + l;
// Pas d'activité commune sur un voyage (il a sa section) ni sur une activité intime.
const canShareAct = l => l !== 'Voyage' && !/^Sexe avec /i.test(l);
const setWith = (id, l, other, on, quiet = false) => {
  const s = state[id], cur = new Set(withOf(s.withActs, l));
  on ? cur.add(other) : cur.delete(other);
  s.withActs ||= {};
  if (cur.size) s.withActs[l] = [...cur]; else delete s.withActs[l];
  if (on && !quiet) notify(id, other, `${nameOf(id)} a noté « ${l} » avec ${nameOf(other)}.`, withKey(id, other, l));
  else dropNews([withKey(id, other, l)]);
};
// Activités où un autre personnage (fiche validée) a mentionné celui-ci aujourd'hui.
const sharedActsOf = id => C.filter(x => x.id !== id && state[x.id]?.done).flatMap(x => Object.entries(state[x.id].withActs || {})
  .filter(([l, ids]) => ids.includes(id) && state[x.id].checked?.has(l)).map(([l, ids]) => ({ from: x.id, act: l, others: ids.filter(o => o !== id && isChar(o)) })));
const sharedActsHtml = (id, canJoin) => {
  const L = sharedActsOf(id), E = evActsOf(id); if (!L.length && !E.length) return '';
  const evItems = E.map(x => `<div class="shared-item"><span>${icon(evType(x.e.type).icon)}Événement de Solution 9 : « ${esc(x.e.text)} »${goingOf(x.e).length > 1 ? ` avec ${esc(andList(goingOf(x.e).filter(o => o !== id).map(nameOf)))}` : ''}.</span>
    ${canJoin ? state[id].checked.has(x.act) ? '<small class="joined">✓ Sur la fiche</small>' : `<button type="button" class="join-btn" data-ev-act="${x.evId}">${icon('plus')}L'ajouter à la fiche ${deName(nameOf(id))}</button>` : ''}</div>`).join('');
  return `<div class="shared-acts"><p class="shared-h">${icon('users')}Activités communes du jour</p>${evItems}${L.map(a => `<div class="shared-item"><span>${esc(nameOf(a.from))} a noté « ${esc(a.act)} » avec ${esc(andList([nameOf(id), ...a.others.map(nameOf)]))}.</span>
    ${canJoin ? state[id].checked.has(a.act) ? '<small class="joined">✓ Sur la fiche</small>' : `<button type="button" class="join-btn" data-join-from="${a.from}" data-join-act="${esc(a.act)}">${icon('plus')}L'ajouter à la fiche ${deName(nameOf(id))}</button>` : ''}</div>`).join('')}</div>`;
};
// Reprend l'activité d'un autre personnage : cochée (en activité spéciale si elle n'est pas dans la liste), mêmes moments, mêmes personnages.
const joinAct = (id, from, l) => {
  const s = state[id], c = C.find(x => x.id === id);
  if (!allActs(c).includes(l) && !s.specials.includes(l)) s.specials.push(l);
  s.checked.add(l);
  if (!s.slots[l] && state[from].slots?.[l]?.length) s.slots[l] = [...state[from].slots[l]];
  const told = new Set([playerOf(id)]);   // une seule nouvelle par joueur
  [from, ...withOf(state[from].withActs, l).filter(o => o !== id)].forEach(o => { setWith(id, l, o, true, told.has(playerOf(o))); told.add(playerOf(o)); });
  saveComplement(id);
};
const clearWith = (id, l) => { const s = state[id]; withOf(s.withActs, l).forEach(o => dropNews([withKey(id, o, l)])); if (s.withActs) delete s.withActs[l]; };
// ---------- Compléments S9 Interact' des fiches recopiées de Journée RP ----------
// La fiche vient de Journée RP (lecture seule ici) ; son joueur peut y ajouter, dans S9 Interact' seulement, les personnages
// présents sur une activité, les activités communes reprises d'autres fiches, et des activités propres à Solution 9.
// Enregistré à part (extras/{id}/months/{AAAA-MM}), jamais écrasé par la recopie, jamais renvoyé vers Journée RP.
const canComplete = id => isMirror(id) && playerOf(id) === me;
// Activités du jour venues de Journée RP (le reste a été ajouté dans S9 Interact').
const mirrorBase = id => new Set(window.RP_SYNC?.rawToday?.(id)?.checked?.$set || []);
const extraOf = id => {
  const s = state[id], base = mirrorBase(id), added = [...s.checked].filter(l => !base.has(l));
  return { added, slots: Object.fromEntries(added.filter(l => s.slots?.[l]?.length).map(l => [l, [...s.slots[l]]])), withActs: JSON.parse(JSON.stringify(s.withActs || {})) };
};
const saveComplement = id => { if (canComplete(id)) window.RP_SYNC?.saveExtra?.(id, extraOf(id)); };
const complOpen = new Set();
const withPickHtml = (id, label, attr) => { const withIds = withOf(state[id].withActs, label), fold = attr === 'x' ? 'data-xwith-fold' : 'data-with-fold';
  return `<details class="with-pick" ${fold}="${esc(label)}" ${(attr === 'x' ? complOpen : withOpen).has(id + ':' + label) ? 'open' : ''}>
    <summary>${icon('users')}<span>${withIds.length ? 'Avec ' + esc(andList(withIds.map(nameOf))) : 'Avec d\'autres personnages ?'}</span></summary>
    <div class="place-list subs" role="group" aria-label="Personnages présents">${C.filter(x => x.id !== id).sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      .map(x => `<button type="button" data-${attr === 'x' ? 'xshare' : 'share'}-act="${esc(label)}" data-${attr === 'x' ? 'xshare' : 'share'}="${x.id}" aria-pressed="${withIds.includes(x.id)}">${esc(x.name)}</button>`).join('')}</div></details>`; };
const complementHtml = id => {
  if (!canComplete(id)) return '';
  const s = state[id], c = C.find(x => x.id === id), base = mirrorBase(id), acts = [...s.checked].filter(canShareAct);
  return `<section class="compl"><p class="shared-h">${icon('users')}Compléments pour S9 Interact'</p>
    <p class="reserved">La fiche vient de Journée RP. Ici, tu ajoutes seulement ce qui concerne le groupe ; Journée RP n'est pas modifié.</p>
    ${acts.map(l => `<div class="compl-act"><p class="compl-name">${esc(l)}${base.has(l) ? '' : ` <small>· ajoutée dans S9 Interact'</small> <button type="button" class="link small" data-xdel="${esc(l)}" aria-label="Retirer ${esc(l)}">Retirer</button>`}</p>
      ${withPickHtml(id, l, 'x')}</div>`).join('') || '<p class="reserved">Aucune activité pour l\'instant aujourd\'hui.</p>'}
    <div class="special-row"><input type="text" id="xadd-${id}" list="xacts-${id}" placeholder="Ajouter une activité de Solution 9" enterkeyhint="done">
      <button type="button" class="btn" data-xadd="${id}">Ajouter</button></div>
    <datalist id="xacts-${id}">${allActs(c).filter(l => !s.checked.has(l) && l !== 'Voyage').map(l => `<option value="${esc(l)}">`).join('')}</datalist></section>`;
};
document.addEventListener('toggle', e => { const d = e.target; if (!d.matches?.('details[data-xwith-fold]')) return; const k = current + ':' + d.dataset.xwithFold; d.open ? complOpen.add(k) : complOpen.delete(k); }, true);
document.addEventListener('click', e => {
  const id = current; if (!canComplete(id)) return;
  const sh = e.target.closest('[data-xshare]'), del = e.target.closest('[data-xdel]'), add = e.target.closest('[data-xadd]'), join = e.target.closest('.compl-join');
  if (sh) { setWith(id, sh.dataset.xshareAct, sh.dataset.xshare, sh.getAttribute('aria-pressed') !== 'true'); saveComplement(id); return renderChar(id); }
  if (del) { const l = del.dataset.xdel, s = state[id]; s.checked.delete(l); delete s.slots[l]; clearWith(id, l); s.specials = s.specials.filter(x => x !== l); saveComplement(id); return renderChar(id); }
  if (add) { const f = document.getElementById('xadd-' + id), l = f.value.trim(); if (!l) return f.focus();
    const s = state[id], c = C.find(x => x.id === id); if (!allActs(c).includes(l) && !s.specials.includes(l)) s.specials.push(l);
    s.checked.add(l); saveComplement(id); return renderChar(id); }
});
document.addEventListener('keydown', e => { if (e.target.id?.startsWith?.('xadd-') && e.key === 'Enter') { e.preventDefault(); document.querySelector(`[data-xadd="${e.target.id.slice(5)}"]`)?.click(); } });

const pairKeys = (a, b) => { const d = keyOf(rpDay); return ['night:' + d + ':' + [a, b].sort().join('+'), 'risk:' + d + ':' + a + ':' + b, 'risk:' + d + ':' + b + ':' + a]; };
const checkRisk = id => {
  const n = nightOf(id); if (!n.hot || !n.with) return;
  const pair = [id, n.with], woman = pair.find(x => isChar(x) && isFem(x)), man = pair.find(x => x !== woman);
  if (!woman || !man) return;
  const unsafe = isChar(man) ? !isFem(man) && !state[man].protect : !pnjProtect(woman, man);
  if (!unsafe) return;
  const key = 'risk:' + keyOf(rpDay) + ':' + woman + ':' + man;
  if (NEWS.some(x => x.key === key)) return;
  // Une seule phrase, claire : « X ne s'est pas protégé. Y est-elle enceinte ? », pour le joueur de Y (sauf s'il l'a cochée lui-même).
  if (playerOf(woman) === playerOf(id)) return;
  const text = `${whoLabel(man)} ne s'est pas protégé. ${nameOf(woman)} est-elle enceinte ?`;
  NEWS.unshift({ to: playerOf(woman), text, charId: woman, key, read: false, src: id, at: Date.now() });
};
// ---------- Carte de Solution 9 : les 53 yourtes (x, y = pastille du numéro sur la carte, en % de l'image) ----------
// chars : occupants ; kind : lieu (fonction), libre (à prendre), invites, speciale ; map : nom écrit sur la carte ; size : taille du dessin.
const YURTS = {
  1: { x:89.31, y:52.88, chars:['tamachag','taiga'], map:'Yourte du khan et de la khatun', size:'xl' },
  2: { x:91.36, y:69.25, kind:'speciale' },
  3: { x:95.07, y:74.55, kind:'speciale' },
  4: { x:83.5, y:70.08, kind:'lieu', label:'Yourte des Faucons', size:'l' },
  5: { x:73.93, y:62.66, chars:['reaksa'], map:'Fauconnière et maître équin', size:'m' },
  6: { x:65.04, y:71.29, kind:'lieu', label:'Yourte des Tatouages', staff:['inkaraa'] },
  7: { x:72.27, y:76.6, kind:'lieu', label:'Yourte des Captifs', size:'m' },
  8: { x:84.42, y:84.53, chars:['altan'] },
  9: { x:78.86, y:89.96, chars:['buyan'] },
  10: { x:71.88, y:89.19, kind:'libre' },
  11: { x:57.67, y:81.2, kind:'libre' },
  12: { x:53.81, y:85.55, kind:'libre' },
  13: { x:48.0, y:80.18, kind:'libre' },
  14: { x:56.3, y:67.71, chars:['cheyenne'], map:'Guérisseuse', size:'m' },
  15: { x:47.56, y:64.07, kind:'lieu', label:'Yourte des Soins', size:'l' },
  16: { x:45.07, y:90.86, kind:'libre' },
  17: { x:39.6, y:83.25, kind:'libre' },
  18: { x:35.69, y:87.72, kind:'libre' },
  19: { x:25.54, y:90.22, chars:['shiruun'] },
  20: { x:26.12, y:78.84, chars:['ogloo'] },
  21: { x:18.07, y:84.21, chars:['taivan'] },
  22: { x:13.18, y:82.1, kind:'libre' },
  23: { x:24.27, y:67.71, kind:'libre' },
  24: { x:16.5, y:68.29, kind:'lieu', label:'Yourte des Ateliers', size:'l' },
  25: { x:11.28, y:63.55, chars:['boroo'] },
  26: { x:8.01, y:70.2, kind:'libre' },
  27: { x:3.81, y:65.73, kind:'libre' },
  28: { x:8.69, y:50.32, chars:['henbilee'], map:"Yourte de l'Udgan", size:'l' },
  29: { x:15.77, y:44.88, chars:['djokhodthai'] },
  30: { x:11.04, y:41.62, kind:'libre' },
  31: { x:5.91, y:36.51, kind:'libre' },
  32: { x:16.94, y:36.7, kind:'libre' },
  33: { x:12.94, y:29.35, kind:'libre' },
  34: { x:8.94, y:24.36, chars:['ankhbayar','khubunjin'] },
  35: { x:18.07, y:22.06, kind:'libre' },
  36: { x:23.49, y:25.58, kind:'libre' },
  37: { x:23.78, y:34.14, kind:'lieu', label:'Yourte des Savoirs', size:'l' },
  38: { x:32.67, y:36.0, kind:'libre' },
  39: { x:29.54, y:28.64, kind:'libre' },
  40: { x:27.39, y:17.97, kind:'libre' },
  41: { x:37.99, y:30.37, kind:'libre' },
  42: { x:41.75, y:19.12, chars:['javkhaanhun'] },
  43: { x:49.22, y:21.04, kind:'lieu', label:'Yourte Commune', size:'xxl' },
  44: { x:58.5, y:18.93, chars:['khokkutsai','inkaraa'] },
  45: { x:60.94, y:29.41, kind:'invites', map:'Baras', size:'m' },
  46: { x:66.6, y:23.59, kind:'libre', elite:true },
  47: { x:69.14, y:15.03, kind:'libre', elite:true },
  48: { x:74.27, y:20.65, kind:'libre', elite:true },
  49: { x:70.31, y:33.31, kind:'invites', map:'Hainag', size:'m' },
  50: { x:75.49, y:28.64, kind:'libre', elite:true },
  51: { x:80.86, y:25.96, kind:'libre', elite:true },
  52: { x:87.4, y:30.24, kind:'libre', elite:true },
  53: { x:95.41, y:45.59, kind:'invites', map:'Mammouth', size:'m' },
};
const YURT_SIZE = { s:[6.4, 9], m:[8.4, 12.5], l:[9.2, 13.5], xl:[10.5, 15.5], xxl:[14, 17.5] };   // largeur, hauteur de la zone cliquable (%)
// Autres lieux de la carte (x, y = coin haut gauche ; w, h = taille, en % de l'image). Les yourtes passent par-dessus.
const ILOH_SPOTS = {
  tour1: { x:32.2, y:16.4, w:4.6, h:11.5, kind:'tour', title:'Tour de guet n° 1' },
  tour2: { x:93.2, y:32.2, w:4.6, h:11.5, kind:'tour', title:'Tour de guet n° 2' },
  tour3: { x:61.4, y:80.4, w:4.6, h:11.5, kind:'tour', title:'Tour de guet n° 3' },
  tour4: { x:2.1, y:75.2, w:4.6, h:11.5, kind:'tour', title:'Tour de guet n° 4' },
  arc: { x:26.1, y:1.3, w:38.5, h:15, kind:'zone', title:"Zone d'entraînement des guerriers et guerrières" },
  chevaux: { x:74, y:7.3, w:24.5, h:23.6, kind:'zone', title:'Enclos des chevaux khurdans' },
  ours: { x:76.4, y:36.2, w:12.6, h:15.8, kind:'zone', title:'Enclos de Duulakh' },
  ruches: { x:29.3, y:66.4, w:10.5, h:17, kind:'zone', title:"Moutons et ruches d'Ogloo", chars:['ogloo'] },
};
// Invités : ils changent selon qui séjourne sur Solution 9 (shared/iloh.guests dans la base, modifiable depuis la carte).
const ILOH_GUESTS = { 53: ['davaajav'] };   // valeur de départ, remplacée par celle de la base dès qu'elle existe
const occupantsOf = n => YURTS[n]?.chars || (YURTS[n]?.kind === 'invites' ? (ILOH_GUESTS[n] || []).filter(isChar) : null);
// staff : personnages qui tiennent un lieu commun (ils habitent ailleurs, leur yourte reste celle où ils vivent).
const yurtOf = id => Object.keys(YURTS).find(n => occupantsOf(n)?.includes(id)) || null;
const peopleOf = n => [...(occupantsOf(n) || []), ...(YURTS[n]?.staff || [])].filter(isChar);
// Personnages qu'on peut accueillir : ceux qui n'ont pas de yourte à eux et ne sont pas déjà invités.
const guestCandidates = () => C.filter(c => !yurtOf(c.id)).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
const setGuests = (n, list) => { ILOH_GUESTS[n] = list; window.RP_SYNC?.saveIloh({ guests: { ...ILOH_GUESTS } }); ilohRefresh(); };
const yurtTitle = y => y.chars ? andList(y.chars.map(nameOf)) : y.kind === 'lieu' ? y.label : y.kind === 'invites' ? 'Les invités'
  : y.kind === 'speciale' ? 'Yourte spéciale' : y.elite ? 'Yourte à prendre (élite)' : 'Yourte à prendre';
const ILOH_ZOOMS = [1, 1.5, 2, 3];
const ilohView = { sel: null, from: null, z: 1, who: false };   // who : « Qui est où aujourd'hui »   // sel : numéro de yourte ou clé d'ILOH_SPOTS ; z : zoom (1 à 3)
const openIloh = (from, sel) => { Object.assign(ilohView, { from: from || null, sel: sel || (from && yurtOf(from)) || null }); go('iloh'); centerYurt(ilohView.sel, false); };
// Qui est où aujourd'hui : à Solution 9 (fiche du jour remplie, pas en voyage), en voyage, ou pas encore de nouvelles.
const travels = st => st.checked?.has('Voyage') || !!st.trip;
const whereOf = cid => { const st = state[cid]; return !st?.done ? 'none' : travels(st) ? 'away' : 'here'; };
const tripDest = st => st.trip?.to ? legLabel(st.trip.to) : '';
const yurtWhere = n => { const w = (occupantsOf(n) || []).map(whereOf); return w.includes('here') ? 'here' : w.includes('away') ? 'away' : w.length ? 'none' : ''; };
const yurtTodayHtml = cid => { const st = state[cid], place = travels(st) ? (tripDest(st) && tripDest(st) !== '…' ? 'en voyage vers ' + tripDest(st) : 'en voyage') : st.places?.size ? [...st.places][0] : '';
  return st.done ? `<span class="yc-today">${st.mood ? `« ${esc(st.mood)} »` : 'Journée racontée'}${place ? ' · ' + esc(place) : ''}</span>` : '<span class="yc-today dim">Pas encore de fiche aujourd\'hui</span>'; };
const occupantHtml = cid => { const c = C.find(x => x.id === cid); if (!c) return '';
  return `<div class="yc-char"><b><i class="yc-dot" style="background:${PLAYERS.find(p => p.id === c.player)?.color || 'var(--dim)'}"></i>${esc(c.name)}${c.surname ? ` <small>${esc(c.surname)}</small>` : ''}</b>
    ${yurtTodayHtml(cid)}<button type="button" class="link small" data-go="${cid}">Voir la fiche ${deName(c.name)} ›</button></div>`; };
const ilohCardHtml = key => {
  const spot = ILOH_SPOTS[key], y = YURTS[key]; if (!spot && !y) return '';
  const head = spot ? `<p class="yc-kicker">${spot.kind === 'tour' ? 'Tour de guet' : 'Lieu de l\'Iloh'}</p><h3>${esc(spot.title)}</h3>`
    : `<p class="yc-kicker">Yourte n° ${key}${y.map ? ' · ' + esc(y.map) : ''}</p>${y.chars ? '' : `<h3>${esc(yurtTitle(y))}</h3>`}`;
  const body = y?.kind === 'invites' ? `${occupantsOf(key).map(cid => `<div class="yc-guest">${occupantHtml(cid)}<button type="button" class="link small danger" data-guest-del="${key}:${cid}">Retirer ${deName(nameOf(cid))} de la yourte</button></div>`).join('')
      || '<p class="yc-desc">Aucun invité en ce moment.</p>'}
      ${guestCandidates().length ? `<label class="yc-add"><span class="sr-only">Accueillir un invité</span><select data-guest-add="${key}"><option value="">Accueillir un invité…</option>
        ${guestCandidates().map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label>` : ''}`
    : (spot || y).chars ? (spot || y).chars.map(occupantHtml).join('')
    : y?.staff ? y.staff.map(occupantHtml).join('')
    : spot ? '' : `<p class="yc-desc">${y.kind === 'lieu' ? 'Lieu commun de l\'Iloh.' : y.kind === 'invites' ? 'Yourte réservée aux invités de l\'Iloh.' : y.kind === 'speciale' ? 'Yourte spéciale.' : y.elite ? 'Yourte libre, réservée à l\'élite.' : 'Yourte libre : elle attend son occupant.'}</p>`;
  return `<div class="yurt-card" role="dialog" aria-label="${esc(spot ? spot.title : 'Yourte ' + key)}">
    <button type="button" class="link ico-btn yc-close" data-yurt-close aria-label="Fermer">×</button>${head}${body}</div>`;
};
function renderIloh() {
  root.className = 't-s9';
  const from = ilohView.from && C.find(c => c.id === ilohView.from), sel = ilohView.sel == null ? null : String(ilohView.sel), z = ilohView.z;
  document.getElementById('view').innerHTML = `
    <p class="ev-back"><button type="button" class="link" data-go="${from ? from.id : 'home'}">‹ ${from ? 'Fiche ' + deName(from.name) : 'Accueil'}</button></p>
    <header><p class="kicker">${APP_NAME}</p><h1>L'Iloh</h1>
      <p class="date">${from ? yurtOf(from.id) ? `Yourte ${deName(esc(from.name))} : n° ${yurtOf(from.id)}` : `${esc(from.name)} n'a pas encore de yourte sur Solution 9.` : 'Touche une yourte pour voir qui l\'habite.'}</p></header>
    <div class="iloh-wrap">
      <div class="iloh-zoom" role="group" aria-label="Zoom de la carte">
        <button type="button" class="btn" data-iloh-zoom="-1" aria-label="Dézoomer" ${z > 1 ? '' : 'disabled'}>−</button>
        <span class="iloh-zlabel" aria-live="polite">${Math.round(z * 100)} %</span>
        <button type="button" class="btn" data-iloh-zoom="1" aria-label="Zoomer" ${z < ILOH_ZMAX ? '' : 'disabled'}>+</button>
        <button type="button" class="chip-link who-btn" data-iloh-who aria-pressed="${ilohView.who}">${icon('users')}Qui est où aujourd'hui ?</button></div>
      <div class="iloh-scroll${z > 1 ? ' zoomed' : ''}"><div class="iloh-map${ilohView.who ? ' who' : ''}" style="--z:${z}">
        <img src="iloh-carte.webp" alt="Carte de Solution 9 : 53 yourtes numérotées autour de la grande place" width="2048" height="1564" draggable="false">
        ${Object.entries(ILOH_SPOTS).map(([k, p]) => `<button type="button" class="iloh-spot k-${p.kind} ${sel === k ? 'sel' : ''}" data-yurt="${k}"
          style="left:${p.x}%;top:${p.y}%;width:${p.w}%;height:${p.h}%" aria-label="${esc(p.title)}" aria-pressed="${sel === k}"></button>`).join('')}
        ${Object.entries(YURTS).map(([n, y]) => { const [w, h] = YURT_SIZE[y.size || 's'];
          const occ = peopleOf(n);
          return `<button type="button" class="yurt-hit ${y.chars ? 'occ' : 'k-' + (y.kind || 'libre')} ${sel === n ? 'sel' : ''} ${ilohView.who && yurtWhere(n) ? 'w-' + yurtWhere(n) : ''}" data-yurt="${n}"
            style="left:${y.x - w / 2}%;top:${y.y - 1.8}%;width:${w}%;height:${h}%" aria-label="Yourte ${n} : ${esc(yurtTitle(y))}" aria-pressed="${sel === n}">
            ${occ?.length ? `<span class="yurt-dots">${occ.map(cid => `<i style="background:${PLAYERS.find(p => p.id === playerOf(cid))?.color}"></i>`).join('')}</span>` : ''}</button>`; }).join('')}
      </div></div>
      ${sel ? ilohCardHtml(sel) : ''}
    </div>
    ${ilohView.who ? (() => { const all = C.map(c => [c, whereOf(c.id)]), here = all.filter(x => x[1] === 'here'), away = all.filter(x => x[1] === 'away');
      return `<div class="who-sum"><p><span class="yurt-key w-here"></span> <b>À Solution 9 (${here.length})</b> : ${esc(here.map(x => x[0].name).join(', ') || 'personne pour l\'instant')}</p>
        <p><span class="yurt-key w-away"></span> <b>En voyage (${away.length})</b> : ${away.length ? away.map(([c]) => esc(c.name) + (tripDest(state[c.id]) && tripDest(state[c.id]) !== '…' ? ` <small>(${esc(tripDest(state[c.id]))})</small>` : '')).join(', ') : 'personne'}</p>
        <p><span class="yurt-key w-none"></span> Pas encore de fiche aujourd'hui : ${all.length - here.length - away.length}</p></div>`; })()
    : `<p class="reserved cal-legend"><span class="yurt-key occ"></span> habitée (couleur du joueur) · <span class="yurt-key k-lieu"></span> lieu commun · <span class="yurt-key k-invites"></span> invités · <span class="yurt-key k-libre"></span> à prendre</p>`}`;
  const sc = document.querySelector('.iloh-scroll');
  sc.addEventListener('scroll', placeIlohCard, { passive: true });
  // Molette de la souris sur la carte (PC) : zoom autour du pointeur. Aux limites, la page défile normalement.
  // Carte zoomée : on la fait glisser à la souris (clic maintenu) pour s'y déplacer ; un vrai glissé n'ouvre pas de fiche.
  let drag = null;
  sc.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || ilohView.z <= 1) return;
    drag = { x: e.clientX, y: e.clientY, l: sc.scrollLeft, t: sc.scrollTop, moved: false, id: e.pointerId };
  });
  sc.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    if (!drag.moved) { drag.moved = true; sc.classList.add('dragging'); try { sc.setPointerCapture(drag.id); } catch {} }
    sc.scrollLeft = drag.l - dx; sc.scrollTop = drag.t - dy; e.preventDefault();
  });
  const endDrag = () => { if (!drag) return; if (drag.moved) { ilohDragged = Date.now(); sc.classList.remove('dragging'); } drag = null; };
  sc.addEventListener('pointerup', endDrag); sc.addEventListener('pointercancel', endDrag);
  sc.addEventListener('dragstart', e => e.preventDefault());
  sc.addEventListener('wheel', e => {
    if (!e.ctrlKey && Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;   // défilement horizontal (pavé tactile) : on laisse faire
    const zin = e.deltaY < 0;
    if ((!zin && ilohView.z <= 1) || (zin && ilohView.z >= ILOH_ZMAX)) return;
    e.preventDefault();
    const r = sc.getBoundingClientRect(), k = e.deltaMode === 1 ? .05 : e.deltaMode === 2 ? 1 : .0015;
    setIlohZoom(ilohView.z * Math.exp(-e.deltaY * k), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
  placeIlohCard();
}
// La fiche est posée hors de la carte qui défile : jamais coupée au bord. Elle suit la yourte quand on fait défiler la carte.
function placeIlohCard() {
  const card = document.querySelector('.yurt-card'), wrap = document.querySelector('.iloh-wrap'), hit = ilohView.sel != null && document.querySelector(`[data-yurt="${ilohView.sel}"]`);
  if (!card || !wrap || !hit) return;
  const W = wrap.getBoundingClientRect(), H = hit.getBoundingClientRect(), sc = document.querySelector('.iloh-scroll').getBoundingClientRect();
  const cw = card.offsetWidth, ch = card.offsetHeight, m = 6;
  const cx = Math.min(Math.max(H.left + H.width / 2, sc.left), sc.right) - W.left;
  const left = Math.min(Math.max(cx - cw / 2, m), W.width - cw - m);
  const top = Math.min(Math.max(H.top, sc.top), sc.bottom) - W.top, bottom = Math.min(Math.max(H.bottom, sc.top), sc.bottom) - W.top;
  // Au-dessus de la yourte s'il y a la place dans le cadre de la carte, sinon en dessous.
  const above = top - ch - 8 >= sc.top - W.top, t = above ? top - ch - 8 : bottom + 8;
  card.style.left = left + 'px'; card.style.top = t + 'px';
}
// La carte (agrandie sur téléphone ou zoomée) défile : on amène le lieu choisi au milieu.
const centerYurt = (key, smooth) => {
  const sc = document.querySelector('.iloh-scroll'), y = YURTS[key] || ILOH_SPOTS[key];
  if (sc && y) {
    const cx = ILOH_SPOTS[key] ? y.x + y.w / 2 : y.x, cy = ILOH_SPOTS[key] ? y.y + y.h / 2 : y.y + 4;
    sc.scrollTo({ left: sc.scrollWidth * cx / 100 - sc.clientWidth / 2, top: sc.scrollHeight * cy / 100 - sc.clientHeight / 2, behavior: smooth ? 'smooth' : 'auto' });
  }
  placeIlohCard(); if (smooth) setTimeout(placeIlohCard, 450);
};
const ilohRefresh = (keep = true) => { const sc = document.querySelector('.iloh-scroll'), pos = sc ? [sc.scrollLeft, sc.scrollTop] : [0, 0], y = window.scrollY, h = fullH();
  renderIloh(); const sc2 = document.querySelector('.iloh-scroll'); if (sc2 && keep) { sc2.scrollLeft = pos[0]; sc2.scrollTop = pos[1]; }
  placeIlohCard(); holdHeight(h); window.scrollTo({ top: y }); holdPlace(null, y); };
// Zoom : la carte grandit autour d'un point du cadre (le pointeur de la souris, ou le centre pour les boutons),
// sans réafficher la page. Les boutons passent d'un palier à l'autre ; la molette zoome en continu.
let ilohDragged = 0;
const ILOH_ZMAX = ILOH_ZOOMS[ILOH_ZOOMS.length - 1];
const setIlohZoom = (z, ax, ay) => {
  z = Math.round(Math.min(Math.max(z, 1), ILOH_ZMAX) * 100) / 100; if (z === ilohView.z) return;
  const sc = document.querySelector('.iloh-scroll'), map = document.querySelector('.iloh-map');
  ilohView.z = z; if (!sc || !map) return;
  ax ??= sc.clientWidth / 2; ay ??= sc.clientHeight / 2;
  const fx = (sc.scrollLeft + ax) / sc.scrollWidth, fy = (sc.scrollTop + ay) / sc.scrollHeight;
  map.style.setProperty('--z', z); sc.classList.toggle('zoomed', z > 1);
  sc.scrollLeft = fx * sc.scrollWidth - ax; sc.scrollTop = fy * sc.scrollHeight - ay;
  document.querySelector('.iloh-zlabel').textContent = Math.round(z * 100) + ' %';
  document.querySelector('[data-iloh-zoom="-1"]').disabled = z <= 1;
  document.querySelector('[data-iloh-zoom="1"]').disabled = z >= ILOH_ZMAX;
  placeIlohCard();
};
const zoomIloh = d => setIlohZoom(d > 0 ? ILOH_ZOOMS.find(x => x > ilohView.z + .01) ?? ILOH_ZMAX : [...ILOH_ZOOMS].reverse().find(x => x < ilohView.z - .01) ?? 1);
addEventListener('resize', () => { if (current === 'iloh') placeIlohCard(); });
document.addEventListener('change', e => { const s = e.target.closest?.('[data-guest-add]'); if (!s || !s.value) return;
  const n = s.dataset.guestAdd; setGuests(n, [...(ILOH_GUESTS[n] || []), s.value]); });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-yurt]'), yo = e.target.closest('[data-yurt-of]'), zb = e.target.closest('[data-iloh-zoom]');
  if (yo) return openIloh(yo.dataset.yurtOf);
  if (zb) return zoomIloh(+zb.dataset.ilohZoom);
  if (e.target.closest('[data-iloh-who]')) { ilohView.who = !ilohView.who; return ilohRefresh(); }
  if (e.target.closest('[data-yurt-close]')) { ilohView.sel = null; return ilohRefresh(); }
  const gd = e.target.closest('[data-guest-del]');
  if (gd) { const [n, cid] = gd.dataset.guestDel.split(':'); return setGuests(n, (ILOH_GUESTS[n] || []).filter(x => x !== cid)); }
  if (b && Date.now() - ilohDragged < 300) return;   // fin d'un glissé de la carte : pas un clic
  if (b) { ilohView.sel = String(ilohView.sel) === b.dataset.yurt ? null : b.dataset.yurt; ilohRefresh(); if (ilohView.sel) centerYurt(ilohView.sel, true); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && current === 'iloh' && ilohView.sel) { ilohView.sel = null; ilohRefresh(); } });

// ---------- Logistique : demandes de matériel à Khokkutsai, responsable de la logistique ----------
// requests/{id} = { from (joueur), charId, item, note, at, status: 'pending' | 'done', doneAt }.
// Les règles Firestore réservent la liste complète au joueur de Khokkutsai ; chacun ne lit que ses propres demandes.
const LOGI_CHAR = 'khokkutsai';
const REQUESTS = {};   // rempli par sync.js
const isLogi = () => playerOf(LOGI_CHAR) === me;
const reqView = { char: null, msg: '', step: null };   // step : demande en cours de passage en préparation ou de refus
const fmtAt = ms => fmtDay(new Date(ms));
const addRequest = (charId, item, note) => {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6), at = Date.now();
  const r = { from: me, charId, item, note: note || '', at, status: 'pending' };
  REQUESTS[id] = r; window.RP_SYNC?.saveRequest(id, r);
  if (!isLogi()) NEWS.unshift({ to: playerOf(LOGI_CHAR), text: `Demande de matériel de ${nameOf(charId)} : ${item}`, charId: LOGI_CHAR, key: 'req:' + id, read: false, at });
};
// Étapes : en attente → en préparation (date prévue, facultative) → livrée ; ou refusée (motif). Une nouvelle à chaque étape.
const reqNews = (id, r, key, text) => { if (r.from !== me) NEWS.unshift({ to: r.from, text, charId: r.charId, key: key + ':' + id, read: false, at: Date.now() }); };
const reqStep = (id, patch) => { const r = REQUESTS[id]; Object.assign(r, patch); window.RP_SYNC?.updateRequest(id, patch); return r; };
const validateRequest = id => {
  const r = REQUESTS[id]; if (!r || r.status === 'done' || r.status === 'refused') return;
  reqStep(id, { status: 'done', doneAt: Date.now() });
  reqNews(id, r, 'reqok', `Commande « ${r.item} » : livraison aujourd'hui. Merci au responsable de la logistique !`);
};
const prepareRequest = (id, eta) => {
  const r = REQUESTS[id]; if (!r || r.status !== 'pending') return;
  reqStep(id, { status: 'preparing', eta: eta || null, stepAt: Date.now() });
  reqNews(id, r, 'reqprep', `Commande « ${r.item} » en préparation${eta ? ` : livraison prévue le ${fmtIso(eta)}` : ''}.`);
};
const refuseRequest = (id, reason) => {
  const r = REQUESTS[id]; if (!r || !['pending', 'preparing'].includes(r.status)) return;
  reqStep(id, { status: 'refused', reason: reason || '', stepAt: Date.now() });
  reqNews(id, r, 'reqno', `Commande « ${r.item} » refusée${reason ? ` : ${reason}` : ''}.`);
};
const cancelRequest = id => { const r = REQUESTS[id]; if (!r || r.status !== 'pending' || r.from !== me) return;
  delete REQUESTS[id]; window.RP_SYNC?.deleteRequest(id); dropNews(['req:' + id]); };
const REQ_STATUS = { pending: 'En attente', preparing: 'En préparation', done: 'Livrée', refused: 'Refusée' };
const reqLine = ([id, r], logi) => `<li class="req ${r.status}"><div><b>${esc(r.item)}</b>
    <small>${logi ? `Pour ${esc(nameOf(r.charId))} · ` : `${esc(nameOf(r.charId))} · `}demandé le ${fmtAt(r.at)}${r.status === 'done' ? ` · livré le ${fmtAt(r.doneAt)}` : ''}${r.status === 'preparing' && r.eta ? ` · livraison prévue le ${fmtIso(r.eta)}` : ''}</small>
    ${r.note ? `<span class="req-note">${esc(r.note)}</span>` : ''}
    ${r.status === 'refused' && r.reason ? `<span class="req-note">Motif : ${esc(r.reason)}</span>` : ''}
    ${logi && reqView.step?.id === id ? reqView.step.kind === 'prep'
      ? `<span class="req-step"><label><span>Livraison prévue le (facultatif)</span><input type="date" id="req-eta" min="${isoDay(rpDay)}"></label>
          <span><button type="button" class="btn" data-req-prep-ok="${id}">Passer en préparation</button> <button type="button" class="link small" data-req-step-no>Annuler</button></span></span>`
      : `<span class="req-step"><input type="text" id="req-reason" maxlength="200" placeholder="Motif du refus (facultatif)">
          <span><button type="button" class="btn danger" data-req-no-ok="${id}">Refuser la demande</button> <button type="button" class="link small" data-req-step-no>Annuler</button></span></span>` : ''}</div>
  ${r.status === 'done' ? `<span class="req-ok">${icon('checks')}Livrée</span>`
    : r.status === 'refused' ? `<span class="req-wait refused">Refusée</span>`
    : logi ? `<span class="req-actions">${r.status === 'pending' ? `<button type="button" class="link small" data-req-prep="${id}">En préparation</button>` : '<span class="req-wait">En préparation</span>'}
        <button type="button" class="join-btn" data-req-ok="${id}">${icon('checks')}Validée</button>
        <button type="button" class="link small danger" data-req-no="${id}">Refuser</button></span>`
    : `<span class="req-wait">${REQ_STATUS[r.status]}</span>${r.status === 'pending' ? `<button type="button" class="link small" data-req-cancel="${id}">Annuler</button>` : ''}`}</li>`;
const logisticsHtml = id => {
  if (id !== LOGI_CHAR) return '';
  const all = Object.entries(REQUESTS).sort((a, b) => b[1].at - a[1].at), logi = isLogi();
  const mineChars = C.filter(c => c.player === me), open = all.filter(([, r]) => ['pending', 'preparing'].includes(r.status)), closed = all.filter(([, r]) => ['done', 'refused'].includes(r.status));
  const pick = reqView.char && mineChars.some(c => c.id === reqView.char) ? reqView.char : mineChars[0]?.id;
  return `<section class="logi"><h2>${icon('box')}Logistique</h2>
    <p class="reserved">${esc(nameOf(LOGI_CHAR))} est ${C.find(c => c.id === LOGI_CHAR)?.gender === 'f' ? 'la responsable' : 'le responsable'} de la logistique de Solution 9. Une demande de matériel lui est transmise aussitôt.</p>
    ${mineChars.length ? `<div class="req-form">
      <label><span>Pour</span><select id="req-char">${mineChars.map(c => `<option value="${c.id}" ${c.id === pick ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
      <input type="text" id="req-item" maxlength="120" placeholder="Ex. : Nouvelle yourte, nouveau bureau…" enterkeyhint="send">
      <input type="text" id="req-note" maxlength="300" placeholder="Précisions (facultatif)">
      <button type="button" class="btn" id="req-send">Envoyer la demande</button>
      ${reqView.msg ? `<p class="reserved" aria-live="polite">${esc(reqView.msg)}</p>` : ''}</div>` : ''}
    ${logi ? `<h3>Demandes en cours${open.length ? ` <span class="badge">${open.length}</span>` : ''}</h3>
      ${open.length ? `<ul class="req-list">${open.map(x => reqLine(x, true)).join('')}</ul>` : '<p class="reserved">Aucune demande en attente.</p>'}
      ${closed.length ? `<details class="req-done"><summary>Demandes traitées (${closed.length})</summary><ul class="req-list">${closed.slice(0, 30).map(x => reqLine(x, true)).join('')}</ul></details>` : ''}
      <p class="reserved">Cette liste n'est visible que de toi.</p>`
    : (m => m.length ? `<h3>Mes demandes</h3><ul class="req-list">${m.slice(0, 20).map(x => reqLine(x, false)).join('')}</ul>` : '')(all.filter(([, r]) => r.from === me))}
  </section>`;
};
document.addEventListener('change', e => { if (e.target.id === 'req-char') reqView.char = e.target.value; });
document.addEventListener('click', e => {
  const q = sel => e.target.closest(sel);
  const ok = q('[data-req-ok]'), cancel = q('[data-req-cancel]'), prep = q('[data-req-prep]'), no = q('[data-req-no]'), prepOk = q('[data-req-prep-ok]'), noOk = q('[data-req-no-ok]');
  if (ok) { validateRequest(ok.dataset.reqOk); reqView.msg = ''; reqView.step = null; return renderChar(current); }
  if (prep) { reqView.step = { id: prep.dataset.reqPrep, kind: 'prep' }; return renderChar(current); }
  if (no) { reqView.step = { id: no.dataset.reqNo, kind: 'no' }; return renderChar(current); }
  if (q('[data-req-step-no]')) { reqView.step = null; return renderChar(current); }
  if (prepOk) { prepareRequest(prepOk.dataset.reqPrepOk, document.getElementById('req-eta')?.value || null); reqView.step = null; return renderChar(current); }
  if (noOk) { refuseRequest(noOk.dataset.reqNoOk, document.getElementById('req-reason')?.value.trim() || ''); reqView.step = null; return renderChar(current); }
  if (cancel) { cancelRequest(cancel.dataset.reqCancel); return renderChar(current); }
  if (e.target.closest('#req-send')) {
    const f = document.getElementById('req-item'), item = f.value.trim(); if (!item) return f.focus();
    const charId = document.getElementById('req-char').value;
    addRequest(charId, item, document.getElementById('req-note').value.trim());
    reqView.msg = isLogi() ? 'Demande ajoutée à ta liste.' : `Demande envoyée à ${nameOf(LOGI_CHAR)}.`; renderChar(current);
  }
});
document.addEventListener('keydown', e => { if ((e.target.id === 'req-item' || e.target.id === 'req-note') && e.key === 'Enter') { e.preventDefault(); document.getElementById('req-send')?.click(); } });

// ---------- Historique chargé à la demande (liens, recherche) ----------
const histDate = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
// Charge les mois [de, à] (Date au 1er du mois) pour tout le groupe, puis réaffiche la page.
const loadMonths = async (from, n) => {
  if (!window.RP_SYNC) return;
  const todo = [];
  for (let i = 0; i < n; i++) { const d = new Date(from.getFullYear(), from.getMonth() + i, 1); if (!RP_SYNC.hasMonth(d.getFullYear(), d.getMonth())) todo.push(RP_SYNC.loadMonth(d.getFullYear(), d.getMonth())); }
  if (todo.length) await Promise.all(todo);
  return todo.length;
};
// Journées d'un personnage (historique + aujourd'hui) : [Date, entrée].
const daysOf = id => { const today = keyOf(rpDay);
  const h = Object.entries((typeof HISTORY === 'undefined' ? {} : HISTORY)[id] || {}).filter(([k]) => k !== today).map(([k, e]) => [histDate(k), e]);
  if (state[id]?.done || state[id]?.checked?.size) h.push([rpDay, state[id]]);
  return h; };

// ---------- Liens entre personnages : activités communes notées (withActs) ----------
const LINK_PERIODS = [{ id: 'mois', label: 'Ce mois-ci', months: 1 }, { id: '3mois', label: '3 derniers mois', months: 3 }, { id: 'annee', label: 'Cette année', months: null }];
const linksView = { period: 'mois', loading: false };
const periodStart = p => p.months ? new Date(rpDay.getFullYear(), rpDay.getMonth() - p.months + 1, 1) : new Date(rpDay.getFullYear(), 0, 1);
const linksCount = start => {
  const pairs = {};   // « a+b » → jours (chaque duo compte une fois par jour)
  for (const c of C) for (const [d, e] of daysOf(c.id)) {
    if (d < start || d > rpDay) continue;
    const k = keyOf(d);
    for (const [l, ids] of Object.entries(e.withActs || {})) {
      if (!(e.checked?.has?.(l) || e.checked?.includes?.(l))) continue;
      for (const o of ids) if (isChar(o) && o !== c.id) ((pairs[[c.id, o].sort().join('+')] ||= new Set())).add(k);
    }
  }
  return Object.entries(pairs).map(([p, s]) => ({ a: p.split('+')[0], b: p.split('+')[1], n: s.size })).sort((x, y) => y.n - x.n || nameOf(x.a).localeCompare(nameOf(y.a), 'fr'));
};
const pColor = id => PLAYERS.find(p => p.id === playerOf(id))?.color || 'var(--dim)';
const linksSvg = L => {
  const ids = [...new Set(L.flatMap(x => [x.a, x.b]))].sort((a, b) => playerOf(a).localeCompare(playerOf(b)) || nameOf(a).localeCompare(nameOf(b), 'fr'));
  if (ids.length < 2) return '';
  const R = 130, cx = 180, cy = 165, max = Math.max(...L.map(x => x.n)), pos = {};
  ids.forEach((id, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / ids.length; pos[id] = [cx + R * Math.cos(a), cy + R * Math.sin(a), a]; });
  return `<svg class="links-net" viewBox="0 0 360 330" role="img" aria-label="Réseau des personnages liés par des activités communes">
    ${L.map(x => `<line x1="${pos[x.a][0].toFixed(1)}" y1="${pos[x.a][1].toFixed(1)}" x2="${pos[x.b][0].toFixed(1)}" y2="${pos[x.b][1].toFixed(1)}" stroke-width="${(1 + 5 * x.n / max).toFixed(1)}" stroke-opacity="${(.35 + .55 * x.n / max).toFixed(2)}"><title>${esc(nameOf(x.a))} et ${esc(nameOf(x.b))} : ${x.n} jour${x.n > 1 ? 's' : ''}</title></line>`).join('')}
    ${ids.map(id => { const [x, y, a] = pos[id], right = Math.cos(a) >= 0;
      return `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="${pColor(id)}"/><text x="${(x + (right ? 10 : -10)).toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${right ? 'start' : 'end'}">${esc(nameOf(id))}</text></g>`; }).join('')}
  </svg>`;
};
function renderLinks() {
  root.className = 't-s9';
  const p = LINK_PERIODS.find(x => x.id === linksView.period), start = periodStart(p), L = linksCount(start), max = L[0]?.n || 1;
  const per = C.map(c => ({ c, with: L.filter(x => x.a === c.id || x.b === c.id).map(x => ({ o: x.a === c.id ? x.b : x.a, n: x.n })) })).filter(x => x.with.length);
  document.getElementById('view').innerHTML = `
    <p class="ev-back"><button type="button" class="link" data-go="home">‹ Accueil</button></p>
    <header><p class="kicker">${APP_NAME}</p><h1>Les liens de Solution 9</h1><p class="date">Qui passe ses journées avec qui, d'après les activités communes notées.</p></header>
    <div class="place-list" role="group" aria-label="Période">${LINK_PERIODS.map(x => `<button type="button" data-links-period="${x.id}" aria-pressed="${x.id === p.id}">${x.label}</button>`).join('')}</div>
    ${linksView.loading ? '<p class="reserved">Chargement de l\'historique…</p>' : ''}
    ${L.length ? `<section><h2>${icon('users')}Les duos</h2><ol class="duos">${L.slice(0, 12).map(x => `<li><span class="duo-names"><i class="yc-dot" style="background:${pColor(x.a)}"></i>${esc(nameOf(x.a))} <span class="dim">&amp;</span> <i class="yc-dot" style="background:${pColor(x.b)}"></i>${esc(nameOf(x.b))}</span>
        <span class="duo-bar"><i style="width:${Math.round(100 * x.n / max)}%"></i></span><b>${x.n} jour${x.n > 1 ? 's' : ''}</b></li>`).join('')}</ol></section>
      <section><h2>${icon('map')}Le réseau</h2>${linksSvg(L)}</section>
      <section><h2>Le plus souvent avec…</h2><ul class="per-char">${per.map(x => `<li><button type="button" class="link" data-go="${x.c.id}"><i class="yc-dot" style="background:${pColor(x.c.id)}"></i>${esc(x.c.name)}</button> :
        ${x.with.slice(0, 3).map(w => `${esc(nameOf(w.o))} <small>(${w.n})</small>`).join(', ')}</li>`).join('')}</ul></section>`
    : linksView.loading ? '' : '<p class="reserved">Aucune activité commune notée sur cette période. Sous une activité cochée, « Avec d\'autres personnages ? » permet d\'en noter.</p>'}`;
}
const openLinks = async period => {
  linksView.period = period || linksView.period;
  const p = LINK_PERIODS.find(x => x.id === linksView.period), start = periodStart(p);
  const n = (rpDay.getFullYear() - start.getFullYear()) * 12 + rpDay.getMonth() - start.getMonth() + 1;
  linksView.loading = !!window.RP_SYNC && Array.from({ length: n }, (_, i) => new Date(start.getFullYear(), start.getMonth() + i, 1)).some(d => !RP_SYNC.hasMonth(d.getFullYear(), d.getMonth()));
  if (current === 'liens') renderLinks(); else go('liens');
  if (linksView.loading) { await loadMonths(start, n).catch(console.error); linksView.loading = false; if (current === 'liens') renderLinks(); }
};

// ---------- Recherche dans l'historique ----------
const SEARCH_MONTHS = 18;   // profondeur chargée pour la recherche
const searchView = { q: '', who: '', loading: false, loaded: false };
const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// Texte d'une journée pour la recherche : mood, activités (précisions, personnages présents), lieux, faits, infos, états.
const entryText = e => {
  const acts = [...(e.checked || [])].map(l => l + (e.details?.[l] ? ' : ' + e.details[l] : '') + (w => w.length ? ' avec ' + andList(w.map(nameOf)) : '')((e.withActs?.[l] || []).filter(isChar)));
  return [e.mood, ...acts, ...[...(e.places || [])], e.faits, e.infos, ...Object.values(e.stateNotes || {}), e.trip?.to ? legLabel(e.trip.to) : ''].filter(Boolean).join(' · ');
};
const snippet = (text, q) => { const i = norm(text).indexOf(norm(q)); if (i < 0) return esc(text.slice(0, 140));
  const a = Math.max(0, i - 60), b = Math.min(text.length, i + q.length + 80);
  return (a ? '…' : '') + esc(text.slice(a, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length, b)) + (b < text.length ? '…' : ''); };
const searchResults = () => {
  const q = searchView.q.trim(); if (q.length < 2) return [];
  const out = [];
  for (const c of C.filter(x => !searchView.who || x.id === searchView.who)) for (const [d, e] of daysOf(c.id)) {
    const t = entryText(e); if (norm(t).includes(norm(q))) out.push({ c, d, t });
  }
  return out.sort((a, b) => b.d - a.d).slice(0, 80);
};
const searchListHtml = () => { const q = searchView.q.trim(), R = searchResults();
  return q.length < 2 ? '<p class="reserved">Saisis au moins deux lettres.</p>'
    : `<p class="reserved">${R.length ? `${R.length}${R.length === 80 ? ' (ou plus)' : ''} journée${R.length > 1 ? 's' : ''} trouvée${R.length > 1 ? 's' : ''}` : 'Aucune journée trouvée.'}${searchView.loading ? ' · chargement de l\'historique…' : ''}</p>
    <ul class="search-res">${R.map(r => `<li><button type="button" class="search-hit" data-search-open="${r.c.id}:${keyOf(r.d)}">
      <span class="sr-head"><i class="yc-dot" style="background:${pColor(r.c.id)}"></i><b>${esc(r.c.name)}</b> <small>${fmtDay(r.d)}</small></span><span class="sr-text">${snippet(r.t, q)}</span></button></li>`).join('')}</ul>`; };
function renderSearch() {
  root.className = 't-s9';
  document.getElementById('view').innerHTML = `
    <p class="ev-back"><button type="button" class="link" data-go="home">‹ Accueil</button></p>
    <header><p class="kicker">${APP_NAME}</p><h1>Rechercher</h1><p class="date">Dans les journées racontées : mood, activités, lieux, faits notoires…</p></header>
    <div class="search-form"><input type="search" id="search-q" value="${esc(searchView.q)}" placeholder="Ex. : massage, mammouth, Buyan…" enterkeyhint="search" autocomplete="off">
      <select id="search-who" aria-label="Personnage"><option value="">Tous les personnages</option>${[...C].sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(c => `<option value="${c.id}" ${searchView.who === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
    <div id="search-out">${searchListHtml()}</div>`;
}
const openSearch = async () => {
  go('search'); document.getElementById('search-q')?.focus();
  if (searchView.loaded || !window.RP_SYNC) return;
  searchView.loading = true; document.getElementById('search-out') && (document.getElementById('search-out').innerHTML = searchListHtml());
  await loadMonths(new Date(rpDay.getFullYear(), rpDay.getMonth() - SEARCH_MONTHS + 1, 1), SEARCH_MONTHS).catch(console.error);
  searchView.loading = false; searchView.loaded = true;
  const o = document.getElementById('search-out'); if (o && current === 'search') o.innerHTML = searchListHtml();
};
document.addEventListener('input', e => { if (e.target.id === 'search-q') { searchView.q = e.target.value; const o = document.getElementById('search-out'); if (o) o.innerHTML = searchListHtml(); } });
document.addEventListener('change', e => { if (e.target.id === 'search-who') { searchView.who = e.target.value; const o = document.getElementById('search-out'); if (o) o.innerHTML = searchListHtml(); } });
document.addEventListener('click', e => {
  const lp = e.target.closest('[data-links-period]'), so = e.target.closest('[data-search-open]'), nav = e.target.closest('[data-open-page]');
  if (nav) return nav.dataset.openPage === 'liens' ? openLinks() : openSearch();
  if (lp) return openLinks(lp.dataset.linksPeriod);
  if (so) { const [id, k] = so.dataset.searchOpen.split(':'), d = histDate(k), s = state[id];
    if (sameDay(d, rpDay)) { s.view = 'day'; return go(id); }
    s.view = 'history'; s.cal = { y: d.getFullYear(), m: d.getMonth() }; s.calSel = d; go(id); }
});

// ---------- Événements du groupe : annoncés par un joueur, une nouvelle (et une notification) pour tous les autres ----------
const EVENT_TYPES = [
  { id:'info', label:"Information importante pour Solution 9", icon:'warn' },
  { id:'soiree', label:'Soirée, concert ou set', icon:'star' },
  { id:'fete', label:'Fête ou rassemblement', icon:'star' },
  { id:'autre', label:'Annonce au groupe', icon:'flag' },
];
const GROUP_EVENTS = {};   // id → { type, text, by (joueur), at, until (AAAA-MM-JJ ou null) } — rempli par sync.js (shared/events)
const evType = t => EVENT_TYPES.find(x => x.id === t) || EVENT_TYPES[EVENT_TYPES.length - 1];
const evText = e => `${evType(e.type).label} : ${e.text}`;
// Date de l'événement (AAAA-MM-JJ) ; sans date de fin, il ne figure au calendrier que ce jour-là mais reste annoncé jusqu'à son retrait.
const evStart = e => e.date || isoDay(new Date(e.at));
const evOn = (e, iso) => evStart(e) <= iso && iso <= (e.until || evStart(e));
const evWhen = e => { const a = evStart(e), t = isoDay(rpDay);
  return e.until && e.until !== a ? (a > t ? `du ${fmtIso(a)} au ${fmtIso(e.until)}` : `jusqu'au ${fmtIso(e.until)}`) : a > t ? `le ${fmtIso(a)}` : a === t ? "aujourd'hui" : `depuis le ${fmtIso(a)}`; };
const activeEvents = () => Object.entries(GROUP_EVENTS).filter(([, e]) => e && (!e.until || e.until >= isoDay(rpDay)))
  .sort((a, b) => evStart(a[1]).localeCompare(evStart(b[1])) || a[1].at - b[1].at);
const evView = { open: false, del: null, type: 'info' };
const evCal = { y: null, m: null, sel: null };   // calendrier des événements : mois affiché et jour choisi
const addGroupEvent = (type, text, until, date) => {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6), at = Date.now();
  date = date || isoDay(rpDay);
  const e = { type, text, by: me, at, date, until: until && until > date ? until : null };
  GROUP_EVENTS[id] = e; window.RP_SYNC?.saveEvent(id, e);
  const txt = evText(e) + (date > isoDay(rpDay) ? ` (${evWhen(e)})` : '');
  PLAYERS.filter(p => p.id !== me).forEach(p => NEWS.unshift({ to: p.id, text: txt, charId: null, key: 'event:' + id + ':' + p.id, read: false, at }));
};
const removeGroupEvent = id => { delete GROUP_EVENTS[id]; window.RP_SYNC?.saveEvent(id, null); dropNews(PLAYERS.map(p => 'event:' + id + ':' + p.id)); };
const fmtIso = iso => { const [y, m, d] = iso.split('-').map(Number); return fmtDay(new Date(y, m - 1, d)); };
const isoDate = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
// Inscriptions : e.going = { personnage: joueur } (écrit champ par champ : deux inscriptions simultanées ne s'écrasent pas).
const goingOf = e => Object.keys(e?.going || {}).filter(isChar).sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'fr'));
const evFinished = e => !!e.until && e.until < isoDay(rpDay);   // sans date de fin : inscriptions ouvertes tant qu'il est annoncé
const setGoing = (evId, cid, on) => { const e = GROUP_EVENTS[evId]; if (!e) return; e.going ||= {};
  if (on) e.going[cid] = me; else delete e.going[cid]; window.RP_SYNC?.setGoing?.(evId, cid, on ? me : null); };
const goingHtml = (id, e) => { const g = goingOf(e), mine = C.filter(c => c.player === me);
  return `<div class="ev-going">${g.length ? `<p class="ev-who">${icon('users')}<span>${g.length} participant${g.length > 1 ? 's' : ''} : ${g.map(cid => `<i class="yc-dot" style="background:${PLAYERS.find(p => p.id === playerOf(cid))?.color}"></i>${esc(nameOf(cid))}`).join(', ')}</span></p>` : ''}
    ${evFinished(e) || !mine.length ? '' : `<div class="ev-join"><span>Je participe avec :</span><div class="place-list subs" role="group" aria-label="Participer avec">${mine.map(c => `<button type="button" data-ev-go="${id}:${c.id}" aria-pressed="${!!e.going?.[c.id]}">${esc(c.name)}</button>`).join('')}</div></div>`}</div>`; };
// Le jour J : l'événement auquel un personnage participe peut être ajouté à sa fiche (avec les autres participants).
const evActLabel = e => e.text.length <= 60 ? e.text : evType(e.type).label;
const evActsOf = id => Object.entries(GROUP_EVENTS).filter(([, e]) => e && e.going?.[id] && evOn(e, isoDay(rpDay))).map(([evId, e]) => ({ evId, e, act: evActLabel(e) }));
const addEvAct = (id, evId) => {
  const e = GROUP_EVENTS[evId], s = state[id], c = C.find(x => x.id === id); if (!e) return;
  const l = evActLabel(e);
  if (!allActs(c).includes(l) && !s.specials.includes(l)) s.specials.push(l);
  s.checked.add(l);
  goingOf(e).filter(o => o !== id).forEach(o => setWith(id, l, o, true, true));   // les autres participants, sans nouvelle
  saveComplement(id);
};
// Anniversaires des personnages et grands jours khurdans (transhumances, Naadam, Mois Blanc) : affichés au calendrier.
const calSpecials = d => { const k = C.find(c => c.groups.includes('Khurdans'));
  return [...(k ? khurdanDays(k, d) : []).map(t => ({ ico: 'star', t })),
    ...C.filter(c => BIRTHDAYS[c.id] && bdayOn(BIRTHDAYS[c.id], d)).map(c => ({ ico: 'cake', t: 'Anniversaire ' + deName(c.name), cid: c.id }))]; };
const calSpecialsHtml = d => calSpecials(d).map(x => `<p class="cal-sp">${icon(x.ico)}<span>${x.cid ? `<button type="button" class="link" data-go="${x.cid}">${esc(x.t)}</button>` : esc(x.t)}</span></p>`).join('');
// Le jour d'un anniversaire, le joueur du personnage prévient les autres (une seule fois : une nouvelle déjà créée n'est pas réécrite).
document.addEventListener('click', e => { const b = e.target.closest('[data-ev-act]'); if (!b || !isChar(current)) return; addEvAct(current, b.dataset.evAct); renderChar(current); });
let bdayNewsDone = false;
const birthdayNews = () => {
  if (bdayNewsDone || !me || !window.RP_SYNC?.newsOnce) return; bdayNewsDone = true;
  C.filter(c => c.player === me && BIRTHDAYS[c.id] && bdayOn(BIRTHDAYS[c.id], rpDay)).forEach(c =>
    PLAYERS.filter(p => p.id !== me).forEach(p => RP_SYNC.newsOnce('bday:' + isoDay(rpDay) + ':' + c.id + ':' + p.id, { to: p.id, text: `C'est l'anniversaire ${deName(c.name)} !`, charId: c.id })));
};
const evCardHtml = ([id, e]) => `<div class="g-event">${icon(evType(e.type).icon)}<div><b>${esc(evType(e.type).label)}</b><span>${esc(e.text)}</span>
      <small>${evWhen(e).replace(/^./, c => c.toUpperCase())} · annoncé par ${esc(PLAYER_NAME[e.by] || '?')}</small>${goingHtml(id, e)}</div>
      ${e.by === me || isAdminMe() ? evView.del === id ? `<span class="g-del"><button type="button" class="link small danger" data-ev-del-ok="${id}">Retirer l'annonce</button> <button type="button" class="link small" data-ev-del-no>Annuler</button></span>`
        : `<button type="button" class="link small ico-btn" data-ev-del="${id}" title="Retirer l'annonce" aria-label="Retirer l'annonce">${icon('trash')}</button>` : ''}</div>`;
const evFormHtml = date => `<details class="ev-new"${evView.open ? ' open' : ''}><summary>${icon('plus')}Annoncer un événement à Solution 9</summary>
      <div class="ev-form">
        <div class="place-list" role="group" aria-label="Type d'événement">${EVENT_TYPES.map(t => `<button type="button" data-ev-type="${t.id}" aria-pressed="${evView.type === t.id}">${icon(t.icon)}${esc(t.label)}</button>`).join('')}</div>
        <input type="text" id="ev-text" maxlength="200" placeholder="Ex. : Couvre-feu à partir de ce soir" enterkeyhint="send">
        <div class="ev-dates"><label class="ev-until"><span>Date</span><input type="date" id="ev-date" value="${date}" min="${isoDay(rpDay)}"></label>
          <label class="ev-until"><span>Jusqu'au (facultatif)</span><input type="date" id="ev-until" min="${date}"></label></div>
        <button type="button" class="btn" id="ev-add">Annoncer à tout le groupe</button>
        <p class="reserved">Tous les autres joueurs recevront une nouvelle et une notification.</p>
      </div></details>`;
const groupEventsHtml = () => {
  const list = activeEvents();
  return `<section class="group-events"><h2>${icon('flag')}Événements à Solution 9<button type="button" class="link ico-btn ev-cal-btn" data-go="events" title="Calendrier des événements" aria-label="Calendrier des événements">${icon('calendar')}</button></h2>
    ${calSpecialsHtml(rpDay)}
    ${list.map(evCardHtml).join('')}
    ${list.length || calSpecials(rpDay).length ? '' : '<p class="reserved">Aucun événement en cours.</p>'}
    ${evFormHtml(isoDay(rpDay))}</section>`;
};
// Page « Calendrier des événements » : un mois, les jours avec un événement marqués ; le jour choisi en dessous.
function renderEvents() {
  root.className = 't-s9';
  if (evCal.y === null) Object.assign(evCal, { y: rpDay.getFullYear(), m: rpDay.getMonth(), sel: isoDay(rpDay) });
  const { y, m } = evCal, n = daysIn(y, m), lead = (new Date(y, m, 1).getDay() + 6) % 7;
  const all = Object.entries(GROUP_EVENTS).filter(([, e]) => e);
  const on = iso => all.filter(([, e]) => evOn(e, iso));
  const sel = evCal.sel, selList = sel ? on(sel) : [];
  document.getElementById('view').innerHTML = `
    <p class="ev-back"><button type="button" class="link" data-go="home">‹ Accueil</button></p>
    <header><p class="kicker">${APP_NAME}</p><h1>Événements à Solution 9</h1></header>
    <section>
      <div class="cal-head"><button type="button" class="btn" data-ev-month="-1" aria-label="Mois précédent">‹</button>
        <h2>${MONTHS[m]} ${y}</h2>
        <button type="button" class="btn" data-ev-month="1" aria-label="Mois suivant">›</button></div>
      <div class="cal" role="grid">
        ${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => `<span class="cal-dow">${d}</span>`).join('')}
        ${'<span></span>'.repeat(lead)}
        ${Array.from({ length: n }, (_, i) => new Date(y, m, i + 1)).map(d => { const iso = isoDay(d), L = on(iso), sp = calSpecials(d), k = L.length + sp.length;
          return `<button type="button" class="cal-day ${L.length ? 'filled ev-day' : sp.length ? 'sp-day' : ''} ${sameDay(d, rpDay) ? 'today' : ''} ${sel === iso ? 'sel' : ''}" data-ev-day="${iso}">
            <span class="n">${d.getDate()}</span>${L.length ? icon(evType(L[0][1].type).icon) : sp.length ? icon(sp[0].ico) : ''}${k > 1 ? `<i class="ev-count">${k}</i>` : ''}</button>`; }).join('')}
      </div>
      <p class="reserved cal-legend">${icon('cake')} anniversaires · les autres icônes : événements annoncés</p>
      ${sel ? `<div class="day-detail"><h3>${fmtIso(sel)}</h3>
        ${calSpecialsHtml(isoDate(sel))}
        ${selList.length ? selList.map(evCardHtml).join('') : calSpecials(isoDate(sel)).length ? '' : '<p class="reserved">Aucun événement ce jour-là.</p>'}</div>` : ''}
      ${evFormHtml(sel && sel >= isoDay(rpDay) ? sel : isoDay(rpDay))}
    </section>`;
}
// Réaffichage de l'accueil ou du calendrier sans saut de page (même cale que pour les fiches).
const openEventsOn = iso => {
  const d = /^\d{4}-\d\d-\d\d$/.test(iso || '') ? iso : isoDay(rpDay), [y, m] = d.split('-').map(Number);
  Object.assign(evCal, { y, m: m - 1, sel: d }); evView.del = null; go('events');
};
// Type de nouvelle (couleur) : nuit chaude, grossesse possible ou vie intime → rose ; personnage mentionné dans une activité commune → vert.
const newsKind = n => /^(night|risk|intime):/.test(n.key || '') ? 'k-hot' : /^with:/.test(n.key || '') ? 'k-with' : 'k-other';
// Nouvelle cliquable : la fiche du personnage, ou le calendrier pour un événement de Solution 9.
const newsLink = (n, inner) => /^pm:/.test(n.key || '') ? `<button type="button" class="link" data-go="pm">${inner}</button>`
  : /^we-/.test(n.key || '') ? `<button type="button" class="link" data-go="we">${inner}</button>` : n.charId ? `<button type="button" class="link" data-go="${n.charId}">${inner}</button>`
  : n.key?.startsWith('event:') ? `<button type="button" class="link" data-ev-open="${esc(n.key.split(':')[1])}">${inner}</button>` : `<span>${inner}</span>`;
document.addEventListener('click', e => { const b = e.target.closest('[data-ev-open]'); if (!b) return;
  const ev = GROUP_EVENTS[b.dataset.evOpen]; openEventsOn(ev ? evStart(ev) : null); });
const evRefresh = () => {
  if (current !== 'events' && current !== 'home') return;
  const y = window.scrollY, h = fullH();
  current === 'events' ? renderEvents() : renderHome();
  holdHeight(h); window.scrollTo({ top: y }); holdPlace(null, y);
};
document.addEventListener('toggle', e => { if (e.target.classList?.contains('ev-new')) evView.open = e.target.open; }, true);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-ev-type]'), add = e.target.closest('#ev-add'), del = e.target.closest('[data-ev-del]'), ok = e.target.closest('[data-ev-del-ok]');
  if (t) { evView.type = t.dataset.evType; document.querySelectorAll('[data-ev-type]').forEach(b => b.setAttribute('aria-pressed', b === t)); return; }
  const go = e.target.closest('[data-ev-go]');
  if (go) { const [evId, cid] = go.dataset.evGo.split(':'); setGoing(evId, cid, go.getAttribute('aria-pressed') !== 'true'); return evRefresh(); }
  const day = e.target.closest('[data-ev-day]'), mo = e.target.closest('[data-ev-month]');
  if (day) { evCal.sel = day.dataset.evDay; evView.del = null; return evRefresh(); }
  if (mo) { const d = new Date(evCal.y, evCal.m + +mo.dataset.evMonth, 1); Object.assign(evCal, { y: d.getFullYear(), m: d.getMonth() }); return evRefresh(); }
  if (e.target.closest('[data-ev-del-no]')) { evView.del = null; return evRefresh(); }
  if (del) { evView.del = del.dataset.evDel; return evRefresh(); }
  if (ok) { evView.del = null; removeGroupEvent(ok.dataset.evDelOk); return evRefresh(); }
  if (add) {
    const f = document.getElementById('ev-text'), text = f.value.trim(); if (!text) return f.focus();
    const date = document.getElementById('ev-date').value || isoDay(rpDay);
    addGroupEvent(evView.type, text, document.getElementById('ev-until').value || null, date < isoDay(rpDay) ? isoDay(rpDay) : date);
    evView.open = false; evRefresh();
  }
});
document.addEventListener('change', e => { if (e.target.id === 'ev-date') { const u = document.getElementById('ev-until'); if (u) u.min = e.target.value; } });
document.addEventListener('keydown', e => { if (e.target.id === 'ev-text' && e.key === 'Enter') { e.preventDefault(); document.getElementById('ev-add')?.click(); } });
const MS_NEWS = {
  'Rencontre':   (a, b) => `${a} et ${b} se sont rencontrés !`,
  'Fiançailles': (a, b) => `${a} et ${b} sont fiancés !`,
  'Mariage':     (a, b) => `${a} et ${b} se sont mariés !`,
  'Grossesse':   (a, b) => `${a} et ${b} attendent un enfant !`,
  'Naissance':   (a, b) => `Une naissance chez ${a} et ${b} !`,
  'Séparation':  (a, b) => `${a} et ${b} se sont séparés…`,
};
// Toutes les nouvelles ne partent qu'une fois validée la fiche qui les a déclenchées.
const newsReady = n => !n.src || !!state[n.src]?.done;
const myNews = () => NEWS.filter(n => n.to === me && newsReady(n));
// Nouvelles reçues pendant la journée RP en cours (elle commence à 5 h), lues ou non : historique du jour.
const newsOfToday = () => myNews().filter(n => n.at && sameDay(new Date(n.at - 5 * 3600e3), rpDay)).sort((a, b) => b.at - a.at);
const newsHour = n => new Date(n.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const isMirror = id => !!C.find(c => c.id === id)?.mirror;
const canEdit = id => C.find(c => c.id === id)?.player === me && !isMirror(id);
const shown = c => (filter === 'all' || c.player === filter) && (groupFilter === 'all' || c.groups.includes(groupFilter));
const root = document.documentElement;
const esc = s => s.replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const vars = t => `--c-bg:${t.bg};--c-gold:${t.gold};--c-text:${t.text};--c-dim:${t.dim};--c-rule:${t.rule};--c-display:${t.display}`;
// La journée RP bascule à 5 h : avant 5 h, on est encore « hier ».
const rpDay = new Date(Date.now() - 5 * 3600e3);
const today = rpDay.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
const dayKey = `${rpDay.getFullYear()}-${rpDay.getMonth() + 1}-${rpDay.getDate()}`;

// Calendrier éorzéen : une lune par mois réel, en alternance astrale / ombrale.
const moonIndex = rpDay.getMonth() + 1;                 // 1 à 12
const moonNum = Math.ceil(moonIndex / 2);
const moonKind = moonIndex % 2 ? 'astrale' : 'ombrale';
const ord = (n, fem) => n === 1 ? (fem ? '1re' : '1er') : n + 'e';
const eorzeaDate = `${ord(rpDay.getDate())} soleil de la ${ord(moonNum, true)} lune ${moonKind}`;
// Lunes khurdanes, une par mois réel.
// Silhouettes pleines dans l'esprit des icônes des fiches (couleur d'accent, détails évidés).
const MOON_ICONS = {
 "brebis": "<circle cx=\"8.6\" cy=\"12.2\" r=\"3.4\"/><circle cx=\"12\" cy=\"10.4\" r=\"3.6\"/><circle cx=\"15\" cy=\"12.6\" r=\"3.2\"/><circle cx=\"11.2\" cy=\"14.2\" r=\"3.2\"/><ellipse cx=\"18.6\" cy=\"10.6\" rx=\"2.4\" ry=\"2.9\" transform=\"rotate(25 18.6 10.6)\"/><path d=\"M16.9 9.2l-1.7-1.4 2.2-.3z\"/><path d=\"M8 15.5h1.6v5H8zM14 15.5h1.6v5H14z\"/><circle cx=\"19.2\" cy=\"10\" r=\".55\" style=\"fill:var(--bg)\"/>",
 "louve": "<path d=\"M4.5 21 6.3 13.4 5.2 5l3.6 3.6L10.6 3.6l1.8 5.6 6.4 2.6 2.7 1.4-1.2 1.8-5.8.8-1.6 2.2.4 3z\"/><circle cx=\"13.3\" cy=\"10.6\" r=\".7\" style=\"fill:var(--bg)\"/><path d=\"M7.6 14.2c1 .9 2 1.3 3.2 1.4M7.3 17c1.1.8 2.2 1.1 3.4 1.1\" fill=\"none\" style=\"stroke:var(--bg)\" stroke-width=\".8\" stroke-linecap=\"round\"/>",
 "irbis": "<ellipse cx=\"11\" cy=\"12.6\" rx=\"6.2\" ry=\"3.2\"/><circle cx=\"18.2\" cy=\"10.4\" r=\"2.7\"/><path d=\"M16.6 8.3l.4-1.9 1.4 1.2zM19 8l1.2-1.4.3 1.9z\"/><path d=\"M6.6 14h1.8v5.6H6.6zM13.6 14h1.8v5.6h-1.8z\"/><path d=\"M5.2 12.6C2 13.5 1.4 17 3.4 19.2c1.6 1.7 4 1.4 4.6.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><circle cx=\"19.2\" cy=\"10\" r=\".55\" style=\"fill:var(--bg)\"/><g style=\"fill:var(--bg)\"><circle cx=\"9\" cy=\"11.6\" r=\".75\"/><circle cx=\"11.6\" cy=\"13.2\" r=\".75\"/><circle cx=\"13.6\" cy=\"11.4\" r=\".75\"/><circle cx=\"7.4\" cy=\"13.4\" r=\".6\"/></g>",
 "aigle": "<circle cx=\"12\" cy=\"5.4\" r=\"2\"/><path d=\"M13.7 5l1.7.7-1.5.9z\"/><path d=\"M10.2 7.4h3.6l.6 7.2L12 16.4l-2.4-1.8z\"/><path d=\"M10.4 8.4C7.6 6.6 4.4 6.2 1.2 7.4l1.4 1.2-1 1 1.8.6-.8 1.2 2.2.2-.4 1.2c2.2-.6 4.2-1.2 6 -1zM13.6 8.4c2.8-1.8 6-2.2 9.2-1l-1.4 1.2 1 1-1.8.6.8 1.2-2.2.2.4 1.2c-2.2-.6-4.2-1.2-6-1z\"/><path d=\"M10 15l-1.2 4.4 3.2-1 3.2 1L14 15z\"/><circle cx=\"12.6\" cy=\"5\" r=\".5\" style=\"fill:var(--bg)\"/>",
 "jument": "<path d=\"M8.2 21.6c-.2-3.6.6-6.4 2-8.6l-4.4.5C4.3 13.6 3.2 12.8 3.3 11.5c0-.8.5-1.4 1.1-1.8l5.9-4.6.5-2.6 2.1 1.9c3.9.3 6.9 3.6 6.9 8.4 0 3.4-.9 6.3-1.6 8.8Z\"/><circle cx=\"10.4\" cy=\"8.6\" r=\".9\" style=\"fill:var(--bg)\"/><path d=\"M13.6 4.6c2 .6 3.6 2.4 4.2 4.8M15 4.2c2.4.9 3.9 3.1 4.2 5.6\" fill=\"none\" style=\"stroke:var(--bg)\" stroke-width=\".8\" stroke-linecap=\"round\"/>",
 "luciole": "<circle cx=\"12\" cy=\"5.4\" r=\"1.7\"/><path d=\"M11.2 4 9.4 1.6M12.8 4l1.8-2.4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1\" stroke-linecap=\"round\"/><ellipse cx=\"12\" cy=\"10.4\" rx=\"2.4\" ry=\"3.4\"/><ellipse cx=\"7.6\" cy=\"10.4\" rx=\"3.6\" ry=\"1.7\" transform=\"rotate(-25 7.6 10.4)\"/><ellipse cx=\"16.4\" cy=\"10.4\" rx=\"3.6\" ry=\"1.7\" transform=\"rotate(25 16.4 10.4)\"/><circle cx=\"12\" cy=\"16.6\" r=\"2.7\"/><path d=\"M12 20.6v1.8M8.4 19.4l-1.2 1.2M15.6 19.4l1.2 1.2M7.6 16.6H6M16.4 16.6H18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1\" stroke-linecap=\"round\"/><path d=\"M12 7.6v5.6\" fill=\"none\" style=\"stroke:var(--bg)\" stroke-width=\".7\"/>",
 "abeille": "<ellipse cx=\"9.4\" cy=\"7.4\" rx=\"3\" ry=\"4\" transform=\"rotate(-20 9.4 7.4)\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\"/><ellipse cx=\"13.6\" cy=\"7\" rx=\"2.6\" ry=\"3.6\" transform=\"rotate(20 13.6 7)\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\"/><ellipse cx=\"11.6\" cy=\"14.4\" rx=\"6.4\" ry=\"4\"/><circle cx=\"18.6\" cy=\"13.8\" r=\"2.4\"/><path d=\"M4.6 14.4 2.4 15l2.4.8z\"/><g fill=\"none\" style=\"stroke:var(--bg)\" stroke-width=\"1.3\"><path d=\"M9 10.6v7.6M12.4 10.4v8M15.4 11v6.8\"/></g><circle cx=\"19.4\" cy=\"13.2\" r=\".55\" style=\"fill:var(--bg)\"/>",
 "loutre": "<circle cx=\"18\" cy=\"9.4\" r=\"2.8\"/><circle cx=\"16.4\" cy=\"7\" r=\".9\"/><path d=\"M17.2 11C14 12.6 8.4 13.4 4.2 14.6L1.8 16.4c4.2.7 8.4.6 12.4-.4 2.6-.6 4.4-2.2 5.4-4.4z\"/><circle cx=\"19.2\" cy=\"8.8\" r=\".55\" style=\"fill:var(--bg)\"/><path d=\"M20.4 10.2l2-.4M20.4 10.8l2 .4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\".6\" stroke-linecap=\"round\"/><path d=\"M2.5 19.4c1.5-.9 3-.9 4.5 0s3 .9 4.5 0 3-.9 4.5 0 3 .9 4.5 0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.1\" stroke-linecap=\"round\"/>",
 "ours": "<path d=\"M3 18.6V13c0-2.5 2-4 5-4 2-.8 5-1 7-.4l2.2-1.4c.8-.6 2.2-.4 2.8.4l1.6 2c.4.6 0 1.2-.6 1.2l-1.4.2c-.2 1.4-.8 2.6-1.6 3.4v4.2h-2.2v-3.2c-2.2.4-4.8.4-6.8 0v3.2H6.8v-3.6c-.8.2-1.4.6-1.6 1.2v2.4z\"/><circle cx=\"17.4\" cy=\"6.8\" r=\"1.2\"/><circle cx=\"19\" cy=\"8.7\" r=\".55\" style=\"fill:var(--bg)\"/>",
 "ecureuil": "<path d=\"M9.6 20.4C3.6 19.6 1.6 13.8 3.4 9.4 5.2 5 10.2 4.4 11.8 7.6 9.2 7.2 7.2 9.2 7.8 12.2c.6 2.6 2.8 3.8 2.4 7z\"/><path d=\"M10.4 20.4c-.4-4 1-7.2 3.4-8.2-.6-1.6 0-3.6 2-4.2l.4-1.8 1.2 1.6c1.8.6 2.8 2 2.4 3.2l-1.6.4c.6 1.6.2 3.6-1 5 .8 1 1.6 2.2 1.4 4z\"/><circle cx=\"17.4\" cy=\"9.6\" r=\".55\" style=\"fill:var(--bg)\"/><path d=\"M6 9.6c.6-1.4 2-2.4 3.4-2.4M5 13c-.2-1 0-2 .4-2.8\" fill=\"none\" style=\"stroke:var(--bg)\" stroke-width=\".7\" stroke-linecap=\"round\"/>",
 "mesange": "<circle cx=\"11\" cy=\"12.4\" r=\"5.2\"/><circle cx=\"15.4\" cy=\"8.6\" r=\"3.2\"/><path d=\"M18.3 8.2l2.4.5-2.4.9z\"/><path d=\"M6.8 14.2 2 17.6l1 1.1 5.2-2.4z\"/><ellipse cx=\"15.6\" cy=\"9.6\" rx=\"1.6\" ry=\"1.1\" style=\"fill:var(--bg)\"/><circle cx=\"16.4\" cy=\"7.8\" r=\".5\" style=\"fill:var(--bg)\"/><path d=\"M3 20.4h18M10 17.4l-.6 3M12.6 17.4l.4 3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1\" stroke-linecap=\"round\"/>",
 "chouette": "<path d=\"M6 7 7.8 3.4l2.2 2.6c1.3-.3 2.7-.3 4 0l2.2-2.6L18 7c1.5 2 1.6 5 1 7-.6 4-3.5 7-7 7s-6.4-3-7-7c-.6-2-.5-5 1-7z\"/><circle cx=\"9.4\" cy=\"10.4\" r=\"2.3\" style=\"fill:var(--bg)\"/><circle cx=\"14.6\" cy=\"10.4\" r=\"2.3\" style=\"fill:var(--bg)\"/><circle cx=\"9.4\" cy=\"10.4\" r=\"1\"/><circle cx=\"14.6\" cy=\"10.4\" r=\"1\"/><path d=\"M11.2 12.2h1.6L12 14z\" style=\"fill:var(--bg)\"/><path d=\"M9.6 16.4l1 .8 1-.8M12.4 16.4l1 .8 1-.8M11 18.6l1 .8 1-.8\" fill=\"none\" style=\"stroke:var(--bg)\" stroke-width=\".7\" stroke-linecap=\"round\"/>"
};
const KHURDAN_MOONS = {
  1:["brebis", "Lune de la brebis"],
  2:["louve", "Lune de la louve"],
  3:["irbis", "Lune de l'irbis"],
  4:["aigle", "Lune de l'aigle"],
  5:["jument", "Lune de la jument"],
  6:["luciole", "Lune de la luciole"],
  7:["abeille", "Lune de l'abeille"],
  8:["loutre", "Lune de la loutre"],
  9:["ours", "Lune de l'ours"],
  10:["ecureuil", "Lune de l'écureuil"],
  11:["mesange", "Lune de la mésange"],
  12:["chouette", "Lune de la chouette"],
};
const khurdanMoon = KHURDAN_MOONS[moonIndex];

// Météo du jour : tirage pondéré, identique pour tous les personnages d'un même foyer
// et pour vous deux (graine = date RP + foyer, pas de hasard propre à l'appareil).
const W = {
  clear:  { label:'Temps clair', icon:'midi' },
  fair:   { label:'Beau temps', icon:'aprem' },
  clouds: { label:'Nuageux', icon:'clouds' },
  fog:    { label:'Brouillard', icon:'fog' },
  wind:   { label:'Venteux', icon:'wind' },
  gales:  { label:'Bourrasques', icon:'wind' },
  rain:   { label:'Pluie', icon:'rain' },
  thunder:{ label:'Orages', icon:'thunder' },
  snow:   { label:'Neige', icon:'snow' },
  blizzard:{ label:'Blizzard', icon:'snow' },
};
// Météo « classique » de FFXIV, pour les foyers sans zone précise.
const CLASSIC = { clear:15, fair:35, clouds:20, fog:10, rain:10, wind:5, thunder:5 };
const HOMES = {
  // Solution Nine : temps clair en permanence, entre 20 et 30 degrés (comme dans Journée RP).
  s9:       { label:'Solution Nine', table:CLASSIC, fixed:'clear', temp:[20, 30] },
};
const weatherOn = {};

// Température du jour, calée sur une ville réelle de référence.
// Dans l'aperçu : normales mensuelles + variation du jour (pas d'accès réseau ici).
// Dans l'appli : relevé réel du jour via Open-Meteo, mis en cache une fois par jour.
const CLIMATE = { // [maxima mensuels], [minima mensuels], °C
  compiegne:   [[6,8,12,15,19,22,24,24,20,15,10,7],        [1,1,3,5,9,12,14,14,11,8,4,2]],
  marrakech:   [[18,20,23,25,29,33,37,37,33,28,23,19],     [6,8,10,12,15,18,21,21,19,15,10,7]],
  varna:       [[6,7,11,16,21,26,29,29,25,19,13,8],         [-1,0,3,8,13,17,20,20,16,11,6,1]],
  erzurum:     [[-4,-2,4,13,18,24,29,29,24,16,7,-1],        [-16,-14,-8,1,5,9,13,13,8,3,-4,-12]],
  arizona:     [[19,21,24,29,34,39,38,37,35,30,23,18],     [5,6,9,12,17,22,25,24,21,15,8,4]],   // Shaaloani (type Tucson)
  cancun:      [[28,28,30,31,32,33,33,33,32,31,29,28],      [20,20,21,23,24,25,25,25,24,23,22,21]],
  jungle:      [[28,30,32,35,35,33,32,32,32,31,29,28],      [18,18,20,22,23,23,22,22,22,21,20,18]],
  kyoto:       [[9,10,14,20,25,28,32,33,29,23,17,12],        [1,1,4,9,14,19,23,24,20,13,7,3]],
  tehran:      [[8,11,16,22,28,34,37,35,31,24,16,10],       [1,3,7,12,17,22,25,24,20,14,7,3]],
  kerala:      [[32,33,34,34,33,29,28,28,29,30,31,31],     [22,23,24,25,25,23,23,23,23,23,23,22]], // forêt tropicale indienne
  pondy:       [[29,30,32,34,37,37,36,35,34,32,30,29],     [21,22,24,26,28,28,27,26,26,25,23,22]], // Pondichéry
  alps:        [[-1,0,4,8,13,17,20,19,15,10,4,0],           [-10,-10,-6,-2,2,6,8,8,4,0,-5,-9]],   // Alpes (Ishgard)
  tahiti:      [[31,31,31,31,30,29,28,28,29,29,30,31],     [23,23,23,23,22,21,20,20,21,22,22,23]],
  vietnam:     [[25,26,29,31,33,34,34,34,32,29,27,25],     [19,20,22,24,25,26,26,25,24,23,22,20]], // centre du Vietnam
  moscow:      [[-4,-3,3,12,19,22,24,22,16,8,1,-3],        [-10,-10,-5,2,8,12,14,12,7,2,-3,-8]],
  liujia:      [[-2,0,4,7,11,15,15,14,12,6,1,-1],           [-18,-16,-11,-6,-1,3,5,4,1,-6,-13,-17]],
  rubis:       [[1,4,10,17,23,27,29,29,25,18,9,3],         [-9,-6,0,7,13,18,22,22,16,9,0,-6]],  // côte proche de Pékin
  ulaanbaatar: [[-16,-11,-2,8,16,21,23,21,15,6,-5,-14], [-27,-24,-15,-6,1,7,11,9,2,-6,-16,-24]],
  beijing:     [[2,5,12,21,27,30,31,30,26,19,10,3],      [-9,-6,0,7,13,18,22,21,15,8,0,-7]],
  lisbon:      [[15,16,19,20,23,27,29,29,27,23,18,15],   [8,9,11,12,14,17,18,19,18,15,11,9]],
  paris:       [[7,9,13,16,20,23,25,25,21,16,11,8],        [3,3,5,7,11,14,16,16,13,10,6,4]],
  mumbai:      [[31,32,33,33,34,32,30,30,31,33,34,33],   [17,18,21,24,27,26,25,25,25,24,22,19]],
};
// Grandes régions, chacune avec son climat par défaut et ses lieux. On choisit une région par jour,
// puis un ou plusieurs lieux à l'intérieur (on y voyage facilement dans la journée).
const REGIONS = {
  eorzea:   { label:'Eorzea', city:'compiegne', zones:{
    noscea:        { label:'Noscea', city:'lisbon', places:['Limsa Lominsa', 'Brumée', 'Grand Bazar'] },
    sombrelinceul: { label:'Sombrelinceul', city:'compiegne', places:['Gridania', 'Lavandière'] },
    thanalan:      { label:'Thanalan', city:'marrakech', places:["Ul'dah", 'La Coupe', 'Chez Davaajav & Ushuaia'] },
    coerthas:      { label:'Coerthas', city:'alps', places:['Ishgard'] },                 // Alpes, neiges éternelles
    gyr:           { label:'Gyr Abania', city:'erzurum', places:['Ala Mhigo'] },          // Turquie montagneuse
  } },
  ilsabard: { label:'Ilsabard', city:'moscow', zones:{
    garlemald:     { label:'Garlemald', city:'moscow', places:[] },                       // Moscou
    werlyt:        { label:'Werlyt', city:'varna', places:['Rocasternes'] },              // mer Noire bulgare
    corvos:        { label:'Corvos', city:'tehran', places:[] },                          // Téhéran
  } },
  othard:   { label:'Othard', city:'beijing', zones:{
    steppe:        { label:"Steppe d'Azim", city:'ulaanbaatar', places:['Khurdan Iloh', 'Yourte commune', 'Yourte des savoirs', 'Yourte mammouth', "Yourte d'Ankhbayar", "Yourte d'Inkaraa & Khokkutsai", 'Yourte de Javkhaanhun', 'Yourte de Taiga & Tamachag', "Yourte d'Ogloo", 'Le Ralliement'] },
    yanxia:        { label:'Yanxia', city:'liujia', places:['Liujia', 'Doma', 'Porte des Cieux : Temple des Héritiers des Dosojins'] },
    rubis:         { label:'Mer de Rubis', city:'rubis', places:[] },
    hingashi:      { label:'Hingashi', city:'beijing', places:['Shirogane'] },
    nagxia:        { label:'Nagxia', city:'vietnam', places:[] },                         // centre du Vietnam
  } },
  thavnair: { label:'Thavnair', city:'mumbai', zones:{
    ile:           { label:'Île de Thavnair', city:'mumbai', places:['Radz-at-Han', 'Yedlihmad', 'Jungle des Sangha'] },
    mersdusud:     { label:'Îles des Mers du Sud', city:'tahiti', places:[] },            // Tahiti
  } },
  tural:    { label:'Tural', city:'cancun', places:['S9', "Elek'Trique", 'Les Faubourgs', 'Chez Prism & Echo', 'Tuliyollal', "Yak'Tel", 'Shaaloani'] },
  autres:   { label:'Autres', city:null, places:[] },   // lieux libres : climat du foyer
};
// Ordre d'affichage, identique sur toutes les fiches.
const REGION_ORDER = ['eorzea', 'ilsabard', 'othard', 'thavnair', 'tural', 'autres'];
const KHURDAN_HIDDEN = ['eorzea', 'ilsabard', 'thavnair', 'tural'];
const isKhurdanGroup = c => c.groups.includes('Khurdans');
const HIDDEN_REGIONS = Object.fromEntries(C.filter(isKhurdanGroup).map(c => [c.id, KHURDAN_HIDDEN]));
// Zones masquées sur les fiches khurdanes (Hingashi, Nagxia et les Mers du Sud).
const KHURDAN_HIDDEN_ZONES = ['hingashi', 'nagxia', 'mersdusud'];
const HIDDEN_ZONES = Object.fromEntries(C.filter(isKhurdanGroup).map(c => [c.id, KHURDAN_HIDDEN_ZONES]));
// Lieux visibles seulement par certains personnages.
const PRIVATE_PLACES = {
  'Chez Prism & Echo':['prism', 'echo'],
};
const canSee = (id, pl) => !PRIVATE_PLACES[pl] || PRIVATE_PLACES[pl].includes(id);
const PLACE_REGION = {}, ZONE_OF = {};
Object.entries(REGIONS).forEach(([r, x]) => {
  if (x.zones) x.places = Object.entries(x.zones).flatMap(([z, zone]) => zone.places.map(pl => (ZONE_OF[pl] = z, pl)));
  x.places.forEach(pl => PLACE_REGION[pl] = r);
});
const REGION_NAME = {};
// Climat propre de certains lieux (ville réelle de référence).
const PLACE_CLIMATE = {
  'Grand Bazar':'lisbon', 'Limsa Lominsa':'lisbon', 'Brumée':'lisbon',     // Noscea : Portugal
  'Gridania':'compiegne', 'Lavandière':'compiegne',                  // Gridania : forêt de Compiègne
  "Ul'dah":'marrakech',                                             // Ul'dah : Maroc
  'Rocasternes':'varna', 'Ala Mhigo':'erzurum',                     // Gyr Abania : mer Noire / Turquie montagneuse
  'Shaaloani':'arizona',                                             // Shaaloani : plaines arides type Arizona
  'Tuliyollal':'cancun', "Yak'Tel":'jungle',                        // Tural : côte caraïbe / jungle mexicaine
  'Liujia':'liujia', 'Shirogane':'beijing', 'Doma':'kyoto',   // Doma : plaines tempérées et humides (type Kyoto)
  'Jungle des Sangha':'kerala', 'Yedlihmad':'pondy', 'Radz-at-Han':'mumbai',
  'Ishgard':'alps',
  'La Coupe':'marrakech', 'Chez Davaajav & Ushuaia':'marrakech',                                           // Thanalan, comme Ul'dah
  'Khurdan Iloh':'ulaanbaatar', 'Le Ralliement':'ulaanbaatar',
  'Yourte commune':'ulaanbaatar', 'Yourte des savoirs':'ulaanbaatar', 'Yourte mammouth':'ulaanbaatar',
  "Yourte d'Ankhbayar":'ulaanbaatar', "Yourte d'Inkaraa & Khokkutsai":'ulaanbaatar', 'Yourte de Javkhaanhun':'ulaanbaatar',
  'Yourte de Taiga & Tamachag':'ulaanbaatar', "Yourte d'Ogloo":'ulaanbaatar',
};
const HOME_REGION = { s9:'tural' };
const DEFAULT_CITY = {};
// Exception : Davaajav vit à La Coupe (Thanalan) ; la steppe prime quand il s'y rend.
const DEFAULT_CITY_OF = {}, HOME_REGION_OF = {}, HOME_LABEL_OF = {};
const defaultCity = id => DEFAULT_CITY_OF[id] || DEFAULT_CITY[HOME_OF[id]] || null;
const homeRegion = id => HOME_REGION_OF[id] || HOME_REGION[HOME_OF[id]] || null;
const regionOf = id => state[id].region || homeRegion(id);
const climatesFor = id => {
  const t = state[id].trip;
  if (!t) return climatesAt(id, regionOf(id), state[id].places, state[id].zone);
  // Mode voyage : météo du départ, puis de l'arrivée.
  const leg = (l, tag) => !l.region ? [] : climatesAt(id, l.region, l.places, l.zone)
    .map(x => ({ ...x, where: `${tag} · ${x.where || REGIONS[l.region].label}` }));
  return [...leg(t.from, 'Départ'), ...leg(t.to, 'Arrivée')];
};
const TRAVEL_MODES = ['Éthérite', 'Monture', 'Bateau'];   // chez les Khurdans : pas d'aéronef
// Durée d'un voyage (en minutes) : « 2 h 30 », « 45 min », « 3 j 4 h ».
const fmtDur = m => { m = Math.round(m || 0); const j = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60), mn = m % 60;
  return j ? `${j} j${h ? ' ' + h + ' h' : ''}` : h ? `${h} h${mn ? ' ' + String(mn).padStart(2, '0') : ''}` : `${mn} min`; };
const tripBits = t => [t.minutes ? fmtDur(t.minutes) : '', [...(t.modes || [])].join(', '), t.reason ? 'motif : ' + t.reason : ''].filter(Boolean).join(' · ');
const zoneOf = T => T.zone && REGIONS[T.region]?.zones?.[T.zone];
// Régions où l'on peut cocher des lieux de plusieurs zones le même jour (ex. Sombrelinceul et La Noscea).
const MULTI_ZONE = ['eorzea'];
const legLabel = l => !l || !l.region ? '…' : l.places.size ? [...l.places].join(', ') : zoneOf(l)?.label || REGIONS[l.region].label;
const climatesAt = (id, R, places, zone) => {
  const reg = REGIONS[R];
  if (!reg) return defaultCity(id) ? [{ city: defaultCity(id), where: HOME_LABEL_OF[id] || null }] : [];
  const byCity = {};
  [...places].filter(pl => PLACE_CLIMATE[pl]).forEach(pl => (byCity[PLACE_CLIMATE[pl]] ||= []).push(pl));
  const list = Object.entries(byCity).map(([city, pls]) => ({ city, where: pls.join(', ') }));
  if (list.length) return list;
  const z = zone && reg.zones?.[zone];
  if (z) return [{ city: z.city, where: z.label }];
  if (R === homeRegion(id) || !reg.city) return defaultCity(id) ? [{ city: defaultCity(id), where: reg.city ? (HOME_LABEL_OF[id] || null) : reg.label }] : [];
  return [{ city: reg.city, where: reg.label }];
};
const TEMP_CITY = id => climatesFor(id)[0]?.city || null;
const keyOf = day => `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`;
const tempAt = (city, day) => {
  const m = day.getMonth(), d = Math.round((seeded(keyOf(day) + ':t:' + city) - .5) * 6);
  return { max: CLIMATE[city][0][m] + d, min: CLIMATE[city][1][m] + d };
};
const deg = n => (n < 0 ? '−' + (-n) : n) + '°';
const HOME_OF = Object.fromEntries(C.map(c => [c.id, 's9']));   // tous rattachés à Solution Nine
const seeded = str => { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 100000) / 100000; };
// Météo cohérente avec la température : pour les personnages rattachés à une ville réelle,
// on part du climat du mois (fréquence des jours de pluie, vent, brouillard) et de l'écart
// du jour à la normale (plus chaud → plus dégagé, plus froid → plus couvert ou neigeux).
const WET = { // probabilité d'un jour de précipitations, par mois
  compiegne:   [.4,.35,.36,.34,.35,.3,.27,.26,.3,.36,.4,.42],
  marrakech:   [.1,.1,.1,.1,.06,.02,.01,.02,.04,.08,.1,.1],
  varna:       [.35,.3,.3,.3,.3,.25,.15,.12,.15,.25,.3,.35],
  erzurum:     [.3,.3,.35,.4,.45,.25,.1,.08,.1,.25,.25,.3],
  arizona:     [.08,.08,.06,.03,.02,.05,.3,.3,.15,.07,.05,.1],   // mousson d'été
  cancun:      [.2,.12,.1,.08,.15,.35,.3,.35,.5,.45,.3,.25],
  jungle:      [.4,.3,.25,.2,.35,.7,.75,.75,.8,.7,.55,.45],
  kyoto:       [.25,.28,.35,.35,.35,.5,.45,.3,.4,.3,.25,.22],
  tehran:      [.2,.2,.25,.2,.12,.03,.02,.02,.02,.1,.15,.2],
  kerala:      [.05,.05,.1,.25,.45,.85,.85,.8,.6,.6,.4,.1],
  pondy:       [.1,.05,.03,.05,.1,.15,.2,.25,.3,.5,.55,.3],
  alps:        [.4,.38,.42,.45,.5,.5,.48,.48,.42,.4,.42,.42],
  tahiti:      [.6,.55,.55,.45,.35,.25,.2,.2,.25,.35,.45,.55],
  vietnam:     [.3,.2,.15,.15,.25,.25,.25,.3,.5,.65,.6,.45],
  moscow:      [.45,.4,.35,.35,.35,.4,.4,.4,.4,.45,.5,.5],
  liujia:      [.2,.25,.3,.35,.3,.45,.6,.6,.4,.25,.2,.2],
  rubis:       [.06,.07,.1,.15,.2,.35,.5,.45,.25,.15,.1,.06],
  ulaanbaatar: [.08,.07,.08,.12,.2,.35,.45,.42,.25,.1,.08,.08],
  beijing:     [.05,.06,.1,.15,.2,.32,.48,.4,.22,.14,.08,.05],
  lisbon:      [.4,.36,.3,.34,.25,.1,.04,.05,.15,.32,.4,.42],
  paris:       [.38,.33,.34,.32,.34,.28,.25,.24,.27,.33,.37,.4],
  mumbai:      [.01,.01,.01,.01,.05,.6,.85,.8,.55,.12,.04,.01],
};
// Neige sur les terres khurdanes. Pour chaque lieu : mois de neige renforcée et fréquence,
// fenêtre de tirage de l'enneigement [mois, jour, durée], fenêtre du dégel, date limite du dégel,
// seuil de maximale sous lequel les précipitations tombent en neige, et seuil de redoux pour le dégel.
const SNOW = {
  // Steppe (Oulan-Bator) : sol enneigé de fin novembre / début décembre à mars.
  ulaanbaatar: { season:[10,11,0,1,2], boost:.28, start:[10,20,21], thaw:[2,1,31], latest:[3,15], line:1, melt:0 },
  // Liujia (haut plateau tibétain) : hivers très neigeux, neige au sol de fin octobre à avril.
  // Ala Mhigo (Turquie montagneuse) : sol enneigé de fin novembre / mi-décembre à mars.
  erzurum:     { season:[11,0,1,2], boost:.35, start:[10,25,21], thaw:[2,5,25], latest:[3,15], line:1, melt:2 },
  // Ishgard : neiges éternelles, la neige ne quitte jamais le sol.
  alps:        { eternal:true, season:[0,1,2,3,4,9,10,11], boost:.45, line:3 },
  // Garlemald (Moscou) : sol enneigé de mi-novembre à fin mars / avril.
  moscow:      { season:[10,11,0,1,2], boost:.45, start:[10,10,25], thaw:[2,15,25], latest:[3,20], line:1, melt:1 },
  liujia:      { season:[9,10,11,0,1,2,3], boost:.5, start:[9,15,21], thaw:[3,1,30], latest:[4,20], line:4, melt:4 },
};
// Premier jour de fonte de l'hiver qui se termine l'année y.
const thawDay = (city, y) => {
  const cfg = SNOW[city];
  const thawFrom = new Date(y, cfg.thaw[0], cfg.thaw[1] + Math.floor(seeded(city + ':thaw:' + (y - 1)) * cfg.thaw[2]));
  const latest = new Date(y, cfg.latest[0], cfg.latest[1]);
  for (let d = new Date(thawFrom); d < latest; d.setDate(d.getDate() + 1)) if (tempAt(city, d).max > cfg.melt) return new Date(d);
  return latest;
};
const snowCoverOn = (city, day) => {
  const cfg = SNOW[city]; if (!cfg) return false;
  if (cfg.eternal) return true;
  const y = day.getMonth() >= 6 ? day.getFullYear() : day.getFullYear() - 1;   // année de début de l'hiver
  const end = thawDay(city, y + 1);
  const start = new Date(y, cfg.start[0], cfg.start[1] + Math.floor(seeded(city + ':cover:' + y) * cfg.start[2]));
  if (day < start || day >= end) return false;
  for (let d = new Date(start); d <= day; d.setDate(d.getDate() + 1)) {
    const w = cityWeather(city, tempAt(city, d), d);
    if (w === W.snow || w === W.blizzard) return true;
  }
  return false;
};
const WINDY = { tehran:[2,3,4],  alps:[0,1,2,11], tahiti:[5,6,7],  varna:[0,1,11],  cancun:[8,9],  marrakech:[2,3,4], ulaanbaatar:[2,3,4,5], liujia:[0,1,2,3,11], rubis:[2,3,4,10], beijing:[3,4] };        // mois venteux (index 0 à 11)
const FOGGY = { kyoto:[5,10],  kerala:[11,0,1],  moscow:[9,10], vietnam:[0,1], alps:[9,10],  varna:[10,11,0,1],  jungle:[0,1,10,11],  compiegne:[9,10,11,0,1], rubis:[3,4,5,6,11,0], beijing:[0,1,10,11], lisbon:[9,10,11,0], paris:[9,10,11,0,1] };
const STORMY = { kyoto:[6,7,8],  tehran:[3,4],  kerala:[3,4,9,10], pondy:[9,10,11],  tahiti:[11,0,1,2], vietnam:[8,9,10], alps:[5,6,7], moscow:[5,6,7],  varna:[5,6], erzurum:[4,5],  cancun:[5,6,7,8,9], jungle:[4,5,6,7,8,9],  compiegne:[5,6,7], marrakech:[7,8], rubis:[5,6,7], mumbai:[5,9], beijing:[5,6,7], paris:[5,6,7], ulaanbaatar:[6,7] }; // pluies orageuses
// Blizzards de la steppe : seulement en décembre et janvier, par épisodes de 1 à 3 jours,
// environ 5 à 6 jours par mois (10 à 12 par an) ; une année sur dix environ est exceptionnelle (8 à 10 par mois).
const BLIZZARD = { ulaanbaatar: { months: [11, 0], perMonth: [5, 6], wild: [8, 10], wildOdds: .1 } };
const blizzCache = {};
const blizzardDays = (city, y, m) => blizzCache[city + y + '-' + m] ||= (() => {
  const B = BLIZZARD[city], days = new Set(); if (!B?.months.includes(m)) return days;
  const wild = seeded(city + ':blizz-year:' + y) < B.wildOdds, [lo, hi] = wild ? B.wild : B.perMonth;
  const n = lo + Math.floor(seeded(city + ':blizz-n:' + y + '-' + m) * (hi - lo + 1)), len = daysIn(y, m);
  for (let i = 0; days.size < n && i < 60; i++) {
    const start = 1 + Math.floor(seeded(city + ':blizz:' + y + '-' + m + ':' + i) * len), run = 1 + Math.floor(seeded(city + ':blizz-run:' + y + '-' + m + ':' + i) * 3);
    for (let d = start; d < start + run && d <= len && days.size < n; d++) days.add(d);
  }
  return days; })();
const cityWeather = (city, tp, day = rpDay) => {
  const m = day.getMonth(), dk = keyOf(day), dev = tp.max - CLIMATE[city][0][m];        // −3 à +3
  if (BLIZZARD[city] && blizzardDays(city, day.getFullYear(), m).has(day.getDate())) return W.blizzard;
  let base = WET[city][m];
  // Steppe en hiver : on force un peu la neige pour l'ambiance (environ un jour sur trois ou quatre).
  if (SNOW[city]?.season.includes(m)) base = Math.max(base, SNOW[city].boost);
  const wet = Math.min(.95, Math.max(0, base * (1 - dev / 5)));
  const r = seeded(dk + ':w:' + city), r2 = seeded(dk + ':w2:' + city);
  if (r < wet) {
    if (tp.max <= (SNOW[city]?.line ?? 1)) return !BLIZZARD[city] && tp.min <= -15 && r2 < .35 ? W.blizzard : W.snow;
    return (STORMY[city] || []).includes(m) && r2 < .45 ? W.thunder : W.rain;
  }
  if ((FOGGY[city] || []).includes(m) && r2 < .25) return W.fog;
  if ((WINDY[city] || []).includes(m) && r2 > .7) return r2 > .88 ? W.gales : W.wind;
  if (r < wet + .2) return W.clouds;
  return dev > 0 ? W.clear : W.fair;
};
// Conditions du jour : une entrée par climat (plusieurs seulement si l'on voyage en Eorzea).
const conditionsFor = id => {
  const home = HOMES[HOME_OF[id]]; if (!home) return [];
  const cl = climatesFor(id);   // un lieu à climat propre (ex. Tuliyollal) s'affiche même sans la case
  if (!cl.length && home.optIn && !weatherOn[HOME_OF[id]]) return [];
  if (cl.length) return cl.map(({ city, where }) => { const tp = tempAt(city, rpDay); return { ...cityWeather(city, tp), tp, where: where || home.label }; });
  if (home.fixed) {   // ciel immuable (Solution Nine) : seule la température varie d'un jour à l'autre
    const [lo, hi] = home.temp, min = lo + Math.round(seeded(dayKey + ':' + HOME_OF[id] + ':min') * 4), max = Math.min(hi, min + 5 + Math.round(seeded(dayKey + ':' + HOME_OF[id] + ':max') * 5));
    return [{ ...W[home.fixed], tp: { max, min }, where: home.label }];
  }
  let r = seeded(dayKey + ':' + HOME_OF[id]) * 100;
  for (const [k, w] of Object.entries(home.table)) { if ((r -= w) < 0) return [{ ...W[k], tp:null, where: home.label }]; }
  return [{ ...W.fair, tp:null, where: home.label }];
};
const weatherFor = id => conditionsFor(id)[0] || null;

// Couples : paires femme / homme.
const PAIRS = [
  ['prism', 'echo'],
];
const pairOf = id => PAIRS.find(p => p.includes(id));
// État de la nuit par personnage : { hot, with }. « with » vaut l'id d'un personnage
// ou un nom libre (PNJ). Quand le partenaire de la nuit est un personnage, sa fiche est cochée aussi.
const nightsBy = {};
// Nuit calme : partagée entre les deux joueurs comme la nuit chaude (cochée chez l'un, elle l'est chez l'autre).
const calmBy = {};   // id → { with } (personnage, PNJ ou null)
const CALM_LINES = [
  (a, b) => `${a} et ${b} ont passé une nuit calme ensemble.`,
  (a, b) => `Nuit paisible pour ${a} et ${b}.`,
  (a, b) => `Pas de folies cette nuit : ${a} et ${b} ont dormi comme des loirs.`,
  (a, b) => `${a} a passé une nuit douce et tranquille auprès de ${b}.`,
  (a, b) => `Une nuit sans histoire, blottis l'un contre l'autre : ${a} et ${b}.`,
  (a, b) => `${a} et ${b} se sont endormis tôt, tout simplement.`,
  (a, b) => `Nuit calme et câline pour ${a} et ${b}.`,
];
const calmKey = (a, b) => 'calm:' + keyOf(rpDay) + ':' + [a, b].sort().join('+');
const syncCalmState = id => { const s = state[id]; if (!s) return; s.nightStates ||= new Set(); calmBy[id] ? s.nightStates.add('Nuit calme') : s.nightStates.delete('Nuit calme'); };
const setCalm = (id, on, w) => {
  const unlink = x => { const o = calmBy[x]?.with; if (o && isChar(o) && calmBy[o]?.with === x) { delete calmBy[o]; syncCalmState(o); dropNews([calmKey(x, o)]); } delete calmBy[x]; syncCalmState(x); };
  unlink(id);
  if (!on) return;
  const p = w === undefined ? (blockedWith(id, partnerOf(id)) ? null : partnerOf(id)) : (w || null);
  if (p && isChar(p)) unlink(p);
  calmBy[id] = { with: p }; syncCalmState(id);
  if (nightOf(id).hot) setNight(id, false);
  if (p && isChar(p)) {
    calmBy[p] = { with: id }; syncCalmState(p);
    if (nightOf(p).hot && nightOf(p).with === id) setNight(p, false);
    const k = calmKey(id, p); notify(id, p, pickLine(CALM_LINES, k)(nameOf(p), nameOf(id)), k);   // la nouvelle parle d'abord du personnage du destinataire
  }
};
const calmWithOf = id => calmBy[id]?.with || null;
// Libellé « Nuit calme avec … » dans les résumés.
const calmLabel = (id, w) => 'Nuit calme' + (w ? ' avec ' + whoLabel(w) : '');
// Amants : ajoutables à tout moment depuis la fiche ; ils s'ajoutent aux choix de partenaire de la nuit.
const LOVERS = {};   // se remplit depuis les fiches
const loversOf = id => (LOVERS[id] ||= []);
const isChar = x => C.some(c => c.id === x);
// Nuit chaude, protection, risque de grossesse : seulement pour les personnages qui ont l'option (couples).
const hasHot = id => !!C.find(c => c.id === id)?.hotNights;
// Vue publique (images envoyées sur le salon Discord commun) : aucune nuit chaude, même pour les joueurs du couple,
// et ni « Nuit précédente » ni « Nuit à venir » dans le récap.
let publicView = false;
// Lignes de nuit (nuit précédente, nuit à venir, historique) : visibles seulement du joueur du personnage
// et des joueurs de son couple ; jamais dans la vue publique (images Discord).
const seesNights = id => !publicView && (playerOf(id) === me || !!pairOf(id)?.some(x => playerOf(x) === me));
const partnerOf = id => pairOf(id)?.find(x => x !== id) || null;
const charByName = v => C.find(c => c.name.toLowerCase() === v.toLowerCase())?.id || null;
const whoLabel = x => isChar(x) ? nameOf(x) : x;
const nightOf = id => {
  const p = partnerOf(id), r = nightsBy[id] || {}, pr = p ? nightsBy[p] : null;
  const hot = !!r.hot && !publicView, phot = !!pr?.hot && !publicView;
  return { partner: p, solo: !p, isMan: !isFem(id), hot, with: hot ? (r.with ?? p ?? '') : null,
    partnerAway: p && phot && pr.with && pr.with !== id ? pr.with : null };
};
// « Monsieur se protège » : le dernier choix de chaque homme est repris d'une nuit à l'autre,
// y compris quand c'est sa partenaire qui coche la nuit.
const lastProtect = {};
const applyProtect = man => { if (isChar(man) && !isFem(man) && state[man]) state[man].protect = !!lastProtect[man]; };
// Pour un PNJ (non lié à un personnage), le choix se fait et se retient sur la fiche du personnage.
const pnjProtect = (id, name) => !!lastProtect['pnj:' + id + ':' + name];
const setProtect = (man, v) => { state[man].protect = v; lastProtect[man] = v; const w = nightOf(man).with; if (v && w) dropNews(pairKeys(man, w).slice(1)); checkRisk(man); };
const setNight = (id, hot, w) => {
  const old = nightsBy[id]?.with;
  if (old && isChar(old) && nightsBy[old]?.with === id) nightsBy[old] = { hot:false, with:null };
  const dflt = blockedWith(id, partnerOf(id)) ? '' : partnerOf(id);
  if (blockedWith(id, w)) return;
  nightsBy[id] = { hot, with: hot ? (w ?? dflt) : null };
  const nw = nightsBy[id].with;
  if (old && old !== nw) {
    dropNews(pairKeys(id, old));
  }
  if (hot && nw && isChar(nw)) {
    const prev = nightsBy[nw]?.with;
    if (prev && prev !== id && isChar(prev) && nightsBy[prev]?.with === nw) { nightsBy[prev] = { hot:false, with:null }; dropNews(pairKeys(prev, nw)); }
    nightsBy[nw] = { hot:true, with:id };
    { const k = 'night:' + keyOf(rpDay) + ':' + [id, nw].sort().join('+'); notify(id, nw, pickLine(nightLinesFor(nw, id), k)(nameOf(nw), nameOf(id)), k); }   // la nouvelle parle du personnage du destinataire (ou du couple)
    applyProtect(nw);
  }
  if (hot) applyProtect(id);
  if (state[id] && (!hot || nightsBy[id].with !== old)) state[id].shell = false;
  if (old && isChar(old) && state[old] && nightOf(old).with !== id) state[old].shell = false;
  checkRisk(id);
};
const nameOf = id => C.find(x => x.id === id).name;
// Journée jouée en RP : cochée par binôme (les deux fiches comptent comme remplies, même sans activités).
const rpPlayed = {};   // id → id du partenaire de jeu, ou 'pnj' (seul·e ou avec des PNJ)
const setRp = (id, on, w) => {
  const unlink = x => { const o = rpPlayed[x]; if (o && isChar(o) && rpPlayed[o] === x) delete rpPlayed[o]; delete rpPlayed[x]; };
  unlink(id);
  if (!on) return;
  const p = w || 'pnj';
  if (isChar(p)) unlink(p);
  rpPlayed[id] = p; if (isChar(p)) rpPlayed[p] = id;
};
const rpLabel = id => { const w = rpPlayed[id]; return w ? 'Journée jouée en RP' + (isChar(w) ? ' avec ' + nameOf(w) : '') : ''; };
// Activités qui n'apparaissent que sous condition (aucune pour l'instant) : { id: { activité: () => booléen } }.
const CONDITIONAL_ACTS = {};
const actAvailable = (id, label) => !CONDITIONAL_ACTS[id]?.[label] || CONDITIONAL_ACTS[id][label]();
// Activités avec une précision libre (affichée dans le résumé).
// « Contrat de chasse » : durée en jours, rang D → SSS, monstre traqué et lieu de la chasse.
// Le contrat court sur plusieurs jours : il se recoche tout seul chaque jour jusqu'à son terme (jour 2/3…).
const CONTRACT_ACT = 'Contrat de chasse';
const RANKS = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
const CONTRACTS = {};   // id → { start:'AAAA-MM-JJ', days, rank, monster, place }
const isoDay = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayIndex = k => Math.round((new Date(isoDay(rpDay) + 'T12:00') - new Date(k.start + 'T12:00')) / 864e5) + 1;
const activeContract = id => { const k = CONTRACTS[id]; if (!k) return null; const n = dayIndex(k);
  return n >= 1 && (!k.days || n <= k.days) ? { ...k, n } : null; };
const contractDay = k => !k.days ? `jour ${k.n}` : k.days === 1 ? '1 jour' : k.n === k.days ? `dernier jour (${k.n}/${k.days})` : `jour ${k.n}/${k.days}`;
const contractText = k => { if (!k) return ''; const bits = [!k.days ? `jour ${k.n}` : k.days === 1 ? '1 jour' : `jour ${k.n}/${k.days}`];
  if (k.rank) bits.unshift('rang ' + k.rank);
  const what = [k.monster, k.place].filter(Boolean).join(' · ');
  return ` (${bits.join(', ')})` + (what ? ' : ' + what : ''); };
// Activités dont la précision est tirée au sort quand on les coche (le tirage est gardé pour la journée).
const JUNK_ACT = 'Commande de malbouffe';
const RANDOM_ACTS = { [JUNK_ACT]: ['Maxi kebab « Fighter Bouffeur »', 'Pizza « Tartaglia »', 'Mégapizza 6 fromages', 'Tacos tulliyolois', 'Ramen', 'Sushis',
  'Pizza kebab', 'Poulet croustillant « Chik&Dip »', 'Burger smashé « Night Vision »', 'Panini « La mama del Arcadioni »', 'Triple burger frites',
  '« Le bouche artère », burger quatre étages', 'Crêpes sucrées', 'Crêpes salées « Thunder Fury »'] };
const drawFor = (label, not) => { const l = RANDOM_ACTS[label].filter(x => x !== not); return l[Math.floor(Math.random() * l.length)]; };
// Plat le plus commandé de l'année (wrap des personnages qui ont l'activité « Commande de malbouffe »).
const junkOfYear = (c, y) => tally(Array.from({ length: 366 }, (_, i) => new Date(y, 0, 1 + i)).filter(d => d.getFullYear() === y && d <= rpDay).map(d => {
  if (sameDay(d, rpDay)) return state[c.id].checked.has(JUNK_ACT) ? state[c.id].details?.[JUNK_ACT] : null;
  const e = typeof HISTORY === 'undefined' ? null : HISTORY[c.id]?.[keyOf(d)];
  return e && (e.checked?.has?.(JUNK_ACT) || e.checked?.includes?.(JUNK_ACT)) ? e.details?.[JUNK_ACT] : null;
}).filter(Boolean));
const DETAIL_ACTS = { 'Visite touristique':'Lieu visité (ex. : Phare de Limsa)', 'Tourisme et Découverte':'Lieu découvert (ex. : Château de Doma)' };
// Image du récap pour l'embed Discord : la fiche validée est convertie en PNG (sans le pied de page).
// Dans l'appli, ce PNG part en pièce jointe du webhook ; ici, on l'affiche pour vérifier le rendu.
const loadH2I = () => window.htmlToImage ? Promise.resolve(window.htmlToImage) : new Promise((ok, ko) => {
  const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js';
  sc.onload = () => ok(window.htmlToImage); sc.onerror = ko; document.head.appendChild(sc); });
const recapPng = async id => {
  const out = document.getElementById('png-out-' + id), card = document.querySelector('#view .recap');
  out.innerHTML = '<p class="reserved">Création de l\'image…</p>';
  try {
    const h2i = await loadH2I(); await document.fonts.ready;
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#111';
    card.classList.add('capturing');
    const url = await h2i.toPng(card, { pixelRatio: 2, backgroundColor: bg, cacheBust: true }).finally(() => card.classList.remove('capturing'));
    const name = `${id}-${isoDay(rpDay)}.png`;
    out.innerHTML = `<figure class="png-fig"><img src="${url}" alt="Image du récap envoyée sur Discord">
      <figcaption><a href="${url}" download="${name}">Télécharger l'image</a></figcaption></figure>`;
  } catch (e) { out.innerHTML = '<p class="reserved">Impossible de créer l\'image.</p>'; }
};
// Coquillage offert après une nuit chaude : affiché chez le ou la partenaire (« a reçu un coquillage au réveil »).
const gotShell = id => { const n = nightOf(id); return n.hot && isChar(n.with) && isKhurdan(n.with) && !!state[n.with]?.shell && nightOf(n.with).with === id; };
// ---------- Chronologie : états de la nuit (précédente et à venir) ----------
// « Nuit chaude » garde toutes ses options ; les autres états se cumulent, sauf Nuit chaude / Nuit calme et Agité / Calme.
const NIGHT_STATES = ['Nuit calme', 'Cauchemar', 'Insomnie', 'A été agité', 'A été pot de colle', 'A été calme', "N'a pas été au lit en même temps"];
const NIGHT_EXCL = [['A été agité', 'A été calme']];
const NIGHT_ICON = { 'Nuit calme':'nuit', 'Cauchemar':'ghost', 'Insomnie':'wakeful', 'A été agité':'zigzag', 'A été pot de colle':'cuddle', 'A été calme':'feather', "N'a pas été au lit en même temps":'clock' };
const nightStatesText = (id, list, notes, calmW) => [...(list || [])].map(x => (x === 'Nuit calme' ? calmLabel(id, calmW) : physLabel(id, x)) + (notes?.[x] ? ` (${notes[x]})` : '')).join(', ');
// Khurdans : « Détails et précisions » sous chaque choix de nuit coché (scope : 'next' ou 'prev').
const nightNoteInput = () => '';   // pas de précisions sous les choix de nuit (celles déjà saisies restent affichées)
// Nuit précédente = la « nuit à venir » d'hier (même nuit), relue dans l'historique et modifiable ici.
const prevDay = () => { const d = new Date(rpDay); d.setDate(d.getDate() - 1); return d; };
const PREV_LOCAL = {};   // aperçu : pas d'historique réel
const prevEntry = id => (typeof HISTORY !== 'undefined' ? HISTORY[id]?.[keyOf(prevDay())] : PREV_LOCAL[id]) || null;
const setPrev = (id, patch) => {
  const d = prevDay(), cur = typeof HISTORY !== 'undefined' ? ((HISTORY[id] ||= {})[keyOf(d)] ||= {}) : (PREV_LOCAL[id] ||= {});
  Object.assign(cur, patch);
  const { night, ...rest } = patch;
  if (night !== undefined) window.RP_SYNC?.patchPastNight?.(id, d, night);
  if (Object.keys(rest).length) window.RP_SYNC?.patchPast?.(id, d, rest);
};
const prevNight = id => {
  const e = prevEntry(id), c = C.find(x => x.id === id);
  const own = e?.night?.hot && !publicView ? { with: e.night.with || null, own: true } : null;
  const viaPartner = !own && !publicView && typeof nightOn === 'function' && typeof HISTORY !== 'undefined' ? nightOn(c, prevDay()) : null;
  return { hot: own || viaPartner, states: [...(e?.nightStates || [])], note: e?.nightNote || '', notes: { ...(e?.nightNotes || {}) }, calmWith: e?.calmWith || null };
};
const prevNightLine = id => { const n = prevNight(id); if (!n.hot && !n.states.length && !n.note) return '';
  const bits = [n.hot ? 'Nuit chaude' + (n.hot.with ? ' avec ' + whoLabel(n.hot.with) : '') + (n.notes['Nuit chaude'] ? ` (${n.notes['Nuit chaude']})` : '') : '', nightStatesText(id, n.states, n.notes, n.calmWith), n.note].filter(Boolean);
  return `<p class="where">${icon('lips')}<span>Nuit précédente : ${esc(bits.join(' · '))}</span></p>`; };
const nightLine = id => {
  const n = nightOf(id), note = isKhurdan(id) ? (state[id].nightNote || '').trim() : '';
  const nn = state[id].nightNotes || {};
  const st = [state[id].nightStates?.size ? nightStatesText(id, state[id].nightStates, nn, calmWithOf(id)) : '', note].filter(Boolean).join(' · ');
  if (!n.hot) return st ? `<p class="where night-line">${icon('lips')}<span>Nuit à venir : ${esc(st)}</span></p>` : '';
  const bits = ['Nuit chaude'];
  if (n.with) bits.push('avec ' + esc(whoLabel(n.with)));
  if (nn['Nuit chaude']) bits[bits.length - 1] += ` (${esc(nn['Nuit chaude'])})`;
  if (isKhurdan(id) && state[id].shell) bits.push('a offert un coquillage');
  if (gotShell(id)) bits.push('a reçu un coquillage au réveil');
  if (n.isMan ? state[id].protect : n.with && (isChar(n.with) ? !isFem(n.with) && state[n.with].protect : pnjProtect(id, n.with))) bits.push('protégé');
  if (st) bits.push(esc(st));
  return `<p class="where night-line">${icon('lips')}<span>Nuit à venir : ${bits.join(' · ')}</span></p>`;
};

// Situation spéciale (maladie, hospitalisation…) : reste affichée en haut de la fiche jusqu'à ce qu'on la retire.
const alerts = {};   // id → texte
// Événements de groupe, reconductibles chaque jour jusqu'à leur fin.
const EVENTS = [];
const eventsFor = c => EVENTS.filter(e => e.active && c.groups.includes(e.group) && !(e.except || []).includes(c.id));
const alertBlock = (id, editable) => {
  const a = alerts[id];
  if (a) return `<div class="alert" role="note">${icon('warn')}<p><strong>Attention</strong>${esc(a)}</p>${editable ? `<button type="button" class="link ico-btn" id="alert-off-${id}" title="Retirer" aria-label="Retirer">${icon('minus')}</button>` : ''}</div>`;
  if (!editable) return '';
  return state[id].alertEdit
    ? `<div class="alert edit">${icon('warn')}<input type="text" id="alert-text-${id}" placeholder="Ex. : hospitalisé après la chasse"><button type="button" class="btn" id="alert-save-${id}">Afficher</button></div>`
    : `<button type="button" class="link alert-add ico-btn" id="alert-add-${id}" title="Signaler une situation spéciale" aria-label="Signaler une situation spéciale">${icon('plus')}${icon('warn')}</button>`;
};
const eventsBlock = (c, editable) => eventsFor(c).map(e => editable
  ? `<div class="event">${icon('flag')}<label class="check-inline"><input type="checkbox" data-event="${e.id}" ${e.today ? 'checked' : ''}> ${esc(e.label)} — en vigueur aujourd'hui</label><button type="button" class="link ico-btn" data-event-end="${e.id}" title="Fin de l&#39;événement" aria-label="Fin de l&#39;événement">${icon('check')}</button></div>`
  : (e.today ? `<p class="where">${icon('flag')}<span>${esc(e.label)}</span></p>` : '')).join('');

// ---------- Fêtes saisonnières de FFXIV ----------
// Dates habituelles ; les dates exactes sont annoncées chaque année et pourront être ajustées.
const FESTIVALS = [
  { name:'Fête de la Transition', from:[11,31], to:[0,14] },
  { name:'La Valention', from:[1,1], to:[1,14] },
  { name:'Fête des Demoiselles', from:[2,1], to:[2,14] },
  { name:'Fête des Proeufs', from:[3,1], to:[3,14] },
  { name:'Festival du Gold Saucer', from:[4,15], to:[4,31] },
  { name:'Feux de la Mort', from:[7,1], to:[7,15] },
  { name:'Fête de la Commémoration', from:[7,20], to:[8,5] },
  { name:'Veillée des Saints', from:[9,18], to:[9,31] },
  { name:'La fête des étoiles', from:[11,15], to:[11,30] },
];
const md = (m, d) => m * 100 + d;
const festivalOn = day => {
  const x = md(day.getMonth(), day.getDate());
  return FESTIVALS.find(f => { const a = md(...f.from), b = md(...f.to); return a <= b ? x >= a && x <= b : x >= a || x <= b; }) || null;
};

// Les fêtes ne concernent que les personnages présents en Eorzea ce jour-là.
const inEorzeaToday = id => {
  const s = state[id];
  if (s.trip) return [s.trip.from, s.trip.to].some(l => l.region === 'eorzea');
  return (s.region || homeRegion(id)) === 'eorzea';
};
const inEorzeaRec = (c, rec) => rec?.real ? inEorzeaToday(c.id) : rec?.place ? PLACE_REGION[rec.place] === 'eorzea' : homeRegion(c.id) === 'eorzea';
const festivalFor = (c, d, rec) => inEorzeaRec(c, rec) ? festivalOn(d) : null;

// Jours khurdans : le Mois Blanc (premier jour de fonte des neiges sur la steppe, fête du Nouvel An
// sur une journée) et le Naadam (11 au 13 juillet, comme en Mongolie).
const khurdanDays = (c, d) => {
  if (!c.groups.includes('Khurdans')) return [];
  const out = [];
  if (sameDay(d, thawDay('ulaanbaatar', d.getFullYear()))) out.push('Mois Blanc');
  if (d.getMonth() === 6 && d.getDate() >= 11 && d.getDate() <= 13) out.push('Naadam');
  // Transhumance : changement d'iloh à chaque saison.
  const move = { 11: "Départ vers l'iloh d'hiver", 2: "Départ vers l'iloh de printemps", 5: "Départ vers l'iloh d'été", 8: "Départ vers l'iloh d'automne" };
  if (d.getDate() === 21 && move[d.getMonth()]) out.push(move[d.getMonth()]);
  return out;
};
// Anniversaires (dates éorzéennes des fiches converties : une lune par mois, astrale puis ombrale).
const BIRTHDAYS = {
  echo:[2,16],
};
const FRIENDS = [];
// Anniversaires vus dans un seul sens (qui voit → de qui).
const SEES_BIRTHDAY = {};
const linkedTo = id => [...new Set([...[...PAIRS, ...FRIENDS].filter(p => p.includes(id)).map(p => p.find(x => x !== id)), ...(SEES_BIRTHDAY[id] || [])])];
// Anniversaires de PNJ proches (enfants…), affichés sur les fiches indiquées.
const PNJ_BIRTHDAYS = [];
// Né un 29 février : fêté le 28 février les années non bissextiles.
const isLeap = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const bdayOn = ([m, day], d) => d.getMonth() === m && (d.getDate() === day || (m === 1 && day === 29 && !isLeap(d.getFullYear()) && d.getDate() === 28));
const birthdaysOn = (id, d) => [...[id, ...linkedTo(id)].filter(x => BIRTHDAYS[x] && bdayOn(BIRTHDAYS[x], d)).map(x => [nameOf(x), BIRTHDAYS[x]]),
    ...PNJ_BIRTHDAYS.filter(b => b.for.includes(id) && bdayOn(b.date, d)).map(b => [b.name, b.date])]
  .map(([n, [m, day]]) => 'Anniversaire ' + (/^[aeiouéè]/i.test(n) ? "d'" : 'de ') + n + (day !== d.getDate() ? ` (${day} en réalité)` : ''));
const specialDays = (c, d, rec) => [...khurdanDays(c, d), ...birthdaysOn(c.id, d), ...(f => f ? [f.name] : [])(festivalFor(c, d, rec))];

// ---------- États du jour : physique et mental ----------
// « En forme » exclut les autres états physiques ; Bon moral / Petit moral et Flemme / Productif s'excluent.
const PHYS = ['En forme', 'Fatigue', 'Douleur', 'Maladie', 'État second', 'En manque'];
const MENTAL = ['Bon moral', 'Petit moral', 'Nervosité', 'Inspiré', 'Flemme', 'Productif', 'Esprit travaillé'];
const MORAL = ['Bon moral', 'Petit moral'];
const MENTAL_EXCL = [MORAL, ['Flemme', 'Productif']];
// Chaque état coché a un champ de précision ; ces exemples s'affichent dans le champ.
const STATE_HINT = { 'Douleur':'blessure, articulation, nuit rigoureuse…', 'État second':"consommation d'alcool, de stupéfiant…",
  'En manque':'faim, sommeil, sexe, alcool, drogue…', 'Nervosité':'anxiété, stress, tension…', 'Esprit travaillé':'par le travail, la situation, une dispute…' };
// Libellés accordés selon le genre du personnage (config : gender).
const isFem = id => C.find(c => c.id === id)?.gender === 'f';
const FEM_LABEL = { 'Éprouvé de la nuit':'Éprouvée de la nuit', 'Inspiré':'Inspirée', 'Productif':'Productive', 'A été agité':'A été agitée' };
const physLabel = (id, p) => isFem(id) && FEM_LABEL[p] || p;
const stateText = (id, p, notes) => physLabel(id, p) + (notes?.[p] ? ` (${notes[p]})` : '');
const statesLine = (id, list, notes, ico) => list?.length ? `<p class="where">${icon(ico)}<span>${esc(list.map(p => stateText(id, p, notes)).join(', '))}</span></p>` : '';

// ---------- Arcs narratifs (durent au-delà d'une journée) ----------
let arcSeq = 1;
const ARCS = {};   // id → arcs ; vide au départ
const arcsOf = id => (ARCS[id] ||= []);

// ---------- Historique (exemple généré pour l'aperçu) ----------
const MOODS = ['Serein', 'Fatigué mais satisfait', 'Tendu', 'Joyeux', 'Pensif', 'Irritable', 'Nostalgique', 'Déterminé',
  'Tendre', 'Inquiet', 'Plein d\'entrain', 'Mélancolique', 'Agacé par la météo', 'Apaisé'];
// Humeurs d'exemple accordées au genre du personnage.
const MOOD_FEM = { 'Serein':'Sereine', 'Fatigué mais satisfait':'Fatiguée mais satisfaite', 'Tendu':'Tendue', 'Joyeux':'Joyeuse',
  'Pensif':'Pensive', 'Déterminé':'Déterminée', 'Inquiet':'Inquiète', "Plein d'entrain":"Pleine d'entrain",
  'Agacé par la météo':'Agacée par la météo', 'Apaisé':'Apaisée' };
const MOOD_MASC = Object.fromEntries(Object.entries(MOOD_FEM).map(([m, f]) => [f, m]));
const moodFor = (id, m) => isFem(id) ? MOOD_FEM[m] || m : m;
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const allActs = c => Object.values(c.acts).flat();
const dayRecord = (c, d) => {
  const s = state[c.id], city = defaultCity(c.id);
  const cond = city ? (() => { const tp = tempAt(city, d); return { ...cityWeather(city, tp, d), tp }; })() : null;
  if (sameDay(d, rpDay)) {
    const filled = s.done || s.mood || s.checked.size || rpPlayed[c.id] || s.trip;
    return filled ? { rp: rpPlayed[c.id] || null, mood: s.mood, acts: [...s.checked], slots: s.slots, place: s.places.size ? [...s.places][0] : '', region: s.region || homeRegion(c.id),
      cond, hot: nightOf(c.id).hot, with: nightOf(c.id).with || null, trip: !!s.trip, tripInfo: s.trip ? { from: s.trip.from.region, to: s.trip.to.region, modes: [...(s.trip.modes || [])], minutes: s.trip.minutes || 0, reason: s.trip.reason || '' } : null,
      phys: [...(s.phys || [])], mental: [...(s.mental || [])], nightStates: [...(s.nightStates || [])], nightNote: s.nightNote || '', nightNotes: { ...(s.nightNotes || {}) }, calmWith: calmWithOf(c.id), faits: s.faits || '', notes: { ...(s.stateNotes || {}) }, withActs: { ...(s.withActs || {}) }, real: true } : null;
  }
  if (d > rpDay) return null;
  const e0 = HISTORY[c.id]?.[keyOf(d)];
  // Jouée en RP : notée sur sa fiche, ou sur celle de son partenaire de jeu (la sienne a pu ne pas être enregistrée)
  const rp = e0?.rp || C.find(x => x.id !== c.id && HISTORY[x.id]?.[keyOf(d)]?.rp === c.id)?.id || null;
  if (!rp && (!e0 || !(e0.done || e0.mood || e0.checked?.size || e0.checked?.length || e0.trip))) return null;
  const e = e0 || {};
  return { rp, mood: e.mood || '', acts: [...(e.checked || [])].filter(a => a !== 'Voyage'), slots: e.slots || {}, place: [...(e.places || [])][0] || '', region: e.region || homeRegion(c.id),
    cond, hot: !publicView && !!e.night?.hot, with: e.night?.with || null, trip: !!e.trip,
    tripInfo: e.trip ? { from: e.trip.from?.region, to: e.trip.to?.region, modes: [...(e.trip.modes || [])], minutes: e.trip.minutes || 0, reason: e.trip.reason || '' } : null,
    phys: [...(e.phys || [])].filter(p => !MORAL.includes(p)), mental: [...(e.mental || []), ...[...(e.phys || [])].filter(p => MORAL.includes(p))],
    notes: e.stateNotes || {}, nightStates: [...(e.nightStates || [])], nightNote: e.nightNote || '', nightNotes: e.nightNotes || {}, calmWith: e.calmWith || null, withActs: e.withActs || {}, intime: e.intime || '', nefaste: e.nefaste || '', faits: e.faits || '', intimeWith: [...(e.intimeWith || [])], real: true };
};
// Journées enregistrées, par personnage puis par date (clé keyOf) — remplies par sync.js.
const HISTORY = {};
const daysIn = (y, m) => new Date(y, m + 1, 0).getDate();
const tally = arr => Object.entries(arr.reduce((o, x) => (o[x] = (o[x] || 0) + 1, o), {})).sort((a, b) => b[1] - a[1]);
// Nuit chaude d'un personnage un jour donné : celle de sa fiche, ou celle cochée par son ou sa partenaire
// (la fiche du partenaire suffit, même si la sienne n'a pas été remplie ce jour-là).
const nightOn = (c, d) => {
  if (publicView) return null;
  const r = dayRecord(c, d); if (r?.hot) return { with: r.with };
  if (d > rpDay || sameDay(d, rpDay) || typeof HISTORY === 'undefined') return null;
  const k = keyOf(d), n = id => HISTORY[id]?.[k]?.night;
  const p = C.find(x => x.id !== c.id && n(x.id)?.hot && n(x.id).with === c.id);
  return p ? { with: p.id } : null;
};
const statsFor = (c, days) => {
  const recs = days.map(d => [d, dayRecord(c, d)]).filter(([, r]) => r);
  const temps = recs.filter(([, r]) => r.cond).map(([d, r]) => ({ d, max: r.cond.tp.max, min: r.cond.tp.min }));
  return {
    filled: recs.length, total: days.filter(d => d <= rpDay).length,
    acts: tally(recs.flatMap(([, r]) => r.acts)).slice(0, 3),
    places: tally(recs.map(([, r]) => r.place).filter(Boolean)).slice(0, 3),
    moods: tally(recs.map(([, r]) => r.mood).filter(Boolean)).slice(0, 2),
    weather: tally(recs.filter(([, r]) => r.cond).map(([, r]) => r.cond.label)).slice(0, 2),
    hottest: temps.reduce((a, b) => !a || b.max > a.max ? b : a, null),
    coldest: temps.reduce((a, b) => !a || b.min < a.min ? b : a, null),
    nights: days.filter(d => nightOn(c, d)).length, trips: recs.filter(([, r]) => r.trip).length,
    phys: tally(recs.flatMap(([, r]) => r.phys.map(p => physLabel(c.id, p)))).slice(0, 2),
    mental: tally(recs.flatMap(([, r]) => (r.mental || []).map(p => physLabel(c.id, p)))).slice(0, 2),
  };
};
// Wrap annuel : proposé (notification + envoi Discord) à partir du 26 décembre.
let simulateWrapDay = false;   // aperçu secret de l'admin : simuler le 26 décembre
// Surprise : avant le 26 décembre, rien ne laisse deviner le wrap. Seul l'aperçu secret
// (lien terminé par #apercu-wrap) permet à Nono de le tester.
const wrapVisible = () => wrapReady() || (isAdminMe() && (() => { try { return location.hash === '#apercu-wrap'; } catch { return false; } })());
// Le wrap est disponible du 26 décembre au 9 janvier ; en janvier, il porte sur l'année écoulée.
const wrapReady = () => simulateWrapDay || (rpDay.getMonth() === 11 && rpDay.getDate() >= 26) || (rpDay.getMonth() === 0 && rpDay.getDate() <= 9);
const wrapYear = () => rpDay.getMonth() === 0 ? rpDay.getFullYear() - 1 : rpDay.getFullYear();
const wrapBanner = (onClick) => wrapReady() ? `<div class="wrap-banner">${icon('star')}<div><b>Et si on revivait cette année ?</b>
  <span>Les wraps ${wrapYear()} sont prêts et ont été envoyés sur Discord.</span></div>${onClick}</div>` : '';
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const fmtDay = d => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
const listOf = pairs => pairs.length ? pairs.map(([k, n]) => `${esc(k)} <small>×${n}</small>`).join(', ') : '—';

// ---------- Wrap : statistiques amusantes ----------
const DIST = { // distances « éorzéennes » entre régions, en km (estimation fantaisiste)
  'eorzea-ilsabard':1500, 'eorzea-othard':6000, 'eorzea-thavnair':4000, 'eorzea-tural':8000,
  'ilsabard-othard':5000, 'ilsabard-thavnair':3500, 'ilsabard-tural':9000,
  'othard-thavnair':4500, 'othard-tural':7000, 'thavnair-tural':9000 };
const distOf = (a, b) => !a || !b ? 0 : a === b ? 300 : DIST[a + '-' + b] || DIST[b + '-' + a] || 2000;
const STOP = new Set(['mais', 'avec', 'pour', 'dans', 'plus', 'très', 'tout', 'bien', 'après', 'cette', 'entre', 'encore']);
const MOOD_COLORS = { Serein:'#7fb3a6', Joyeux:'#e7c35a', "Plein d'entrain":'#f0a35c', Tendre:'#e38fa8', Apaisé:'#8fc3d8', Pensif:'#9a9cc9',
  Nostalgique:'#a98bbf', Déterminé:'#c96f4a', Tendu:'#b86060', Irritable:'#c0504d', Inquiet:'#8a7f9e', Mélancolique:'#6f7fa6',
  'Fatigué mais satisfait':'#b5a37c', 'Agacé par la météo':'#7d8b8f' };
const SEASONS = ['hiver', 'hiver', 'printemps', 'printemps', 'printemps', 'été', 'été', 'été', 'automne', 'automne', 'automne', 'hiver'];
const pct = (a, b) => b ? Math.round(a * 100 / b) : 0;
const wrapExtras = (c, y) => {
  const fem = isFem(c.id), e = fem ? 'e' : '';
  const days = Array.from({ length:366 }, (_, i) => new Date(y, 0, 1 + i)).filter(d => d.getFullYear() === y && d <= rpDay);
  const recs = days.map(d => [d, dayRecord(c, d)]);
  const filled = recs.filter(([, r]) => r);
  // série la plus longue
  let best = 0, run = 0; recs.forEach(([, r]) => { run = r ? run + 1 : 0; best = Math.max(best, run); });
  // mot de l'année
  const words = tally(filled.flatMap(([, r]) => (r.mood || '').toLowerCase().match(/[a-zàâçéèêëîïôûùüÿœ']{4,}/g) || []).filter(w => !STOP.has(w)));
  // périodes de la journée
  const slotIds = filled.flatMap(([, r]) => Object.values(r.slots || {}).flat());
  const late = slotIds.filter(x => x === 'soir' || x === 'nuit').length, early = slotIds.filter(x => x === 'aube' || x === 'matin').length;
  // mois et saison
  const byMonth = tally(filled.map(([d]) => d.getMonth()));
  const bestMonth = byMonth.length ? +byMonth[0][0] : null;
  const seasons = tally(filled.map(([d]) => SEASONS[d.getMonth()]));
  // voyages
  const trips = filled.filter(([, r]) => r.tripInfo).map(([, r]) => r.tripInfo);
  const km = trips.reduce((a, t) => a + distOf(t.from, t.to), 0);
  const modes = tally(trips.flatMap(t => t.modes));
  const regions = new Set(filled.map(([, r]) => r.region).filter(Boolean));
  trips.forEach(t => { regions.add(t.from); regions.add(t.to); });
  const zones = new Set(filled.map(([, r]) => ZONE_OF[r.place] || PLACE_REGION[r.place]).filter(Boolean));
  const homeDays = filled.filter(([, r]) => !r.region || r.region === homeRegion(c.id)).length;
  // météo
  const withCond = filled.filter(([, r]) => r.cond);
  const rain = withCond.filter(([, r]) => ['Pluie', 'Orages'].includes(r.cond.label)).length;
  const snow = withCond.filter(([, r]) => ['Neige', 'Blizzard'].includes(r.cond.label)).length;
  const hot = withCond.reduce((a, [d, r]) => !a || r.cond.tp.max > a.t ? { t:r.cond.tp.max, d, where:r.place } : a, null);
  // liens
  const names = tally(filled.flatMap(([, r]) => r.acts.flatMap(a => [...(a.match(/(?:avec|de|à) ([A-ZÉ][\wéèï'-]+)/g) || []).map(m => m.replace(/^(avec|de|à) /, '')), ...withOf(r.withActs, a).map(nameOf)])
    .filter(n => !['Rhalgr', 'Werlyt', 'Bazar', 'Gridania', 'Ala', 'Rocasternes', 'Khurdans', 'Ul', 'La'].includes(n))));
  const nightsByMonth = tally(filled.filter(([, r]) => r.hot).map(([d]) => d.getMonth()));
  // fêtes et jours spéciaux
  const fests = new Set(filled.map(([d, r]) => festivalFor(c, d, r)?.name).filter(Boolean));
  const bdays = filled.filter(([d]) => birthdaysOn(c.id, d).length).length;
  const khurdan = filled.flatMap(([d]) => khurdanDays(c, d));
  // humour
  const physAll = filled.flatMap(([, r]) => r.phys);
  const drunk = physAll.filter(x => x === 'Ivresse').length, hurt = physAll.filter(x => x === 'Blessure').length;
  const curfew = c.groups.includes('Khurdans') && EVENTS[0] && !(EVENTS[0].except || []).includes(c.id) ? filled.filter(([d]) => d >= new Date(y, 9, 1)).length : 0;
  const actCount = tally(filled.flatMap(([, r]) => r.acts));
  const neglected = allActs(c).filter(a => !actCount.some(([k]) => k === a));
  const low = actCount.length && actCount[actCount.length - 1][1] <= actCount[0][1] / 4 ? actCount[actCount.length - 1] : null;
  const least = neglected.length ? [neglected[0], 0] : low;
  // frise des humeurs : humeur dominante de chaque mois
  const frieze = Array.from({ length:12 }, (_, m) => { const t = tally(filled.filter(([d]) => d.getMonth() === m).map(([, r]) => r.mood).filter(Boolean)); return t[0]?.[0] || null; });
  // titre de l'année
  const ratioHome = pct(homeDays, filled.length);
  const signature = { tamachag:'Le Khan infatigable', davaajav:"L'Archéologue", ankhbayar:'Le Chasseur exilé' };
  const title = drunk >= 8 ? (fem ? 'La Fêtarde' : 'Le Fêtard')
    : trips.length >= 6 ? (fem ? "L'Aventurière" : "L'Aventurier")
    : ratioHome >= 85 ? (fem ? 'La Casanière' : 'Le Casanier')
    : signature[c.id] || "L'Insaisissable";
  const partner = pairOf(c.id)?.find(x => x !== c.id) || null;
  return { fem, filled, best, word: words[0]?.[0] || null, late, early, slotsTotal: slotIds.length,
    first: filled[0], last: filled[filled.length - 1], bestMonth, season: seasons[0]?.[0],
    trips, km, mode: modes[0]?.[0], regions, zones, ratioHome, rain, snow, hot,
    duo: names[0] || null, nightsMonth: nightsByMonth[0] ? [+nightsByMonth[0][0], nightsByMonth[0][1]] : null,
    fests, bdays, khurdan, drunk, hurt, curfew, least, frieze, title, partner };
};
// Duo le plus chaud de l'année, toutes paires confondues.
const hotDuoCache = {};
// Temps de voyage cumulé dans l'année (minutes renseignées dans la section Voyage).
const travelTime = (c, y) => Array.from({ length:366 }, (_, i) => new Date(y, 0, 1 + i)).filter(d => d.getFullYear() === y && d <= rpDay)
  .reduce((a, d) => a + (dayRecord(c, d)?.tripInfo?.minutes || 0), 0);
// Palme du plus grand voyageur / de la plus grande voyageuse : tous personnages confondus (mise en cache avec le duo).
const topTraveler = y => hotDuoCache['travel:' + y] ||= C.map(c => ({ id: c.id, min: travelTime(c, y) })).filter(x => x.min > 0).sort((a, b) => b.min - a.min)[0] || null;
const travelerTitle = id => isFem(id) ? 'Plus grande voyageuse' : 'Plus grand voyageur';
const hottestDuo = y => hotDuoCache[y + (publicView ? ':pub' : '')] ||= PAIRS.map(p => {
  const days = Array.from({ length:366 }, (_, i) => new Date(y, 0, 1 + i)).filter(d => d.getFullYear() === y && d <= rpDay);
  const n = days.filter(d => p.some(id => { const r = dayRecord(C.find(c => c.id === id), d); return r?.hot && (!r.with || p.includes(r.with)); })).length;   // nuits passées ensemble
  return { pair:p, n };
}).sort((a, b) => b.n - a.n)[0];
// Duel sous les draps (wrap de Taiga) : qui a passé le plus de nuits chaudes avec elle ?
const nightPartners = (c, x) => [...new Set(x.filled.filter(([, r]) => r.hot).map(([, r]) => r.with || partnerOf(c.id)).filter(Boolean))];
const battleHtml = (c, x) => {
  const fem = isFem(c.id), hotDays = x.filled.filter(([, r]) => r.hot);
  // Rivaux : toutes les personnes indiquées dans « La nuit » au fil de l'année.
  const rivals = nightPartners(c, x);
  const counts = rivals.map(id => ({ id, n: hotDays.filter(([, r]) => (r.with || partnerOf(c.id)) === id).length,
    rough: hotDays.filter(([, r]) => (r.with || partnerOf(c.id)) === id && (r.phys.includes('Éprouvé de la nuit') || (r.phys.includes('Douleur') && /nuit/i.test(r.notes?.Douleur || '')))).length }));
  const [ra, rb] = [...counts].sort((p, q) => q.rough - p.rough);
  const total = counts.reduce((a, b) => a + b.n, 0) || 1;
  const [a, b] = [...counts].sort((p, q) => q.n - p.n);
  const tie = a.n === b.n;
  // Genre des rivaux : celui de la fiche pour un personnage, sinon le sexe opposé au personnage (amantes / amants).
  const L = k => esc(whoLabel(k.id)), F = k => isChar(k.id) ? isFem(k.id) : !fem;
  const de = n => (/^[aeiouéèh]/i.test(n) ? "d'" : 'de ') + n;
  return `<h3 class="wrap-sec">Duel sous les draps</h3>
    <div class="battle">
      ${counts.map(k => `<div class="battle-row ${!tie && k.id === a.id ? 'win' : ''}"><span>${L(k)}</span>
        <div class="bar"><i style="width:${Math.round(k.n * 100 / total)}%"></i></div><b>${k.n}</b></div>`).join('')}
      ${tie ? `<p class="battle-joke">Égalité parfaite. ${c.name} ne choisit pas : ${fem ? 'elle' : 'il'} collectionne.</p>` : `
      <p class="battle-joke">${L(a)} remporte la couche haut la main : avec ${F(a) ? 'elle' : 'lui'}, les nuits ${de(c.name)} ont tourné au brasier.</p>
      <p class="battle-joke">${a.n >= b.n * 2 ? 'On voit vite qui lui offrait les meilleurs orgasmes…' : `${L(b)} talonne de près : la course aux orgasmes reste ouverte…`}</p>`}
      <h4 class="battle-sub">Lendemains éprouvants</h4>
      ${counts.map(k => `<div class="battle-row ${ra.rough > rb.rough && k.id === ra.id ? 'win' : ''}"><span>${L(k)}</span>
        <div class="bar"><i style="width:${Math.round(k.rough * 100 / Math.max(1, ra.rough))}%"></i></div><b>${k.rough}</b></div>`).join('')}
      <p class="battle-joke">${ra.rough === rb.rough ? `Personne ne ${fem ? 'la' : 'le'} ménage plus que l'autre : match nul, et des courbatures pour tout le monde.`
        : `Mention spéciale à ${L(ra)}, ${F(ra) ? 'celle' : 'celui'} ${fem ? 'qui lui a le plus fait trembler les jambes' : 'qui a le plus vidé ses réserves'} : ${ra.rough} réveil${ra.rough > 1 ? 's' : ''} « ${physLabel(c.id, 'Éprouvé de la nuit').toLowerCase()} ».${ra.n < a.n ? ' Moins souvent, mais plus fort.' : ''}`}</p>
    </div>`;
};
const faceStats = (c, y) => { const x = wrapExtras(c, y); return { name:c.name, days:x.filled.length, trips:x.trips.length, km:x.km, nights:x.filled.filter(([, r]) => r.hot).length, top: tally(x.filled.flatMap(([, r]) => r.acts))[0]?.[0] || '—' }; };
const wrapExtrasHtml = (c, y) => {
  const x = wrapExtras(c, y), lateRatio = pct(x.late, x.late + x.early);
  const card = (label, value, small = '') => `<div class="fx"><span class="fx-label">${label}</span><b>${value}</b>${small ? `<small>${small}</small>` : ''}</div>`;
  const p = x.partner && C.find(k => k.id === x.partner);
  const ps = p ? faceStats(p, y) : null, me = p ? faceStats(c, y) : null;
  return `
    <div class="wrap-title"><span>Titre de l'année</span><b>${x.title}</b></div>
    <h3 class="wrap-sec">Records</h3>
    <div class="fx-grid">
      ${card('Plus longue série', x.best + ' jours', "d'affilée")}
      ${x.word ? card("Mot de l'année", '« ' + esc(x.word) + ' »') : ''}
      ${x.slotsTotal ? card(lateRatio >= 50 ? 'Oiseau de nuit' : 'Lève-tôt', (lateRatio >= 50 ? lateRatio : 100 - lateRatio) + ' %', lateRatio >= 50 ? 'de ses activités le soir ou la nuit' : "de ses activités à l'aube ou le matin") : ''}
      ${(j => j ? card('Malbouffe de l\'année', esc(j[0]), `commandé ${j[1]} fois`) : '')(RANDOM_ACTS[JUNK_ACT] && allActs(c).includes(JUNK_ACT) ? junkOfYear(c, y)[0] : null)}
      ${x.bestMonth !== null ? card('Mois le plus rempli', MONTHS[x.bestMonth], 'saison préférée : ' + x.season) : ''}
    </div>
    ${x.first ? `<div class="mood-pair"><div><span>Premier mood</span><q>${esc(x.first[1].mood)}</q><small>${fmtDay(x.first[0])}</small></div>
      <div><span>Dernier mood</span><q>${esc(x.last[1].mood)}</q><small>${fmtDay(x.last[0])}</small></div></div>` : ''}
    <h3 class="wrap-sec">Voyages et météo</h3>
    <div class="fx-grid">
      ${card('Distance parcourue', x.km.toLocaleString('fr-FR') + ' km', x.mode ? 'surtout en ' + x.mode.toLowerCase() : 'sans quitter sa région')}
      ${(tt => tt ? card('Temps de voyage', fmtDur(tt), x.trips.length + ' voyage' + (x.trips.length > 1 ? 's' : '') + ' dans l\'année') : '')(travelTime(c, y))}
      ${(w => !w ? '' : w.id === c.id ? card('🏆 ' + travelerTitle(c.id), 'de l\'année', 'Palme décernée : ' + fmtDur(w.min) + ' sur les routes')
        : card(travelerTitle(w.id) + ' de l\'année', esc(nameOf(w.id)), fmtDur(w.min) + ' de voyage'))(topTraveler(y))}
      ${card('Régions visitées', x.regions.size, x.zones.size + ' zones et lieux distincts')}
      ${card('Chez soi', x.ratioHome + ' %', 'des journées dans sa région')}
      ${card('Sous la pluie', x.rain + ' jours', x.snow ? x.snow + ' jours de neige' : '')}
      ${x.hot ? card('Plus grosse chaleur', deg(x.hot.t), `le ${fmtDay(x.hot.d)}${x.hot.where ? ' à ' + esc(x.hot.where) : ''}`) : ''}
    </div>
    <h3 class="wrap-sec">Liens et fêtes</h3>
    <div class="fx-grid">
      ${x.duo ? card("Duo de l'année", esc(x.duo[0]), x.duo[1] + ' moments partagés') : ''}
      ${(h => h && h.n && h.pair.includes(c.id) && seesNights(c.id) ? `<div class="fx hot-duo">${icon('lips')}<span class="fx-label">Duo le plus chaud de l'année</span><b>${h.pair.map(nameOf).join(' & ')}</b><small>${h.n} nuits torrides, record toutes fiches confondues</small><em class="cheer">Bravo les petits coquins</em></div>` : '')(hottestDuo(y))}
      ${x.nightsMonth && seesNights(c.id) ? card('Mois le plus torride', MONTHS[x.nightsMonth[0]], x.nightsMonth[1] + ' nuits chaudes') : ''}
      ${x.fests.size ? card('Fêtes vécues', x.fests.size, [...x.fests].slice(0, 3).join(', ')) : ''}
      ${x.bdays ? card('Anniversaires fêtés', x.bdays) : ''}
      ${x.khurdan.length ? card('Grands jours khurdans', x.khurdan.length + ' jours', [...new Set(x.khurdan.map(k => k.startsWith('Départ') ? 'transhumances' : k))].join(', ')) : ''}
    </div>
    ${hasHot(c.id) && seesNights(c.id) && nightPartners(c, x).length >= 2 ? battleHtml(c, x) : ''}
    ${huntYearHtml(c, x)}
    <h3 class="wrap-sec">Météo intérieure</h3>
    <div class="frieze">${x.frieze.map((mo, i) => `<span style="background:${mo ? MOOD_COLORS[mo] || MOOD_COLORS[MOOD_MASC[mo]] || '#888' : 'transparent'}" title="${MONTHS[i]} : ${mo ? esc(mo) : '—'}"><i>${MONTHS[i][0].toUpperCase()}</i></span>`).join('')}</div>
    <p class="reserved frieze-legend">${x.frieze.map((mo, i) => mo ? `${MONTHS[i].slice(0, 4)}. ${esc(mo).toLowerCase()}` : '').filter(Boolean).slice(0, 4).join(' · ')}…</p>
    <h3 class="wrap-sec">Mosaïque</h3>
    <div class="mosaic">${MONTHS.map((mo, i) => `<span><i>${mo.slice(0, 3)}.</i></span>`).join('')}</div>
    <p class="reserved">Dans l'appli, chaque case affichera une capture du mois.</p>
    ${ps ? `<h3 class="wrap-sec">Face-à-face</h3>
      <table class="duel"><thead><tr><th></th><th>${esc(me.name)}</th><th>${esc(ps.name)}</th></tr></thead><tbody>
        <tr><th>Journées</th><td>${me.days}</td><td>${ps.days}</td></tr>
        <tr><th>Voyages</th><td>${me.trips}</td><td>${ps.trips}</td></tr>
        <tr><th>Kilomètres</th><td>${me.km.toLocaleString('fr-FR')}</td><td>${ps.km.toLocaleString('fr-FR')}</td></tr>
        <tr><th>Activité phare</th><td>${esc(me.top)}</td><td>${esc(ps.top)}</td></tr></tbody></table>` : ''}
    ${`<h3 class="wrap-sec">Les petites hontes</h3>
    <ul class="shames">
      ${x.drunk ? `<li>A fini ivre ${x.drunk} fois.</li>` : `<li>Pas une seule ivresse. Exemplaire, ou très discret${x.fem ? 'e' : ''}.</li>`}
      ${x.hurt ? `<li>${x.hurt} blessure${x.hurt > 1 ? 's' : ''} au compteur.</li>` : ''}
      ${x.curfew ? `<li>${x.curfew} jours de couvre-feu subis à Solution 9.</li>` : ''}
      ${x.least ? `<li>Activité la plus négligée : « ${esc(x.least[0])} », ${x.least[1]} fois. ${c.name}, voyons.</li>` : ''}
    </ul>`}`;
};

// ---------- Onglets de la fiche : Journée / Historique ----------
const tabsHtml = id => `<div class="tabs" role="tablist">
  <button type="button" role="tab" data-view="day" aria-selected="${state[id].view !== 'history'}">Journée</button>
  <button type="button" role="tab" data-view="history" aria-selected="${state[id].view === 'history'}">Historique</button></div>
  ${weOf(id).length ? `<p class="home-links we-links">${weOf(id).map(h => `<button type="button" class="chip-link" data-we-acc="${esc(h)}">${icon('eye')}@${esc(h)}</button>`).join('')}</p>` : ''}`;
const bindTabs = id => document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
  state[id].view = b.dataset.view; renderChar(id); window.scrollTo({ top:0 });
}));

const b4wrap = () => { const b = document.querySelector('.wrap-btn'); if (b) { b.disabled = true; b.textContent = "Chargement de l’année…"; } };
function renderHistory(id) {
  const c = C.find(x => x.id === id), t = THEMES[c.theme], s = state[id];
  root.className = t.cls;
  const cur = s.cal || (s.cal = { y: rpDay.getFullYear(), m: rpDay.getMonth() });
  const { y, m } = cur, n = daysIn(y, m);
  if (window.RP_SYNC && !RP_SYNC.hasMonth(y, m)) RP_SYNC.loadMonth(y, m).then(() => { if (current === id && s.view === 'history') renderChar(id); });
  const days = Array.from({ length:n }, (_, i) => new Date(y, m, i + 1));
  const lead = (new Date(y, m, 1).getDay() + 6) % 7;            // semaine commençant le lundi
  const sel = s.calSel && s.calSel.getMonth() === m && s.calSel.getFullYear() === y ? s.calSel : null;
  const selRec = sel && dayRecord(c, sel);
  const st = statsFor(c, days);
  const wrapOn = s.wrap;
  const wy = wrapYear();   // année du wrap (l'année écoulée en janvier)
  const yearDays = Array.from({ length: 366 }, (_, i) => new Date(wy, 0, 1 + i)).filter(d => d.getFullYear() === wy);
  const ws = wrapOn ? statsFor(c, yearDays) : null;
  const doneArcs = arcsOf(id).filter(a => a.done);
  const firstSnow = wrapOn && defaultCity(id) ? yearDays.find(d => d <= rpDay && snowCoverOn(defaultCity(id), d)) : null;

  const wrapSection = () => `
    <section>
      ${wrapBanner('')}
      <button type="button" class="btn wrap-btn" id="wrap-${id}">${wrapOn ? 'Masquer le wrap' : wrapReady() ? 'Revivre ' + wy : 'Aperçu du wrap ' + wy}</button>
      ${wrapReady() ? '' : `<p class="reserved">Aperçu secret : invisible pour tous jusqu'au 26 décembre. <button type="button" class="link" id="simwrap-${id}">Simuler le 26 décembre</button></p>`}
      ${wrapOn ? `<article class="wrap">
        <p class="kicker">L'année ${wy} de</p>
        <h2 class="wrap-name">${c.name}</h2>
        <div class="wrap-big"><div><b>${ws.filled}</b><span>journées racontées</span></div>
          ${hasHot(id) && seesNights(id) ? `<div><b>${ws.nights}</b><span>nuits chaudes</span></div>` : ''}
          <div><b>${ws.trips}</b><span>voyages</span></div>
          <div><b>${doneArcs.length}</b><span>arcs bouclés</span></div></div>
        <dl class="stats-list">
          <div><dt>Ce qui l'a occupé</dt><dd>${listOf(ws.acts)}</dd></div>
          <div><dt>Là où on l'a vu</dt><dd>${listOf(ws.places)}</dd></div>
          <div><dt>Humeur de l'année</dt><dd>${listOf(ws.moods)}</dd></div>
          ${ws.hottest ? `<div><dt>Jour le plus chaud</dt><dd>${deg(ws.hottest.max)} le ${fmtDay(ws.hottest.d)}</dd></div>
          <div><dt>Jour le plus froid</dt><dd>${deg(ws.coldest.min)} le ${fmtDay(ws.coldest.d)}</dd></div>` : ''}
          ${firstSnow ? `<div><dt>Premier sol enneigé</dt><dd>${fmtDay(firstSnow)}</dd></div>` : ''}
          ${(ms => ms.length ? `<div><dt>Moments marquants</dt><dd>${ms.map(m => `${esc(m.type)}${m.with ? ' avec ' + esc(whoLabel(m.with)) : ''} (${fmtDay(new Date(...m.key.split('-').map((v, i) => i === 1 ? v - 1 : +v)))})`).join(', ')}</dd></div>` : '')(milestonesOf(id).filter(m => m.key.startsWith(wy + '-')))}
          ${doneArcs.length ? `<div><dt>Arcs bouclés</dt><dd>${doneArcs.map(a => esc(a.title)).join(', ')}</dd></div>` : ''}
        </dl>
        ${wrapExtrasHtml(c, wy)}
      </article>` : ''}
    </section>`;
  document.getElementById('view').innerHTML = `
    ${tabsHtml(id)}
    <header><p class="kicker">${t.glyph} ${c.groups.join(' · ')}</p><h1>${c.name}${c.surname ? `<small>${c.surname}</small>` : ''}</h1></header>
    <section>
      <div class="cal-head"><button type="button" class="btn" id="cal-prev" aria-label="Mois précédent">‹</button>
        <h2>${MONTHS[m]} ${y}</h2>
        <button type="button" class="btn" id="cal-next" aria-label="Mois suivant">›</button></div>
      <div class="cal" role="grid">
        ${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => `<span class="cal-dow">${d}</span>`).join('')}
        ${'<span></span>'.repeat(lead)}
        ${days.map(d => { const r = dayRecord(c, d), f = festivalFor(c, d, r || { real: sameDay(d, rpDay) }) || khurdanDays(c, d).length, bd = birthdaysOn(c.id, d).length, ms = milestonesOn(c.id, d).length;
          return `<button type="button" class="cal-day ${r ? 'filled' : ''} ${sameDay(d, rpDay) ? 'today' : ''} ${sel && sameDay(d, sel) ? 'sel' : ''} ${d > rpDay ? 'future' : ''}" data-day="${d.getDate()}" ${d > rpDay ? 'disabled' : ''}>
            <span class="n">${d.getDate()}</span>${r?.cond ? icon(r.cond.icon) : ''}${nightOn(c, d) ? '<i class="heart"></i>' : ''}${f ? '<i class="fest-dot"></i>' : ''}${bd ? '<i class="bday-dot"></i>' : ''}${ms ? '<i class="ms-mark">✦</i>' : ''}</button>`; }).join('')}
      </div>
      <p class="reserved cal-legend"><span class="key filled"></span> journée remplie · <i class="heart"></i> nuit chaude · <i class="fest-dot"></i> fête · <i class="bday-dot"></i> anniversaire · <i class="ms-mark">✦</i> moment marquant</p>
      ${sel ? `<div class="day-detail">
        ${milestonesOn(id, sel).map(m => `<p class="milestone">${icon('ring')}<span>${esc(msLabel(m))}</span></p>`).join('')}
        ${selRec?.rp ? `<p class="where">${icon('star')}<span>Journée jouée en RP${isChar(selRec.rp) ? ' avec ' + esc(nameOf(selRec.rp)) : ''}</span></p>` : ''}
        <h3>${fmtDay(sel)}${specialDays(c, sel, selRec || { real: sameDay(sel, rpDay) }).map(x => ' · ' + esc(x)).join('')}</h3>
        ${selRec ? `
          ${selRec.mood ? `<p class="recap-mood small">${esc(selRec.mood)}</p>` : ''}
          ${selRec.faits ? `<p class="where">${icon('star')}<span>Faits notoires : ${esc(selRec.faits)}</span></p>` : ''}
          ${selRec.cond ? `<p class="where">${icon(selRec.cond.icon)}<span>${selRec.cond.label} · ${deg(selRec.cond.tp.max)} / ${deg(selRec.cond.tp.min)}</span></p>` : ''}
          ${selRec.place ? `<p class="where">${icon('pin')}<span>${esc(selRec.place)}</span></p>` : ''}
          ${selRec.acts.length ? `<p class="where">${icon('matin')}<span>${selRec.acts.map(a => esc(a + withTxt(selRec.withActs, a))).join(' · ')}</span></p>` : ''}
          ${seesNights(id) && (selRec.nightStates?.length || selRec.nightNote || selRec.nightNotes?.['Nuit chaude']) ? `<p class="where">${icon('lips')}<span>Nuit : ${esc([nightStatesText(id, selRec.nightStates, selRec.nightNotes, selRec.calmWith), selRec.nightNote].filter(Boolean).join(' · '))}</span></p>` : ''}
          ${statesLine(id, selRec.phys, selRec.notes, 'heartbeat')}${statesLine(id, selRec.mental, selRec.notes, 'brain')}
          ${selRec.trip ? `<p class="where">${icon('route')}<span>Voyage${selRec.tripInfo?.from ? ' : ' + esc(REGIONS[selRec.tripInfo.from]?.label || '') + (selRec.tripInfo.to ? ' → ' + esc(REGIONS[selRec.tripInfo.to]?.label || '') : '') : ''}${selRec.tripInfo && tripBits(selRec.tripInfo) ? ' · ' + esc(tripBits(selRec.tripInfo)) : ''}</span></p>` : ''}
          ${seesNights(id) && selRec.hot ? `<p class="where night-line">${icon('lips')}<span>Nuit chaude${selRec.with ? ' avec ' + esc(whoLabel(selRec.with)) : ''}${selRec.nightNotes?.['Nuit chaude'] ? ' (' + esc(selRec.nightNotes['Nuit chaude']) + ')' : ''}</span></p>` : (n => n ? `<p class="where night-line">${icon('lips')}<span>Nuit chaude${n.with ? ' avec ' + esc(whoLabel(n.with)) : ''}</span></p>` : '')(nightOn(c, sel))}`
        : `<p class="reserved">Pas de fiche remplie ce jour-là.</p>${(n => n && seesNights(id) ? `<p class="where night-line">${icon('lips')}<span>Nuit chaude${n.with ? ' avec ' + esc(whoLabel(n.with)) : ''}</span></p>` : '')(nightOn(c, sel))}`}
      </div>` : '<p class="reserved">Touche un jour pour revoir sa fiche.</p>'}
    </section>

    <section class="month-recap"><h2>Récap de ${MONTHS[m]}</h2>
      <dl class="stats-list">
        <div><dt>Journées remplies</dt><dd>${st.filled} / ${st.total}</dd></div>
        <div><dt>Activités phares</dt><dd>${listOf(st.acts)}</dd></div>
        <div><dt>Lieux fréquentés</dt><dd>${listOf(st.places)}</dd></div>
        <div><dt>Humeurs dominantes</dt><dd>${listOf(st.moods)}</dd></div>
        ${st.weather.length ? `<div><dt>Météo</dt><dd>${listOf(st.weather)}</dd></div>` : ''}
        ${st.hottest ? `<div><dt>Températures</dt><dd>de ${deg(st.coldest.min)} (${fmtDay(st.coldest.d)}) à ${deg(st.hottest.max)} (${fmtDay(st.hottest.d)})</dd></div>` : ''}
        ${st.phys.length ? `<div><dt>État physique</dt><dd>${listOf(st.phys)}</dd></div>` : ''}
        ${st.mental.length ? `<div><dt>État mental</dt><dd>${listOf(st.mental)}</dd></div>` : ''}
        ${hasHot(id) && seesNights(id) ? `<div><dt>Nuits chaudes</dt><dd>${st.nights}</dd></div>` : ''}
        ${st.trips ? `<div><dt>Voyages</dt><dd>${st.trips}</dd></div>` : ''}
      </dl>
    </section>

    ${wrapVisible() ? wrapSection() : ''}`;
  bindTabs(id);
  document.getElementById('cal-prev').addEventListener('click', () => { cur.m--; if (cur.m < 0) { cur.m = 11; cur.y--; } s.calSel = null; renderChar(id); });
  document.getElementById('cal-next').addEventListener('click', () => { cur.m++; if (cur.m > 11) { cur.m = 0; cur.y++; } s.calSel = null; renderChar(id); });
  document.querySelectorAll('[data-day]').forEach(b => b.addEventListener('click', () => { s.calSel = new Date(y, m, +b.dataset.day); renderChar(id); }));
  document.getElementById('wrap-' + id)?.addEventListener('click', async () => { s.wrap = !s.wrap; if (s.wrap && window.RP_SYNC) { b4wrap(); await RP_SYNC.loadYear(wrapYear()); Object.keys(hotDuoCache).forEach(k => delete hotDuoCache[k]); } renderChar(id); });
  document.getElementById('simwrap-' + id)?.addEventListener('click', async () => { simulateWrapDay = true; s.wrap = true; if (window.RP_SYNC) { b4wrap(); await RP_SYNC.loadYear(wrapYear()); Object.keys(hotDuoCache).forEach(k => delete hotDuoCache[k]); } renderChar(id); });
}

// ---------- Sections de la journée : état physique, capture, arcs ----------
// ---------- Moments marquants (mariage, naissance…) : restent dans l'historique ----------
const MILESTONE_TYPES = ['Rencontre', 'Fiançailles', 'Mariage', 'Grossesse', 'Naissance', 'Séparation', 'Deuil', 'Autre'];
const SHARED_TYPES = ['Rencontre', 'Fiançailles', 'Mariage', 'Grossesse', 'Naissance', 'Séparation'];
const MILESTONES = {};   // id → [{ key, type, note, with }]
const milestonesOf = id => (MILESTONES[id] ||= []);
const milestonesOn = (id, d) => milestonesOf(id).filter(m => m.key === keyOf(d));
const msLabel = m => `${m.type}${m.with ? ' avec ' + whoLabel(m.with) : ''}${m.note ? ' — ' + m.note : ''}`;
// Ce qui se passe aujourd'hui autour du personnage (fêtes, anniversaires, jours khurdans).
// Haut de fiche : moments marquants, événements de groupe et événements sur mesure du jour.
const headEvents = c => [
  ...milestonesOn(c.id, rpDay).map(m => ['ring', msLabel(m)]),
  ...eventsFor(c).filter(e => e.today).map(e => ['flag', e.label]),
  ...(state[c.id].dayEvents || []).map(x => ['star', x]),
].map(([ic, x]) => `<span class="fest">${icon(ic)}${esc(x)}</span>`).join('');
const dayHighlights = c => [
  ...(f => f ? [['star', f.name]] : [])(inEorzeaToday(c.id) ? festivalOn(rpDay) : null),
  ...khurdanDays(c, rpDay).map(x => [x.startsWith('Départ') ? 'route' : 'star', x]),
  ...birthdaysOn(c.id, rpDay).map(x => ['cake', x]),
].map(([ic, x]) => `<p class="where">${icon(ic)}<span>${esc(x)}</span></p>`).join('');
const milestoneSection = (id, inner) => {
  const s = state[id], today = milestonesOn(id, rpDay), p = partnerOf(id);
  return `${inner ? '' : '<section><h2>Moment marquant</h2>'}
    ${today.map((m, i) => `<p class="milestone">${icon('ring')}<span>${esc(msLabel(m))}</span><button type="button" class="link small" data-ms-del="${i}" aria-label="Retirer">×</button></p>`).join('')}
    ${s.msOpen ? `<div class="event-form">
        <div class="place-list" role="group" aria-label="Type">${MILESTONE_TYPES.map(t => `<button type="button" data-ms-type="${t}" aria-pressed="${s.msType === t}">${t}</button>`).join('')}</div>
        <input type="text" id="ms-note-${id}" placeholder="Précisions (facultatif)">
        ${p && SHARED_TYPES.includes(s.msType) ? `<label class="check-inline"><input type="checkbox" id="ms-with-${id}" checked> Avec ${nameOf(p)} (ajouté aussi sur sa fiche)</label>` : ''}
        <div class="special-row"><button type="button" class="btn" id="ms-save-${id}" ${s.msType ? '' : 'disabled'}>Enregistrer</button><button type="button" class="link ico-btn" id="ms-cancel-${id}" title="Annuler" aria-label="Annuler">${icon('cross')}</button></div>
      </div>` : `<button type="button" class="link alert-add ico-btn" id="ms-add-${id}" title="Noter un moment marquant (mariage, naissance…)" aria-label="Noter un moment marquant">${icon('plus')}${icon('ring')}</button>`}
  ${inner ? '' : '</section>'}`;
};
const bindMilestones = id => {
  const s = state[id];
  document.getElementById('ms-add-' + id)?.addEventListener('click', () => { s.msOpen = true; s.msType = null; renderChar(id); });
  document.getElementById('ms-cancel-' + id)?.addEventListener('click', () => { s.msOpen = false; renderChar(id); });
  document.querySelectorAll('[data-ms-type]').forEach(b => b.addEventListener('click', () => {
    const note = document.getElementById('ms-note-' + id)?.value || ''; s.msType = b.dataset.msType; renderChar(id);
    const el = document.getElementById('ms-note-' + id); if (el) el.value = note;
  }));
  document.getElementById('ms-save-' + id)?.addEventListener('click', () => {
    const note = document.getElementById('ms-note-' + id).value.trim(), withP = document.getElementById('ms-with-' + id)?.checked ? partnerOf(id) : null;
    const key = keyOf(rpDay);
    milestonesOf(id).push({ key, type: s.msType, note, with: withP });
    if (withP) { milestonesOf(withP).push({ key, type: s.msType, note, with: id });
      notify(id, withP, (MS_NEWS[s.msType] || ((a, b) => `Moment marquant pour ${a} et ${b} : ${s.msType.toLowerCase()}`))(nameOf(withP), nameOf(id)), 'ms:' + key + ':' + s.msType + ':' + [id, withP].sort().join('+')); }
    s.msOpen = false; renderChar(id);
  });
  document.querySelectorAll('[data-ms-del]').forEach(b => b.addEventListener('click', () => {
    const m = milestonesOn(id, rpDay)[+b.dataset.msDel];
    MILESTONES[id] = milestonesOf(id).filter(x => x !== m);
    if (m.with && isChar(m.with)) MILESTONES[m.with] = milestonesOf(m.with).filter(x => !(x.key === m.key && x.type === m.type && x.with === id));
    renderChar(id);
  }));
};
// ---------- Tableau de chasse : prises tirées au hasard (stables pour la journée) ----------
// Gibier de la steppe (liste de Nono). weight = fréquence relative ; group = seulement en chasse de groupe.
const KHURDAN_HUNT = {
    acts: { 'Chasse solo': 'solo', 'Chasse en groupe': 'group' },
    odds: { solo: .8, group: .9 },          // probabilité de rentrer avec au moins une prise
    max:  { solo: 2, group: 4 },            // nombre maximum de prises
    game: [
      // Lagomorphes et sciuridés : le quotidien du chasseur
      { name:'Lapin', weight:6 }, { name:'Lièvre', weight:6 }, { name:'Marmotte', weight:6 },
      // Oiseaux
      { name:'Perdrix', weight:4 }, { name:'Faisan', weight:3 }, { name:'Canard sauvage', weight:2.5 },
      { name:'Oie sauvage', weight:2 }, { name:'Outarde', weight:1.5 },
      // Cervidés et bovidés
      { name:'Chevreuil', weight:3.5 }, { name:'Daim', weight:2.5 }, { name:'Cerf', weight:2 }, { name:'Antilope', weight:2.5 },
      { name:'Hainag', weight:1.2 },
      // Porcins et canidés
      { name:'Sanglier', weight:1.5 }, { name:'Renard', weight:2.5 }, { name:'Loup', weight:1 },
      // Grands prédateurs et géants : surtout en groupe ; en solo, exceptionnels
      // (soloWeight : environ 0,4 % des prises en solo pour un félin, 0,1 % pour le mammouth)
      { name:'Tigre', weight:.5, soloWeight:.19 }, { name:'Lion', weight:.4, soloWeight:.19 },
      { name:'Baras', weight:.4, soloWeight:.19 }, { name:'Coeurl', weight:.35, soloWeight:.19 },
      { name:'Mammouth', weight:.3, soloWeight:.047 },
    ],
};
// Tous les personnages de Solution 9 chassent avec la même table de prises (Chasse solo / Chasse en groupe, dans « Métier »).
const HUNTS = Object.fromEntries(C.map(c => [c.id, KHURDAN_HUNT]));
// Ankhbayar, chasseur de métier : plus doué que les autres.
HUNTS.ankhbayar = { ...KHURDAN_HUNT, odds: { solo: .9, group: .95 } };
// Tableau de chasse de l'année (wrap).
const huntYear = (c, x) => {
  const outs = x.filled.flatMap(([d, r]) => r.acts.filter(a => HUNTS[c.id]?.acts[a]).map(a => huntFor(c.id, a, d)));
  if (!outs.length) return null;
  const wins = outs.filter(h => h.catches.length);
  const all = wins.flatMap(h => h.catches);
  const byName = tally(all.flatMap(k => Array(k.qty).fill(k.name)));
  const rarest = byName.map(([n]) => HUNTS[c.id].game.find(g => g.name === n)).sort((a, b) => a.weight - b.weight)[0];
  const rarestSolo = rarest && outs.some(h => h.mode === 'solo' && h.catches.some(k => k.name === rarest.name)) && rarest.soloWeight !== undefined;
  return { outs: outs.length, solo: outs.filter(h => h.mode === 'solo').length, group: outs.filter(h => h.mode === 'group').length,
    wins: wins.length, empty: outs.length - wins.length, total: byName.reduce((a, [, n]) => a + n, 0), byName, rarest, rarestSolo };
};
const huntYearHtml = (c, x) => {
  const h = huntYear(c, x); if (!h) return '';
  return `<h3 class="wrap-sec">Tableau de chasse de l'année</h3>
    <div class="fx-grid">
      <div class="fx"><span class="fx-label">Prises</span><b>${h.total}</b><small>en ${h.outs} sorties (${h.solo} en solo, ${h.group} en groupe)</small></div>
      <div class="fx"><span class="fx-label">Réussite</span><b>${pct(h.wins, h.outs)} %</b><small>${h.empty} retour${h.empty > 1 ? 's' : ''} bredouille</small></div>
      ${h.rarest ? `<div class="fx"><span class="fx-label">Plus belle prise</span><b>${esc(h.rarest.name)}</b><small>${h.rarestSolo ? 'abattue en solo, exploit !' : 'prise de l\'année'}</small></div>` : ''}
    </div>
    ${h.byName.length ? `<table class="duel hunt-table"><thead><tr><th>Gibier</th><th>Nombre</th></tr></thead><tbody>${h.byName.map(([n, q]) => `<tr><th>${esc(n)}</th><td>${q}</td></tr>`).join('')}</tbody></table>` : ''}`;
};
// Prise choisie à la main (au lieu du tirage au sort) : gardée sur la journée (huntSet[activité] = [{ name, qty }]).
const huntManual = (id, label, day) => sameDay(day, rpDay) ? state[id]?.huntSet?.[label]
  : typeof HISTORY !== 'undefined' ? HISTORY[id]?.[keyOf(day)]?.huntSet?.[label] : null;
const huntGame = (id, label) => { const h = HUNTS[id], mode = h?.acts[label]; return !mode ? [] : h.game.filter(g => mode === 'group' || !g.group).map(g => g.name); };
const huntFor = (id, label, day = rpDay) => {
  const h = HUNTS[id], mode = h?.acts[label]; if (!mode) return null;
  const man = huntManual(id, label, day);
  if (Array.isArray(man)) return { mode, manual: true, catches: man.map(x => ({ name: x.name, qty: Math.max(1, +x.qty || 1) })) };
  const k = keyOf(day) + ':' + id + ':' + label;
  if (seeded(k + 'ok') >= h.odds[mode]) return { mode, catches: [] };          // bredouille
  const wOf = g => mode === 'solo' ? (g.group ? 0 : g.soloWeight ?? g.weight) : g.weight;
  const pool = h.game.filter(g => wOf(g) > 0), total = pool.reduce((a, g) => a + wOf(g), 0);
  const n = 1 + Math.floor(seeded(k + 'n') * h.max[mode]);
  const catches = Array.from({ length: n }, (_, i) => { let r = seeded(k + 'g' + i) * total; return pool.find(g => (r -= wOf(g)) < 0) || pool.at(-1); });
  return { mode, catches: tally(catches.map(g => g.name)).map(([name, qty]) => ({ name, qty })) };
};
const huntText = h => !h ? '' : h.catches.length ? h.catches.map(c => (c.qty > 1 ? c.qty + ' × ' : '') + c.name).join(', ') : 'bredouille';
// Même présentation que « Nuit chaude » : cases à cocher avec une petite icône.
// « Avec qui ? » pour la nuit calme : mêmes choix que pour la nuit chaude (partenaire, amants), plus tout personnage.
const calmWithPicker = (id, scope) => {
  const cur = scope === 'next' ? calmWithOf(id) : prevEntry(id)?.calmWith || null;
  const chips = [...new Set([partnerOf(id), ...loversOf(id)].filter(Boolean))];
  const others = C.filter(x => x.id !== id && !chips.includes(x.id));
  return `<div class="place-list calm-with" role="group" aria-label="Avec qui ?">
      ${chips.map(w => `<button type="button" data-calm-with="${esc(w)}" data-calm-scope="${scope}" aria-pressed="${cur === w}">${esc(whoLabel(w))}</button>`).join('')}
      <button type="button" data-calm-with="" data-calm-scope="${scope}" aria-pressed="${!cur}">Seul·e</button>
      <select data-calm-select="${scope}" aria-label="Autre personnage"><option value="">Autre…</option>${others.map(x => `<option value="${x.id}" ${cur === x.id ? 'selected' : ''}>${x.name}</option>`).join('')}</select>
    </div>
    ${scope === 'next' && cur && isChar(cur) ? `<p class="reserved">Cochée aussi sur la fiche ${deName(nameOf(cur))}.</p>` : ''}`;
};
// Repliées par défaut pour gagner de la place ; le titre rappelle ce qui est coché. État gardé sur l'appareil.
const NIGHT_OPEN = (() => { try { return new Set(JSON.parse(localStorage.getItem('rp-night-open') || '[]')); } catch { return new Set(); } })();
const setNightOpen = (k, on) => { on ? NIGHT_OPEN.add(k) : NIGHT_OPEN.delete(k); try { localStorage.setItem('rp-night-open', JSON.stringify([...NIGHT_OPEN])); } catch {} };
const nightChips = (id, set, attr, hotHtml = '', question = 'Comment s\'est passée la nuit ?', hotSum = '', noteHtml = '', notes = {}) => { const k = id + ':' + attr, scope = attr === 'data-prev-night' ? 'prev' : 'next';
  const on = [hotSum, ...NIGHT_STATES.filter(x => set.has(x)).map(x => x === 'Nuit calme' ? calmLabel(id, scope === 'next' ? calmWithOf(id) : prevEntry(id)?.calmWith) : physLabel(id, x))].filter(Boolean);
  return `<details class="night-more" data-night-fold="${k}" ${NIGHT_OPEN.has(k) ? 'open' : ''}>
    <summary>${icon('nuit')}<span>${question}${on.length ? ` <small>· ${esc(on.join(', '))}</small>` : ''}</span></summary>
    <div class="night-kind"><h4 class="chrono-sub">Type de nuit</h4>
      ${(([hotLabel, hotOpts = '']) => `<div class="night-kind-pick">${hotLabel}<label class="act night"><input type="checkbox" ${attr}="Nuit calme" ${set.has('Nuit calme') ? 'checked' : ''}>${icon(NIGHT_ICON['Nuit calme'])}<span>${esc(physLabel(id, 'Nuit calme'))}</span></label></div>
      ${hotOpts}${set.has('Nuit calme') ? nightNoteInput(id, scope, 'Nuit calme', notes['Nuit calme']) + calmWithPicker(id, scope) : ''}`)(hotHtml.split('<!--hot-opts-->'))}</div>
    <div class="night-extra"><h4 class="chrono-sub">Et aussi… <small>(cumulables)</small></h4>
      ${NIGHT_STATES.filter(x => x !== 'Nuit calme').map(x => `<label class="act night"><input type="checkbox" ${attr}="${esc(x)}" ${set.has(x) ? 'checked' : ''}>${icon(NIGHT_ICON[x])}<span>${esc(physLabel(id, x))}</span></label>${set.has(x) ? nightNoteInput(id, scope, x, notes[x]) : ''}${x === 'Nuit calme' && set.has(x) ? calmWithPicker(id, scope) : ''}`).join('')}</div>
    ${noteHtml}
  </details>`; };
const prevNightBlock = id => {
  const s = state[id], n = prevNight(id), e = prevEntry(id), c = C.find(x => x.id === id);
  const filled = n.hot || n.states.length || n.note || Object.values(n.notes).some(Boolean);
  const head = `<h3 class="chrono-h">Nuit précédente <small>${fmtDay(prevDay())}</small></h3>`;
  if (filled && !s.prevEdit) return `<div class="chrono-part">${head}${prevNightLine(id).replace('Nuit précédente : ', '')}
    <p class="reserved">Reprise de la nuit à venir de la veille. <button type="button" class="link small ico-btn" id="prev-edit-${id}" title="Modifier" aria-label="Modifier">${icon('pencil')}</button></p></div>`;
  const hotOwn = !!e?.night?.hot, w = e?.night?.with || '';
  const opts = [...new Set([partnerOf(id), ...loversOf(id)].filter(Boolean))];
  const hotHtml = !hasHot(id) ? '' : n.hot && !n.hot.own ? `<!--hot-opts--><p class="where">${icon('lips')}<span>Nuit chaude avec ${esc(whoLabel(n.hot.with))} <small>(indiquée sur la fiche ${deName(nameOf(n.hot.with))})</small></span></p>`
      : `<label class="act night"><input type="checkbox" id="prev-hot-${id}" ${hotOwn ? 'checked' : ''}>${icon('lips')}<span>Nuit chaude</span></label><!--hot-opts-->
      ${hotOwn ? `<label class="check-inline">avec <select id="prev-with-${id}"><option value="">—</option>${opts.map(o => `<option value="${esc(o)}" ${o === w ? 'selected' : ''}>${esc(whoLabel(o))}</option>`).join('')}</select></label>` : ''}`;
  const hotNote = n.hot ? nightNoteInput(id, 'prev', 'Nuit chaude', n.notes['Nuit chaude']) : '';
  return `<div class="chrono-part">${head}
    ${nightChips(id, new Set(n.states), 'data-prev-night', hotHtml + hotNote, 'Comment s\'est passée la nuit ?', n.hot ? 'Nuit chaude' + (n.hot.with ? ' avec ' + whoLabel(n.hot.with) : '') : '', '', n.notes)}
    ${filled ? `<button type="button" class="link small ico-btn" id="prev-done-${id}" title="Terminé" aria-label="Terminé">${icon('check')}</button>` : ''}</div>`;
};
const statesBlock = id => { const s = state[id]; s.phys ||= new Set(); s.mental ||= new Set(); s.stateNotes ||= {};
  const group = (title, list, set, attr) => `<h3 class="state-h">${icon(title === 'État physique' ? 'heartbeat' : 'brain')}${title}</h3>
    <div class="place-list" role="group" aria-label="${title}">${list.map(p => `<button type="button" ${attr}="${p}" aria-pressed="${set.has(p)}">${esc(physLabel(id, p))}</button>`).join('')}</div>
    ${list.filter(p => set.has(p)).map(p => `<input type="text" class="state-note" data-state-note="${p}" placeholder="${esc(physLabel(id, p))} : ${STATE_HINT[p] ? `à préciser (ex. : ${STATE_HINT[p]})` : 'précision (facultatif)'}" value="${esc(s.stateNotes[p] || '')}">`).join('')}`;
  return group('État physique', PHYS, s.phys, 'data-phys') + group('État mental', MENTAL, s.mental, 'data-mental'); };
const shotSection = id => { const s = state[id];
  return `<section><h2>Capture du jour</h2>
    ${s.shot ? `<figure class="shot"><img src="${s.shot}" alt="Capture du jour de ${esc(C.find(x => x.id === id).name)}"><figcaption><button type="button" class="link ico-btn" id="shot-off-${id}" title="Retirer la capture" aria-label="Retirer la capture">${icon('minus')}</button></figcaption></figure>`
      : `<label class="btn file-btn">${icon('camera')}Joindre une capture<input type="file" id="shot-${id}" accept="image/*" hidden></label>`}
  </section>`; };
const arcsSection = id => {
  const s = state[id], list = arcsOf(id), open = list.filter(a => !a.done), done = list.filter(a => a.done);
  const arcHtml = a => `<div class="arc ${a.done ? 'done' : ''}">
      <div class="arc-head">
        ${s.arcEdit === a.id ? `<input type="text" id="arc-title-${a.id}" value="${esc(a.title)}"><button type="button" class="btn" data-arc-save="${a.id}">OK</button>`
          : `<label class="check-inline arc-title"><input type="checkbox" data-arc-done="${a.id}" ${a.done ? 'checked' : ''}><b>${esc(a.title)}</b></label>
             <span class="arc-progress">${a.steps.filter(x => x.done).length}/${a.steps.length}</span>
             <button type="button" class="link ico-btn" data-arc-edit="${a.id}" title="Modifier" aria-label="Modifier">${icon('pencil')}</button>
             ${s.arcDel === a.id ? `<button type="button" class="link danger" data-arc-del-ok="${a.id}">Confirmer la suppression</button>` : `<button type="button" class="link ico-btn" data-arc-del="${a.id}" title="Supprimer" aria-label="Supprimer">${icon('trash')}</button>`}`}
      </div>
      <ul class="arc-steps">${a.steps.map((st, i) => `<li><label class="check-inline"><input type="checkbox" data-step="${a.id}:${i}" ${st.done ? 'checked' : ''}> ${esc(st.t)}</label>
        <button type="button" class="link small" data-step-del="${a.id}:${i}" aria-label="Retirer l'étape">×</button></li>`).join('')}</ul>
      ${a.done ? '' : `<div class="special-row"><input type="text" id="step-new-${a.id}" placeholder="Nouvelle étape"><button type="button" class="btn" data-step-add="${a.id}">+</button></div>`}
    </div>`;
  return `<section><h2>Arcs narratifs</h2>
    ${open.length ? open.map(arcHtml).join('') : '<p class="reserved">Aucun arc en cours.</p>'}
    <div class="special-row"><input type="text" id="arc-new-${id}" placeholder="Nouvel arc (ex. : Retrouver la lame de Bator)"><button type="button" class="btn" id="arc-add-${id}">Créer</button></div>
    ${done.length ? `<details class="arcs-done"><summary>Arcs terminés (${done.length})</summary>${done.map(arcHtml).join('')}</details>` : ''}
  </section>`;
};
const bindDaySections = id => {
  const s = state[id], list = arcsOf(id), find = aid => list.find(a => a.id === aid);
  document.querySelectorAll('[data-phys]').forEach(b => b.addEventListener('click', () => {
    const p = b.dataset.phys;
    if (s.phys.has(p)) { s.phys.delete(p); delete s.stateNotes[p]; }
    else { if (p === 'En forme') [...s.phys].forEach(x => { s.phys.delete(x); delete s.stateNotes[x]; }); else s.phys.delete('En forme'); s.phys.add(p); }
    renderChar(id);
  }));
  document.querySelectorAll('[data-mental]').forEach(b => b.addEventListener('click', () => {
    const p = b.dataset.mental;
    if (s.mental.has(p)) { s.mental.delete(p); delete s.stateNotes[p]; }
    else { MENTAL_EXCL.filter(g => g.includes(p)).flat().forEach(x => { s.mental.delete(x); delete s.stateNotes[x]; }); s.mental.add(p); }
    renderChar(id);
  }));
  document.querySelectorAll('[data-state-note]').forEach(i => i.addEventListener('input', () => { s.stateNotes[i.dataset.stateNote] = i.value.trim(); }));
  document.getElementById('shot-' + id)?.addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader(); rd.onload = () => { s.shot = rd.result; renderChar(id); }; rd.readAsDataURL(f);
  });
  document.getElementById('shot-off-' + id)?.addEventListener('click', () => { s.shot = null; renderChar(id); });
  document.getElementById('arc-add-' + id)?.addEventListener('click', () => {
    const v = document.getElementById('arc-new-' + id).value.trim(); if (!v) return;
    list.push({ id:'arc-' + (arcSeq++), title:v, done:false, steps:[] }); renderChar(id);
  });
  document.querySelectorAll('[data-arc-done]').forEach(cb => cb.addEventListener('change', e => { find(cb.dataset.arcDone).done = e.target.checked; renderChar(id); }));
  document.querySelectorAll('[data-arc-edit]').forEach(b => b.addEventListener('click', () => { s.arcEdit = b.dataset.arcEdit; renderChar(id); }));
  document.querySelectorAll('[data-arc-save]').forEach(b => b.addEventListener('click', () => {
    const v = document.getElementById('arc-title-' + b.dataset.arcSave).value.trim(); if (v) find(b.dataset.arcSave).title = v;
    s.arcEdit = null; renderChar(id);
  }));
  document.querySelectorAll('[data-arc-del]').forEach(b => b.addEventListener('click', () => { s.arcDel = b.dataset.arcDel; renderChar(id); }));
  document.querySelectorAll('[data-arc-del-ok]').forEach(b => b.addEventListener('click', () => {
    list.splice(list.findIndex(a => a.id === b.dataset.arcDelOk), 1); s.arcDel = null; renderChar(id);
  }));
  document.querySelectorAll('[data-step]').forEach(cb => cb.addEventListener('change', e => {
    const [aid, i] = cb.dataset.step.split(':'); find(aid).steps[+i].done = e.target.checked; renderChar(id);
  }));
  document.querySelectorAll('[data-step-del]').forEach(b => b.addEventListener('click', () => {
    const [aid, i] = b.dataset.stepDel.split(':'); find(aid).steps.splice(+i, 1); renderChar(id);
  }));
  document.querySelectorAll('[data-step-add]').forEach(b => b.addEventListener('click', () => {
    const aid = b.dataset.stepAdd, v = document.getElementById('step-new-' + aid).value.trim(); if (!v) return;
    find(aid).steps.push({ t:v, done:false }); renderChar(id);
  }));
};

let navCentered = null;   // page pour laquelle la liste a déjà été centrée
function renderNav() {
  const list = document.getElementById('navList');
  const visible = C.filter(shown);
  let html = `<li><button type="button" class="chip" id="nav-home" style="${vars(THEMES.s9)}" data-go="home" ${current==='home'?'aria-current="true"':''}>Accueil</button></li>`;
  // Applis du lore : Wondereye (réseau social) et Pixel Meet (rencontres, privé)
  html += `<li><button type="button" class="chip app-chip" id="nav-we" style="${vars(THEMES.yololo)}" data-go="we" ${current==='we'?'aria-current="true"':''}><span class="g" aria-hidden="true">ω</span>Wondereye</button></li>`;
  html += `<li><button type="button" class="chip app-chip" id="nav-pm" style="${vars(THEMES.prism)}" data-go="pm" ${current==='pm'?'aria-current="true"':''}><span class="g" aria-hidden="true">♥</span>Pixel Meet${S9.pmUnreadCount() ? '<span class="news-dot" aria-label="message"></span>' : ''}</button></li>`;
  const seen = new Set();
  GROUPS.forEach(g => {
    const members = visible.filter(c => c.groups.includes(g));
    if (!members.length) return;
    html += `<li class="nav-group">${g}</li>`;
    members.forEach(c => {
      const t = THEMES[c.theme], dup = seen.has(c.id); seen.add(c.id);
      html += `<li class="${dup?'dup':''}"><button type="button" class="chip" id="nav-${c.id}-${g}" style="${vars(t)}" data-go="${c.id}" ${current===c.id?'aria-current="true"':''}><span class="g" aria-hidden="true">${t.glyph}</span>${c.name}${myNews().some(n => !n.read && n.charId === c.id) ? '<span class="news-dot" aria-label="nouvelle"></span>' : ''}<span class="dot ${state[c.id].done || rpPlayed[c.id] ? 'done' : ''}" aria-label="${state[c.id].done ? 'terminé' : rpPlayed[c.id] ? 'jouée en RP' : 'à faire'}"></span></button></li>`;
    });
  });
  list.innerHTML = html;
  // Centre le personnage actif dans la barre de puces, en ne faisant défiler QUE la barre (jamais la page).
  // Seulement quand on change de page : un simple réaffichage (données reçues, envoi Discord…) ne touche pas
  // à la position de la liste, que l'on peut faire défiler librement.
  if (navCentered === current) return;
  navCentered = current;
  const cur = list.querySelector('[aria-current="true"]');
  for (let el = cur?.parentElement; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    const st = getComputedStyle(el), r = el.getBoundingClientRect(), cr = cur.getBoundingClientRect();
    if (/(auto|scroll)/.test(st.overflowX) && el.scrollWidth > el.clientWidth) el.scrollLeft += (cr.left + cr.width / 2) - (r.left + r.width / 2);
    if (/(auto|scroll)/.test(st.overflowY) && el.scrollHeight > el.clientHeight) el.scrollTop += (cr.top + cr.height / 2) - (r.top + r.height / 2);
  }
}


// ---------- Animation météo de l'accueil ----------
// Météo de Khurdan Iloh pour tous. Particules dessinées dans un canvas placé derrière le contenu de l'accueil :
// elles ne prennent aucune place (pas de saut de page), ne captent aucun clic, restent sous 40, s'arrêtent quand l'appli
// n'est pas à l'écran ou quand on quitte l'accueil, et sont coupées si l'appareil demande moins d'animations.
const FX_CITY = null;   // Solution Nine : pas de météo, donc pas de particules
const fxKind = () => {
  if (window.FX_FORCE !== undefined) return window.FX_FORCE;   // tests : forcer un temps
  if (!FX_CITY) return null;
  const w = cityWeather(FX_CITY, tempAt(FX_CITY, rpDay)), k = Object.keys(W).find(x => W[x] === w);
  const h = new Date().getHours(), night = h >= 21 || h < 6;
  return { snow:'snow', blizzard:'blizzard', rain:'rain', thunder:'storm', wind:'wind', gales:'wind', fog:'fog' }[k] || (night && (k === 'clear' || k === 'fair') ? 'fireflies' : null);
};
const FX_PREF = 'rp-anim-meteo';
const fxWanted = () => { try { return localStorage.getItem(FX_PREF) !== 'off'; } catch { return true; } };
const fxReduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const FX = { canvas: null, ctx: null, parts: [], kind: null, raf: 0, last: 0, flash: 0, nextBolt: 0 };
const rnd = (a, b) => a + Math.random() * (b - a);
const FX_COUNT = { snow: 32, blizzard: 40, rain: 38, storm: 40, wind: 14, fog: 6, fireflies: 14 };
const fxSpawn = (k, w, h, anywhere) => {
  const y0 = anywhere ? rnd(0, h) : -20;
  if (k === 'snow') return { x: rnd(0, w), y: y0, r: rnd(1.2, 2.8), vy: rnd(12, 26), drift: rnd(0, 6.3), sway: rnd(8, 20), a: rnd(.35, .7) };
  if (k === 'blizzard') return { x: anywhere ? rnd(0, w) : rnd(-w * .3, w), y: y0, r: rnd(1, 2.4), vy: rnd(70, 120), vx: rnd(90, 160), a: rnd(.35, .75) };
  if (k === 'rain' || k === 'storm') return { x: anywhere ? rnd(0, w) : rnd(-w * .2, w), y: y0, len: rnd(9, 16), vy: rnd(260, 380), vx: 55, a: rnd(.18, .35) };
  if (k === 'wind') return { x: anywhere ? rnd(0, w) : -30, y: rnd(0, h), len: rnd(6, 14), vx: rnd(90, 170), wob: rnd(0, 6.3), rot: rnd(-.5, .5), a: rnd(.25, .5), grass: Math.random() < .5 };
  if (k === 'fog') return { x: anywhere ? rnd(-w * .3, w) : -w * .6, y: rnd(h * .1, h * .9), rx: rnd(w * .35, w * .7), ry: rnd(50, 110), vx: rnd(6, 14), a: rnd(.1, .16) };
  if (k === 'fireflies') return { x: rnd(0, w), y: rnd(h * .2, h), r: rnd(1.4, 2.4), t: rnd(0, 6.3), sp: rnd(.6, 1.4), vx: rnd(-8, 8), vy: rnd(-6, 6) };
};
const fxView = () => document.getElementById('view');
const fxStop = () => { cancelAnimationFrame(FX.raf); FX.raf = 0; };
const fxOff = () => { fxStop(); FX.canvas?.remove(); fxView()?.classList.remove('fx-on'); };
const fxFrame = now => {
  const view = fxView(), cv = FX.canvas;
  if (!cv || !cv.isConnected || current !== 'home' || document.hidden) { FX.raf = 0; return; }
  // Le canvas suit la partie visible de l'accueil (déplacement par transform : rien ne bouge dans la page).
  const r = view.getBoundingClientRect(), top = Math.max(0, -r.top), w = Math.round(r.width), h = Math.max(0, Math.round(Math.min(innerHeight, r.bottom) - Math.max(0, r.top)));
  const dpr = Math.min(2, devicePixelRatio || 1);
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
  cv.style.transform = `translateY(${top}px)`;
  const dt = Math.min(.05, (now - (FX.last || now)) / 1000); FX.last = now;
  const c = FX.ctx, k = FX.kind; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
  while (FX.parts.length < FX_COUNT[k]) FX.parts.push(fxSpawn(k, w, h, true));
  const gold = '201,174,143', cream = '236,227,214', ember = '185,120,90';
  for (let i = 0; i < FX.parts.length; i++) {
    const p = FX.parts[i]; let gone = false;
    if (k === 'snow') { p.y += p.vy * dt; p.drift += dt * .8; const x = p.x + Math.sin(p.drift) * p.sway;
      c.fillStyle = `rgba(${cream},${p.a})`; c.beginPath(); c.arc(x, p.y, p.r, 0, 6.3); c.fill(); gone = p.y > h + 10; }
    else if (k === 'blizzard') { p.y += p.vy * dt; p.x += p.vx * dt;
      c.fillStyle = `rgba(${cream},${p.a})`; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.3); c.fill(); gone = p.y > h + 10 || p.x > w + 10; }
    else if (k === 'rain' || k === 'storm') { p.y += p.vy * dt; p.x += p.vx * dt;
      c.strokeStyle = `rgba(${gold},${p.a})`; c.lineWidth = 1; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.len * .2, p.y - p.len); c.stroke(); gone = p.y - p.len > h; }
    else if (k === 'wind') { p.x += p.vx * dt; p.wob += dt * 3; const y = p.y + Math.sin(p.wob) * 4;
      c.strokeStyle = `rgba(${p.grass ? ember : gold},${p.a})`; c.lineWidth = p.grass ? 1.2 : 1.6; c.lineCap = 'round';
      c.beginPath(); if (p.grass) { c.moveTo(p.x, y); c.quadraticCurveTo(p.x + p.len * .5, y - 3 + p.rot * 6, p.x + p.len, y + p.rot * 4); } else { c.moveTo(p.x, y); c.lineTo(p.x + 1.5, y); } c.stroke(); gone = p.x > w + 30; }
    else if (k === 'fog') { p.x += p.vx * dt;
      const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.rx); g.addColorStop(0, `rgba(${cream},${p.a})`); g.addColorStop(1, `rgba(${cream},0)`);
      c.fillStyle = g; c.save(); c.translate(p.x, p.y); c.scale(1, p.ry / p.rx); c.translate(-p.x, -p.y); c.beginPath(); c.arc(p.x, p.y, p.rx, 0, 6.3); c.fill(); c.restore(); gone = p.x - p.rx > w; }
    else if (k === 'fireflies') { p.t += dt * p.sp; p.x += (p.vx + Math.sin(p.t * 1.3) * 6) * dt; p.y += (p.vy + Math.cos(p.t) * 5) * dt;
      const a = .25 + .55 * Math.max(0, Math.sin(p.t * 2)); const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
      g.addColorStop(0, `rgba(232,200,122,${a})`); g.addColorStop(1, 'rgba(232,200,122,0)'); c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, p.r * 5, 0, 6.3); c.fill();
      c.fillStyle = `rgba(250,226,160,${Math.min(1, a + .25)})`; c.beginPath(); c.arc(p.x, p.y, p.r * .7, 0, 6.3); c.fill();
      gone = p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20; }
    if (gone) FX.parts[i] = fxSpawn(k, w, h, k === 'fireflies');
  }
  // Orage : un éclair discret de temps en temps (léger voile clair, jamais de flash vif).
  if (k === 'storm') {
    if (now > FX.nextBolt) { FX.flash = .5; FX.nextBolt = now + rnd(7000, 16000); }
    if (FX.flash > 0) { c.fillStyle = `rgba(${cream},${.09 * FX.flash})`; c.fillRect(0, 0, w, h); FX.flash = Math.max(0, FX.flash - dt * 2.5); }
  }
  FX.raf = requestAnimationFrame(fxFrame);
};
const fxStart = () => {
  const view = fxView();
  if (current !== 'home' || !view || !fxWanted() || fxReduced()) return fxOff();
  const k = fxKind(); if (!k) return fxOff();
  if (!FX.canvas) { FX.canvas = document.createElement('canvas'); FX.canvas.className = 'wx-fx'; FX.canvas.setAttribute('aria-hidden', 'true'); FX.ctx = FX.canvas.getContext('2d'); }
  if (FX.kind !== k) { FX.kind = k; FX.parts = []; FX.nextBolt = performance.now() + rnd(3000, 8000); }
  view.classList.add('fx-on'); view.prepend(FX.canvas);
  if (!FX.raf && !document.hidden) { FX.last = 0; FX.raf = requestAnimationFrame(fxFrame); }
};
document.addEventListener('visibilitychange', () => { if (document.hidden) fxStop(); else if (current === 'home') fxStart(); });
try { matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => current === 'home' ? fxStart() : fxOff()); } catch {}
document.addEventListener('change', e => { if (e.target.id !== 'fx-toggle') return;
  try { localStorage.setItem(FX_PREF, e.target.checked ? 'on' : 'off'); } catch {} fxStart(); });
const fxToggleHtml = () => `<label class="check-inline fx-toggle"><input type="checkbox" id="fx-toggle" ${fxWanted() ? 'checked' : ''} ${fxReduced() ? 'disabled' : ''}> Animation de la météo${fxReduced() ? ' <small>(coupée : l\'appareil demande moins d\'animations)</small>' : ''}</label>`;

function renderHome() {
  setTimeout(birthdayNews, 0);
  root.className = 't-s9';
  const visible = C.filter(shown);
  document.getElementById('view').innerHTML = `
    <p class="session">Connecté : ${PLAYER_NAME[me]} · <button type="button" class="link" id="signout">Se déconnecter</button></p>
    <header><p class="kicker">${APP_NAME} · canal 09</p><h1 class="s9-flicker">Aujourd'hui</h1><p class="date">${today}<br>${eorzeaDate}</p>
      <p class="home-links"><button type="button" class="chip-link" data-go="we">${icon('eye')}Wondereye</button>
        <button type="button" class="chip-link" data-go="pm">${icon('heart')}Pixel Meet</button>
        <button type="button" class="chip-link" data-open-page="liens">${icon('users')}Les liens</button>
        <button type="button" class="chip-link" data-open-page="search">${icon('search')}Rechercher</button></p>${(f => f ? `<p class="fest home-fest">${icon('star')}En Eorzea : ${f.name}</p>` : '')(festivalOn(rpDay))}</header>
    ${S9.flashHtml()}
    ${((unread, day) => `<section class="news"><h2>${icon('bell')}Nouvelles${unread.length ? ` <span class="badge">${unread.length}</span>` : ''}</h2>
      ${unread.length ? `<ul>${unread.slice(0, 8).map(n => `<li class="unread ${newsKind(n)}">${newsLink(n, esc(n.text))}</li>`).join('')}</ul>
      <button type="button" class="link ico-btn" id="news-read" title="Tout marquer comme lu" aria-label="Tout marquer comme lu">${icon('checks')}</button>` : '<p class="reserved">Rien de nouveau pour l\'instant.</p>'}
      <details class="news-day"${newsDayOpen ? ' open' : ''}><summary>Nouvelles du jour (${day.length})</summary>
        ${day.length ? `<ul>${day.map(n => `<li class="${n.read ? '' : 'unread'} ${newsKind(n)}">${newsLink(n, `<small>${newsHour(n)}</small> ${esc(n.text)}`)}</li>`).join('')}</ul>` : '<p class="reserved">Aucune nouvelle depuis 5 h ce matin.</p>'}</details>
      </section>`)(myNews().filter(n => !n.read), newsOfToday())}
    ${groupEventsHtml()}
    ${wrapBanner(`<div class="wrap-open">${C.filter(c => c.player === me).map(c => `<button type="button" class="btn" data-wrap-open="${c.id}">${c.name}</button>`).join('')}</div>`)}
    <div class="grid">
      ${visible.map(c => { const t = THEMES[c.theme]; const s = state[c.id];
        return `<button type="button" class="card" id="card-${c.id}" style="${vars(t)}" data-go="${c.id}">
          <span class="grp">${t.glyph} S9-${S9.code(c.id)}</span><span class="name">${c.name}</span><span class="who">${isFem(c.id) ? 'jouée' : 'joué'} par ${esc(PLAYER_NAME[c.player] || '')}</span>
          ${(w => w ? `<span class="wx">${icon(w.icon)}${w.label}</span>` : '')(weatherFor(c.id))}
          ${alerts[c.id] ? `<span class="card-alert">${icon('warn')}${esc(alerts[c.id])}</span>` : ''}
          <span class="state ${s.done || rpPlayed[c.id] ? 'done' : ''}">${s.done ? '✓ Terminé' : rpPlayed[c.id] ? '✓ Jouée en RP' : (s.mood || s.checked.size || s.trip ? 'En cours' : 'À remplir')}</span></button>`; }).join('')}
    </div>
    ${S9.fxToggleHtml()}
    ${window.RP_PUSH ? RP_PUSH.html() : ''}
    ${isAdminMe() && window.RP_DISCORD ? RP_DISCORD.settingsHtml() : ''}
    ${window.RP_ADMIN_UI ? RP_ADMIN_UI.html() : ''}`;
  fxStart();
}

// Réaffichage sans saut de page : la hauteur est gardée pendant le remplacement, et l'élément touché
// (case, bouton…) reste au même endroit de l'écran.
const anchorSel = el => !el || el === document.body ? null : el.id ? '#' + CSS.escape(el.id)
  : [...el.attributes].filter(a => a.name.startsWith('data-')).map(a => `[${a.name}="${CSS.escape(a.value)}"]`).join('') || null;
let lastPage = null;   // page affichée (personnage + vue) : la hauteur n'est gardée que sur la même page
// Dernier élément touché : Safari (iPhone, Mac) ne donne pas le focus aux cases ni aux boutons, donc on le note
// au moment du toucher. Il sert de repère pendant quelques secondes (réaffichages qui suivent l'enregistrement).
let touched = null;
document.addEventListener('pointerdown', e => {
  let el = e.target.closest?.('input, button, select, summary, textarea, label'); if (!el) return;
  if (el.tagName === 'LABEL') el = el.querySelector('input, select') || el;
  const sel = anchorSel(el); if (sel) touched = { sel, at: Date.now() };
}, true);
const anchorNow = () => (touched && Date.now() - touched.at < 6000 ? touched.sel : null) || anchorSel(document.activeElement);
// Cale placée sous la fiche : compense ce qui disparaît (bloc replié, options masquées) pour que le navigateur
// ne remonte pas la page. Une cale plutôt qu'une hauteur minimale : la fiche est une grille, qui s'étirerait.
const spacer = () => { let s = document.getElementById('view-spacer');
  if (!s) { s = document.createElement('div'); s.id = 'view-spacer'; s.setAttribute('aria-hidden', 'true'); document.getElementById('view').after(s); }
  return s; };
const fullH = () => document.getElementById('view').offsetHeight + spacer().offsetHeight;
const holdHeight = h => { const sp = spacer(); sp.style.height = '0px'; sp.style.height = Math.max(0, h - document.getElementById('view').offsetHeight) + 'px'; };
const resetSpacer = () => { spacer().style.height = '0px'; };
// Blocs repliables (catégories, nuits…) : même compensation quand on les replie.
let toggleH = null;
document.addEventListener('click', e => { if (e.target.closest('#view summary')) toggleH = fullH(); }, true);
document.addEventListener('toggle', e => { if (toggleH != null && e.target.closest?.('#view')) { holdHeight(toggleH); toggleH = null; } }, true);
const pageKey = id => { const s = state[id]; return id + ':' + (s.view === 'history' ? 'history' : s.done || !canEdit(id) ? 'recap' : 'form'); };
function renderChar(id) {
  const view = document.getElementById('view');
  if (lastPage !== pageKey(id)) {   // autre fiche ou autre vue (récap, historique…) : affichage neuf
    resetSpacer(); renderCharNow(id); lastPage = pageKey(id); return;
  }
  const sel = anchorNow();
  const before = sel && view.querySelector(sel)?.getBoundingClientRect().top, y = window.scrollY, h = fullH();
  try { renderCharNow(id); holdHeight(h); }
  finally {
    if (lastPage !== pageKey(id)) { resetSpacer(); lastPage = pageKey(id); }   // la vue a changé pendant l'affichage
    // La hauteur ne diminue pas tant qu'on reste sur la fiche (sinon le navigateur remonte la page quand
    // un bloc se replie en bas) ; elle est libérée en changeant de page.
    const el = sel && view.querySelector(sel);
    if (el && before != null) { try { el.focus({ preventScroll: true }); } catch {} window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - before }); holdPlace(sel, before); }
    else { window.scrollTo({ top: y }); holdPlace(null, y); }
  }
}
// Garde-fou (Firefox notamment) : le navigateur peut encore déplacer la page juste après le réaffichage
// (focus perdu, case remplacée…). Pendant un court instant, on remet l'élément touché à sa place ;
// le moindre geste de l'utilisateur (molette, toucher, clavier) arrête aussitôt la correction.
let placeGuard = null;
const holdPlace = (sel, pos) => {
  placeGuard?.stop();
  const view = document.getElementById('view'), until = Date.now() + 700;
  const fix = () => {
    if (Date.now() > until) return stop();
    const el = sel && view.querySelector(sel);
    if (el) { const d = el.getBoundingClientRect().top - pos; if (Math.abs(d) > 2) window.scrollTo({ top: window.scrollY + d }); }
    else if (!sel && Math.abs(window.scrollY - pos) > 2) window.scrollTo({ top: pos });
  };
  let raf = 0; const loop = () => { fix(); if (Date.now() <= until) raf = requestAnimationFrame(loop); };
  const stop = () => { cancelAnimationFrame(raf); removeEventListener('scroll', fix); ['wheel', 'touchstart', 'keydown'].forEach(e => removeEventListener(e, stop, true)); placeGuard = null; };
  addEventListener('scroll', fix); ['wheel', 'touchstart', 'keydown'].forEach(e => addEventListener(e, stop, true));
  raf = requestAnimationFrame(loop); placeGuard = { stop };
};
function renderCharNow(id) {
  const c = C.find(x => x.id === id), t = THEMES[c.theme], s = state[id];
  if (s.view === 'history') return renderHistory(id);
  const loverMsg = s.loverMsg; s.loverMsg = null;
  root.className = t.cls;
  // Activités retirées de la liste (ex. : Inkaraa arrête de tatouer) : masquées, l'historique est conservé.
  const removed = c.removedActs ||= new Set();
  const live = k => (c.acts[k] || []).filter(a => !removed.has(a));
  const cats = catsOf(c).filter(k => live(k).length || (s.manageActs && !CATS[k]));
  [...s.checked].forEach(l => { if (!actAvailable(id, l)) s.checked.delete(l); });
  if (s.checked.delete('Voyage')) delete s.slots['Voyage'];
  s.nightStates ||= new Set(); if (nightOf(id).hot) s.nightStates.delete('Nuit calme');
  if (activeContract(id) && !s.contractOff) s.checked.add(CONTRACT_ACT);
  if (!activeContract(id)) s.checked.delete(CONTRACT_ACT);
  const actRow = (label, special) => {
    const on = s.checked.has(label);
    const k = activeContract(id) || {};
    const contract = on && label === CONTRACT_ACT ? `<div class="contract">
        <p class="wide contract-day">${icon('target')}<span>${k.n ? (k.n > 1 ? `Contrat en cours : ${contractDay(k)}` : `Nouveau contrat : ${contractDay(k)}`) : ''}</span></p>
        <label><span>Début</span><input type="date" data-contract="start" value="${k.start || isoDay(rpDay)}" max="${isoDay(rpDay)}"></label>
        <label><span>Rang</span><select data-contract="rank"><option value="">—</option>${RANKS.map(r => `<option ${k.rank === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label>
        <label><span>Durée (jours)</span><input type="number" min="1" max="60" inputmode="numeric" data-contract="days" value="${k.days || ''}"></label>
        <label class="wide"><span>Monstre chassé</span><input type="text" data-contract="monster" value="${esc(k.monster || '')}" placeholder="Ex. : Béhémoth"></label>
        <label class="wide"><span>Lieu de la chasse</span><input type="text" data-contract="place" value="${esc(k.place || '')}" placeholder="Ex. : Mor Dhona"></label>
        ${k.days && k.n < k.days ? `<button type="button" class="link small wide" id="contract-end-${id}">Contrat terminé plus tôt (aujourd'hui)</button>` : ''}
      </div>` : '';
    const drawn = on && RANDOM_ACTS[label] ? `<p class="act-detail drawn">${icon('star')}<span>${esc(s.details?.[label] || '…')}</span> <button type="button" class="link small ico-btn" data-redraw="${esc(label)}" title="Autre tirage" aria-label="Autre tirage">${icon('dice')}</button></p>` : '';
    const detail = on && DETAIL_ACTS[label] ? `<input type="text" class="act-detail" data-detail="${esc(label)}" value="${esc(s.details?.[label] || '')}" placeholder="${DETAIL_ACTS[label]}">` : '';
    const slots = on ? `<div class="slots" role="group" aria-label="Moment de la journée">${SLOTS.map(sl => `<button type="button" data-slot="${sl.id}" data-for="${esc(label)}" aria-pressed="${(s.slots[label] || []).includes(sl.id)}" title="${sl.hint}">${icon(sl.icon)}${sl.label}</button>`).join('')}</div>` : '';
    const regionOpts = sel => c.regions.map(r => `<option value="${r}" ${sel === r ? 'selected' : ''}>${REGIONS[r].label}</option>`).join('');
    const trip = label === 'Voyage' && on && s.trip ? `<p class="act-detail">${icon('route')}<span>${(b => b ? esc(b) : 'Détails dans la section « Voyage », plus bas')(tripBits(s.trip))}</span></p>` : '';
    const hunt = on ? huntFor(id, label) : null;
    const huntRow = hunt ? `<p class="hunt ${hunt.catches.length ? '' : 'empty'}">${icon('target')}<span>${hunt.catches.length ? 'Prises : ' + esc(huntText(hunt)) : (isFem(id) ? 'Rentrée bredouille' : 'Rentré bredouille')}</span></p>
      <div class="hunt-edit"><div class="place-list" role="group" aria-label="Prise">
        <button type="button" data-hunt-mode="${esc(label)}" data-v="draw" aria-pressed="${!hunt.manual}">Tirage au sort</button>
        <button type="button" data-hunt-mode="${esc(label)}" data-v="manual" aria-pressed="${!!hunt.manual}">Je choisis la prise</button></div>
      ${hunt.manual ? `${hunt.catches.map((x, i) => `<p class="where">${icon('target')}<span>${x.qty > 1 ? x.qty + ' × ' : ''}${esc(x.name)}</span><button type="button" class="link small" data-hunt-del="${esc(label)}" data-i="${i}" aria-label="Retirer">×</button></p>`).join('')}
        <div class="special-row"><input type="text" list="game-${id}-${hunt.mode}" data-hunt-name="${esc(label)}" placeholder="Proie (ex. : Lièvre)">
          <input type="number" min="1" max="20" value="1" data-hunt-qty="${esc(label)}" aria-label="Nombre" class="hunt-qty">
          <button type="button" class="btn" data-hunt-add="${esc(label)}">Ajouter</button></div>
        <datalist id="game-${id}-${hunt.mode}">${huntGame(id, label).map(g => `<option value="${esc(g)}">`).join('')}</datalist>
        ${hunt.catches.length ? '' : '<p class="reserved">Aucune prise ajoutée : la chasse compte comme bredouille.</p>'}` : ''}</div>` : '';
    const withRow = on && canShareAct(label) ? withPickHtml(id, label) : '';
    return `<div class="act-wrap"><label class="act ${special?'special':''}"><input type="checkbox" data-act="${esc(label)}" ${on?'checked':''}><span>${label === 'Voyage' ? icon('route') : ''}${esc(label)}</span></label>${huntRow}${drawn}${detail}${contract}${trip}${slots}${withRow}</div>`;
  };
  const dispLabel = l => dispBase(l) + withTxt(s.withActs, l);
  const dispBase = l => l === CONTRACT_ACT && activeContract(id) ? l + contractText(activeContract(id)) : s.details?.[l] && (DETAIL_ACTS[l] || RANDOM_ACTS[l]) ? `${l} : ${s.details[l]}` : huntFor(id, l) ? `${l} (${huntText(huntFor(id, l))})` : l === 'Voyage' && s.trip ? `Voyage${s.trip.modes?.size ? ` (${[...s.trip.modes].join(', ').toLowerCase()})` : ''} : ${legLabel(s.trip.from)} → ${legLabel(s.trip.to)}` : l;
  const picked = [...s.checked];
  const byKey = {};
  // Une activité sur plusieurs périodes apparaît dans chacune (plus de période combinée « Aube → Matin »).
  picked.forEach(l => { const ids = (s.slots[l] || []).filter(x => SLOTS.some(sl => sl.id === x)); (ids.length ? ids.map(x => spanOf([x])) : [spanOf([])]).forEach(sp => (byKey[sp.key] ||= { sl:sp, items:[] }).items.push(l)); });
  const groups = Object.values(byKey).sort((a, b) => a.sl.order - b.sl.order || a.sl.key.length - b.sl.key.length);
  const regLabel = s.region ? REGIONS[s.region].label : '';
  // Sélecteur Région → (Zone) → Lieux, pour la journée ou pour une étape de voyage.
  const picker = (T, leg) => {
    const L = leg ? ` data-leg="${leg}"` : '', reg = T.region && REGIONS[T.region];
    let html = `<div class="place-list regions" role="group" aria-label="Région">${c.regions.map(r => `<button type="button"${L} data-region="${r}" aria-pressed="${T.region === r}">${icon('globe')}${REGIONS[r].label}${!leg && c.added?.has(r) ? '<small class="added">ajoutée</small>' : ''}</button>`).join('')}</div>`;
    if (!reg) return html;
    if (reg.zones) html += `<div class="place-list subs zones" role="group" aria-label="Zone">${Object.entries(reg.zones).filter(([z]) => !(HIDDEN_ZONES[id] || []).includes(z)).map(([z, zone]) => `<button type="button"${L} data-zone="${z}" aria-pressed="${T.zone === z}">${icon('zone')}${zone.label}</button>`).join('')}</div>`;
    const elsewhere = !leg && reg.zones && MULTI_ZONE.includes(T.region) ? [...T.places].filter(pl => ZONE_OF[pl] && ZONE_OF[pl] !== T.zone) : [];
    if (elsewhere.length) html += `<p class="reserved other-zones">Aussi aujourd'hui : ${elsewhere.map(pl => `<button type="button" class="link small" data-place="${esc(pl)}" title="Retirer ce lieu">${esc(pl)} <small>(${esc(reg.zones[ZONE_OF[pl]]?.label || '')})</small> ×</button>`).join(' ')}</p>`;
    if (reg.zones && !T.zone) return html;
    const base = reg.zones ? reg.zones[T.zone].places : reg.places;
    const own = c.places.filter(pl => PLACE_REGION[pl] === T.region && (!reg.zones || ZONE_OF[pl] === T.zone));
    const subs = [...new Set([...base, ...own])].filter(pl => canSee(id, pl));
    if (subs.length) html += `<div class="place-list subs ${reg.zones ? 'deep' : ''}" role="group" aria-label="Lieux">${subs.map(pl => `<button type="button"${L} data-place="${esc(pl)}" aria-pressed="${T.places.has(pl)}">${icon('pin')}${esc(pl)}</button>`).join('')}</div>`;
    return html;
  };
  const pathOf = T => {
    if (!T.region) return '…';
    const R = REGIONS[T.region], by = {};
    [...T.places].forEach(pl => (by[ZONE_OF[pl] || ''] ||= []).push(pl));
    const zs = Object.keys(by);
    if (R.zones && MULTI_ZONE.includes(T.region) && (zs.length > 1 || (zs[0] && zs[0] !== T.zone)))   // plusieurs zones : « Zone : lieux · Zone : lieux »
      return R.label + ' — ' + zs.map(z => (R.zones[z]?.label ? R.zones[z].label + ' : ' : '') + by[z].join(', ')).join(' · ');
    return [R.label, zoneOf(T)?.label, [...T.places].join(', ')].filter(Boolean).join(' — ');
  };
  const placesLine = s.trip ? `<p class="where">${icon('route')}<span>${esc(pathOf(s.trip.from))} → ${esc(pathOf(s.trip.to))}${tripBits(s.trip) ? '<small> · ' + esc(tripBits(s.trip)) + '</small>' : ''}</span></p>` : (s.region || s.places.size) ? `<p class="where">${icon('pin')}<span>${esc(pathOf(s))}</span></p>` : '';
  const timeline = (groups.length || s.places.size || s.region || s.trip) ? `<section><h2>Déroulé du jour</h2>${placesLine}<div class="timeline">${groups.map(({ sl, items }) => `
    <div class="period"><p class="period-head">${sl.icon ? icon(sl.icon) : ''}<span>${sl.label}</span>${sl.hint ? `<small>${sl.hint}</small>` : ''}</p>
    <ul>${items.map(l => `<li>${esc(dispLabel(l))}</li>`).join('')}</ul></div>`).join('')}</div></section>` : '';
  const chipsHead = `${c.groups.includes('Khurdans') ? `<span class="moon"><svg class="moon-ico" viewBox="0 0 24 24" aria-hidden="true">${MOON_ICONS[khurdanMoon[0]]}</svg>${khurdanMoon[1]}</span>` : ''}
        ${conditionsFor(id).map(w => `<span class="wx">${icon(w.icon)}${w.label}${w.tp ? ` · ${deg(w.tp.max)}<small>/ ${deg(w.tp.min)}</small>` : ''}${w.where ? `<small>${w.where}</small>` : ''}</span>`).join('')}
        ${snowCoverOn(TEMP_CITY(id), rpDay) ? `<span class="snowcover">${icon('ground')}${SNOW[TEMP_CITY(id)].eternal ? 'Neiges éternelles' : 'Sol enneigé'}</span>` : ''}`;
  const chips = `${c.groups.includes('Khurdans') ? `<span class="moon"><svg class="moon-ico" viewBox="0 0 24 24" aria-hidden="true">${MOON_ICONS[khurdanMoon[0]]}</svg>${khurdanMoon[1]}</span>` : ''}
        ${conditionsFor(id).map(w => `<span class="wx">${icon(w.icon)}${w.label}${w.tp ? ` · ${deg(w.tp.max)}<small>/ ${deg(w.tp.min)}</small>` : ''}${w.where ? `<small>${w.where}</small>` : ''}</span>`).join('')}
        ${(f => f ? `<span class="fest">${icon('star')}${f.name}</span>` : '')(inEorzeaToday(id) ? festivalOn(rpDay) : null)}
        ${khurdanDays(c, rpDay).map(x => `<span class="fest">${icon(x.startsWith('Départ') ? 'route' : 'star')}${x}</span>`).join('')}
        ${birthdaysOn(id, rpDay).map(x => `<span class="fest">${icon('cake')}${esc(x)}</span>`).join('')}
        ${snowCoverOn(TEMP_CITY(id), rpDay) ? `<span class="snowcover">${icon('ground')}${SNOW[TEMP_CITY(id)].eternal ? 'Neiges éternelles' : 'Sol enneigé'}</span>` : ''}`;

  // Journée validée, ou fiche de l'autre joueur : visuel synthétique, sans les options de saisie.
  const readOnly = !canEdit(id);
  if (s.done || readOnly) {
    document.getElementById('view').innerHTML = `
    ${tabsHtml(id)}
    ${sharedActsHtml(id, canComplete(id))}
    ${complementHtml(id)}
    ${readOnly ? `<p class="readonly-note">${icon('eye')}${isMirror(id) ? `Fiche tenue par ${PLAYER_NAME[c.player]} dans Journée RP, recopiée ici : lecture seule.` : `Fiche de ${PLAYER_NAME[c.player]} : lecture seule.`}</p>` : ''}
    <article class="recap">
      ${alertBlock(id, false)}
      <header class="recap-head">
        <p class="kicker">${t.glyph} ${c.groups.join(' · ')}</p>
        <h1>${c.name}${c.surname ? `<small>${c.surname}</small>` : ''}</h1>
        <p class="date">${today} · ${eorzeaDate}</p>
        <div class="day-info">${chips}</div>
      </header>
      ${rpPlayed[id] ? `<p class="where">${icon('star')}<span>${esc(rpLabel(id))}</span></p>` : ''}
      ${!s.done && !s.mood && !s.checked.size && !rpPlayed[id] ? `<p class="reserved">${c.name} n'a pas encore rempli sa journée.</p>` : s.mood ? `<blockquote class="recap-mood">${esc(s.mood)}</blockquote>` : '<p class="reserved">Pas de mood renseigné.</p>'}
      ${placesLine}
      ${eventsBlock(c, false)}
      ${(s.dayEvents || []).map(x => `<p class="where">${icon('star')}<span>${esc(x)}</span></p>`).join('')}
      ${milestonesOn(id, rpDay).map(m => `<p class="milestone">${icon('ring')}<span>${esc(msLabel(m))}</span></p>`).join('')}
      ${statesLine(id, [...(s.phys || [])], s.stateNotes, 'heartbeat').replace('</span></p>', s.physNote ? ' — ' + esc(s.physNote) + '</span></p>' : '</span></p>')}
      ${statesLine(id, [...(s.mental || [])], s.stateNotes, 'brain')}
      ${isKhurdan(id) && s.violet ? `<p class="where">${icon('cloth')}<span>A porté du violet</span></p>` : ''}
      ${seesNights(id) ? prevNightLine(id) : ''}
      ${seesNights(id) ? nightLine(id) : ''}
      ${groups.length ? `<ul class="recap-list">${groups.map(({ sl, items }) => `<li>
        <span class="recap-when">${sl.icon ? icon(sl.icon) : ''}${sl.label}</span>
        <span class="recap-what">${items.map(l => esc(dispLabel(l))).join(' · ')}</span></li>`).join('')}</ul>` : ''}
      ${s.faits?.trim() ? `<div class="recap-infos"><span>Faits notoires</span><p>${esc(s.faits.trim())}</p></div>` : ''}
      ${s.infos?.trim() ? `<div class="recap-infos"><span>Informations</span><p>${esc(s.infos.trim())}</p></div>` : ''}
      ${s.shot ? `<img class="recap-shot" src="${s.shot}" alt="Capture du jour">` : ''}
      ${readOnly ? `<footer class="recap-foot"><span>${s.done ? '✓ Journée terminée' : 'Journée en cours'}</span></footer>` : `<footer class="recap-foot"><span>✓ Journée validée${window.RP_DISCORD ? RP_DISCORD.status(id) : ''}</span>
        <span class="foot-btns"><button type="button" class="btn" id="png-${id}">${icon('camera')}Image du récap</button>
        <button type="button" class="btn" id="edit-${id}">Modifier la journée</button></span></footer>`}
    </article>
    <div id="png-out-${id}" class="png-out" aria-live="polite"></div>`;
    document.getElementById('png-'+id)?.addEventListener('click', () => recapPng(id));
    document.getElementById('edit-'+id)?.addEventListener('click', () => { s.done = false; renderNav(); renderChar(id); });
    document.querySelectorAll('#view [data-join-from]').forEach(b => b.addEventListener('click', () => { joinAct(id, b.dataset.joinFrom, b.dataset.joinAct); renderChar(id); }));
    bindTabs(id);
    return;
  }

  document.getElementById('view').innerHTML = `
    ${tabsHtml(id)}
    ${alertBlock(id, true)}
    <header><p class="kicker">${t.glyph} ${c.groups.join(' · ')}</p><h1>${c.name}${c.surname ? `<small>${c.surname}</small>` : ''}</h1>
      <p class="date">${today}<br>${eorzeaDate}</p>
      <div class="day-info">${chips}${headEvents(c)}</div>
      ${HOMES[HOME_OF[id]]?.optIn ? `<label class="check-inline wx-toggle"><input type="checkbox" id="wx-${id}" ${weatherOn[HOME_OF[id]]?'checked':''}> Météo du jour</label>` : ''}
      </header>
    <section class="rp-played"><label class="act"><input type="checkbox" id="rp-${id}" ${rpPlayed[id] ? 'checked' : ''}>${icon('star')}<span>Journée jouée en RP</span></label>
      ${rpPlayed[id] ? `<label class="check-inline">avec <select id="rp-with-${id}"><option value="pnj">personne d'autre (seul·e ou PNJ)</option>
        ${C.filter(x => x.id !== id).map(x => `<option value="${x.id}" ${rpPlayed[id] === x.id ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>
      <p class="reserved">La fiche compte comme remplie${isChar(rpPlayed[id]) ? `, et celle ${deName(nameOf(rpPlayed[id]))} aussi` : ''}, même sans activités cochées.</p>` : ''}</section>
    <section><h2>Mood du jour</h2>
      <textarea id="mood-${id}" placeholder="Comment se sent ${c.name} aujourd'hui ?">${esc(s.mood)}</textarea>
      ${statesBlock(id)}</section>
    <section><h2>Lieux du jour</h2>
      ${s.trip ? `<p class="reserved">${icon('route')} Journée de voyage : le départ et l'arrivée se renseignent dans la section « Voyage », après les activités.</p>` : `
      ${picker(s, '')}
      ${s.region ? `
        ${c.added?.has(s.region) ? `<button type="button" class="link ico-btn" id="rmregion-${id}" title="Retirer ${REGIONS[s.region].label} de la fiche ${deName(c.name)}" aria-label="Retirer ${REGIONS[s.region].label} de la fiche">${icon('minus')}${icon('globe')}</button>` : ''}
        ${(more => s.region === 'autres' && more.length ? `<div class="more-regions"><p class="reserved">Ajouter une région existante à la fiche ${deName(c.name)} :</p>
          <div class="place-list">${more.map(r => `<button type="button" data-addregion="${r}">+ ${REGIONS[r].label}</button>`).join('')}</div></div>` : '')(REGION_ORDER.filter(r => !c.regions.includes(r)))}
        ${!REGIONS[s.region].zones || s.zone ? `<div class="special-row"><input type="text" id="place-${id}" placeholder="Autre lieu en ${zoneOf(s)?.label || REGIONS[s.region].label}"><button type="button" class="btn" id="addplace-${id}">Ajouter</button></div>` : ''}`
      : `<p class="reserved">Choisis d'abord la région du jour pour voir ses lieux.</p>`}`}
    </section>
    <section class="chrono"><h2>Chronologie du jour</h2>
    ${prevNightBlock(id)}
    <div class="chrono-part"><h3 class="chrono-h">Activités</h3>
      ${sharedActsHtml(id, true)}
      ${cats.length ? '' : `<p class="reserved">Liste d'activités à définir. En attendant, utilise le champ « Activité spéciale » et coche « L'ajouter aussi à la liste ».</p>`}
      ${!s.manageActs && cats.length > 1 ? `<div class="fold-all"><button type="button" class="link small ico-btn" data-fold-all="1" title="Tout replier" aria-label="Tout replier">${icon('foldall')}</button><button type="button" class="link small ico-btn" data-fold-all="0" title="Tout déplier" aria-label="Tout déplier">${icon('unfoldall')}</button></div>` : ''}
      ${cats.map(k => !s.manageActs ? (list => `<details class="cat fold" data-fold="${k}" ${isFolded(id, k) ? '' : 'open'}>
        <summary><h3>${esc(catLabel(c, k))}<small>${list.filter(a => s.checked.has(a)).length ? ` · ${list.filter(a => s.checked.has(a)).length} cochée${list.filter(a => s.checked.has(a)).length > 1 ? 's' : ''}` : ''}</small></h3></summary>
        ${list.map(a => actRow(a)).join('')}</details>`)(live(k).filter(a => actAvailable(id, a)))
      : `<div class="cat">${s.manageActs && s.renaming === k
        ? `<div class="special-row"><input type="text" id="rename-${id}" value="${esc(catLabel(c, k))}" aria-label="Nouveau nom"><button type="button" class="btn" data-rename-ok="${k}">OK</button><button type="button" class="link small ico-btn" data-rename-cancel title="Annuler" aria-label="Annuler">${icon('cross')}</button></div>`
        : `<h3>${esc(catLabel(c, k))}${s.manageActs ? ` <button type="button" class="link small ico-btn" data-rename="${k}" title="Renommer" aria-label="Renommer">${icon('pencil')}</button>` : ''}</h3>`}${s.manageActs
        ? (live(k).length ? live(k).map(a => `<div class="act manage"><span>${esc(a)}</span>
            <select class="cat-move" data-act-cat="${esc(a)}" aria-label="Catégorie de ${esc(a)}">${catsOf(c).map(x => `<option value="${x}" ${x === k ? 'selected' : ''}>${esc(catLabel(c, x))}</option>`).join('')}</select>
            ${s.actDel === a ? `<button type="button" class="link small danger" data-act-remove="${esc(a)}">Confirmer la suppression</button>` : `<button type="button" class="link small ico-btn" data-act-del="${esc(a)}" title="Supprimer" aria-label="Supprimer">${icon('trash')}</button>`}</div>`).join('')
          : `<p class="reserved">Catégorie vide : déplace-y des activités. <button type="button" class="link small ico-btn" data-cat-del="${k}" title="Supprimer la catégorie" aria-label="Supprimer la catégorie">${icon('trash')}</button></p>`)
        : live(k).filter(a => actAvailable(id, a)).map(a => actRow(a)).join('')}</div>`).join('')}
      ${s.manageActs ? `<div class="special-row new-cat"><input type="text" id="newcat-${id}" placeholder="Nouvelle catégorie (ex. : Loisirs)">
        <button type="button" class="btn" id="newcat-add-${id}">Créer</button></div>` : ''}
      ${canEdit(id) ? `<button type="button" class="link small manage-toggle ico-btn" id="manage-acts-${id}" title="${s.manageActs ? 'Terminer' : 'Gérer la liste d\'activités et les catégories'}" aria-label="${s.manageActs ? 'Terminer' : 'Gérer la liste d\'activités et les catégories'}">${icon(s.manageActs ? 'check' : 'gear')}</button>` : ''}
      ${s.specials.length ? `<div class="cat"><h3>Spéciales du jour</h3>${s.manageActs
        ? s.specials.map(a => `<div class="act manage"><span>${esc(a)}</span>${s.actDel === 'spe:' + a ? `<button type="button" class="link small danger" data-special-remove="${esc(a)}">Confirmer la suppression</button>` : `<button type="button" class="link small ico-btn" data-act-del="spe:${esc(a)}" title="Supprimer" aria-label="Supprimer">${icon('trash')}</button>`}</div>`).join('')
        : s.specials.map(a => actRow(a, true)).join('')}</div>` : ''}
      <h4 class="chrono-sub">Activité spéciale</h4>
      <div class="special-row"><input type="text" id="special-${id}" placeholder="Ex. : réception à l'ambassade">
        <button type="button" class="btn" id="add-${id}">Ajouter</button></div>
      <label class="check-inline"><input type="checkbox" id="keep-${id}"> L'ajouter aussi à la liste ${deName(c.name)}</label>
    </div>
    ${(n => `<div class="chrono-part"><h3 class="chrono-h">Nuit à venir</h3>
      ${isKhurdan(id) ? `<label class="act"><input type="checkbox" id="violet-${id}" ${s.violet ? 'checked' : ''}>${icon('cloth')}<span>A porté du violet</span></label>` : ''}
      ${nightChips(id, s.nightStates, 'data-next-night', !hasHot(id) ? '' : `
      <label class="act night"><input type="checkbox" id="hot-${id}" ${n.hot ? 'checked' : ''}>${icon('lips')}<span>Nuit chaude</span></label><!--hot-opts-->
      ${n.hot ? nightNoteInput(id, 'next', 'Nuit chaude', s.nightNotes?.['Nuit chaude']) : ''}
      ${blockedWith(id, n.partner) ? `<p class="reserved">${nameOf(n.partner)} travaille ce soir (jour de travail récurrent).</p>` : ''}
      ${n.partnerAway ? `<p class="reserved">${nameOf(n.partner)} était avec ${esc(whoLabel(n.partnerAway))} cette nuit.</p>` : ''}
      ${n.hot ? `<div class="place-list" role="group" aria-label="Avec qui ?">
          ${[...new Set([n.partner, ...loversOf(id)].filter(Boolean))].map(w => `<span class="with-chip"><button type="button" data-with="${esc(w)}" aria-pressed="${n.with === w}" ${blockedWith(id, w) ? `disabled title="${esc(whoLabel(w))} travaille ce soir"` : ''}>${icon('lips')}${esc(whoLabel(w))}</button>${loversOf(id).includes(w) ? `<button type="button" class="link small" data-lover-del="${esc(w)}" aria-label="Retirer ${esc(whoLabel(w))}">×</button>` : ''}</span>`).join('')}
        </div>
        <div class="special-row"><input type="text" id="lover-new-${id}" enterkeyhint="done" autocapitalize="words" placeholder="Nom d'un personnage ou d'un PNJ"><button type="button" class="btn" id="lover-add-${id}">Ajouter</button></div>
        ${loverMsg ? `<p class="reserved lover-msg">${esc(loverMsg)}</p>` : ''}
        ${isKhurdan(id) ? `<label class="check-inline"><input type="checkbox" id="shell-${id}" ${s.shell ? 'checked' : ''}>${icon('shell')}A offert un coquillage</label>` : ''}
        ${gotShell(id) ? `<p class="check-inline info">${icon('shell')}A reçu un coquillage au réveil <small>(offert par ${esc(nameOf(n.with))})</small></p>` : ''}
        ${n.with && isChar(n.with) ? `<p class="reserved">Cochée aussi sur la fiche ${deName(nameOf(n.with))}.</p>` : ''}
        ${n.isMan ? `<label class="check-inline"><input type="checkbox" id="protect-${id}" ${state[id].protect ? 'checked' : ''}>${icon('shield')}Monsieur se protège</label>`
          : n.with && isChar(n.with) && !isFem(n.with)
            ? `<p class="check-inline info">${icon('shield')}${nameOf(n.with)} ${state[n.with].protect ? 'se protège' : 'ne se protège pas'} <small>(indiqué sur sa fiche)</small></p>`
            : n.with && !isChar(n.with) ? `<label class="check-inline"><input type="checkbox" id="protect-pnj-${id}" ${pnjProtect(id, n.with) ? 'checked' : ''}>${icon('shield')}${esc(n.with)} se protège</label>` : ''}` : ''}
      `, 'Comment va se passer la nuit ?', n.hot ? 'Nuit chaude' + (n.with ? ' avec ' + whoLabel(n.with) : '') : '', '', s.nightNotes || {})}
    </div>`)(nightOf(id))}
    </section>
    <section class="trip-sec"><h2>Voyage</h2>
      <label class="act"><input type="checkbox" id="trip-${id}" ${s.trip ? 'checked' : ''}>${icon('route')}<span>${c.name} a voyagé aujourd'hui</span></label>
      ${s.trip ? `${['from', 'to'].map(leg => `<div class="leg"><h3>${leg === 'from' ? 'Départ' : 'Arrivée'}</h3>${picker(s.trip[leg], leg)}</div>`).join('')}
      <h3>Durée du voyage</h3>
      <div class="trip-row dur"><label><input type="number" min="0" max="240" inputmode="numeric" id="trip-h-${id}" value="${Math.floor((s.trip.minutes || 0) / 60) || ''}" placeholder="0"> h</label>
        <label><input type="number" min="0" max="59" step="5" inputmode="numeric" id="trip-m-${id}" value="${(s.trip.minutes || 0) % 60 || ''}" placeholder="0"> min</label></div>
      <h3>Mode de déplacement</h3>
      <div class="trip-row modes" role="group" aria-label="Mode de déplacement">${TRAVEL_MODES.map(m => `<label class="check-inline"><input type="checkbox" data-mode="${m}" ${s.trip.modes?.has(m) ? 'checked' : ''}> ${m}</label>`).join('')}</div>
      <h3>Motif du voyage</h3>
      <input type="text" id="trip-reason-${id}" placeholder="Ex. : affaires de la tribu, rendre visite à un ami…" value="${esc(s.trip.reason || '')}">` : ''}
    </section>
    ${workdaysBlock(id)}
    <section class="faits"><h2>Faits notoires</h2>
      <textarea id="faits-${id}" placeholder="Ce qui a marqué la journée ${deName(c.name)}…">${esc(s.faits || '')}</textarea></section>
    <section class="events-sec"><h2>Événements importants</h2>
      <p class="where">${icon('cake')}<span>${today} · ${eorzeaDate}</span></p>
      ${dayHighlights(c)}
      ${eventsBlock(c, true)}
    ${s.eventEdit ? `<div class="event-form">
        <h3>Nouvel événement</h3>
        <input type="text" id="ev-label-${id}" placeholder="Ex. : Fête de la Lune de la mésange">
        <label class="check-inline">Pour la catégorie
          <select id="ev-group-${id}">${c.groups.map(g => `<option value="${esc(g)}" ${g === s.eventGroup ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select></label>
        ${(members => members.length > 1 ? `<p class="reserved">Personnages non concernés (exil, absence…) :</p>
          <div class="place-list">${members.map(m => `<label class="check-inline"><input type="checkbox" data-ev-except="${m.id}"> ${m.name}</label>`).join('')}</div>` : '')(C.filter(m => m.groups.includes(s.eventGroup || c.groups[0])))}
        <div class="special-row"><button type="button" class="btn" id="ev-create-${id}">Créer l'événement</button><button type="button" class="link ico-btn" id="ev-cancel-${id}" title="Annuler" aria-label="Annuler">${icon('cross')}</button></div>
      </div>` : `<button type="button" class="link alert-add ico-btn" id="ev-add-${id}" title="Ajouter un événement de groupe" aria-label="Ajouter un événement de groupe">${icon('plus')}${icon('flag')}</button>`}
      ${(s.dayEvents || []).map((x, i) => `<p class="where">${icon('star')}<span>${esc(x)}</span><button type="button" class="link small" data-dayev-del="${i}" aria-label="Retirer">×</button></p>`).join('')}
      <div class="special-row"><input type="text" id="dayev-${id}" placeholder="Événement sur mesure (ex. : arrivée d'une caravane au Ralliement)"><button type="button" class="btn" id="dayev-add-${id}">Ajouter</button></div>
      <h3 class="chrono-sub">Moment marquant</h3>
      ${milestoneSection(id, true)}
    </section>
    ${arcsSection(id)}
    <section class="infos-sec"><h2>Informations supplémentaires</h2>
      <textarea id="infos-${id}" placeholder="Facultatif — utile pour les autres : une soirée qui se prépare, une nouveauté au shop de Prism, une annonce affichée…">${esc(s.infos || '')}</textarea></section>
    ${shotSection(id)}
    ${timeline}
    <button type="button" class="btn primary" id="done-${id}" ${s.done?'disabled':''}>${s.done ? '✓ Journée validée' : "J'ai terminé"}</button>
`;

  document.getElementById('mood-'+id).addEventListener('input', e => s.mood = e.target.value);
  document.getElementById('infos-'+id)?.addEventListener('input', e => s.infos = e.target.value);
  document.getElementById('faits-'+id)?.addEventListener('input', e => s.faits = e.target.value);
  document.getElementById('dayev-add-'+id)?.addEventListener('click', () => { const v = document.getElementById('dayev-'+id).value.trim(); if (!v) return; (s.dayEvents ||= []).push(v); renderChar(id); });
  document.querySelectorAll('[data-dayev-del]').forEach(b => b.addEventListener('click', () => { s.dayEvents.splice(+b.dataset.dayevDel, 1); renderChar(id); }));
  bindTabs(id); bindDaySections(id); bindMilestones(id);
  document.getElementById('alert-add-'+id)?.addEventListener('click', () => { s.alertEdit = true; renderChar(id); });
  document.getElementById('alert-save-'+id)?.addEventListener('click', () => {
    const v = document.getElementById('alert-text-'+id).value.trim(); if (!v) return;
    alerts[id] = v; s.alertEdit = false; renderChar(id);
  });
  document.getElementById('alert-off-'+id)?.addEventListener('click', () => { delete alerts[id]; renderChar(id); });
  document.querySelectorAll('[data-event]').forEach(cb => cb.addEventListener('change', e => { EVENTS.find(x => x.id === cb.dataset.event).today = e.target.checked; }));
  document.querySelectorAll('[data-event-end]').forEach(b => b.addEventListener('click', () => { EVENTS.find(x => x.id === b.dataset.eventEnd).active = false; renderChar(id); }));
  document.getElementById('ev-add-'+id)?.addEventListener('click', () => { s.eventEdit = true; s.eventGroup = c.groups[0]; renderChar(id); });
  document.getElementById('ev-cancel-'+id)?.addEventListener('click', () => { s.eventEdit = false; renderChar(id); });
  document.getElementById('ev-group-'+id)?.addEventListener('change', e => {
    const label = document.getElementById('ev-label-'+id).value; s.eventGroup = e.target.value; renderChar(id);
    document.getElementById('ev-label-'+id).value = label;
  });
  document.getElementById('ev-create-'+id)?.addEventListener('click', () => {
    const label = document.getElementById('ev-label-'+id).value.trim(); if (!label) return;
    const except = [...document.querySelectorAll('[data-ev-except]')].filter(x => x.checked).map(x => x.dataset.evExcept);
    EVENTS.push({ id:'ev-' + Date.now(), label, group: s.eventGroup || c.groups[0], except, active:true, today:true });
    s.eventEdit = false; renderChar(id);
  });
  // Mode voyage : partagé entre la section Lieux et l'activité « Voyage ».
  const setTrip = on => {
    if (on && !s.trip) {
      s.trip = { from:{ region: s.region || homeRegion(id), places: new Set(s.places) }, to:{ region:null, places: new Set() }, modes: new Set() };
    } else if (!on && s.trip) {
      s.trip = null;
    }
    renderChar(id);
  };
  document.querySelectorAll('[data-addregion]').forEach(b => b.addEventListener('click', () => {
    const r = b.dataset.addregion;
    c.regions = REGION_ORDER.filter(x => x === r || c.regions.includes(x));   // garde l'ordre habituel
    (c.added ||= new Set()).add(r);
    s.region = r; s.places = new Set(); renderChar(id);
  }));
  document.getElementById('rmregion-'+id)?.addEventListener('click', () => {
    const r = s.region;
    c.regions = c.regions.filter(x => x !== r); c.added.delete(r);
    s.region = null; s.places = new Set(); renderChar(id);
  });
  document.querySelectorAll('[data-mode]').forEach(cb => cb.addEventListener('change', e => {
    const m = cb.dataset.mode; (s.trip.modes ||= new Set()); e.target.checked ? s.trip.modes.add(m) : s.trip.modes.delete(m);
  }));
  document.getElementById('trip-'+id)?.addEventListener('change', e => setTrip(e.target.checked));
  const setDur = () => { const h = Math.max(0, +document.getElementById('trip-h-'+id).value || 0), m = Math.max(0, Math.min(59, +document.getElementById('trip-m-'+id).value || 0)); s.trip.minutes = h * 60 + m; };
  document.getElementById('trip-h-'+id)?.addEventListener('input', setDur);
  document.getElementById('trip-m-'+id)?.addEventListener('input', setDur);
  document.getElementById('trip-reason-'+id)?.addEventListener('input', e => { s.trip.reason = e.target.value.trim(); });
  const setLegRegion = (leg, r) => { const L = s.trip[leg]; L.region = r || null; L.zone = null; L.places = new Set(); renderChar(id); };
  document.getElementById('tripfrom-'+id)?.addEventListener('change', e => setLegRegion('from', e.target.value));
  document.getElementById('tripto-'+id)?.addEventListener('change', e => setLegRegion('to', e.target.value));
  document.querySelectorAll('[data-region]').forEach(b => b.addEventListener('click', () => {
    const r = b.dataset.region, leg = b.dataset.leg;
    if (leg) return setLegRegion(leg, s.trip[leg].region === r ? null : r);
    s.region = s.region === r ? null : r; s.zone = null;
    s.places = new Set([...s.places].filter(pl => PLACE_REGION[pl] === s.region && !ZONE_OF[pl]));
    renderChar(id);
  }));
  document.querySelectorAll('[data-zone]').forEach(b => b.addEventListener('click', () => {
    const T = b.dataset.leg ? s.trip[b.dataset.leg] : s, z = b.dataset.zone;
    T.zone = T.zone === z ? null : z;
    // Eorzea : les lieux déjà cochés dans les autres zones restent ; ailleurs, une seule zone par jour.
    if (!(T === s && MULTI_ZONE.includes(T.region))) T.places = new Set([...T.places].filter(pl => ZONE_OF[pl] === T.zone));
    renderChar(id);
  }));
  document.querySelectorAll('[data-place]').forEach(b => b.addEventListener('click', () => {
    const pl = b.dataset.place, set = b.dataset.leg ? s.trip[b.dataset.leg].places : s.places;
    set.has(pl) ? set.delete(pl) : set.add(pl); renderChar(id);
  }));
  document.querySelectorAll('[data-contract]').forEach(i => i.addEventListener('change', () => {
    const f = i.dataset.contract, v = i.value.trim(), k = CONTRACTS[id] ||= { start: isoDay(rpDay) };
    if (f === 'days') k.days = v ? Math.max(1, Math.min(60, Math.round(+v))) : null;
    else if (f === 'start') k.start = v && v <= isoDay(rpDay) ? v : isoDay(rpDay);
    else k[f] = v;
    if (!activeContract(id)) k.days = dayIndex(k);   // un début trop ancien prolonge la durée jusqu'à aujourd'hui
    renderChar(id); }));
  document.getElementById('contract-end-'+id)?.addEventListener('click', () => { CONTRACTS[id].days = dayIndex(CONTRACTS[id]); renderChar(id); });
  document.querySelectorAll('[data-redraw]').forEach(b => b.addEventListener('click', () => { const l = b.dataset.redraw; (s.details ||= {})[l] = drawFor(l, s.details[l]); renderChar(id); }));
  document.querySelectorAll('[data-detail]').forEach(i => i.addEventListener('change', () => { (s.details ||= {})[i.dataset.detail] = i.value.trim(); renderChar(id); }));
  document.getElementById('hot-'+id)?.addEventListener('change', e => { setNight(id, e.target.checked); if (!e.target.checked && s.nightNotes) delete s.nightNotes['Nuit chaude']; if (e.target.checked && calmBy[id]) setCalm(id, false); renderChar(id); });
  document.querySelectorAll('[data-next-night]').forEach(b => b.addEventListener('change', () => {
    const x = b.dataset.nextNight;
    if (x === 'Nuit calme') { setCalm(id, !(calmBy[id] || s.nightStates.has(x))); return renderChar(id); }
    if (s.nightStates.has(x)) { s.nightStates.delete(x); if (s.nightNotes) delete s.nightNotes[x]; }
    else { NIGHT_EXCL.filter(g => g.includes(x)).flat().forEach(y => s.nightStates.delete(y)); s.nightStates.add(x); }
    renderChar(id);
  }));
  // Nuit précédente : enregistrée sur la journée d'hier (même nuit)
  const prevStates = () => new Set(prevNight(id).states);
  document.querySelectorAll('[data-night-note][data-night-scope="next"]').forEach(i => i.addEventListener('input', () => { (s.nightNotes ||= {})[i.dataset.nightNote] = i.value.trim(); }));
  document.querySelectorAll('[data-night-note][data-night-scope="prev"]').forEach(i => i.addEventListener('change', () => {
    s.prevEdit = true; setPrev(id, { nightNotes: { ...prevNight(id).notes, [i.dataset.nightNote]: i.value.trim() } }); }));
  document.getElementById('prev-edit-'+id)?.addEventListener('click', () => { s.prevEdit = true; renderChar(id); });
  document.getElementById('prev-done-'+id)?.addEventListener('click', () => { s.prevEdit = false; renderChar(id); });
  document.getElementById('prev-hot-'+id)?.addEventListener('change', e => {
    const st = prevStates(); if (e.target.checked) st.delete('Nuit calme');
    s.prevEdit = true; setPrev(id, { night: { hot: e.target.checked, with: e.target.checked ? (partnerOf(id) || null) : null }, nightStates: [...st] }); renderChar(id);
  });
  document.getElementById('prev-with-'+id)?.addEventListener('change', e => { setPrev(id, { night: { hot: true, with: e.target.value || null } }); renderChar(id); });
  document.querySelectorAll('[data-prev-night]').forEach(b => b.addEventListener('change', () => {
    const x = b.dataset.prevNight, st = prevStates(), patch = {};
    if (st.has(x)) { st.delete(x); const nn = { ...prevNight(id).notes }; if (nn[x]) { delete nn[x]; patch.nightNotes = nn; } if (x === 'Nuit calme') patch.calmWith = null; }
    else { NIGHT_EXCL.filter(g => g.includes(x)).flat().forEach(y => st.delete(y)); st.add(x); if (x === 'Nuit calme') { patch.calmWith = partnerOf(id) || null; if (prevEntry(id)?.night?.hot) patch.night = { hot: false, with: null }; } }
    s.prevEdit = true; setPrev(id, { ...patch, nightStates: [...st] }); renderChar(id);
  }));
  document.querySelectorAll('[data-workday]').forEach(b => b.addEventListener('click', () => { const d = +b.dataset.workday, w = WORKDAYS[id]; w.has(d) ? w.delete(d) : w.add(d); renderChar(id); }));
  document.querySelectorAll('[data-with]').forEach(b => b.addEventListener('click', () => { setNight(id, true, b.dataset.with); renderChar(id); }));
  const pickCalm = (scope, w) => {
    if (scope === 'next') setCalm(id, true, w);
    else { s.prevEdit = true; setPrev(id, { calmWith: w || null }); }
    renderChar(id);
  };
  document.querySelectorAll('[data-calm-with]').forEach(b => b.addEventListener('click', () => pickCalm(b.dataset.calmScope, b.dataset.calmWith)));
  document.querySelectorAll('[data-calm-select]').forEach(sel => sel.addEventListener('change', () => { if (sel.value) pickCalm(sel.dataset.calmSelect, sel.value); }));
  // Ajout d'un amant : bouton « Ajouter » ou touche Entrée du clavier (téléphone compris).
  const addLover = (raw, alsoTonight) => {
    const v = (raw || '').trim(); if (!v) return;
    const who = charByName(v) || v;
    // Une nuit chaude ne se coche qu'avec son ou sa partenaire, ou avec un PNJ : jamais avec un autre personnage du groupe.
    if (isChar(who) && who !== partnerOf(id)) { state[id].loversOpen = true; state[id].loverMsg = `${nameOf(who)} est un personnage du groupe : seul un PNJ peut être ajouté ici.`; renderChar(id); return; }
    if (who !== id && !loversOf(id).includes(who) && who !== partnerOf(id)) loversOf(id).push(who);
    if (alsoTonight) setNight(id, true, who);
    state[id].loversOpen = true; state[id].loverMsg = `${whoLabel(who)} ajouté${isChar(who) && isFem(who) ? 'e' : ''}${alsoTonight ? ' et choisi' + (isChar(who) && isFem(who) ? 'e' : '') + ' pour cette nuit' : ''}.`;
    renderChar(id);
  };
  const onEnter = (el, fn) => el?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); fn(); } });
  const loverEl = document.getElementById('lover-new-'+id);
  document.getElementById('lover-add-'+id)?.addEventListener('click', () => addLover(loverEl.value, false));
  onEnter(loverEl, () => addLover(loverEl.value, false));
  document.querySelector('.lovers')?.addEventListener('toggle', e => { state[id].loversOpen = e.target.open; });
  document.querySelectorAll('[data-lover-del]').forEach(b => b.addEventListener('click', () => {
    const l = b.dataset.loverDel; LOVERS[id] = loversOf(id).filter(x => x !== l);
    if (isChar(l)) LOVERS[l] = loversOf(l).filter(x => x !== id);
    state[id].loversOpen = true; renderChar(id);
  }));
  document.getElementById('violet-'+id)?.addEventListener('change', e => { s.violet = e.target.checked; renderChar(id); });
  document.getElementById('rp-'+id)?.addEventListener('change', e => { setRp(id, e.target.checked, partnerOf(id)); renderNav(); renderChar(id); });
  document.getElementById('rp-with-'+id)?.addEventListener('change', e => { setRp(id, true, e.target.value); renderNav(); renderChar(id); });
  document.getElementById('shell-'+id)?.addEventListener('change', e => { s.shell = e.target.checked; renderChar(id); });
  document.getElementById('protect-'+id)?.addEventListener('change', e => setProtect(id, e.target.checked));
  document.getElementById('protect-pnj-'+id)?.addEventListener('change', e => { lastProtect['pnj:' + id + ':' + nightOf(id).with] = e.target.checked; if (e.target.checked) dropNews(pairKeys(id, nightOf(id).with).slice(1)); checkRisk(id); });
  document.getElementById('addplace-'+id)?.addEventListener('click', () => {
    const v = document.getElementById('place-'+id).value.trim(); if (!v || !s.region) return;
    PLACE_REGION[v] ||= s.region; if (s.zone) ZONE_OF[v] ||= s.zone;
    if (!c.places.includes(v)) { c.places.push(v); (c.customPlaces ||= []).push({ name: v, region: s.region, zone: s.zone || null }); }
    s.places.add(v); renderChar(id);
  });
  document.getElementById('wx-'+id)?.addEventListener('change', e => { weatherOn[HOME_OF[id]] = e.target.checked; renderChar(id); });
  document.querySelectorAll('[data-hunt-mode]').forEach(b => b.addEventListener('click', () => {
    const l = b.dataset.huntMode; s.huntSet ||= {};
    if (b.dataset.v === 'draw') delete s.huntSet[l];
    else if (!Array.isArray(s.huntSet[l])) s.huntSet[l] = (huntFor(id, l)?.catches || []).map(x => ({ ...x }));   // part du tirage, à modifier
    renderChar(id);
  }));
  document.querySelectorAll('[data-hunt-add]').forEach(b => b.addEventListener('click', () => {
    const l = b.dataset.huntAdd, row = b.closest('.special-row');
    const name = row.querySelector('[data-hunt-name]').value.trim(), qty = Math.max(1, +row.querySelector('[data-hunt-qty]').value || 1); if (!name) return;
    const list = (s.huntSet ||= {})[l] ||= [], same = list.find(x => x.name.toLowerCase() === name.toLowerCase());
    same ? same.qty += qty : list.push({ name, qty }); renderChar(id);
  }));
  document.querySelectorAll('[data-hunt-del]').forEach(b => b.addEventListener('click', () => { s.huntSet[b.dataset.huntDel].splice(+b.dataset.i, 1); renderChar(id); }));
  document.querySelectorAll('[data-act]').forEach(cb => cb.addEventListener('change', e => {
    const l = e.target.dataset.act;
    if (l === 'Voyage') return setTrip(e.target.checked);
    if (l === CONTRACT_ACT) { s.contractOff = !e.target.checked;
      if (e.target.checked && !activeContract(id)) CONTRACTS[id] = { start: isoDay(rpDay) };
      if (!e.target.checked && CONTRACTS[id]?.start === isoDay(rpDay)) delete CONTRACTS[id]; }   // contrat créé par erreur aujourd'hui
    if (e.target.checked) { s.checked.add(l); if (!s.slots[l] && guessSlot(l)) s.slots[l] = [...guessSlot(l)]; if (RANDOM_ACTS[l] && !s.details?.[l]) (s.details ||= {})[l] = drawFor(l); }
    else { s.checked.delete(l); delete s.slots[l]; clearWith(id, l); if (RANDOM_ACTS[l] && s.details) delete s.details[l]; if (s.huntSet) delete s.huntSet[l]; }
    renderChar(id);
  }));
  document.querySelectorAll('[data-join-from]').forEach(b => b.addEventListener('click', () => { joinAct(id, b.dataset.joinFrom, b.dataset.joinAct); renderChar(id); }));
  document.querySelectorAll('[data-share]').forEach(b => b.addEventListener('click', () => {
    setWith(id, b.dataset.shareAct, b.dataset.share, b.getAttribute('aria-pressed') !== 'true'); renderChar(id);
  }));
  document.querySelectorAll('details[data-with-fold]').forEach(d => d.addEventListener('toggle', () => { const k = id + ':' + d.dataset.withFold; d.open ? withOpen.add(k) : withOpen.delete(k); }));
  document.querySelectorAll('[data-slot]').forEach(b => b.addEventListener('click', () => {
    const l = b.dataset.for;
    const cur = new Set(s.slots[l] || []), id2 = b.dataset.slot;
    cur.has(id2) ? cur.delete(id2) : cur.add(id2);
    s.slots[l] = SLOTS.map(x => x.id).filter(x => cur.has(x));
    if (s.slots[l].length) lastSlot[l] = s.slots[l]; else delete s.slots[l];
    renderChar(id);
  }));
  document.getElementById('manage-acts-'+id)?.addEventListener('click', () => { s.manageActs = !s.manageActs; s.renaming = null; renderChar(id); });
  document.querySelectorAll('details[data-night-fold]').forEach(d => d.addEventListener('toggle', () => setNightOpen(d.dataset.nightFold, d.open)));
  document.querySelectorAll('details[data-fold]').forEach(d => d.addEventListener('toggle', () => setFolded(id, d.dataset.fold, !d.open)));
  document.querySelectorAll('[data-fold-all]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('details[data-fold]').forEach(d => { setFolded(id, d.dataset.fold, b.dataset.foldAll === '1'); d.open = b.dataset.foldAll !== '1'; });
  }));
  document.querySelectorAll('[data-act-cat]').forEach(sel => sel.addEventListener('change', () => { moveAct(c, sel.dataset.actCat, sel.value); renderChar(id); }));
  document.querySelectorAll('[data-rename]').forEach(b => b.addEventListener('click', () => { s.renaming = b.dataset.rename; renderChar(id); document.getElementById('rename-'+id)?.focus(); }));
  document.querySelectorAll('[data-rename-cancel]').forEach(b => b.addEventListener('click', () => { s.renaming = null; renderChar(id); }));
  const renameOk = k => {
    const v = document.getElementById('rename-'+id).value.trim(); if (!v) return;
    if (catsOf(c).some(x => x !== k && catLabel(c, x).toLowerCase() === v.toLowerCase())) return;
    renameCat(c, k, v); s.renaming = null; renderChar(id);
  };
  document.querySelectorAll('[data-rename-ok]').forEach(b => b.addEventListener('click', () => renameOk(b.dataset.renameOk)));
  document.getElementById('rename-'+id)?.addEventListener('keydown', e => { if (e.key === 'Enter') renameOk(s.renaming); });
  document.querySelectorAll('[data-cat-del]').forEach(b => b.addEventListener('click', () => { c.customCats = (c.customCats || []).filter(x => x.key !== b.dataset.catDel); renderChar(id); }));
  document.getElementById('newcat-add-'+id)?.addEventListener('click', () => {
    const v = document.getElementById('newcat-'+id).value.trim(); if (!v) return;
    if (catsOf(c).some(k => catLabel(c, k).toLowerCase() === v.toLowerCase())) return;
    (c.customCats ||= []).push({ key: 'cat-' + Date.now().toString(36), label: v }); renderChar(id);
  });
  document.querySelectorAll('[data-act-remove]').forEach(b => b.addEventListener('click', () => {
    const l = b.dataset.actRemove; s.actDel = null;
    // Définitif : retirée de la liste (et des activités ajoutées) ; masquée pour de bon si elle vient de la fiche de base.
    c.removedActs.add(l); pullAct(c, l); c.addedActs = (c.addedActs || []).filter(x => x !== l); if (c.actCat) delete c.actCat[l];
    s.checked.delete(l); delete s.slots[l]; renderChar(id); }));
  document.querySelectorAll('[data-special-remove]').forEach(b => b.addEventListener('click', () => {
    const l = b.dataset.specialRemove; s.actDel = null; s.specials = s.specials.filter(x => x !== l); s.checked.delete(l); delete s.slots[l]; renderChar(id); }));
  document.querySelectorAll('[data-act-del]').forEach(b => b.addEventListener('click', () => { s.actDel = b.dataset.actDel; renderChar(id); }));
  document.getElementById('add-'+id).addEventListener('click', () => {
    const inp = document.getElementById('special-'+id), v = inp.value.trim(); if (!v) return;
    if (document.getElementById('keep-'+id).checked) { c.removedActs?.delete(v); (c.acts.quotidien ||= []).push(v); (c.addedActs ||= []).push(v); }
    else s.specials.push(v);
    s.checked.add(v); renderChar(id);
  });
  document.getElementById('done-'+id).addEventListener('click', () => { s.done = true; s.doneAt ??= Date.now(); renderNav(); renderChar(id); window.RP_SYNC?.saveNow(); window.RP_DISCORD?.send(id); });
}

// S9-MODULES-JS (début)
// ---------- Modules propres à S9 Interact' : Flash Actu (accueil), Wondereye (réseau social), Pixel Meet (rencontres) ----------
// Inséré dans dev/apercu.html par dev/s9-insert.py (ne pas modifier dans l'aperçu : modifier ce fichier puis relancer).
// Données en mémoire ; dans l'appli, sync.js les charge et les tient à jour (window.S9.apply*) et enregistre
// chaque changement par window.RP_SYNC.s9*(…). Rien n'est envoyé sur Discord ni recopié vers Journée RP.
Object.assign(ICONS, {
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  bubble: '<path d="M4 5h16v11H9l-4 3v-3H4z"/>',
  send: '<path d="M21 3L3 10.5l7 2.5 2.5 7z M21 3L10 13"/>',
  lock: '<rect x="5" y="11" width="14" height="9"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
  image: '<rect x="3" y="5" width="18" height="14"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/>',
});
const S9 = window.S9 = {};
const s9uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const s9time = at => { const d = new Date(at), now = Date.now(), mn = Math.round((now - at) / 60e3);
  if (mn < 1) return "à l'instant"; if (mn < 60) return `il y a ${mn} min`; if (mn < 24 * 60) return `il y a ${Math.round(mn / 60)} h`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); };
const s9hour = at => new Date(at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const myChars = () => C.filter(c => c.player === me);
const charTheme = id => THEMES[C.find(c => c.id === id)?.theme] || THEMES.s9;
const s9col = id => charTheme(id).gold;
// Notifie d'autres joueurs (jamais soi-même) : nouvelle dans l'appli, puis notification push par le service du VPS.
const s9news = (toPlayer, text, key, charId = null) => {
  if (!toPlayer || toPlayer === me || NEWS.some(n => n.key === key)) return;
  NEWS.unshift({ to: toPlayer, text, charId, key, read: false, at: Date.now() });
};
// Photo choisie sur l'appareil : réduite (côté le plus long 1080 px) et compressée sous ~200 Ko, rangée telle quelle dans la base.
const s9photo = (file, maxBytes = 200e3, side = 1080) => new Promise((res, rej) => {
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => {
    URL.revokeObjectURL(url);
    const k = Math.min(1, side / Math.max(img.width, img.height)), cv = document.createElement('canvas');
    cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    for (let q = .82; q > .3; q -= .08) { const d = cv.toDataURL('image/webp', q); if (d.length * .75 < maxBytes || q <= .35) return res(d.startsWith('data:image/webp') ? d : cv.toDataURL('image/jpeg', q)); }
  };
  img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('image illisible')); };
  img.src = url;
});
const s9sheet = (html, cls = '') => { s9close(); const b = document.createElement('div'); b.className = 's9-back'; b.id = 's9-sheet';
  b.innerHTML = `<div class="s9-sheet ${cls}" role="dialog">${html}</div>`; document.body.appendChild(b); return b; };
const s9close = () => document.getElementById('s9-sheet')?.remove();
document.addEventListener('click', e => { if (e.target.id === 's9-sheet' || e.target.closest('[data-s9-close]')) s9close(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') s9close(); });

// ================================================================ Flash Actu
// flash/{id} : { cat, title, text, src, by (joueur), at } — tout joueur publie ; chaque flash reste en tête au moins 48 h.
const FLASH = {};
const FLASH_CATS = ['Nightlife', 'Faits divers', 'Mode', 'Rumeur', 'Ville', 'Météo néon'];
const FLASH_HOLD = 48 * 3600e3;
const flashList = () => Object.entries(FLASH).filter(([, f]) => f).sort((a, b) => b[1].at - a[1].at);
const flashFresh = () => flashList().filter(([, f]) => Date.now() - f.at < FLASH_HOLD);
const flashHtml = () => {
  const all = flashList(), fresh = flashFresh(), old = all.filter(x => !fresh.includes(x));
  const line = (fresh.length ? fresh : all.slice(0, 3)).map(([, f]) => `<span><b>${esc(f.cat.toUpperCase())}</b>${esc(f.title)}</span>`).join('');
  return `<section class="s9-flash" aria-label="Flash Actu">
    <div class="s9-flash-head"><span class="s9-live">LIVE</span><h2>Flash Actu</h2><button type="button" class="btn s9-mini" data-flash-new>${icon('plus')}Flash</button></div>
    ${all.length ? `<div class="s9-ticker" aria-hidden="true"><div class="s9-track">${line}${line.replaceAll('<span>', '<span class="dup">')}</div></div>
    <div class="s9-flash-list">${(fresh.length ? fresh : all.slice(0, 1)).map(([id, f]) => `<article class="s9-flash-item">
      <p class="s9-cat">${esc(f.cat)} · ${esc(f.src || 'S9 Infos')}</p><strong>${esc(f.title)}</strong>${f.text ? `<p>${esc(f.text)}</p>` : ''}
      <p class="s9-by">${s9time(f.at)} · écrit par ${esc(PLAYER_NAME[f.by] || '?')}${f.by === me || isAdminMe() ? ` · <button type="button" class="link" data-flash-del="${id}">retirer</button>` : ''}</p></article>`).join('')}</div>
    ${old.length ? `<details class="s9-more"><summary>Flashs précédents (${old.length})</summary><ul>${old.slice(0, 30).map(([, f]) => `<li><small>${s9time(f.at)}</small> <b>${esc(f.title)}</b> — ${esc(f.src || 'S9 Infos')}</li>`).join('')}</ul></details>` : ''}`
    : '<p class="reserved">Aucun flash pour l\'instant. Le premier qui sait quelque chose l\'écrit !</p>'}
  </section>`;
};
const openFlash = () => s9sheet(`<div class="s9-row"><h2>${icon('bolt')}Nouveau flash</h2><button type="button" class="link ico-btn" data-s9-close aria-label="Fermer">${icon('cross')}</button></div>
  <div class="s9-field"><span>Rubrique</span><div class="place-list">${FLASH_CATS.map((c, i) => `<button type="button" data-fcat="${c}" aria-pressed="${i === 0}">${c}</button>`).join('')}</div></div>
  <label class="s9-field"><span>Titre</span><input type="text" id="f-title" maxlength="90" placeholder="Ce que tout Solution Nine doit savoir"></label>
  <label class="s9-field"><span>Texte (facultatif)</span><textarea id="f-text" maxlength="280" placeholder="Deux ou trois phrases."></textarea></label>
  <label class="s9-field"><span>Média (dans le lore)</span><input type="text" id="f-src" maxlength="40" value="S9 Infos"></label>
  <p class="reserved">Visible par tous les joueurs, en tête de l'accueil pendant au moins 48 h. Chacun reçoit une notification.</p>
  <button type="button" class="btn primary" data-flash-pub>Publier le flash</button>`, 's9-yellow');
document.addEventListener('click', e => {
  const t = e.target;
  if (t.closest('[data-flash-new]')) return openFlash();
  const c = t.closest('[data-fcat]'); if (c) return c.parentNode.querySelectorAll('[data-fcat]').forEach(b => b.setAttribute('aria-pressed', b === c));
  const del = t.closest('[data-flash-del]');
  if (del) { const id = del.dataset.flashDel; delete FLASH[id]; window.RP_SYNC?.s9Flash?.(id, null); dropNews(PLAYERS.map(p => 'flash:' + id + ':' + p.id)); return renderHome(); }
  if (t.closest('[data-flash-pub]')) {
    const title = document.getElementById('f-title').value.trim(); if (!title) return document.getElementById('f-title').focus();
    const id = s9uid(), f = { cat: document.querySelector('[data-fcat][aria-pressed="true"]').dataset.fcat, title,
      text: document.getElementById('f-text').value.trim(), src: document.getElementById('f-src').value.trim() || 'S9 Infos', by: me, at: Date.now() };
    FLASH[id] = f; window.RP_SYNC?.s9Flash?.(id, f);
    PLAYERS.forEach(p => s9news(p.id, `Flash Actu · ${f.cat} : ${f.title}`, 'flash:' + id + ':' + p.id));
    s9close(); if (current === 'home') renderHome(); window.RP_SYNC?.save();
  }
});
S9.applyFlash = list => { Object.keys(FLASH).forEach(k => delete FLASH[k]); list.forEach(([id, f]) => { FLASH[id] = f; }); };

// ================================================================ Wondereye
// we_accounts/{pseudo} : { char, type ('perso'|'pro'), name, bio, avatar? } — créés par le joueur du personnage.
// we_posts/{id} : { acc, char, photo, text, loc, at, likes: { pseudo: true }, comments: [{ acc, text, at }] }.
const WE_ACC = {}, WE_POSTS = {};
const weView = { acc: null, as: null };   // acc : profil ouvert ; as : compte choisi pour aimer, commenter, publier
const myAccs = () => Object.entries(WE_ACC).filter(([, a]) => playerOf(a.char) === me).map(([h, a]) => ({ h, ...a }));
const weAs = () => { const m = myAccs(); return m.find(a => a.h === weView.as)?.h || m[0]?.h || null; };
const weAv = (h, cls = '') => { const a = WE_ACC[h]; if (!a) return '';
  return `<span class="we-av ${a.type === 'pro' ? 'pro' : ''} ${cls}" style="--c:${s9col(a.char)}" aria-hidden="true">${a.avatar ? `<img src="${a.avatar}" alt="">` : esc(a.name[0] || '?')}</span>`; };
const weH = h => `<button type="button" class="we-h" data-we-acc="${esc(h)}">@${esc(h)}</button>`;
const wePostHtml = ([id, p]) => {
  const a = WE_ACC[p.acc]; if (!a) return '';
  const likers = Object.keys(p.likes || {}).filter(h => p.likes[h]), mine = weAs(), on = !!mine && !!p.likes?.[mine];
  const cms = p.comments || [];
  return `<article class="we-post" style="--c:${s9col(a.char)}">
    <div class="we-head">${weAv(p.acc)}<div class="we-who">${weH(p.acc)}<span>${esc(p.loc || '')}</span></div>${a.type === 'pro' ? '<span class="we-pro">PRO</span>' : ''}
      ${playerOf(a.char) === me ? `<button type="button" class="link ico-btn" data-we-del="${id}" title="Supprimer" aria-label="Supprimer">${icon('trash')}</button>` : ''}</div>
    ${p.photo ? `<img class="we-photo" src="${p.photo}" alt="" loading="lazy">` : ''}
    <div class="we-actions">
      <button type="button" class="we-ico" data-we-like="${id}" aria-pressed="${on}" aria-label="J'aime" ${mine ? '' : 'disabled'}>${icon('heart')}</button>
      <button type="button" class="we-ico" data-we-cm-open="${id}" aria-label="Commenter" ${mine ? '' : 'disabled'}>${icon('bubble')}</button>
    </div>
    <div class="we-body">
      ${likers.length ? `<span class="we-likes">Aimé par ${weH(likers[0])}${likers.length > 1 ? ` et ${likers.length - 1} autre${likers.length > 2 ? 's' : ''}` : ''}</span>` : ''}
      ${p.text ? `<span>${weH(p.acc)} ${esc(p.text)}</span>` : ''}
      ${cms.map(c => `<span class="we-cm">${weH(c.acc)} ${esc(c.text)}</span>`).join('')}
      <span class="we-time">${s9time(p.at)}</span>
    </div></article>`;
};
const weMeHtml = () => { const m = myAccs();
  return m.length ? `<div class="we-as"><span>Aimer et commenter en tant que</span><div class="place-list">${m.map(a => `<button type="button" data-we-as="${esc(a.h)}" aria-pressed="${a.h === weAs()}">@${esc(a.h)}</button>`).join('')}</div></div>`
    : `<p class="reserved">Aucun compte Wondereye pour tes personnages. Crée-en un pour publier, aimer et commenter.</p>`; };
function renderWe() {
  root.className = 't-s9';
  const h = weView.acc, a = h && WE_ACC[h];
  if (a) return renderWeProfile(h, a);
  const posts = Object.entries(WE_POSTS).filter(([, p]) => p && WE_ACC[p.acc]).sort((x, y) => y[1].at - x[1].at);
  document.getElementById('view').innerHTML = `
    <header class="we-top"><p class="kicker">${APP_NAME} · réseau</p><h1 class="we-logo" aria-label="Wondereye">ωondereye</h1>
      <p class="home-links"><button type="button" class="chip-link" data-we-post>${icon('plus')}Publier</button>
        <button type="button" class="chip-link" data-we-newacc>${icon('users')}Nouveau compte</button></p></header>
    ${weMeHtml()}
    <div class="we-stories">${Object.entries(WE_ACC).map(([k]) => `<button type="button" class="we-story" data-we-acc="${esc(k)}">${weAv(k)}<span>${esc(k)}</span></button>`).join('')}</div>
    ${posts.length ? posts.map(wePostHtml).join('') : '<p class="reserved">Aucune publication pour l\'instant.</p>'}`;
}
function renderWeProfile(h, a) {
  const c = C.find(x => x.id === a.char), posts = Object.entries(WE_POSTS).filter(([, p]) => p?.acc === h).sort((x, y) => y[1].at - x[1].at);
  const others = Object.entries(WE_ACC).filter(([k, o]) => o.char === a.char && k !== h);
  const fol = Object.values(WE_POSTS).reduce((n, p) => n + (p?.acc === h ? Object.keys(p.likes || {}).length : 0), 0);
  document.getElementById('view').innerHTML = `
    <p><button type="button" class="chip-link" data-we-acc="">${icon('back')}<span class="we-logo sm">ωondereye</span></button></p>
    <header class="we-prof" style="--c:${s9col(a.char)}">${weAv(h, 'lg')}
      <div><h1>${esc(a.name)}</h1><p class="we-handle">@${esc(h)} ${a.type === 'pro' ? '<span class="we-pro">PRO</span>' : ''}</p>
        <p class="we-counts"><span><b>${posts.length}</b> publications</span><span><b>${fol}</b> j'aime reçus</span></p></div></header>
    ${a.bio ? `<p class="we-bio">${esc(a.bio)}</p>` : ''}
    ${others.length ? `<section><h2>Autres comptes de ${esc(c.name)}</h2><p class="home-links">${others.map(([k]) => `<button type="button" class="chip-link" data-we-acc="${esc(k)}">@${esc(k)}</button>`).join('')}</p></section>` : ''}
    <p class="home-links"><button type="button" class="chip-link" data-go="${c.id}">${icon('heartbeat')}Fiche du jour de ${esc(c.name)}</button>
      ${playerOf(a.char) === me ? `<button type="button" class="chip-link" data-we-edit="${esc(h)}">${icon('pencil')}Modifier le compte</button>` : ''}</p>
    ${posts.length ? `<div class="we-grid">${posts.map(([, p]) => p.photo ? `<img src="${p.photo}" alt="" loading="lazy">` : `<span class="we-txt">${esc(p.text.slice(0, 60))}</span>`).join('')}</div>` : '<p class="reserved">Aucune publication.</p>'}`;
}
const openWePost = () => {
  const m = myAccs(); if (!m.length) return openWeAcc();
  const as = weAs(), c = C.find(x => x.id === WE_ACC[as].char);
  s9sheet(`<div class="s9-row"><h2>${icon('image')}Nouvelle publication</h2><button type="button" class="link ico-btn" data-s9-close aria-label="Fermer">${icon('cross')}</button></div>
    <div class="s9-field"><span>Publier en tant que</span><div class="place-list">${m.map(a => `<button type="button" data-we-pick="${esc(a.h)}" aria-pressed="${a.h === as}">@${esc(a.h)}</button>`).join('')}</div></div>
    <label class="s9-pick"><input type="file" accept="image/*" id="we-file" hidden><span id="we-prev">${icon('image')}Choisir une photo<small>réduite à environ 200 Ko</small></span></label>
    <label class="s9-field"><span>Légende</span><textarea id="we-text" maxlength="600" placeholder="Écris quelque chose… #hashtags"></textarea></label>
    <label class="s9-field"><span>Lieu</span><input type="text" id="we-loc" maxlength="60" value="${esc([...(state[c.id]?.places || [])][0] || '')}"></label>
    ${c.mirror ? '' : `<label class="check-inline"><input type="checkbox" id="we-fiche" checked> Ajouter « A posté sur Wondereye » à la fiche du jour de ${esc(c.name)}</label>`}
    <p class="reserved">Seule la personne qui joue ${esc(c.name)} peut publier avec ce compte.</p>
    <button type="button" class="btn primary" data-we-pub>Publier</button>`);
};
let weFile = null;
const openWeAcc = (h = null) => {
  const a = h ? WE_ACC[h] : null, mine = myChars();
  if (!mine.length) return;
  s9sheet(`<div class="s9-row"><h2>${icon('users')}${a ? 'Modifier le compte' : 'Nouveau compte'}</h2><button type="button" class="link ico-btn" data-s9-close aria-label="Fermer">${icon('cross')}</button></div>
    <div class="s9-field"><span>Personnage</span><div class="place-list">${mine.map((c, i) => `<button type="button" data-we-char="${c.id}" aria-pressed="${a ? a.char === c.id : i === 0}" ${a ? 'disabled' : ''}>${esc(c.name)}</button>`).join('')}</div></div>
    <label class="s9-field"><span>Pseudo (sans @)</span><input type="text" id="wa-h" maxlength="24" value="${esc(h || '')}" ${a ? 'disabled' : ''} placeholder="ex. : prism.atelier" autocapitalize="off"></label>
    <label class="s9-field"><span>Nom affiché</span><input type="text" id="wa-name" maxlength="40" value="${esc(a?.name || '')}"></label>
    <label class="s9-field"><span>Bio</span><textarea id="wa-bio" maxlength="200">${esc(a?.bio || '')}</textarea></label>
    <div class="s9-field"><span>Type</span><div class="place-list">${[['perso', 'Personnel'], ['pro', 'Pro (boutique, scène…)']].map(([k, l]) => `<button type="button" data-we-type="${k}" aria-pressed="${(a?.type || 'perso') === k}">${l}</button>`).join('')}</div></div>
    <label class="s9-pick sm"><input type="file" accept="image/*" id="wa-file" hidden><span id="wa-prev">${a?.avatar ? `<img src="${a.avatar}" alt="">` : icon('camera')}Photo de profil (facultatif)</span></label>
    <p class="reserved" id="wa-msg"></p>
    <button type="button" class="btn primary" data-we-save="${esc(h || '')}">Enregistrer</button>`);
};
let waAvatar;
document.addEventListener('change', async e => {
  if (e.target.id === 'we-file' && e.target.files[0]) { try { weFile = await s9photo(e.target.files[0]); document.getElementById('we-prev').innerHTML = `<img src="${weFile}" alt="">`; } catch { weFile = null; } }
  if (e.target.id === 'wa-file' && e.target.files[0]) { try { waAvatar = await s9photo(e.target.files[0], 30e3, 240); document.getElementById('wa-prev').innerHTML = `<img src="${waAvatar}" alt="">Photo de profil`; } catch { waAvatar = undefined; } }
});
document.addEventListener('click', e => {
  const t = e.target;
  const acc = t.closest('[data-we-acc]'); if (acc) { weView.acc = acc.dataset.weAcc || null; if (current !== 'we') return go('we'); renderWe(); return window.scrollTo({ top: 0 }); }
  const as = t.closest('[data-we-as]'); if (as) { weView.as = as.dataset.weAs; return renderWe(); }
  if (t.closest('[data-we-post]')) { weFile = null; return openWePost(); }
  if (t.closest('[data-we-newacc]')) { waAvatar = undefined; return openWeAcc(); }
  const ed = t.closest('[data-we-edit]'); if (ed) { waAvatar = undefined; return openWeAcc(ed.dataset.weEdit); }
  const pk = t.closest('[data-we-pick]'); if (pk) { weView.as = pk.dataset.wePick; const f = weFile; openWePost(); weFile = f; if (f) document.getElementById('we-prev').innerHTML = `<img src="${f}" alt="">`; return; }
  for (const k of ['weChar', 'weType']) { const b = t.closest(`[data-${k === 'weChar' ? 'we-char' : 'we-type'}]`); if (b) return b.parentNode.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); }
  const lk = t.closest('[data-we-like]');
  if (lk) {
    const id = lk.dataset.weLike, p = WE_POSTS[id], mine = weAs(); if (!p || !mine) return;
    const on = !p.likes?.[mine]; p.likes ||= {}; if (on) p.likes[mine] = true; else delete p.likes[mine];
    window.RP_SYNC?.s9Like?.(id, mine, on);
    const owner = playerOf(WE_ACC[p.acc]?.char), key = 'we-like:' + id + ':' + mine;
    if (on) s9news(owner, `@${mine} a aimé la publication de @${p.acc}.`, key, WE_ACC[p.acc]?.char); else dropNews([key]);
    lk.closest('.we-post').outerHTML = wePostHtml([id, p]); window.RP_SYNC?.save(); return;
  }
  const co = t.closest('[data-we-cm-open]');
  if (co) { const id = co.dataset.weCmOpen, art = co.closest('.we-post'); if (art.querySelector('.we-cm-form')) return;
    art.querySelector('.we-body').insertAdjacentHTML('beforeend', `<div class="special-row we-cm-form"><input type="text" id="we-cm-${id}" maxlength="300" placeholder="Commenter en tant que @${esc(weAs())}" enterkeyhint="send"><button type="button" class="btn" data-we-cm="${id}">Envoyer</button></div>`);
    return document.getElementById('we-cm-' + id).focus(); }
  const cm = t.closest('[data-we-cm]');
  if (cm) {
    const id = cm.dataset.weCm, p = WE_POSTS[id], inp = document.getElementById('we-cm-' + id), txt = inp?.value.trim(), mine = weAs(); if (!p || !txt || !mine) return;
    const c = { acc: mine, text: txt, at: Date.now() }; (p.comments ||= []).push(c); window.RP_SYNC?.s9Comment?.(id, c);
    s9news(playerOf(WE_ACC[p.acc]?.char), `@${mine} a commenté la publication de @${p.acc} : « ${txt.slice(0, 80)} »`, 'we-cm:' + id + ':' + c.at, WE_ACC[p.acc]?.char);
    cm.closest('.we-post').outerHTML = wePostHtml([id, p]); window.RP_SYNC?.save(); return;
  }
  const dl = t.closest('[data-we-del]');
  if (dl) { const id = dl.dataset.weDel; if (dl.dataset.sure !== '1') { dl.dataset.sure = '1'; dl.classList.add('danger'); dl.title = 'Toucher encore pour supprimer'; return; }
    delete WE_POSTS[id]; window.RP_SYNC?.s9Post?.(id, null); return renderWe(); }
  if (t.closest('[data-we-pub]')) {
    const as = weAs(), a = WE_ACC[as], text = document.getElementById('we-text').value.trim(); if (!a || (!weFile && !text)) return;
    const id = s9uid(), p = { acc: as, char: a.char, photo: weFile || null, text, loc: document.getElementById('we-loc').value.trim(), at: Date.now(), likes: {}, comments: [] };
    WE_POSTS[id] = p; window.RP_SYNC?.s9Post?.(id, p);
    if (document.getElementById('we-fiche')?.checked && state[a.char] && canEdit(a.char)) { const s = state[a.char], l = 'A posté sur Wondereye';
      if (!s.specials.includes(l)) s.specials.push(l); s.checked.add(l); }
    s9close(); weFile = null; weView.acc = null; renderWe(); window.RP_SYNC?.save(); return;
  }
  const sv = t.closest('[data-we-save]');
  if (sv) {
    const old = sv.dataset.weSave, h = old || document.getElementById('wa-h').value.trim().replace(/^@/, '').toLowerCase(), msg = document.getElementById('wa-msg');
    if (!/^[a-z0-9._]{2,24}$/.test(h)) return msg.textContent = 'Pseudo : 2 à 24 caractères, lettres sans accent, chiffres, point ou _.';
    if (!old && WE_ACC[h]) return msg.textContent = 'Ce pseudo est déjà pris.';
    const char = old ? WE_ACC[old].char : document.querySelector('[data-we-char][aria-pressed="true"]').dataset.weChar;
    const a = { char, type: document.querySelector('[data-we-type][aria-pressed="true"]').dataset.weType, name: document.getElementById('wa-name').value.trim() || nameOf(char),
      bio: document.getElementById('wa-bio').value.trim(), avatar: waAvatar !== undefined ? waAvatar : (WE_ACC[old]?.avatar || null) };
    WE_ACC[h] = a; window.RP_SYNC?.s9Account?.(h, a); weView.as ||= h;
    s9close(); renderWe(); return;
  }
});
S9.applyWe = (accs, posts) => {
  if (accs) { Object.keys(WE_ACC).forEach(k => delete WE_ACC[k]); accs.forEach(([h, a]) => { WE_ACC[h] = a; }); }
  if (posts) { Object.keys(WE_POSTS).forEach(k => delete WE_POSTS[k]); posts.forEach(([id, p]) => { WE_POSTS[id] = p; }); }
};
const weOf = id => Object.entries(WE_ACC).filter(([, a]) => a.char === id).map(([h]) => h);

// ================================================================ Pixel Meet
// Privé. pm_profiles/{perso} : profil + réglages ; visibleTo = joueurs qui le voient dans « Découvrir »
// (tous, sauf le joueur du partenaire en couple). pm_threads/{id} : { a, b (perso ou null), npc?, players, last, at, seen: { joueur: ms } },
// messages dans pm_threads/{id}/msgs. Les accroches de PNJ sont écrites par le service s9-pixel du VPS (étape 6).
const PM_PROFILES = {}, PM_THREADS = {}, PM_MSGS = {};
const pmView = { tab: 'inbox', thread: null, as: null };
const PM_FIELDS = [['pseudo', 'Pseudo', 30], ['age', 'Âge', 3], ['genre', 'Genre', 20], ['metier', 'Métier', 60], ['vit', 'Vit à', 60], ['traine', 'Traîne à', 60],
  ['trait', 'Trait de caractère', 40], ['cherche', 'Cherche', 120], ['interet', 'Intéressé·e par', 200], ['passions', 'Passions', 400], ['naime', "N'aime pas", 160]];
const PM_FREQ = [['calme', 'Calme · ~1 / semaine'], ['normal', 'Normal · 2 à 3 / semaine'], ['star', 'Très demandé·e · ~1 / jour'], ['off', 'Aucune accroche']];
const PM_TONES = [['classique', 'Classique'], ['taquin', 'Taquin'], ['direct', 'Direct']];
const pmMine = () => myChars().map(c => c.id).filter(id => PM_PROFILES[id]);
const pmAs = () => { const m = pmMine(); return m.includes(pmView.as) ? pmView.as : m[0] || null; };
const pmVisibleTo = id => { const p = partnerOf(id); return PLAYERS.map(x => x.id).filter(x => x !== (p ? playerOf(p) : null) || x === playerOf(id)); };
const pmThreadsOf = id => Object.entries(PM_THREADS).filter(([, t]) => t && (t.a === id || t.b === id)).sort((x, y) => y[1].at - x[1].at);
const pmUnread = t => (t.at || 0) > (t.seen?.[me] || 0) && t.lastBy !== me;
const pmName = (t, id) => { const o = t.a === id ? t.b : t.a; return o ? PM_PROFILES[o]?.pseudo || nameOf(o) : t.npc?.name || 'Inconnu·e'; };
const pmPix = name => { let h = 0; for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const col = ['#ff3d9a', '#2ff5dc', '#d4ff09', '#b24bff', '#ff8a1f', '#3dff6e', '#2b8cff'][h % 7]; let r = '';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { h = (h * 1103515245 + 12345) >>> 0; if ((h >> 16) % 3 === 0) r += `<rect x="${x}" y="${y}" width="1" height="1"/><rect x="${7 - x}" y="${y}" width="1" height="1"/>`; }
  return `<svg class="pm-px" viewBox="-1 -1 10 10" aria-hidden="true"><rect x="-1" y="-1" width="10" height="10" fill="#140c2c"/><g fill="${col}">${r}</g></svg>`; };
const pmAv = (t, id) => { const o = t.a === id ? t.b : t.a, ph = o && PM_PROFILES[o]?.photo; return ph ? `<img class="pm-px" src="${ph}" alt="">` : pmPix(pmName(t, id)); };
const pmProfileHtml = (id, own) => { const p = PM_PROFILES[id]; if (!p) return '';
  return `<article class="pm-card" style="--c:${s9col(id)}">
    ${p.photo ? `<div class="pm-photo"><img src="${p.photo}" alt="">${p.age ? `<span>${esc(String(p.age))} ans</span>` : ''}</div>` : ''}
    <div class="pm-body"><h2 class="pm-name">${esc(p.pseudo || nameOf(id))}</h2>
      <p class="pm-facts">${['genre', 'metier', 'trait'].filter(k => p[k]).map(k => `<span>${esc(p[k])}</span>`).join('')}</p>
      <dl>${[['vit', 'Vit à'], ['traine', 'Traîne à'], ['cherche', 'Cherche'], ['interet', 'Intéressé·e par'], ['passions', 'Passions'], ['naime', "N'aime pas"]].filter(([k]) => p[k]).map(([k, l]) => `<dt>${l}</dt><dd>${esc(p[k])}</dd>`).join('')}</dl>
      ${p.bio ? `<p class="pm-bio">${esc(p.bio)}</p>` : ''}
      ${own ? `<button type="button" class="btn" data-pm-edit="${id}">${icon('pencil')} Modifier le profil</button>`
        : pmAs() ? `<button type="button" class="btn" data-pm-write="${id}">${icon('send')} Envoyer un message</button>` : ''}
    </div></article>`; };
function renderPm() {
  root.className = 't-s9';
  const mine = pmMine(), as = pmAs(), t = pmView.thread && PM_THREADS[pmView.thread];
  const unread = as ? pmThreadsOf(as).filter(([, x]) => pmUnread(x)).length : 0;
  const body = !myChars().length ? '<p class="reserved">Aucun personnage à toi ici.</p>'
    : t ? pmThreadHtml(pmView.thread, t, as)
    : pmView.tab === 'profile' ? (as ? pmProfileHtml(as, true) : '') + (myChars().filter(c => !PM_PROFILES[c.id]).length ? `<p class="home-links">${myChars().filter(c => !PM_PROFILES[c.id]).map(c => `<button type="button" class="chip-link" data-pm-edit="${c.id}">${icon('plus')}Créer le profil de ${esc(c.name)}</button>`).join('')}</p>` : '')
    : pmView.tab === 'discover' ? pmDiscoverHtml(as)
    : pmView.tab === 'settings' ? (as ? pmSettingsHtml(as) : '<p class="reserved">Crée d\'abord un profil.</p>')
    : as ? pmInboxHtml(as) : `<p class="reserved">Pas encore de profil Pixel Meet.</p><p class="home-links">${myChars().map(c => `<button type="button" class="chip-link" data-pm-edit="${c.id}">${icon('plus')}Créer le profil de ${esc(c.name)}</button>`).join('')}</p>`;
  document.getElementById('view').innerHTML = `
    <header class="pm-top"><p class="kicker">${APP_NAME} · rencontres</p><h1 class="pm-logo" aria-label="Pixel Meet">Pixel<span>♥</span>Meet</h1>
      <p class="pm-private">${icon('lock')}Privé : seuls toi et les joueurs à qui tu écris voyez ces messages. Ni Discord, ni chronique, ni Journée RP.</p></header>
    ${mine.length > 1 ? `<div class="we-as"><span>Profil</span><div class="place-list">${mine.map(id => `<button type="button" data-pm-as="${id}" aria-pressed="${id === as}">${esc(PM_PROFILES[id].pseudo || nameOf(id))}</button>`).join('')}</div></div>` : ''}
    <div class="tabs pm-tabs" role="tablist">${[['inbox', 'Messages' + (unread ? ` (${unread})` : '')], ['profile', 'Mon profil'], ['discover', 'Découvrir'], ['settings', 'Réglages']]
      .map(([k, l]) => `<button type="button" role="tab" data-pm-tab="${k}" aria-selected="${!t && pmView.tab === k}">${l}</button>`).join('')}</div>
    ${body}`;
  if (t && as && (t.seen?.[me] || 0) < (t.at || 0)) { (t.seen ||= {})[me] = Date.now(); window.RP_SYNC?.s9PmSeen?.(pmView.thread); renderNav(); }
}
const pmInboxHtml = as => { const list = pmThreadsOf(as);
  return list.length ? `<ul class="pm-inbox">${list.map(([id, t]) => `<li><button type="button" class="pm-thread ${pmUnread(t) ? 'unread' : ''}" data-pm-thread="${id}">
    ${pmAv(t, as)}<span class="pm-nm">${esc(pmName(t, as))} <small>${t.npc ? `${esc(String(t.npc.age || ''))} ans · ${esc(t.npc.job || '')}` : 'joueur'}</small></span>
    <span class="pm-pv">${esc(t.last || '')}</span><span class="pm-tm">${s9time(t.at)}</span>${t.npc?.tone ? `<span class="pm-tone ${t.npc.tone}">${t.npc.tone.toUpperCase()}</span>` : ''}</button></li>`).join('')}</ul>`
    : '<p class="reserved">Aucun message pour l\'instant. Les accroches arriveront selon tes réglages.</p>'; };
const pmThreadHtml = (id, t, as) => {
  const msgs = (PM_MSGS[id] || []).slice().sort((a, b) => a.at - b.at);
  return `<section class="pm-convo">
    <p><button type="button" class="chip-link" data-pm-tab="inbox">${icon('back')}Messages</button></p>
    <div class="pm-head">${pmAv(t, as)}<b>${esc(pmName(t, as))}</b><span>${t.npc ? `${esc(String(t.npc.age || ''))} ans · ${esc(t.npc.job || '')} · PNJ` : 'Conversation entre joueurs'}</span></div>
    ${msgs.map(m => `<div class="pm-bub ${m.from === as ? 'me' : 'them'}">${esc(m.text)}<small>${s9hour(m.at)}</small></div>`).join('') || '<p class="reserved">Chargement…</p>'}
    <div class="special-row"><textarea id="pm-text" maxlength="800" placeholder="Répondre en tant que ${esc(PM_PROFILES[as]?.pseudo || nameOf(as))}…"></textarea></div>
    <p class="home-links"><button type="button" class="btn" data-pm-send="${id}">Envoyer</button>
      ${t.npc && canEdit(as) ? `<button type="button" class="chip-link" data-pm-date="${id}">${icon('calendar')}Noter un rendez-vous sur la fiche de ${esc(nameOf(as))}</button>` : ''}</p>
    <p class="reserved">${t.npc ? "Pour l'instant, les PNJ ne répondent pas : la suite se joue en RP ou sur la fiche du jour." : 'Seuls les deux joueurs de cette conversation la voient.'}</p>
  </section>`;
};
const pmDiscoverHtml = as => { const list = Object.keys(PM_PROFILES).filter(id => playerOf(id) !== me && PM_PROFILES[id].visibleTo?.includes(me));
  return list.length ? list.map(id => pmProfileHtml(id, false)).join('') : '<p class="reserved">Aucun autre profil pour l\'instant.</p>'; };
const pmSettingsHtml = as => { const p = PM_PROFILES[as], mix = p.mix || { classique: 50, taquin: 30, direct: 20 }, tot = (mix.classique + mix.taquin + mix.direct) || 1;
  return `<section class="pm-set"><h2>Accroches de PNJ</h2>
    <p class="state-h">Fréquence</p><div class="place-list">${PM_FREQ.map(([k, l]) => `<button type="button" data-pm-freq="${k}" aria-pressed="${(p.freq || 'normal') === k}">${l}</button>`).join('')}</div>
    <p class="state-h">Ton des accroches</p>
    ${PM_TONES.map(([k, l]) => `<label class="pm-slider"><span class="pm-tone ${k}">${l}</span><input type="range" min="0" max="100" step="5" value="${mix[k]}" data-pm-mix="${k}"><output id="pmo-${k}">${Math.round(mix[k] / tot * 100)} %</output></label>`).join('')}
    <p class="reserved">Les PNJ qui écrivent suivent « Cherche » du profil. Aucune accroche entre 2 h et 10 h. Sur l'écran verrouillé, seulement « Pixel Meet · nouveau message ».</p>
  </section>`; };
const openPmEdit = id => { const p = PM_PROFILES[id] || {};
  s9sheet(`<div class="s9-row"><h2>${icon('pencil')}Profil Pixel Meet de ${esc(nameOf(id))}</h2><button type="button" class="link ico-btn" data-s9-close aria-label="Fermer">${icon('cross')}</button></div>
    <label class="s9-pick"><input type="file" accept="image/*" id="pm-file" hidden><span id="pm-prev">${p.photo ? `<img src="${p.photo}" alt="">` : icon('camera')}Photo du profil</span></label>
    ${PM_FIELDS.map(([k, l, n]) => `<label class="s9-field"><span>${l}</span><input type="text" data-pm-f="${k}" maxlength="${n}" value="${esc(String(p[k] ?? ''))}"></label>`).join('')}
    <label class="s9-field"><span>Bio</span><textarea data-pm-f="bio" maxlength="800">${esc(p.bio || '')}</textarea></label>
    ${partnerOf(id) ? `<p class="reserved">${esc(nameOf(partnerOf(id)))} ne voit pas ce profil ni ses messages.</p>` : ''}
    <button type="button" class="btn primary" data-pm-save="${id}">Enregistrer</button>`, 's9-pink'); };
let pmPhoto;
document.addEventListener('change', async e => {
  if (e.target.id === 'pm-file' && e.target.files[0]) { try { pmPhoto = await s9photo(e.target.files[0]); document.getElementById('pm-prev').innerHTML = `<img src="${pmPhoto}" alt="">Photo du profil`; } catch { pmPhoto = undefined; } }
});
document.addEventListener('input', e => {
  const k = e.target.dataset?.pmMix; if (!k) return; const as = pmAs(), p = PM_PROFILES[as]; if (!p) return;
  p.mix = { classique: 50, taquin: 30, direct: 20, ...(p.mix || {}), [k]: +e.target.value }; const tot = (p.mix.classique + p.mix.taquin + p.mix.direct) || 1;
  PM_TONES.forEach(([x]) => { const o = document.getElementById('pmo-' + x); if (o) o.textContent = Math.round(p.mix[x] / tot * 100) + ' %'; });
  clearTimeout(S9.mixT); S9.mixT = setTimeout(() => window.RP_SYNC?.s9PmProfile?.(as, { mix: p.mix }), 600);
});
document.addEventListener('click', e => {
  const t = e.target;
  const tab = t.closest('[data-pm-tab]'); if (tab) { pmView.tab = tab.dataset.pmTab; pmView.thread = null; return renderPm(); }
  const as = t.closest('[data-pm-as]'); if (as) { pmView.as = as.dataset.pmAs; pmView.thread = null; return renderPm(); }
  const th = t.closest('[data-pm-thread]'); if (th) { pmView.thread = th.dataset.pmThread; window.RP_SYNC?.s9PmOpen?.(pmView.thread); renderPm(); return window.scrollTo({ top: 0 }); }
  const ed = t.closest('[data-pm-edit]'); if (ed) { pmPhoto = undefined; return openPmEdit(ed.dataset.pmEdit); }
  const fr = t.closest('[data-pm-freq]'); if (fr) { const p = PM_PROFILES[pmAs()]; p.freq = fr.dataset.pmFreq; window.RP_SYNC?.s9PmProfile?.(pmAs(), { freq: p.freq }); return renderPm(); }
  const sv = t.closest('[data-pm-save]');
  if (sv) { const id = sv.dataset.pmSave, p = { ...(PM_PROFILES[id] || { freq: 'normal', mix: { classique: 50, taquin: 30, direct: 20 } }) };
    document.querySelectorAll('[data-pm-f]').forEach(i => { p[i.dataset.pmF] = i.value.trim(); });
    if (pmPhoto !== undefined) p.photo = pmPhoto; p.char = id; p.player = playerOf(id); p.visibleTo = pmVisibleTo(id);
    PM_PROFILES[id] = p; window.RP_SYNC?.s9PmProfile?.(id, p, true); pmView.as = id; pmView.tab = 'profile'; s9close(); return renderPm(); }
  const wr = t.closest('[data-pm-write]');
  if (wr) { const to = wr.dataset.pmWrite, from = pmAs(); if (!from) return;
    const ex = Object.entries(PM_THREADS).find(([, x]) => x && !x.npc && [x.a, x.b].includes(from) && [x.a, x.b].includes(to));
    if (ex) { pmView.thread = ex[0]; return renderPm(); }
    const id = s9uid(); PM_THREADS[id] = { a: from, b: to, players: [...new Set([playerOf(from), playerOf(to)])], last: '', at: Date.now(), lastBy: me, seen: { [me]: Date.now() } };
    PM_MSGS[id] = []; pmView.thread = id; renderPm(); return document.getElementById('pm-text')?.focus(); }
  const se = t.closest('[data-pm-send]');
  if (se) { const id = se.dataset.pmSend, th = PM_THREADS[id], txt = document.getElementById('pm-text')?.value.trim(), from = pmAs(); if (!th || !txt || !from) return;
    const m = { from, text: txt, at: Date.now() }; (PM_MSGS[id] ||= []).push(m);
    Object.assign(th, { last: txt.slice(0, 120), at: m.at, lastBy: me }); (th.seen ||= {})[me] = m.at;
    window.RP_SYNC?.s9PmSend?.(id, th, m);
    const other = th.a === from ? th.b : th.a;
    if (other) s9news(playerOf(other), 'Pixel Meet · nouveau message', 'pm:' + id + ':' + m.at, null);
    return renderPm(); }
  const dt = t.closest('[data-pm-date]');
  if (dt) { const th = PM_THREADS[dt.dataset.pmDate], as2 = pmAs(); if (!th?.npc || !canEdit(as2)) return;
    const l = 'Rendez-vous Pixel Meet avec ' + th.npc.name, s = state[as2]; if (!s.specials.includes(l)) s.specials.push(l); s.checked.add(l);
    window.RP_SYNC?.save(); dt.outerHTML = `<span class="reserved">✓ Noté sur la fiche de ${esc(nameOf(as2))} : « ${esc(l)} »</span>`; }
});
S9.applyPm = (profiles, threads) => {
  if (profiles) { Object.keys(PM_PROFILES).forEach(k => delete PM_PROFILES[k]); profiles.forEach(([id, p]) => { PM_PROFILES[id] = p; }); }
  if (threads) { Object.keys(PM_THREADS).forEach(k => delete PM_THREADS[k]); threads.forEach(([id, t]) => { PM_THREADS[id] = t; }); }
};
S9.applyPmMsgs = (id, list) => { PM_MSGS[id] = list; };
S9.pmUnreadCount = () => myChars().reduce((n, c) => n + pmThreadsOf(c.id).filter(([, t]) => pmUnread(t)).length, 0);
// Habillage : codes S9-01… des personnages, lignes d'écran et scintillement (case en bas de l'accueil, gardée sur l'appareil).
const S9_CODES = { echo: '01', prism: '02', joy: '03', tala: '04', aaron: '05', yololo: '06' };
S9.code = id => S9_CODES[id] || String(C.findIndex(c => c.id === id) + 1).padStart(2, '0');
const S9_FX = 's9-effets';
const s9fxOn = () => { try { return localStorage.getItem(S9_FX) !== 'off'; } catch { return true; } };
const s9fxApply = () => document.documentElement.classList.toggle('no-fx', !s9fxOn());
s9fxApply(); new MutationObserver(() => { if (!s9fxOn() !== document.documentElement.classList.contains('no-fx')) s9fxApply(); })
  .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
S9.fxToggleHtml = () => `<label class="check-inline fx-toggle"><input type="checkbox" id="s9-fx" ${s9fxOn() ? 'checked' : ''}> Lignes d'écran, scintillement et défilement</label>`;
document.addEventListener('change', e => { if (e.target.id !== 's9-fx') return; try { localStorage.setItem(S9_FX, e.target.checked ? 'on' : 'off'); } catch {} s9fxApply(); });
// Fiche d'un personnage : la page prend sa couleur (accent) ; accueil et applis gardent le violet S9.
const s9tint = () => { const c = C.find(x => x.id === current), st = document.documentElement.style;
  if (c) { st.setProperty('--accent', charTheme(c.id).gold); st.setProperty('--gold', charTheme(c.id).gold); } else { st.removeProperty('--accent'); st.removeProperty('--gold'); } };
new MutationObserver(s9tint).observe(document.getElementById('view'), { childList: true });
// Un seul groupe (Solution 9) : le filtre par groupe ne sert à rien.
if (GROUPS.length < 2) document.getElementById('nav-groups')?.style.setProperty('display', 'none');
S9.views = { we: () => renderWe(), pm: () => renderPm() };
S9.flashHtml = flashHtml;

// S9 : exemples de l'aperçu (fin)
// S9-MODULES-JS (fin)
function go(id) { resetSpacer(); lastPage = null; current = id; renderNav(); if (id !== 'home') fxOff(); id === 'home' ? renderHome() : S9.views[id] ? S9.views[id]() : id === 'events' ? renderEvents() : id === 'iloh' ? renderIloh() : id === 'liens' ? renderLinks() : id === 'search' ? renderSearch() : renderChar(id); window.scrollTo({ top:0 }); }
document.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-wrap-open]'); if (!b) return;
  const id = b.dataset.wrapOpen; Object.assign(state[id], { view: 'history', wrap: true });
  b.disabled = true;
  if (window.RP_SYNC) { await RP_SYNC.loadYear(wrapYear()); Object.keys(hotDuoCache).forEach(k => delete hotDuoCache[k]); }
  go(id);
});
document.addEventListener('click', e => { if (e.target.closest('#signout')) window.RP_SYNC?.signOut(); });
document.addEventListener('click', e => {
  const sm = e.target.closest('.news-day summary'); if (sm) { newsDayOpen = !sm.parentElement.open; return; }
  if (e.target.closest('#news-read')) { myNews().forEach(n => n.read = true); go(current); return; }
  const b = e.target.closest('.news [data-go]'); if (b) myNews().filter(n => n.charId === b.dataset.go).forEach(n => n.read = true);
});
document.getElementById('nav-players').innerHTML = [['all', 'Tous'], ...PLAYERS.filter(p => C.some(c => c.player === p.id)).map(p => [p.id, p.name])]
  .map(([k, n]) => `<button type="button" id="f-${k}" data-f="${k}" aria-pressed="${k === 'all'}">${n}</button>`).join('');
document.getElementById('nav-groups').innerHTML = [['all', 'Tous'], ...GROUPS.filter(g => C.some(c => c.groups.includes(g))).map(g => [g, g])]
  .map(([k, n]) => `<button type="button" id="g-${k === 'all' ? 'all' : k.normalize('NFD').replace(/[^a-z]/gi, '').toLowerCase()}" data-g="${k}" aria-pressed="${k === 'all'}">${n}</button>`).join('');
document.querySelectorAll('.nav-filter button').forEach(b => b.addEventListener('click', () => {
  const row = b.dataset.f ? '[data-f]' : '[data-g]';
  if (b.dataset.f) filter = b.dataset.f; else groupFilter = b.dataset.g;
  document.querySelectorAll('.nav-filter button' + row).forEach(x => x.setAttribute('aria-pressed', x === b));
  if (!['home', 'events', 'liens', 'search', 'we', 'pm'].includes(current) && !C.some(c => c.id === current && shown(c))) current = 'home';
  go(current);
}));
initPlaces();

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
  typingDirty = false; renderNav(); current === 'home' ? renderHome() : S9.views[current] ? (document.getElementById('s9-sheet') ? null : S9.views[current]()) : current === 'events' ? renderEvents() : current === 'iloh' ? renderIloh() : current === 'liens' ? renderLinks() : current === 'search' ? null : renderChar(current);
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

// ---------- Discord : un embed par journée validée, avec l'image du récap ----------
// L'adresse du webhook n'est pas dans le code public : elle est rangée dans Firestore (shared/discord),
// lisible par les joueurs et réglée par l'admin. Un seul salon commun pour tout le groupe.
// Un message par personnage et par jour ; revalider le même jour met à jour le message existant.
const APP_URL = 'https://nonomisu.github.io/s9-interact/';
const TEXT_GLYPH = {};   // glyphes dessinés (SVG) : équivalent texte pour Discord
const glyphText = t => TEXT_GLYPH[Object.keys(THEMES).find(k => THEMES[k] === t)] || (String(t.glyph).startsWith('<') ? '◆' : t.glyph);
const discordState = {};   // id → 'sending' | 'sent' | 'error'
const SLOT_ORDER = ['aube', 'matin', 'midi', 'aprem', 'soir', 'nuit'];
const clip = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;

// Embed : le nom du personnage et la date en titre (lien vers la fiche), puis l'image du récap.
// Bande de couleur : celle du joueur (config PLAYERS).
const PLAYER_COLOR = Object.fromEntries(PLAYERS.map(p => [p.id, parseInt(p.color.slice(1), 16)]));
const embedFor = id => {
  const c = C.find(x => x.id === id), t = THEMES[c.theme];
  return {
    title: `${glyphText(t)} ${c.name}${c.surname ? ' ' + c.surname : ''} — ${today}`,
    url: `${APP_URL}?fiche=${id}&jour=${isoDay(rpDay)}`,
    color: PLAYER_COLOR[c.player],
    image: { url: 'attachment://recap.png' },
  };
};
// Libellé d'activité avec ses précisions (chasse, contrat, visite…), comme dans le résumé.
const dispLabelOf = (id, l) => {
  const s = state[id];
  if (l === CONTRACT_ACT && activeContract(id)) return l + contractText(activeContract(id));
  if (s.details?.[l] && (DETAIL_ACTS[l] || RANDOM_ACTS[l])) return `${l} : ${s.details[l]}`;
  const h = huntFor(id, l); if (h) return `${l} (${huntText(h)})`;
  return l;
};

const recapBlob = async (pixelRatio = 2) => {
  const card = document.querySelector('#view .recap'); if (!card) throw new Error('récap introuvable');
  const h2i = await loadH2I(); await document.fonts.ready;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#111';
  card.classList.add('capturing');
  try { return await h2i.toBlob(card, { pixelRatio, backgroundColor: bg, cacheBust: true }); }
  finally { card.classList.remove('capturing'); }
};

// Salon commun : shared/discord → webhook.
const hookFor = () => window.RP_DISCORD.webhook || null;
const anyHook = () => !!window.RP_DISCORD.webhook;
// Envoi (ou mise à jour, si le message existe déjà) du récap d'un personnage sur le salon commun.
const postRecap = async (c, blob, prev) => {
  const hook = hookFor();
  const payload = { username: `${c.name} · S9 Interact'`, avatar_url: APP_URL + 'icon-512.png', embeds: [embedFor(c.id)],
    attachments: [{ id: 0, filename: 'recap.png' }] };
  const form = () => { const f = new FormData(); f.append('payload_json', JSON.stringify(payload)); f.append('files[0]', blob, 'recap.png'); return f; };
  let res = prev ? await fetch(`${hook}/messages/${prev}`, { method: 'PATCH', body: form() }) : null;
  if (!res || !res.ok) res = await fetch(`${hook}?wait=true`, { method: 'POST', body: form() });
  if (!res.ok) throw new Error('Discord ' + res.status);
  return (await res.json().catch(() => null))?.id || null;
};
const sendDiscord = async id => {
  if (window.RP_TEST_COPY) return;   // copie de test : rien n'est envoyé
  const hook = hookFor(C.find(x => x.id === id)?.player);
  if (!hook || !owns(id) || !state[id].done) return;
  discordState[id] = 'sending'; if (current === id) rerender();
  try {
    // Image pour le salon commun : vue publique, sans nuit chaude (même chez les joueurs du couple).
    publicView = true; if (current === id) rerender();
    await new Promise(r => setTimeout(r, 300));          // laisse le récap s'afficher
    const c = C.find(x => x.id === id);
    const blob = await recapBlob().finally(() => { publicView = false; });
    const msgId = await postRecap(c, blob, state[id].discordMsg);
    if (msgId) state[id].discordMsg = msgId;
    discordState[id] = 'sent';
    window.RP_SYNC?.save();
  } catch (e) { console.error(e); discordState[id] = 'error'; }
  if (current === id) rerender();
};

window.RP_DISCORD = {
  webhook: null,
  send: id => sendDiscord(id),
  status: id => !hookFor(C.find(x => x.id === id)?.player) ? '' : ({
    sending: ' · Envoi sur Discord…',
    sent: ' · Envoyé sur Discord',
    error: ' · Échec de l\'envoi sur Discord <button type="button" class="link" data-discord-retry="' + id + '">Réessayer</button>',
  })[discordState[id]] || (state[id].discordMsg ? ' · Envoyé sur Discord' : ''),
  // Réglage (admin uniquement) : le webhook du salon commun.
  settingsHtml: () => `<details class="discord-set"><summary>${icon('bell')}Discord ${anyHook() ? '· relié ✓' : '· à relier'}</summary>
    <p class="reserved">Adresse du webhook du salon commun (Paramètres du salon → Intégrations → Webhooks → Copier l'URL du webhook).</p>
    <label class="hook-row"><span>Salon des fiches${anyHook() ? ' ✓' : ''}</span>
    <div class="special-row"><input type="url" id="discord-hook-commun" placeholder="https://discord.com/api/webhooks/…" value="${anyHook() ? '••••••••' : ''}">
    <button type="button" class="btn" data-discord-save="commun">Enregistrer</button></div></label>
    <p class="reserved" id="discord-msg"></p></details>`,
};
document.addEventListener('click', async e => {
  const r = e.target.closest('[data-discord-retry]'); if (r) return sendDiscord(r.dataset.discordRetry);
  const sv = e.target.closest('[data-discord-save]'); if (!sv) return;
  const pl = sv.dataset.discordSave, v = document.getElementById('discord-hook-' + pl).value.trim(), msg = document.getElementById('discord-msg');
  if (!/^https:\/\/(canary\.|ptb\.)?discord(app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(v)) { msg.textContent = 'Cette adresse ne ressemble pas à un webhook Discord.'; return; }
  try {
    const t = await fetch(v); if (!t.ok) throw new Error();
    await window.RP_SYNC.setWebhook(v); window.RP_DISCORD.webhook = v;
    msg.textContent = 'Webhook enregistré : les prochaines fiches partiront sur ce salon.';
  } catch { msg.textContent = 'Discord ne reconnaît pas ce webhook. Vérifie l\'adresse copiée.'; }
});

// Lien direct depuis Discord : ?fiche=tamachag&jour=AAAA-MM-JJ
const openFromLink = () => {
  try {
    const q = new URLSearchParams(location.search), id = q.get('fiche'), jour = q.get('jour');
    // Notification d'un événement : ?evenements=AAAA-MM-JJ ouvre le calendrier des événements sur ce jour.
    if (q.has('evenements')) { openEventsOn(q.get('evenements')); history.replaceState(null, '', location.pathname + location.hash); return true; }
    if (!id || !C.some(c => c.id === id)) return false;
    if (jour && jour !== isoDay(rpDay)) {
      const [y, m, d] = jour.split('-').map(Number);
      Object.assign(state[id], { view: 'history', cal: { y, m: m - 1 }, calSel: new Date(y, m - 1, d) });
    }
    history.replaceState(null, '', location.pathname + location.hash);
    go(id); return true;
  } catch { return false; }
};

// ---------- Wraps de l'année : envoyés une seule fois, à la première ouverture de l'appli à partir du 26 décembre ----------
// Chaque wrap est affiché comme dans l'onglet Historique, converti en image et posté sur le webhook du salon.
// Un verrou dans Firestore (shared/wraps-AAAA) empêche plusieurs appareils de les envoyer en double ;
// s'il est interrompu (appli fermée), le prochain lancement reprend où il s'était arrêté, 10 minutes plus tard.
// Test : avec l'aperçu secret (#apercu-wrap), l'admin peut les envoyer sur un autre salon, sans toucher au verrou.
const wrapDayReal = () => (rpDay.getMonth() === 11 && rpDay.getDate() >= 26) || (rpDay.getMonth() === 0 && rpDay.getDate() <= 9);
const pause = ms => new Promise(r => setTimeout(r, ms));
const secretPreview = () => { try { return location.hash === '#apercu-wrap'; } catch { return false; } };
const HOOK_RE = /^https:\/\/(canary\.|ptb\.)?discord(app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/;

// Écran affiché pendant l'envoi (les fiches défilent derrière pour être photographiées).
const wrapOverlay = txt => {
  let o = document.getElementById('wrap-sending');
  if (txt == null) { o?.remove(); return; }
  if (!o) {
    o = document.createElement('div'); o.id = 'wrap-sending';
    o.style.cssText = 'position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:2rem;text-align:center;background:#14161c;color:#d4af6a;font:500 1.05rem/1.5 Georgia,serif';
    document.body.appendChild(o);
  }
  o.textContent = txt;
};
const wrapBlob = async ratio => {
  const card = document.querySelector('#view article.wrap'); if (!card) throw new Error('wrap introuvable');
  const h2i = await loadH2I(); await document.fonts.ready;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#111';
  return h2i.toBlob(card, { pixelRatio: ratio, backgroundColor: bg, cacheBust: true });
};
// Envoi d'un message avec image ; respecte la limite de débit de Discord (code 429).
const postHook = async (hook, payload, blob, name) => {
  for (let i = 0; i < 5; i++) {
    const f = new FormData(); f.append('payload_json', JSON.stringify(payload)); f.append('files[0]', blob, name);
    const res = await fetch(`${hook}?wait=true`, { method: 'POST', body: f });
    if (res.status === 429) { const j = await res.json().catch(() => ({})); await pause((j.retry_after || 2) * 1000 + 300); continue; }
    if (!res.ok) throw new Error('Discord ' + res.status);
    return (await res.json().catch(() => null))?.id || 'ok';
  }
  throw new Error('Discord : trop de requêtes');
};

const sendWraps = async ({ hook, sent = {}, test = false }) => {
  const y = wrapYear(), back = { current, sim: simulateWrapDay, st: {} };
  const label = test ? 'Test des wraps' : `Les wraps ${y} partent sur Discord`;
  wrapOverlay(label + '…');
  try {
    if (window.RP_SYNC) await RP_SYNC.loadYear(y);
    publicView = true;                                          // wraps du salon commun : sans nuit chaude
    Object.keys(hotDuoCache).forEach(k => delete hotDuoCache[k]);
    const days = Array.from({ length: 366 }, (_, i) => new Date(y, 0, 1 + i)).filter(d => d.getFullYear() === y);
    const list = C.filter(c => statsFor(c, days).filled > 0);   // seulement les personnages qui ont vécu cette année
    simulateWrapDay = true;                                     // le test peut avoir lieu avant le 26 décembre
    let n = 0;
    for (const c of list) {
      n++;
      if (sent[c.id]) continue;
      wrapOverlay(`${label}… ${n} / ${list.length}`);
      back.st[c.id] = { view: state[c.id].view, wrap: state[c.id].wrap };
      Object.assign(state[c.id], { view: 'history', wrap: true });
      go(c.id); await pause(600);
      let blob = await wrapBlob(2);
      if (blob.size > 9.5e6) blob = await wrapBlob(1.2);          // limite de Discord : 10 Mo par fichier
      const payload = { username: `${c.name} · S9 Interact'`, avatar_url: APP_URL + 'icon-512.png',
        embeds: [{ title: `${test ? '[Test] ' : ''}${glyphText(THEMES[c.theme])} ${c.name}${c.surname ? ' ' + c.surname : ''} — L'année ${y}`,
          url: `${APP_URL}?fiche=${c.id}`, color: PLAYER_COLOR[c.player], image: { url: 'attachment://wrap.png' } }],
        attachments: [{ id: 0, filename: 'wrap.png' }] };
      const msg = await postHook(test ? hook : hookFor(c.player), payload, blob, 'wrap.png');
      if (!test) await RP_SYNC.wrapSent(y, c.id, msg);
      await pause(1200);
    }
    return list.length;
  } finally {
    publicView = false; Object.keys(hotDuoCache).forEach(k => delete hotDuoCache[k]);
    simulateWrapDay = back.sim;
    Object.entries(back.st).forEach(([id, v]) => Object.assign(state[id], v));
    go(back.current); wrapOverlay(null);
  }
};

let wrapsRunning = false;
const autoWraps = async () => {
  if (window.RP_TEST_COPY) return;
  if (wrapsRunning || !anyHook() || !wrapDayReal() || !window.RP_SYNC?.wrapClaim) return;
  wrapsRunning = true;
  try {
    const y = wrapYear(), sent = await RP_SYNC.wrapClaim(y);
    if (!sent) return;                       // déjà envoyés, ou envoi en cours sur l'autre appareil
    await sendWraps({ sent });
    await RP_SYNC.wrapDone(y);
  } catch (e) { console.error('Wraps :', e); }
  finally { wrapsRunning = false; }
};
window.RP_DISCORD.autoWraps = autoWraps;

// ---------- Fiches recopiées de Journée RP ----------
// Validées dans Journée RP, elles n'ont pas de bouton « J'ai terminé » ici. Au lancement d'Iloh (et quand la recopie
// apporte une fiche nouvelle ou modifiée), l'appli affiche « Mise à jour des fiches » et envoie TOUTES les fiches
// recopiées du jour en un seul message Discord (une seule notification), en vue publique (sans nuit chaude).
// Un seul message par journée : une fiche nouvelle → nouveau message (et l'ancien est supprimé) ; une fiche seulement
// modifiée → le message est mis à jour sans nouvelle notification. Verrou et suivi : shared/recaps-AAAA-MM-JJ.
let mirrorBusy = false;
const mirrorDone = {};   // id → signature déjà envoyée (ou vérifiée) pour cette fiche
const updateScreen = (names, i) => {
  let o = document.getElementById('mirror-update');
  if (names == null) { o?.remove(); return; }
  if (!o) {
    o = document.createElement('div'); o.id = 'mirror-update'; o.setAttribute('role', 'status');
    o.style.cssText = 'position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:2rem;text-align:center;background:radial-gradient(ellipse at 50% 20%,#1c2a42,#0b111c 70%);color:#ece3d6;font:400 1rem/1.5 "Spectral",Georgia,serif';
    document.body.appendChild(o);
  }
  o.innerHTML = `<div style="display:grid;gap:.9rem;justify-items:center;max-width:22rem">
    <img src="logo.png" alt="" width="96" height="96" style="width:6rem;height:6rem">
    <p style="margin:0;font:700 1.5rem/1.2 'Alegreya SC',Georgia,serif;letter-spacing:.05em">Mise à jour des fiches</p>
    <p style="margin:0;color:#a2988c;font-style:italic">${i < names.length ? `Fiche ${deName(esc(names[i]))} (${i + 1} / ${names.length})…` : 'Envoi sur Discord…'}</p></div>`;
};
// Fiches recopiées de Journée RP (et leurs compléments Iloh) : un message par fiche, envoyé une seule fois ;
// une fiche modifiée remplace l'image de SON message (les autres ne bougent pas).
const updateMirrors = async () => {
  if (window.RP_TEST_COPY) return;
  if (mirrorBusy || !hookFor() || !window.RP_SYNC || isTyping(document.activeElement) || document.getElementById('wrap-sending')) return;
  const todo = C.filter(x => x.mirror && state[x.id].done).map(c => ({ c, sig: RP_SYNC.entrySig(c.id) })).filter(x => mirrorDone[x.c.id] !== x.sig);
  if (!todo.length) return;
  mirrorBusy = true;
  const back = { current, views: Object.fromEntries(todo.map(x => [x.c.id, state[x.c.id].view])) };
  let batch = null, shown = false;
  try {
    // Chaque fiche est réservée avant envoi : deux appareils ne l'envoient jamais en double.
    const claimed = [];
    for (const x of todo) {
      const claim = await RP_SYNC.recapClaim(x.c.id, x.sig).catch(e => { console.error(e); return null; });
      if (claim === 'done') mirrorDone[x.c.id] = x.sig;
      else if (claim) { claimed.push({ ...x, prev: claim.msg }); batch ||= claim.batch; }
    }
    const names = claimed.map(x => x.c.name);
    publicView = true;
    for (let i = 0; i < claimed.length; i++) {
      const { c, sig, prev } = claimed[i];
      try {
        updateScreen(names, i); shown = true;
        state[c.id].view = 'day'; go(c.id); await pause(350);
        const msg = await postRecap(c, await recapBlob(2), prev);
        await RP_SYNC.recapSent(c.id, sig, msg); mirrorDone[c.id] = sig;
      } catch (e) { console.error(e); await RP_SYNC.recapFailed(c.id).catch(() => {}); }
    }
    // Ancien message groupé (version précédente de l'appli) : remplacé par les messages fiche par fiche.
    if (batch && claimed.length && claimed.every(x => mirrorDone[x.c.id] === x.sig)) {
      await fetch(`${hookFor()}/messages/${batch}`, { method: 'DELETE' }).catch(() => {});
      await RP_SYNC.recapBatchGone().catch(() => {});
    }
  } finally {
    publicView = false;
    Object.entries(back.views).forEach(([id, v]) => { state[id].view = v; });
    if (shown || document.getElementById('mirror-update')) { go(back.current); updateScreen(null); }
    mirrorBusy = false;
  }
};
let mirrorTimer = null;
window.RP_DISCORD.updateMirrors = updateMirrors;
window.RP_DISCORD.sendMirrors = () => { clearTimeout(mirrorTimer); mirrorTimer = setTimeout(updateMirrors, 1500); };
setInterval(() => window.RP_DISCORD.sendMirrors(), 120e3);   // reprise si un envoi a été remis (saisie en cours, échec)

// ---------- Notifications push (iPhone/iPad : appli ouverte depuis l'écran d'accueil, iOS 16.4 ou plus) ----------
// L'abonnement de l'appareil est rangé dans Firestore (pushSubs/{joueur}/subs) par sync.js. Le service du VPS
// envoie une notification pour chaque nouvelle destinée à ce joueur, et une de bienvenue à l'activation.
const pushView = { st: null, busy: false, msg: '' };
const refreshPush = async () => {
  try { pushView.st = window.RP_SYNC?.pushState ? await RP_SYNC.pushState() : 'unsupported'; } catch { pushView.st = 'unsupported'; }
  if (current === 'home') go('home');
};
window.RP_PUSH = {
  refresh: refreshPush,
  html: () => {
    const st = pushView.st; if (!st) return '';
    const body = {
      unsupported: `<p class="reserved">Notifications : sur iPhone ou iPad, ouvre S9 Interact' depuis son icône sur l'écran d'accueil (iOS 16.4 ou plus) pour pouvoir les activer.</p>`,
      denied: `<p class="reserved">Notifications refusées sur cet appareil. Pour les réactiver : Réglages › Notifications › S9 Interact'.</p>`,
      off: `<button type="button" class="btn" id="push-on" ${pushView.busy ? 'disabled' : ''}>${icon('bell')}${pushView.busy ? 'Activation…' : 'Activer les notifications sur cet appareil'}</button>`,
      on: `<p class="reserved">${icon('bell')} Notifications activées sur cet appareil ✓ <button type="button" class="link ico-btn" id="push-off" title="Désactiver" aria-label="Désactiver les notifications">${icon('minus')}</button></p>`,
    }[st];
    return `<div class="push-set" style="margin-top:1rem">${body}${pushView.msg ? `<p class="reserved">${esc(pushView.msg)}</p>` : ''}</div>`;
  },
};
document.addEventListener('click', async e => {
  const on = e.target.closest('#push-on'), off = e.target.closest('#push-off'); if (!on && !off) return;
  pushView.busy = true; pushView.msg = '';
  try {
    // iOS n'accepte la demande d'autorisation que pendant le geste : on l'appelle tout de suite, sans rien afficher avant.
    if (on) { await RP_SYNC.enablePush(); pushView.msg = 'C\'est fait : une notification de bienvenue va arriver d\'ici quelques secondes.'; }
    else await RP_SYNC.disablePush();
  } catch (err) { console.error(err); pushView.msg = 'Impossible d\'activer les notifications : ' + (err.message || err); }
  pushView.busy = false; refreshPush();
});

// ---------- Administration (admin seulement) : invitations des joueurs ----------
// Inviter = créer access/{adresse} = { player, role: 'joueur' } ; retirer l'accès = supprimer ce document.
// Les personnages restent décrits dans la configuration (en tête de l'appli) ; leurs fiches sont créées à la connexion de l'admin.
const adminView = { open: false, list: null, msg: '', confirm: null };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
window.RP_ADMIN_UI = {
  html: () => !isAdminMe() || !window.RP_SYNC ? '' : `<details class="admin-set"${adminView.open ? ' open' : ''}><summary>${icon('gear')}Administration · joueurs</summary>
    <p class="reserved">Saisis l'adresse Google d'un joueur pour l'inviter, puis envoie-lui le lien de l'appli. Retirer l'accès l'empêche de se connecter ; ses fiches restent.</p>
    ${adminView.list === null ? '<p class="reserved">Chargement…</p>' : PLAYERS.map(p => {
      const mails = adminView.list.filter(a => a.player === p.id), n = C.filter(c => c.player === p.id).length;
      return `<div class="admin-row"><span class="admin-name"><i style="background:${p.color}"></i>${esc(p.name)} <small>${n} personnage${n > 1 ? 's' : ''}</small></span>
        ${mails.map(a => `<span class="admin-mail">${esc(a.email)}${a.role === 'admin' ? ' <small>(admin)</small>'
          : adminView.confirm === a.email ? ` <button type="button" class="link small danger" data-revoke-ok="${esc(a.email)}">Confirmer le retrait</button> <button type="button" class="link small" data-revoke-cancel>Annuler</button>`
          : ` <button type="button" class="link small ico-btn" data-revoke="${esc(a.email)}" title="Retirer l'accès" aria-label="Retirer l'accès de ${esc(p.name)}">${icon('trash')}</button>`}</span>`).join('')}
        ${mails.length ? '' : `<div class="special-row"><input type="email" id="invite-${p.id}" placeholder="Adresse Google de ${esc(p.name)}" autocomplete="off" autocapitalize="off" enterkeyhint="done">
          <button type="button" class="btn" data-invite="${p.id}">Inviter</button></div>`}</div>`;
    }).join('')}
    <p class="reserved" id="admin-msg" aria-live="polite">${esc(adminView.msg)}</p></details>`,
  refresh: async () => {
    try { adminView.list = await window.RP_SYNC.listAccess(); }
    catch (e) { console.error(e); adminView.list = []; adminView.msg = 'Lecture des accès impossible : ' + (e.message || e); }
    if (current === 'home') rerender();
  },
};
const adminSay = t => { adminView.msg = t; adminView.open = true; if (current === 'home') rerender(); };
document.addEventListener('toggle', e => { if (e.target.classList?.contains('admin-set')) adminView.open = e.target.open; }, true);
document.addEventListener('click', async e => {
  const inv = e.target.closest('[data-invite]'), rv = e.target.closest('[data-revoke]'), ok = e.target.closest('[data-revoke-ok]');
  if (e.target.closest('[data-revoke-cancel]')) { adminView.confirm = null; adminSay(''); return; }
  if (rv) { adminView.confirm = rv.dataset.revoke; adminSay(''); return; }
  if (ok) {
    const email = ok.dataset.revokeOk; adminView.confirm = null;
    try { await window.RP_SYNC.revoke(email); adminSay(`Accès retiré pour ${email}.`); window.RP_ADMIN_UI.refresh(); }
    catch (err) { console.error(err); adminSay('Retrait impossible : ' + (err.message || err)); }
    return;
  }
  if (!inv) return;
  const p = PLAYERS.find(x => x.id === inv.dataset.invite), field = document.getElementById('invite-' + p.id);
  const email = (field?.value || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return adminSay('Cette adresse ne ressemble pas à une adresse e-mail.');
  if (adminView.list?.some(a => a.email === email)) return adminSay('Cette adresse a déjà un accès.');
  try {
    await window.RP_SYNC.invite(email, p);
    adminSay(`Accès ouvert pour ${p.name} : envoie-lui le lien ${APP_URL}, à ouvrir avec ${email}.`);
    window.RP_ADMIN_UI.refresh();
  } catch (err) { console.error(err); adminSay('Invitation impossible : ' + (err.message || err)); }
});
document.addEventListener('keydown', e => { const f = e.target.closest?.('.admin-set input[type="email"]'); if (f && e.key === 'Enter') { e.preventDefault(); f.nextElementSibling?.click(); } });

// Copie de test (test/) : bandeau permanent ; l'admin y choisit le joueur dont il veut voir l'appli.
const testBanner = () => {
  if (!window.RP_TEST_COPY || !me || document.getElementById('view-as')) return;
  const b = document.createElement('div'); b.id = 'view-as'; b.setAttribute('role', 'status');
  b.innerHTML = `${icon('eye')}<span><b>Copie de test</b> : rien n'est enregistré ni envoyé.${window.RP_VIEW_AS ? ` Vue de <b>${esc(PLAYER_NAME[me])}</b>.` : ''}</span>
    ${window.RP_TEST_ADMIN ? `<span class="view-as-pick">Voir comme : ${PLAYERS.map(p => `<a href="?voir=${p.id}" ${p.id === me ? 'aria-current="true"' : ''}>${esc(p.name)}</a>`).join(' ')}</span>` : ''}`;
  document.body.prepend(b);
};
const testTimer = setInterval(() => { if (window.RP_TEST_COPY && me) { testBanner(); clearInterval(testTimer); } }, 300);
setTimeout(() => clearInterval(testTimer), 60000);
