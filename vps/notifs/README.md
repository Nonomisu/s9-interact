# Notifications push de S9 Interact' (`s9-notifs`)

Envoie chaque nouvelle (collection `news`) en notification sur les appareils abonnés de son destinataire, 30 secondes après
sa création (l'auteur peut encore l'annuler), et accueille chaque nouvel appareil. Rappel la veille d'un événement (18 h)
pour les joueurs inscrits. **Pixel Meet** : la notification dit seulement « Pixel Meet · Nouveau message », jamais le texte
ni l'expéditeur. Clés : `~/secrets/s9-interact-cle.json` et `~/secrets/s9-vapid.json`.

Installation : voir `vps/README.md`. Test sans réseau : `node test-notifs.js`.
