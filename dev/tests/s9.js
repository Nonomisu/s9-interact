// Test de bout en bout de S9 Interact' (Firestore simulé, plusieurs joueurs dans le même navigateur).
// Usage : python3 -m http.server 8765 (à la racine du dépôt), puis node dev/tests/groupe.js [largeur]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const MOCK = path.join(__dirname, 'mockfb');
const W = +(process.argv[2] || 420);
// Sections de nuit dépliées d'office (sinon les cases sont repliées sous « Comment va se passer la nuit ? »).
const IDS = ["echo", "prism", "joy", "tala", "aaron", "yololo"];
const ok = (cond, label) => { console.log((cond ? '  ok  ' : '  ÉCHEC ') + label); if (!cond) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
  await ctx.route('https://www.gstatic.com/firebasejs/**', r => r.fulfill({ body: fs.readFileSync(path.join(MOCK, r.request().url().split('/').pop())), contentType: 'application/javascript' }));
  await ctx.route('**fonts.googleapis.com**', r => r.fulfill({ body: '', contentType: 'text/css' }));
  await ctx.route('**fonts.gstatic.com**', r => r.fulfill({ body: '' }));
  // Bibliothèque d'image servie en local, webhook Discord simulé (on note ce que montre la fiche au moment de l'envoi)
  const H2I = path.join(require.resolve('html-to-image/package.json'), '..', 'dist', 'html-to-image.js');
  await ctx.route('https://cdn.jsdelivr.net/npm/html-to-image@*/**', r => r.fulfill({ body: fs.readFileSync(H2I), contentType: 'application/javascript' }));
  const posts = [];
  await ctx.route('https://discord.com/api/webhooks/**', async (r, req) => {
    if (req.method() === 'GET') return r.fulfill({ status: 200, body: '{}' });
    const pg = req.frame().page(), body = (req.postDataBuffer() || Buffer.from('')).toString('latin1');
    const pj = body.match(/name="payload_json"\r\n\r\n([\s\S]*?)\r\n--/); const payload = pj ? JSON.parse(Buffer.from(pj[1], 'latin1').toString('utf8')) : {};
    const dom = await pg.evaluate(() => document.querySelector('#view .recap')?.textContent || '');
    // Texte de chaque fiche photographiée pour ce message (noté au moment de la capture)
    const caps = await pg.evaluate(() => (window.__captures || []).splice(0));
    posts.push(Object.assign(new String(dom + ' ' + caps.join(' ')), { method: req.method(), files: (body.match(/filename="recap/g) || []).length,
      titles: (payload.embeds || []).map(e => e.title), caps }));
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'm' + posts.length }) });
  });
  const errs = [];
  // Journée RP en cours (elle commence à 5 h), comme dans l'appli.
  const rp = new Date(Date.now() - 5 * 3600e3), ym = `${rp.getFullYear()}-${String(rp.getMonth() + 1).padStart(2, '0')}`, day = String(rp.getDate());
  // Base de départ : l'admin et deux joueuses invités (comme dans la console Firebase).
  const seed = { 'access/nono@test.fr': { player: 'nono', role: 'admin' }, 'access/jynette@test.fr': { player: 'jynette', role: 'joueur' },
    'access/eden@test.fr': { player: 'eden', role: 'joueur' }, 'access/idriss@test.fr': { player: 'idriss', role: 'joueur' },
    'shared/discord': { webhook: 'https://discord.com/api/webhooks/1/test' },
    // Fiches recopiées de Journée RP (Echo, Prism), comme les écrit le service s9-miroir
    [`days/echo/months/${ym}`]: { [day]: { mood: 'Recopié de Journée RP.', done: true, checked: { $set: ['Prépare le set à la maison'] }, nightStates: { $set: ['Cauchemar'] } } },
    [`days/prism/months/${ym}`]: { [day]: { mood: 'Prism aussi.', done: true } },
    [`couples/echo-prism/months/${ym}`]: { [day]: { nights: { echo: { hot: true, with: 'prism' }, prism: { hot: true, with: 'echo' } } } } };
  const open = async (name, email, first = false) => {
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(name + ' console: ' + m.text()); });
    await p.addInitScript(() => {
      // Note le texte de chaque récap au moment où il est photographié pour Discord.
      window.__captures = [];
      new MutationObserver(ms => ms.forEach(m => { if (m.target.classList?.contains('capturing')) window.__captures.push(m.target.textContent); }))
        .observe(document, { attributes: true, attributeFilter: ['class'], subtree: true });
    });
    await p.addInitScript(([n, e, s, IDS]) => { try { localStorage.setItem('rp-night-open', JSON.stringify(IDS.flatMap(i => [i + ':data-next-night', i + ':data-prev-night']))); } catch {} window.name = n; window.MOCK_EMAIL = e; window.MOCK_WRITES = []; if (s && !localStorage.getItem('mockdb')) localStorage.setItem('mockdb', JSON.stringify(s)); }, [name, email, first ? seed : null, IDS]);
    await p.goto('http://localhost:8765/'); await p.waitForTimeout(400);
    if (await p.isVisible('#login-btn')) await p.click('#login-btn');   // session déjà ouverte : pas de bouton
    await p.waitForTimeout(1200);
    // « Mise à jour des fiches » : l'appli rend la main une fois les fiches recopiées envoyées
    await p.waitForFunction(() => !document.getElementById('mirror-update'), null, { timeout: 60000 }); await p.waitForTimeout(300);
    return p;
  };
  const db = p => p.evaluate(() => JSON.parse(localStorage.getItem('mockdb')));

  console.log('Admin (Nono)');
  const nono = await open('nono', 'nono@test.fr', true);
  ok(await nono.isHidden('#login'), 'connexion réussie');
  ok((await nono.textContent('.session')).includes('Nono'), 'session : Nono');
  ok(await nono.locator('.grid .card').count() === 6, '6 cartes sur l\'accueil');
  ok((await nono.textContent('#view header .kicker')).includes("S9 Interact'"), 'nom de l\'appli sur l\'accueil');
  ok(await nono.locator('#nav-players button').count() === 6, 'filtre par joueur : Tous + 5 joueurs');
  ok(await nono.evaluate(() => document.documentElement.className) === 't-s9', 'thème S9 sur l\'accueil');
  ok(await nono.locator('[data-go="iloh"]').count() === 0, 'plus de carte de l\'Iloh');
  let d = await db(nono);
  ok(Object.keys(d).filter(k => k.startsWith('characters/')).length === 6, 'fiches des 6 personnages créées par l\'admin');
  ok(d['characters/aaron']?.player === 'jynette' && d['characters/joy']?.player === 'eden', 'joueurs des fiches repris de la config');
  const mir = () => posts.filter(t => t.titles?.length && t.method === 'POST');
  ok(mir().length === 2 && mir().some(t => t.titles[0].includes('Echo')) && mir().some(t => t.titles[0].includes('Prism')), 'Echo et Prism recopiés : un message Discord chacun');
  ok(mir().every(t => !t.caps[0].includes('Nuit chaude')), 'aucune image avec la nuit chaude');
  await nono.evaluate(() => go('echo')); await nono.waitForTimeout(200);
  ok((await nono.textContent('#view h1')).includes('Echo'), 'fiche d\'Echo');
  ok(await nono.locator('#mood-echo').count() === 0 && (await nono.textContent('#view')).includes('Journée RP'), 'Echo en lecture seule (tenu dans Journée RP)');
  ok((await nono.textContent('#view')).includes('Cauchemar'), 'le joueur du personnage voit ses lignes de nuit');
  ok(await nono.locator('[data-yurt-of]').count() === 0, 'plus d\'onglet Yourte');
  ok(!(await nono.textContent('#view')).includes('Chasse'), 'aucune chasse');
  ok(Object.keys(d).filter(k => /^couples\/[^/]+$/.test(k)).length === 1, 'un espace de couple : Echo et Prism');

  console.log('Joueuse (Eden) : Joy');
  const ed = await open('eden', 'eden@test.fr');
  await ed.evaluate(() => go('joy')); await ed.waitForTimeout(200);
  ok(await ed.locator('#hot-joy').count() === 0, 'pas de nuit chaude hors couple (Joy)');
  await ed.fill('#mood-joy', 'Survoltée.'); await ed.dispatchEvent('#mood-joy', 'input');
  const act = 'Danse';
  await ed.click(`[data-act="${act}"]`); await ed.waitForTimeout(150);
  await ed.click(`details[data-with-fold="${act}"] summary`); await ed.waitForTimeout(100);
  await ed.evaluate(a => document.querySelector(`[data-share-act="${a}"][data-share="tala"]`).click(), act); await ed.waitForTimeout(150);
  ok((await ed.textContent(`details[data-with-fold="${act}"] summary`)).includes('Avec Tala'), 'résumé : « Avec Tala »');
  await ed.click('#done-joy'); await ed.waitForTimeout(1500);
  d = await db(ed);
  ok(d[`days/joy/months/${ym}`]?.[day]?.mood === 'Survoltée.', 'journée de Joy enregistrée');
  const news = Object.entries(d).filter(([k]) => k.startsWith('news/')).map(([, v]) => v);
  ok(news.some(n => n.to === 'idriss' && n.charId === 'tala' && n.text.includes('Joy')), 'activité commune : nouvelle pour Idriss (Tala)');
  ok(posts.some(t => t.includes('Survoltée.') && t.includes(act + ' avec Tala')), 'récap de Joy envoyé sur Discord');
  ok(!(await ed.textContent('#view')).includes('Météo du jour'), 'pas de case météo');

  console.log('Joueuse (Jynette) : Aaron et le couple');
  const jy = await open('jynette', 'jynette@test.fr');
  await jy.evaluate(() => go('prism')); await jy.waitForTimeout(200);
  ok((await jy.textContent('#view')).includes('Nuit chaude'), 'Prism : nuit chaude recopiée visible pour Jynette');
  await jy.evaluate(() => go('aaron')); await jy.waitForTimeout(200);
  ok(await jy.locator('#mood-aaron').count() === 1, 'Aaron (absent de Journée RP) se remplit ici');
  ok((await jy.textContent('#view h1')).includes('Aaron'), 'fiche d\'Aaron');

  console.log('Joueur (Idriss)');
  const id = await open('idriss', 'idriss@test.fr');
  ok((await id.textContent('.news')).includes('Joy'), 'Idriss voit la nouvelle de l\'activité commune');
  await id.evaluate(() => go('echo')); await id.waitForTimeout(200);
  ok(!(await id.textContent('#view')).includes('Nuit chaude') && !(await id.textContent('#view')).includes('Cauchemar'), 'hors couple : aucune ligne de nuit d\'Echo');

  console.log('Événements (Nono)');
  await nono.evaluate(() => go('home')); await nono.waitForTimeout(200);
  ok((await nono.textContent('.group-events h2')).includes('Événements à Solution 9'), 'titre « Événements à Solution 9 »');
  await nono.click('.ev-new summary'); await nono.click('[data-ev-type="soiree"]');
  await nono.fill('#ev-text', "Set d'Echo samedi"); await nono.click('#ev-add'); await nono.waitForTimeout(1500);
  ok((await nono.textContent('.group-events')).includes("Set d'Echo samedi"), 'annonce affichée sur l\'accueil');

  console.log('Flash Actu');
  await nono.evaluate(() => go('home')); await nono.waitForTimeout(200);
  ok(await nono.locator('.s9-flash').count() === 1, 'module Flash Actu sur l\'accueil');
  await nono.click('[data-flash-new]'); await nono.click('[data-fcat="Rumeur"]');
  await nono.fill('#f-title', 'Un drone géant au-dessus de S9'); await nono.click('[data-flash-pub]'); await nono.waitForTimeout(1500);
  d = await db(nono);
  const fl = Object.entries(d).filter(([k]) => k.startsWith('flash/'));
  ok(fl.length === 1 && fl[0][1].by === 'nono' && fl[0][1].cat === 'Rumeur', 'flash enregistré');
  const fn = Object.values(d).filter(v => v?.key?.startsWith?.('flash:'));
  ok(fn.length === 4 && !fn.some(n => n.to === 'nono'), 'une nouvelle pour chacun des 4 autres joueurs, aucune pour l\'auteur');
  await ed.waitForTimeout(500); await ed.evaluate(() => go('home')); await ed.waitForTimeout(300);
  ok((await ed.textContent('.s9-flash')).includes('Un drone géant'), 'Eden voit le flash');
  ok(await ed.locator('[data-flash-del]').count() === 0, 'Eden ne peut pas retirer le flash de Nono');

  console.log('Wondereye');
  await jy.evaluate(() => go('we')); await jy.waitForTimeout(200);
  await jy.click('[data-we-newacc]'); await jy.click('[data-we-char="prism"]');
  await jy.fill('#wa-h', 'prism.atelier'); await jy.fill('#wa-name', 'Atelier Prism'); await jy.click('[data-we-type="pro"]'); await jy.click('[data-we-save]'); await jy.waitForTimeout(600);
  await jy.click('[data-we-post]'); await jy.fill('#we-text', 'Nouvelle veste #pieceunique'); await jy.click('[data-we-pub]'); await jy.waitForTimeout(1200);
  d = await db(jy);
  ok(d['we_accounts/prism.atelier']?.char === 'prism' && d['we_accounts/prism.atelier']?.type === 'pro', 'compte pro de Prism créé');
  const post = Object.entries(d).find(([k, v]) => k.startsWith('we_posts/') && v.acc === 'prism.atelier');
  ok(!!post, 'publication enregistrée');
  await ed.evaluate(() => go('we')); await ed.waitForTimeout(300);
  ok(await ed.locator('[data-we-like]:not([disabled])').count() === 0, 'sans compte, Eden ne peut pas aimer');
  await ed.click('[data-we-newacc]'); await ed.fill('#wa-h', 'prism.atelier'); await ed.click('[data-we-save]'); await ed.waitForTimeout(200);
  ok((await ed.textContent('#wa-msg')).includes('déjà pris'), 'pseudo déjà pris refusé');
  await ed.fill('#wa-h', 'AngelSparkle'); await ed.click('[data-we-save]'); await ed.waitForTimeout(600);
  ok(!!(await db(ed))['we_accounts/angelsparkle'], 'compte de Joy créé (pseudo en minuscules)');
  const pid = post[0].split('/')[1];
  await ed.click(`[data-we-like="${pid}"]`); await ed.waitForTimeout(300);
  await ed.click(`[data-we-cm-open="${pid}"]`); await ed.fill(`#we-cm-${pid}`, 'JE LA VEUX'); await ed.click(`[data-we-cm="${pid}"]`); await ed.waitForTimeout(1500);
  d = await db(ed);
  ok(d[`we_posts/${pid}`]?.likes?.angelsparkle === true && d[`we_posts/${pid}`]?.comments?.[0]?.text === 'JE LA VEUX', 'j\'aime et commentaire enregistrés');
  ok(Object.values(d).some(v => v?.to === 'jynette' && v?.key?.startsWith?.('we-like:')) && Object.values(d).some(v => v?.to === 'jynette' && v?.key?.startsWith?.('we-cm:')), 'nouvelles pour Jynette (j\'aime, commentaire)');
  await ed.evaluate(() => go('prism')); await ed.waitForTimeout(200);
  ok(await ed.locator('.we-links [data-we-acc="prism.atelier"]').count() === 1, 'fiche de Prism : lien vers @prism.atelier');

  console.log('Pixel Meet');
  await ed.evaluate(() => go('pm')); await ed.waitForTimeout(200);
  await ed.click('[data-pm-edit="joy"]'); await ed.fill('[data-pm-f="pseudo"]', 'AngelSparkle007'); await ed.fill('[data-pm-f="age"]', '28'); await ed.click('[data-pm-save="joy"]'); await ed.waitForTimeout(800);
  await jy.evaluate(() => { pmView.tab = 'inbox'; go('pm'); }); await jy.waitForTimeout(200);
  await jy.click('[data-pm-edit="prism"]'); await jy.fill('[data-pm-f="pseudo"]', 'PrismQueen'); await jy.click('[data-pm-save="prism"]'); await jy.waitForTimeout(400);
  await jy.click('[data-pm-tab="profile"]'); await jy.click('[data-pm-edit="aaron"]'); await jy.fill('[data-pm-f="pseudo"]', 'GridRunner'); await jy.click('[data-pm-save="aaron"]'); await jy.waitForTimeout(800);
  d = await db(jy);
  ok(d['pm_profiles/prism'] && !d['pm_profiles/prism'].visibleTo.includes('nono') && d['pm_profiles/aaron'].visibleTo.includes('nono'), 'profil de Prism caché au joueur d\'Echo, celui d\'Aaron non');
  await jy.click('[data-pm-as="aaron"]'); await jy.click('[data-pm-tab="discover"]'); await jy.waitForTimeout(200);
  await jy.click('[data-pm-write="joy"]'); await jy.fill('#pm-text', 'Salut Angel !'); await jy.click('[data-pm-send]'); await jy.waitForTimeout(1500);
  d = await db(jy);
  const th = Object.entries(d).find(([k, v]) => /^pm_threads\/[^/]+$/.test(k) && v.a === 'aaron' && v.b === 'joy');
  ok(!!th && JSON.stringify(th[1].players.sort()) === '["eden","jynette"]', 'conversation Aaron → Joy, entre Jynette et Eden');
  ok(Object.keys(d).some(k => k.startsWith(th[0] + '/msgs/')), 'message enregistré');
  ok(Object.values(d).some(v => v?.to === 'eden' && v?.key?.startsWith?.('pm:') && v.text === 'Pixel Meet · nouveau message'), 'nouvelle discrète pour Eden');
  await ed.waitForTimeout(600); await ed.evaluate(() => { pmView.tab = 'inbox'; go('pm'); }); await ed.waitForTimeout(300);
  ok(await ed.locator('.pm-thread.unread').count() === 1, 'Eden voit la conversation non lue');
  await ed.click('.pm-thread'); await ed.waitForTimeout(600);
  ok((await ed.textContent('.pm-convo')).includes('Salut Angel !'), 'Eden lit le message');
  await nono.evaluate(() => { pmView.tab = 'discover'; go('pm'); }); await nono.waitForTimeout(300);
  const nd = await nono.textContent('#view');
  ok(nd.includes('GridRunner') && nd.includes('AngelSparkle007') && !nd.includes('PrismQueen'), 'Nono voit Aaron et Joy dans « Découvrir », pas Prism');
  ok(await nono.evaluate(() => Object.keys(PM_THREADS).length) === 0, 'Nono ne voit aucune conversation des autres');

  console.log('Mise en page');
  for (const [p, n] of [[nono, 'Nono'], [ed, 'Eden']]) {
    for (const v of ['home', 'joy', 'echo', 'events', 'we', 'pm']) {
      await p.evaluate(v => go(v), v); await p.waitForTimeout(150);
      ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${n}, ${v} : rien ne dépasse (${W} px)`);
    }
  }

  console.log('Compte non invité');
  const x = await open('x', 'inconnu@test.fr');
  ok((await x.textContent('#login-msg')).includes("n'a pas accès"), 'accès refusé à une adresse non invitée');

  console.log('Erreurs JavaScript :', errs.length); [...new Set(errs)].forEach(e => console.log('   ', e));
  if (errs.length) process.exitCode = 1;
  await b.close();
})();
