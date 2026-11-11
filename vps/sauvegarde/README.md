# Sauvegarde hebdomadaire de S9 Interact' (`s9-sauvegarde`)

Lit toute la base `s9-interact` (sous-collections comprises) et l'écrit dans `~/sauvegardes/s9/s9-AAAA-MM-JJ.json.gz`
(dossier lisible par toi seul). Chaque dimanche à 5 h (une heure après celle d'Iloh) ; les 12 plus récentes sont gardées.
Le script ne fait que lire la base. Vérifier : `ls -lh ~/sauvegardes/s9` puis `cd ~/s9-sauvegarde && node verifier.js`.

Installation : voir `vps/README.md`. Test sans réseau : `node test-sauvegarde.js`.
