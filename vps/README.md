# Services du VPS de S9 Interact'

Cinq services Node.js gérés par pm2, **à côté** de `quiz-bot`, `journee-rp` et des services `iloh-*`, sans jamais les arrêter :

| Service | Rôle | Fonctionnement |
|---|---|---|
| `s9-miroir` | Recopie Echo et Prism de Journée RP vers S9 Interact', et rapporte les activités communes | en continu |
| `s9-notifs` | Notifications push des nouvelles (Pixel Meet : notification discrète) | en continu |
| `s9-pixel` | Accroches des PNJ de Pixel Meet | en continu (toutes les 20 min) |
| `s9-sauvegarde` | Sauvegarde de toute la base, gardée 12 semaines | dimanche 5 h |
| `s9-chronique` | Chronique de la semaine sur Discord | dimanche 20 h |

Chaque service vérifie au démarrage que sa clé est bien celle du projet `s9-interact` (et `journal-rp` pour la source du miroir) :
avec une autre clé, il s'arrête sans rien faire.

## Installation pas à pas

Toutes les commandes se collent telles quelles. Celles de l'étape 1 se tapent dans **PowerShell sur ton PC** ; toutes les autres
**sur le VPS** (`ssh -p 2222 ubuntu@51.91.122.199`).

### 1. Clé de service du projet s9-interact (sur le PC)

Console Firebase › roue dentée › Paramètres du projet › Comptes de service › « Générer une nouvelle clé privée ».
Un fichier `s9-interact-firebase-adminsdk-….json` arrive dans Téléchargements. Envoie-le sur le VPS :

```powershell
scp -P 2222 (Get-ChildItem "$HOME\Downloads\s9-interact-firebase-adminsdk-*.json" | Select-Object -First 1).FullName ubuntu@51.91.122.199:secrets/s9-interact-cle.json
```

Puis **supprime ce fichier de Téléchargements** : il donne un accès complet à la base.

### 2. Vérifier ce qui tourne et protéger la clé (sur le VPS)

```bash
pm2 list
chmod 600 ~/secrets/s9-interact-cle.json && ls -l ~/secrets
```

`pm2 list` doit montrer `quiz-bot`, `journee-rp` et les `iloh-*` en « online » : on n'y touchera pas.
`ls` doit montrer `s9-interact-cle.json` avec `-rw-------` au début de la ligne.

### 3. Récupérer le code

```bash
git clone https://github.com/Nonomisu/s9-interact.git ~/s9-interact-depot
```

### 4. Installer les cinq services et lancer leurs tests

```bash
for s in miroir notifs pixel sauvegarde chronique; do cp -r ~/s9-interact-depot/vps/$s ~/s9-$s && (cd ~/s9-$s && npm install --omit=dev --no-audit --no-fund); done
cd ~/s9-miroir && node test-transform.js && node test-miroir.js
cd ~/s9-notifs && node test-notifs.js
cd ~/s9-pixel && node test-pixel.js
cd ~/s9-sauvegarde && node test-sauvegarde.js
cd ~/s9-chronique && node test-chronique.js
```

Chaque test doit finir par « Tout est bon. ». Pas de `npm audit fix`.

### 5. Clés des notifications (VAPID)

```bash
cd ~/s9-notifs && npx web-push generate-vapid-keys --json > ~/secrets/s9-vapid.json && chmod 600 ~/secrets/s9-vapid.json
node -e "console.log(require(process.env.HOME + '/secrets/s9-vapid.json').publicKey)"
```

La deuxième commande affiche la **clé publique** : envoie-la à Claude, qui la met dans l'appli (`sync.js`).
La clé privée reste sur le VPS.

### 6. Recopier tout l'historique d'Echo et Prism (une seule fois)

```bash
cd ~/s9-miroir && SRC_KEY=~/secrets/journee-rp-cle.json DST_KEY=~/secrets/s9-interact-cle.json node miroir.js --tout
```

Doit finir par « historique recopié ». Dans l'appli, les fiches d'Echo et Prism se remplissent.

### 7. Lancer les services

```bash
for s in miroir notifs pixel sauvegarde chronique; do (cd ~/s9-$s && pm2 start ecosystem.config.js); done
pm2 save && pm2 list
```

`s9-miroir`, `s9-notifs` et `s9-pixel` doivent être « online ». `s9-sauvegarde` fait une première sauvegarde puis passe en
« stopped » (normal, il repart le dimanche) ; `s9-chronique` aussi. Les autres services n'ont pas bougé.

### 8. Vérifier

```bash
pm2 logs s9-miroir --lines 20 --nostream
pm2 logs s9-pixel --lines 5 --nostream
ls -lh ~/sauvegardes/s9
```

## Mettre à jour un service plus tard

```bash
cd ~/s9-interact-depot && git pull
cp ~/s9-interact-depot/vps/miroir/* ~/s9-miroir/ && cd ~/s9-miroir && node test-transform.js && node test-miroir.js && pm2 restart s9-miroir
```

(remplacer `miroir` par le service concerné ; redémarrer seulement celui-là).
