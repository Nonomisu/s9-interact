// S9 : exemples de l'aperçu (début) — retirés par dev/build.py
FLASH.f1 = { cat: 'Nightlife', title: "Elek'Trique affiche complet pour le set d'Echo samedi", text: "Les préventes sont parties en moins d'une heure.", src: 'S9 Infos', by: 'nono', at: Date.now() - 3 * 3600e3 };
FLASH.f2 = { cat: 'Faits divers', title: 'Panne géante de néons dans les Faubourgs', text: 'Trois rues dans le noir pendant vingt minutes.', src: 'Radio Faubourgs', by: 'idriss', at: Date.now() - 20 * 3600e3 };
FLASH.f3 = { cat: 'Rumeur', title: 'Angel Sparkle préparerait un nouveau single', text: '', src: 'Pixel Potins', by: 'eden', at: Date.now() - 60 * 3600e3 };
Object.assign(WE_ACC, {
  'echo.live': { char: 'echo', type: 'pro', name: 'ECHO — live', bio: 'Dates des sets et réservations.' },
  'prism': { char: 'prism', type: 'perso', name: 'Prism', bio: 'créatrice · néons et paillettes' },
  'prism.atelier': { char: 'prism', type: 'pro', name: 'Atelier Prism', bio: 'Boutique · pièces uniques' },
  'angelsparkle': { char: 'joy', type: 'perso', name: 'Angel Sparkle', bio: 'chanteuse · bubble-gum & glitchs ✦' },
  'aaron.grid': { char: 'aaron', type: 'perso', name: 'Aaron', bio: 'Tuliyollal → Solution Nine' },
});
Object.assign(WE_POSTS, {
  p1: { acc: 'echo.live', char: 'echo', photo: null, text: "Samedi on fait trembler Elek'Trique. #set #S9", loc: "Elek'Trique", at: Date.now() - 2 * 3600e3, likes: { prism: true, angelsparkle: true }, comments: [{ acc: 'angelsparkle', text: 'je serai devant la scène 💙', at: Date.now() - 3600e3 }] },
  p2: { acc: 'prism.atelier', char: 'prism', photo: null, text: 'Nouvelle veste réfléchissante, pièce unique.', loc: 'Chez Prism & Echo', at: Date.now() - 5 * 3600e3, likes: {}, comments: [] },
});
PM_PROFILES.joy = { char: 'joy', player: 'eden', visibleTo: ['nono', 'jynette', 'eden', 'idriss', 'lou'], pseudo: 'AngelSparkle007', age: 28, genre: 'Féminin',
  metier: 'Chanteuse et compositrice', vit: "P'tit curieux", traine: 'Vraie-Vision', trait: 'Extravertie++', cherche: 'Hommes, Femmes. La fête n\'a pas de genre !!!',
  interet: 'amitié, juste pour une nuit, comparse de fiesta… surprenez-moi !!', passions: 'la musique, le chant, la danse, le clubbing, le nail art, les tatouages, ses deux chats',
  naime: 'les gens ennuyeux !', bio: "Saluuuut ♪ Moi c'est Joy, mais vous me connaissez peut-être sous mon nom de scène : Angel Sparkle !", freq: 'normal', mix: { classique: 50, taquin: 30, direct: 20 } };
PM_THREADS.t1 = { a: 'joy', b: null, npc: { name: 'Kai_Neon', age: 31, job: 'mécano de drones', g: 'm', tone: 'classique' }, players: ['eden'], last: "Coucou, je crois qu'on s'est croisés à Vraie-Vision l'autre soir. C'était toi ?", at: Date.now() - 3600e3, lastBy: 'pnj', seen: {} };
PM_MSGS.t1 = [{ from: 'npc', text: PM_THREADS.t1.last, at: PM_THREADS.t1.at }];
// S9 : exemples de l'aperçu (fin)
