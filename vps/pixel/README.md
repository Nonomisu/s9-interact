# Accroches de PNJ de Pixel Meet (`s9-pixel`)

Toutes les 20 minutes (jamais entre 2 h et 10 h), chaque profil Pixel Meet a une petite chance de recevoir le message d'un PNJ
inventé, selon ses réglages : fréquence (calme ~1 par semaine, normal 2 à 3, très demandé·e ~1 par jour, ou aucune) et dosage
du ton (classique, taquin, direct). Les PNJ qui écrivent suivent « Cherche » du profil ; jamais deux accroches à moins de 3 h.
Les messages viennent de `accroches.json` (30 par ton, modifiables) ; les accroches directes restent suggestives, jamais explicites.
Les PNJ ne répondent pas. Le service écrit seulement la conversation (`pm_threads`), une nouvelle discrète pour le joueur
du profil et `pm_state/{perso}` (heure de la dernière accroche).

- Aperçu, sans rien écrire : `DST_KEY=~/secrets/s9-interact-cle.json node pixel.js --apercu`
- Envoyer tout de suite une accroche à Joy : `DST_KEY=~/secrets/s9-interact-cle.json node pixel.js --une joy`

Installation : voir `vps/README.md`. Test sans réseau : `node test-pixel.js`.
