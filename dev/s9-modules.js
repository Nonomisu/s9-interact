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
