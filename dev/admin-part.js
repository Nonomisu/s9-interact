
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
