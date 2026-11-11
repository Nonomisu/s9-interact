// S9 Interact' — service des notifications push, à lancer sur le VPS avec pm2.
//
// Il surveille la base S9 Interact' (projet s9-interact) :
//   - chaque nouvelle (collection news) destinée à un joueur part en notification sur tous ses appareils abonnés ;
//   - chaque appareil qui vient d'activer les notifications (pushSubs/{joueur}/subs) reçoit une notification de bienvenue.
//
// Clés (jamais dans le dépôt) : DST_KEY = clé de service Firebase de s9-interact,
// VAPID_KEY = fichier JSON { publicKey, privateKey } créé une fois avec « npx web-push generate-vapid-keys --json ».
// Le service ne touche qu'à S9 Interact', jamais à Journée RP.
'use strict';
process.env.TZ = 'Europe/Paris';
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');
const webpush = require('web-push');

const need = k => { const v = process.env[k]; if (!v) { console.error(`Variable ${k} manquante.`); process.exit(1); } return v; };
const key = require(need('DST_KEY')), vapid = require(need('VAPID_KEY'));
if (key.project_id !== 's9-interact') { console.error(`Clé inattendue (${key.project_id}) : arrêt.`); process.exit(1); }
webpush.setVapidDetails('https://nonomisu.github.io/s9-interact/', vapid.publicKey, vapid.privateKey);
const db = admin.initializeApp({ credential: admin.credential.cert(key) }, 's9-notifs').firestore();

const log = (...a) => console.log(new Date().toLocaleString('fr-FR'), ...a);
const WAIT = +(process.env.WAIT_MS || 30000);   // délai avant envoi : l'auteur peut encore corriger ou annuler sa nouvelle
const OLD = 24 * 3600e3;                         // au démarrage, les nouvelles de plus d'un jour ne sont pas envoyées
const APP = 'https://nonomisu.github.io/s9-interact/';

// Envoie une notification à tous les appareils d'un joueur ; supprime les abonnements expirés.
async function sendTo(player, payload, only) {
  const subs = only ? [only] : (await db.collection(`pushSubs/${player}/subs`).get()).docs;
  let sent = 0;
  for (const s of subs) {
    const d = s.data();
    try { await webpush.sendNotification({ endpoint: d.endpoint, keys: d.keys }, JSON.stringify(payload), { TTL: 24 * 3600 }); sent++; }
    catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) { await s.ref.delete(); log(`abonnement expiré supprimé (${player})`); }
      else log(`échec d'envoi à ${player} :`, e.statusCode || '', e.body || e.message);
    }
  }
  return sent;
}

// ---------- Nouvelles ----------
const timers = new Map();
async function pushNews(id) {
  timers.delete(id);
  const ref = db.doc(`news/${id}`);
  // Transaction : marque la nouvelle « envoyée » une seule fois (l'auteur ne peut plus la réécrire ensuite).
  const n = await db.runTransaction(async tx => {
    const s = await tx.get(ref); const d = s.exists ? s.data() : null;
    if (!d || d.pushedAt || d.read || !d.to || !d.text) return null;
    tx.update(ref, { pushedAt: FieldValue.serverTimestamp() });
    return d;
  });
  if (!n) return;
  // Événement à Solution 9 : la notification ouvre le calendrier sur le jour de l'événement.
  let url = n.charId ? `${APP}?fiche=${encodeURIComponent(n.charId)}` : APP;
  if (String(n.key || '').startsWith('event:')) {
    const ev = (await db.doc('shared/events').get()).data()?.[n.key.split(':')[1]];
    url = `${APP}?evenements=${encodeURIComponent(ev?.date || '')}`;
  }
  // Pixel Meet : jamais le texte ni l'expéditeur sur l'écran verrouillé.
  const pm = String(n.key || '').startsWith('pm:');
  const sent = await sendTo(n.to, pm ? { title: 'Pixel Meet', body: 'Nouveau message', tag: 'pm', url: APP }
    : { title: "S9 Interact'", body: n.text, tag: 'news-' + id, url });
  log(`nouvelle pour ${n.to} : ${sent} appareil(s)`);
}
function watchNews() {
  let first = true;
  db.collection('news').onSnapshot(snap => {
    for (const ch of snap.docChanges()) {
      const id = ch.doc.id, d = ch.doc.data();
      if (ch.type === 'removed' || d.pushedAt || d.read) { clearTimeout(timers.get(id)); timers.delete(id); continue; }
      const at = d.createdAt?.toMillis?.() ?? Date.now();
      if (first && Date.now() - at > OLD) continue;          // vieilles nouvelles jamais envoyées : on les laisse
      clearTimeout(timers.get(id));                          // modifiée : on repart pour un délai complet
      timers.set(id, setTimeout(() => pushNews(id).catch(e => log('erreur nouvelle', id, e.message)), WAIT));
    }
    first = false;
  }, e => { log('écoute des nouvelles interrompue :', e.message); setTimeout(watchNews, 30000); });
}

// ---------- Bienvenue sur un nouvel appareil ----------
function watchSubs() {
  db.collectionGroup('subs').onSnapshot(snap => {
    for (const ch of snap.docChanges()) {
      if (ch.type !== 'added' || ch.doc.data().welcomedAt) continue;
      const player = ch.doc.ref.parent.parent?.id; if (!player) continue;
      (async () => {
        await ch.doc.ref.update({ welcomedAt: FieldValue.serverTimestamp() });
        const sent = await sendTo(player, { title: "S9 Interact'", body: 'Notifications activées : tu seras prévenu des nouvelles de tes personnages.', tag: 'bienvenue', url: APP }, ch.doc);
        log(`bienvenue envoyée à ${player} (${sent})`);
      })().catch(e => log('erreur bienvenue', player, e.message));
    }
  }, e => { log('écoute des appareils interrompue :', e.message); setTimeout(watchSubs, 30000); });
}

// ---------- Rappel la veille d'un événement à Solution 9, pour les joueurs inscrits (à partir de 18 h) ----------
const EV_LABEL = { info: 'Information importante pour Solution 9', soiree: 'Soirée, concert ou set', fete: 'Fête ou rassemblement', autre: 'Annonce au groupe' };
const pad = n => String(n).padStart(2, '0');
const isoOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
async function remindEvents(now = new Date()) {
  if (now.getHours() < +(process.env.REMIND_HOUR || 18)) return 0;
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), tomorrow = isoOf(t);
  const evs = (await db.doc('shared/events').get()).data() || {};
  let n = 0;
  for (const [id, e] of Object.entries(evs)) {
    if (!e || e.date !== tomorrow) continue;
    const players = [...new Set(Object.values(e.going || {}).filter(p => typeof p === 'string'))];
    for (const p of players) {
      const key = `event:${id}:rappel:${p}`, ref = db.doc('news/' + key);
      if ((await ref.get()).exists) continue;   // déjà rappelé
      await ref.set({ from: 's9', to: p, text: `Demain : « ${e.text} » (${EV_LABEL[e.type] || 'événement'}). Tu y participes.`, charId: null, key, read: false, createdAt: FieldValue.serverTimestamp() });
      n++;
    }
  }
  if (n) log(`rappel de la veille : ${n} joueur(s)`);
  return n;
}
setInterval(() => remindEvents().catch(e => log('erreur rappel', e.message)), +(process.env.REMIND_EVERY_MS || 10 * 60e3));
module.exports = { remindEvents };

log("Service des notifications S9 Interact' démarré.");
watchNews();
watchSubs();
