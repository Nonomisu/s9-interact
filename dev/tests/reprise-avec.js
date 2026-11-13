// Reprise d'une activité commune : retirer des personnages proposés avant l'ajout (l'auteur reste) ; boutons flèches haut/bas.
// Usage : python3 -m http.server 8765 (à la racine du dépôt), puis node dev/tests/reprise-avec.js [largeur]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const W = +(process.argv[2] || 420), PORT = process.argv[3] || 8765;
const ok = (c, l) => { console.log((c ? '  ok  ' : '  ÉCHEC ') + l); if (!c) process.exitCode = 1; };
(async () => { const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
  await ctx.route('https://www.gstatic.com/firebasejs/**', r => r.fulfill({ body: fs.readFileSync(path.join(__dirname, 'mockfb', r.request().url().split('/').pop())), contentType: 'application/javascript' }));
  await ctx.route('**fonts.g*.com**', r => r.fulfill({ body: '' }));
  await ctx.route('https://discord.com/api/webhooks/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"id":"m"}' }));
  const errs = [], seed = { 'access/nono@test.fr': { player: 'nono', role: 'admin' }, 'access/jynette@test.fr': { player: 'jynette', role: 'joueur' }, 'access/eden@test.fr': { player: 'eden', role: 'joueur' } };
  const open = async (n, e, first) => { const p = await ctx.newPage(); p.on('pageerror', x => errs.push(n + ': ' + x.message));
    await p.addInitScript(([a, c, s]) => { window.name = a; window.MOCK_EMAIL = c; if (s && !localStorage.getItem('mockdb')) localStorage.setItem('mockdb', JSON.stringify(s)); }, [n, e, first ? seed : null]);
    await p.goto(`http://localhost:${PORT}/`); await p.waitForTimeout(400); if (await p.isVisible('#login-btn')) await p.click('#login-btn'); await p.waitForTimeout(1500);
    await p.waitForFunction(() => !document.getElementById('mirror-update'), null, { timeout: 60000 }); await p.waitForTimeout(300); return p; };
  const eden = await open('eden', 'eden@test.fr', true), jyn = await open('jynette', 'jynette@test.fr');
  // Joy note « Cuisine » avec Aaron, Tala et Yololo, puis valide
  await eden.evaluate(() => { go('joy'); const s = state.joy; s.specials.push('Cuisine'); s.checked.add('Cuisine'); ['aaron', 'prism', 'tala', 'yololo'].forEach(o => setWith('joy', 'Cuisine', o, true)); s.mood ||= 'ok'; renderChar('joy'); });
  await eden.evaluate(() => document.getElementById('done-joy').click()); await eden.waitForTimeout(2500);
  await jyn.waitForTimeout(800); await jyn.evaluate(() => go('aaron')); await jyn.waitForTimeout(300);
  const chips = await jyn.evaluate(() => [...document.querySelectorAll('[data-jp-who]')].map(b => b.dataset.jpWho + ':' + b.getAttribute('aria-pressed')));
  ok(JSON.stringify(chips) === '["prism:true","tala:true","yololo:true"]', 'personnages proposés, tous cochés au départ (auteur fixe)');
  ok((await jyn.textContent('.join-pick .join-fixed')).includes('Joy'), 'Joy reste toujours');
  const y0 = await jyn.evaluate(() => { document.querySelector('.join-pick').scrollIntoView({ block: 'center' }); return scrollY; });
  await jyn.evaluate(() => document.querySelector('[data-jp-who="tala"]').click()); await jyn.waitForTimeout(200);
  await jyn.evaluate(() => document.querySelector('[data-jp-who="yololo"]').click()); await jyn.waitForTimeout(200);
  await jyn.evaluate(() => document.querySelector('[data-jp-who="prism"]').click()); await jyn.waitForTimeout(200);
  ok(Math.abs(await jyn.evaluate(() => scrollY) - y0) < 4, 'pas de saut de page');
  ok(JSON.stringify(await jyn.evaluate(() => [...document.querySelectorAll('[data-jp-who]')].map(b => b.getAttribute('aria-pressed')))) === '["false","false","false"]', 'Prism, Tala et Yololo retirés');
  await jyn.evaluate(() => document.querySelector('[data-join-from="joy"]').click()); await jyn.waitForTimeout(1500);
  ok(await jyn.evaluate(() => JSON.stringify(state.aaron.withActs.Cuisine) === '["joy"]' && state.aaron.checked.has('Cuisine')), 'repris : « Cuisine avec Joy » seulement');
  ok((await jyn.textContent('#view')).includes('Cuisine avec Joy') || (await jyn.evaluate(() => withTxt(state.aaron.withActs, 'Cuisine'))) === ' avec Joy', 'affichage : avec Joy');
  // Fiche recopiée de Journée RP (Prism) : même choix, ajouté en complément S9
  await jyn.evaluate(() => go('prism')); await jyn.waitForTimeout(400);
  ok(await jyn.locator('[data-jp-who="aaron"]').count() === 1, 'fiche recopiée (Prism) : choix des personnages proposé');
  await jyn.evaluate(() => document.querySelector('[data-jp-who="tala"]').click()); await jyn.waitForTimeout(200);
  await jyn.evaluate(() => document.querySelector('[data-join-from="joy"]').click()); await jyn.waitForTimeout(1500);
  ok(await jyn.evaluate(() => JSON.stringify(state.prism.withActs?.Cuisine) === '["joy","aaron","yololo"]'), 'Prism : avec Joy, Aaron et Yololo (sans Tala)');
  // Boutons flèches
  await jyn.evaluate(() => scrollTo(0, 0)); await jyn.waitForTimeout(300);
  const long = await jyn.evaluate(() => document.documentElement.scrollHeight - innerHeight > 300);
  ok(await jyn.evaluate(lg => document.getElementById('scroll-top').hidden && document.getElementById('scroll-bottom').hidden === !lg, long), 'en haut : seule la flèche du bas (page assez longue)');
  await jyn.evaluate(() => document.getElementById('scroll-bottom').click()); await jyn.waitForTimeout(1200);
  ok(await jyn.evaluate(() => innerHeight + scrollY >= document.documentElement.scrollHeight - 4), 'flèche du bas : tout en bas');
  ok(await jyn.evaluate(lg => document.getElementById('scroll-top').hidden === !lg && document.getElementById('scroll-bottom').hidden, long), 'en bas : seule la flèche du haut (page assez longue)');
  const bb = await jyn.evaluate(() => { const n = document.querySelector('.nav').getBoundingClientRect(), f = document.querySelector('.scroll-btns').getBoundingClientRect(); return { navTop: n.top, navW: n.width, fabBottom: f.bottom, w: innerWidth }; });
  ok(bb.navW < bb.w * .9 || bb.fabBottom <= bb.navTop, 'au-dessus du menu sur téléphone');
  await jyn.evaluate(() => document.getElementById('scroll-top').click()); await jyn.waitForTimeout(1200);
  ok(await jyn.evaluate(() => scrollY < 2), 'flèche du haut : tout en haut');
  ok(long || W > 600, 'téléphone : page assez longue pour tester les flèches');
  ok(await jyn.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'pas de débordement horizontal');
  console.log('erreurs :', errs.length ? errs : 'aucune'); if (errs.length) process.exitCode = 1;
  await b.close();
})();
