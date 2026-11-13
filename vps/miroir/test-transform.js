// Tests des règles de recopie (sans Firebase) : node test-transform.js
'use strict';
const T = require('./transform');
let fails = 0;
const ok = (c, l) => { console.log((c ? '  ok  ' : '  ÉCHEC ') + l); if (!c) fails++; };

const e = {
  mood: 'Survolté', done: true, checked: { $set: ['Prépare le set à la maison', 'Sexe avec Prism', 'Plaisir en solo sur Moonstone', 'Publication Moonstone', 'Commande de malbouffe'] },
  slots: { 'Prépare le set à la maison': ['aprem'], 'Sexe avec Prism': ['nuit'] }, details: { 'Sexe avec Prism': 'x', 'Commande de malbouffe': 'Pizza' },
  intime: 'secret', intimeWith: { $set: ['prism'] }, night: { hot: true, with: 'prism' }, discordMsg: '123', set: true, setLate: true, lateAt: '3h',
  door: 'occupee', wait: true, msType: 'video', msOpen: true, loverMsg: 'x', film: true,
  nightNotes: { 'Nuit chaude': 'détail', 'Cauchemar': 'sirènes' }, rp: 'eoor', calmWith: 'prism',
};
const p = T.publicEntry(e);
ok(p.mood === 'Survolté' && p.done === true, 'humeur et validation gardées');
ok(!('intime' in p) && !('intimeWith' in p) && !('night' in p), 'vie intime et nuit chaude retirées de la fiche');
ok(!['discordMsg', 'set', 'setLate', 'lateAt', 'door', 'wait', 'msType', 'msOpen', 'loverMsg', 'film'].some(k => k in p), 'sets, retour tardif, livreur, Moonstone : restent dans Journée RP');
ok(JSON.stringify(p.checked.$set) === '["Prépare le set à la maison","Commande de malbouffe"]', 'activités intimes et Moonstone retirées');
ok(!('Sexe avec Prism' in p.slots) && !('Sexe avec Prism' in p.details) && p.details['Commande de malbouffe'] === 'Pizza', 'périodes et précisions filtrées');
ok(!('Nuit chaude' in p.nightNotes) && p.nightNotes.Cauchemar === 'sirènes', 'précision de nuit chaude retirée');
ok(p.rp === 'Eoor' && p.calmWith === 'prism', 'personnage hors S9 : un nom ; Prism : identifiant');
ok(e.intime === 'secret', 'la journée d\'origine n\'est pas modifiée');
const h = T.publicEntry({ checked: { $set: ['Studio', 'Salle'] }, hideS9: { $set: ['Salle'] }, hideIloh: { $set: ['Studio'] } }, { $set: ['Rien'] });
ok(JSON.stringify(h.checked.$set) === '["Studio"]' && !('hideS9' in h) && !('hideIloh' in h), 'masquées pour S9 (hideS9) retirées ; le réglage d\'Iloh ne joue pas ici');
const w = T.publicEntry({ checked: { $set: ['Verre avec les copains', 'Sexe avec Prism'] }, withActs: { 'Verre avec les copains': ['joy', 'eoor', 'tala'], 'Sexe avec Prism': ['prism'] } });
ok(JSON.stringify(w.withActs) === '{"Verre avec les copains":["joy","tala"]}', 'activités communes : personnages de S9 seulement, rien d\'intime');
ok(JSON.stringify(T.hotNight({ hot: true, with: 'prism' })) === '{"hot":true,"with":"prism"}' && T.hotNight({ hot: false }) === null, 'nuit chaude du couple');
ok(T.coupleOf('echo').id === 'echo-prism' && T.coupleOf('joy') === null, 'couple Echo et Prism');
ok(JSON.stringify(T.lovers(['Un DJ', 'joy', 'echo'], 'prism')) === '["Un DJ"]', 'amants : PNJ seulement');
ok(T.todayDoc({ activities: ['Studio', 'Publication Moonstone', 'Sexe avec Prism'] }).activities.join() === 'Studio', 'encart public filtré');
ok(T.MIRROR.join() === 'echo,prism' && T.ILOH_ONLY.sort().join() === 'aaron,joy,tala,yololo', 'Echo et Prism recopiés ; Joy, Tala, Aaron, Yololo propres à S9');
const n = T.withNews('echo', new Date(2026, 10, 11), T.publicEntry({ done: true, checked: { $set: ['Verre avec les copains'] }, withActs: { 'Verre avec les copains': ['joy', 'aaron'] } }));
ok(Object.values(n).map(x => x.to).sort().join() === 'eden,jynette' && Object.values(n).every(x => x.text.startsWith('Echo a noté')), 'nouvelles pour Eden (Joy) et Jynette (Aaron)');
ok(Object.keys(T.withNews('prism', new Date(2026, 10, 11), T.publicEntry({ done: true, checked: { $set: ['Shopping'] }, withActs: { 'Shopping': ['aaron'] } }))).length === 0, 'pas de nouvelle vers la même joueuse (Prism → Aaron, Jynette)');
const b = T.s9BackMonth({ '11': { added: ['Soirée au club', 'Sexe avec Prism'], withActs: { 'Soirée au club': ['joy', 'prism'] } } });
ok(JSON.stringify(b) === '{"11":{"added":["Soirée au club"],"with":{"Soirée au club":["Joy","prism"]}}}', 'retour vers Journée RP : activités communes, sans rien d\'intime');
T.setPrivate({ $set: ['Instant coquin'] });
ok(T.isPrivateAct('Instant coquin') && T.isPrivateAct('Livreur pressé') && !T.isPrivateAct('Studio'), 'activités marquées intimes dans Journée RP');
T.setPrivate(null);
{ const pub = T.publicEntry({ done: true, checked: { $set: ['Cuisine', 'Pêche'] }, withActs: { Cuisine: [T.ILOH_ONLY[0], T.MIRROR[0]], Pêche: [T.ILOH_ONLY[0]] }, withFrom: { Cuisine: T.MIRROR[0], 'Instant coquin': 'x' } });
  ok(JSON.stringify(pub.withFrom) === JSON.stringify({ Cuisine: T.MIRROR[0] }), 'reprises : seulement pour les activités communes gardées');
  const n = T.withNews(T.MIRROR[1], new Date(2026, 10, 13), pub);
  ok(!Object.keys(n).some(k => k.endsWith(':Cuisine')), 'une reprise ne refait pas de proposition (pas de nouvelle)'); }
console.log(fails ? `${fails} échec(s)` : 'Tout est bon.');
process.exitCode = fails ? 1 : 0;
