# Contribuer à ORÉE

## Message pour Imtherean (et son assistant ChatGPT)

Salut ! De notre côté (Resmo, avec Claude), on a remonté le code du
jeu depuis le site en ligne dans ce dépôt Git pour pouvoir développer
dessus proprement et à plusieurs. Pour que nos deux historiques de
changements restent clairs et compréhensibles dans les deux sens —
même sans être présent au moment du changement — voici la convention
qu'on propose d'adopter ensemble. C'est une proposition de notre part,
pas une contrainte : à adapter si tu préfères une autre organisation.

Si tu (ou ton assistant ChatGPT) modifie le jeu — directement dans ce
dépôt, ou en redéployant sur le site `chatgpt.site` en attendant de
passer par Git de ton côté — merci de suivre les mêmes règles ci-dessous
pour que ce soit documenté de la même façon des deux côtés.

## 1. Chaque commit / push a une description claire

- Une ligne de résumé qui dit **ce qui** change et **pourquoi**, pas
  juste « update » ou « fix ».
- Écrite en français, comme le reste du projet.
- Exemple : `Ajoute l'extraction automatique quand la soute est pleine`
  plutôt que `fix bug`.

## 2. Chaque nouvelle version a une entrée dans CHANGELOG.md

- Une section par version : `## [0.2.0] - AAAA-MM-JJ`.
- Sous-sections `Ajouté` / `Modifié` / `Corrigé` / `Supprimé` selon ce
  qui s'applique (voir `CHANGELOG.md` pour l'exemple de la v0.1.0).
- Le numéro de version suit SemVer (majeure.mineure.corrective) — voir
  la section « Workflow de développement » du `README.md` pour la
  marche à suivre (tag Git à chaque fusion `dev → master`).
- Tant qu'un changement n'est pas encore lié à une version précise, il
  va dans la section `[Non publié]` en haut du fichier.

## 3. Si le changement ne passe pas par Git

Si tu modifies/redéploies le jeu uniquement via ChatGPT sans passer
par ce dépôt, décris quand même le changement dans `CHANGELOG.md`
(section `[Non publié]`, ou directement sur GitHub si tu y as accès) —
ça permettra de le repérer facilement au moment de comparer avec le
site en ligne (`scripts/sync-from-live.ps1`, voir le README).

## 4. Détecter les changements de l'autre côté avant d'agir

Comme on travaille à deux sur la même branche `dev`, un message pour
Claude et ChatGPT : avant de pousser, fusionner, ou baser un
changement sur l'état du dépôt, fait un `git fetch`/lecture de l'état
distant pour voir si l'autre a ajouté des commits entre-temps. Si
c'est le cas, lis ce qui a changé et dis-le clairement à l'utilisateur
(quoi, par qui, y a-t-il un risque de conflit avec ce qui est en
cours) avant de continuer — plutôt que d'écraser ou d'ignorer le
travail de l'autre en silence.

Merci, et bonne suite du développement d'ORÉE !
— Resmo & Claude
