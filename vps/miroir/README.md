# Service de recopie Journée RP → S9 Interact' (`s9-miroir`)

Service Node.js lancé par pm2 sur le VPS, à côté de `quiz-bot`, `journee-rp` et des services `iloh-*` (sans y toucher).
Il **lit** Journée RP (projet `journal-rp`) et **écrit** dans S9 Interact' (projet `s9-interact`).

## Ce qui est recopié, pour Echo et Prism

- journées (`days/…`), sans la Vie intime, sans les activités « Sexe avec … », sans rien de Moonstone ni du livreur,
  sans les sets tardifs ni la porte fermée (ces mécaniques restent dans Journée RP) ;
- nuits chaudes, protection, amants (PNJ) : **dans l'espace privé du couple** `couples/echo-prism`, lisible par Nono et Jynette seulement ;
- journée jouée en RP et nuit calme du jour, alertes ;
- activités et lieux ajoutés (`characters/…`), encart public « Aujourd'hui » (`today/…`).

Activités à ne jamais montrer dans S9 : réglage `hideS9` de Journée RP (ce jour-là ou toujours, à brancher à l'étape 7).

## Retour vers Journée RP

Seules écritures dans Journée RP, dans la collection `s9` :
- `s9/{echo|prism}/months/{AAAA-MM}` : activités communes acceptées dans S9 Interact' (rien d'intime) ;
- `s9/_noms/months/liste` : noms et genres de Joy, Tala, Aaron et Yololo, pour les noter sur une activité commune.

Quand Echo ou Prism note dans Journée RP une activité commune avec Joy, Tala, Aaron ou Yololo (journée validée),
le service crée dans S9 Interact' la nouvelle verte pour le joueur concerné.

Installation : voir `vps/README.md`. Tests sans réseau : `node test-transform.js && node test-miroir.js`.
