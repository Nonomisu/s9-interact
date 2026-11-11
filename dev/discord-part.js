
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
