# S9 Interact'

Journal RP de groupe des personnages de Solution 9 (Final Fantasy XIV) : chaque joueur tient au quotidien la journée
de ses personnages, lit celles des autres, et reçoit récaps, nouvelles et wraps annuels. Construit sur le modèle
d'Iloh Khurdan (`Nonomisu/khurdan`).

Appli web publiée sur GitHub Pages (`https://nonomisu.github.io/s9-interact/`), données dans le projet Firebase
`s9-interact` (connexion Google, Firestore). Rien ici ne touche Journée RP ni Iloh Khurdan.

## Joueurs, personnages, accès

- Joueurs, groupes et personnages : en tête du script de `dev/apercu.html` (`PLAYERS`, `GROUP_DEFS`, `C`, puis `PAIRS`,
  `BIRTHDAYS` plus bas). Aucune adresse e-mail dans le dépôt.
- Echo (Nono) et Prism (Jynette) sont tenus dans Journée RP et recopiés ici (lecture seule) par le service `s9-miroir`.
- Accès : un document `access/{adresse Google en minuscules}` = `{ player, role }` par joueur, créé par l'admin.
- Les règles Firestore sont dans la console Firebase, pas dans ce dépôt.

## Avancement

1. Décisions de départ — fait (cahier de lancement)
2. Maquette d'ambiance — validée
3. Dépôt : copie d'Iloh Khurdan, six personnages, thème néon, mécaniques khurdanes retirées — en cours
   ; Flash Actu, Wondereye et Pixel Meet — faits (reste : mise en page de la maquette)
4. Projet Firebase `s9-interact`, connexion Google, règles, première mise en ligne — fait
5. Invitations des joueurs — à faire
6. Services du VPS (`s9-miroir`, `s9-notifs`, `s9-sauvegarde`, `s9-chronique`) — à faire
7. Côté Journée RP : collection `s9`, choix « Personnages de Solution 9 » — à faire
8. Webhook Discord — à faire
9. Test de bout en bout avec deux joueurs — à faire

## Applis du lore

- **Flash Actu** (accueil) : `flash/{id}` — tout joueur publie ; nouvelle (puis notification) pour tous les autres.
- **Wondereye** (réseau social) : `we_accounts/{pseudo}` (plusieurs comptes par personnage, perso ou pro),
  `we_posts/{id}` (photo compressée dans le document, j'aime, commentaires).
- **Pixel Meet** (rencontres, privé) : `pm_profiles/{perso}` (`visibleTo` : tous les joueurs sauf celui du partenaire en couple),
  `pm_threads/{id}` (`players` : les joueurs de la conversation) et `pm_threads/{id}/msgs`. Accroches de PNJ : service `s9-pixel` (étape 6).
  Rien n'est envoyé sur Discord, dans la chronique ni vers Journée RP.

Code : `dev/s9-modules.js` et `dev/s9-modules.css`, insérés dans `dev/apercu.html` par `python3 dev/s9-insert.py`.

Développement : voir `dev/README.md`.
