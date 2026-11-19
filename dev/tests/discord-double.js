// Fiche recopiée de Journée RP : deux appareils du même joueur ouverts en même temps ne l'envoient qu'une fois sur Discord ;
// Discord en erreur (429) → pas de second message.
// Usage : python3 -m http.server 8765 (à la racine du dépôt), puis node dev/tests/discord-double.js [largeur]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const W = +(process.argv[2] || 420), EMAIL = 'nono@test.fr';
const ok = (c, l) => { console.log((c ? '  ok  ' : '  ÉCHEC ') + l); if (!c) process.exitCode = 1; };
(async () => { const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
  await ctx.route('https://www.gstatic.com/firebasejs/**', r => r.fulfill({ body: fs.readFileSync(path.join(__dirname, 'mockfb', r.request().url().split('/').pop())), contentType: 'application/javascript' }));
  await ctx.route('**fonts.g*.com**', r => r.fulfill({ body: '' }));
  await ctx.route('https://cdn.jsdelivr.net/**', r => r.fulfill({ body: 'window.htmlToImage={toBlob:async()=>new Blob(["png"])};', contentType: 'application/javascript' }));
  const calls = []; let patchStatus = 200, n = 0;
  await ctx.route('https://discord.com/api/webhooks/**', async r => { const m = r.request().method(); calls.push(m);
    await new Promise(x => setTimeout(x, 300));
    if (m === 'PATCH' && patchStatus !== 200) return r.fulfill({ status: patchStatus, body: '{}' });
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: m === 'POST' ? 'msg' + (++n) : 'msg' + n }) }); });
  const errs = [];
  const open = async nm => { const p = await ctx.newPage(); p.on('pageerror', x => errs.push(nm + ': ' + x.message));
    await p.addInitScript(([a, c]) => { window.name = a; window.MOCK_EMAIL = c; }, [nm, EMAIL]);
    await p.goto('http://localhost:8765/'); await p.waitForTimeout(400); if (await p.isVisible('#login-btn')) await p.click('#login-btn'); return p; };
  // Jour RP en cours, calculé par l'appli elle-même, puis base simulée : fiche d'Echo validée (recopiée), webhook relié.
  const s = await ctx.newPage(); await s.goto('http://localhost:8765/icon.svg');
  const { ym, day } = await s.evaluate(() => { const d = new Date(); if (d.getHours() < 5) d.setDate(d.getDate() - 1);
    return { ym: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, day: String(d.getDate()) }; });
  await s.evaluate(([ym, day, e]) => localStorage.setItem('mockdb', JSON.stringify({ ['access/' + e]: { player: 'nono', role: 'admin' },
    'shared/discord': { webhook: 'https://discord.com/api/webhooks/1/abc' },
    ['days/echo/months/' + ym]: { [day]: { done: true, doneAt: Date.now(), mood: 'Calme', checked: { $set: ['Cuisine'] } } } })), [ym, day, EMAIL]);
  await s.close();
  const [pc, tel] = await Promise.all([open('pc'), open('tel')]);
  await pc.waitForTimeout(9000);
  ok(calls.filter(m => m === 'POST').length === 1, 'PC + téléphone du même joueur : un seul message Discord (' + calls + ')');
  // Fiche modifiée, Discord surchargé : pas de nouveau message.
  calls.length = 0; patchStatus = 429;
  await pc.evaluate(() => { const db = JSON.parse(localStorage.getItem('mockdb')); const k = Object.keys(db).find(x => x.startsWith('shared/recaps-'));
    db[k].echo.sig = 'ancienne'; localStorage.setItem('mockdb', JSON.stringify(db)); Object.keys(mirrorDone).forEach(x => delete mirrorDone[x]); RP_DISCORD.updateMirrors(); });
  await pc.waitForTimeout(3000);
  ok(calls.length >= 1 && !calls.includes('POST'), 'Discord en erreur : aucun doublon (' + calls + ')');
  ok(await pc.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'pas de débordement horizontal');
  console.log('erreurs :', errs.length ? errs : 'aucune'); if (errs.length) process.exitCode = 1;
  await b.close();
})();
