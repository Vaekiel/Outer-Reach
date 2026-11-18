# Exports propres (facultatifs, pour plus tard)

**Pour l'instant, tous les assets sont découpés directement depuis les
planches** (décision du 16/09). Les planches sont en RVB 24 bits sans canal
alpha : le fond est détouré par la couleur, asset par asset, avec contrôle
visuel. Là où ce détourage laisse des défauts (fonds d'espace chargés derrière
les hubs, stations et sites, halos des failles), des exports d'origine
permettraient d'améliorer la netteté. Ce document décrit le format idéal si
Vekamel / Astra peuvent en fournir un jour.

## Règles communes

- **PNG avec transparence réelle** (canal alpha), aucun fond, aucune ombre de
  cadre ni texte.
- **Vue du dessus stricte**, pixel-art net, **sans lissage ni flou** (export
  « plus proche voisin » si un redimensionnement est nécessaire).
- **Taille native** du dessin (pas d'agrandissement) ; marge transparente de
  4 px autour.
- Un asset par fichier, noms en minuscules sans accents, tirets pour séparer.
- Pour les vaisseaux : **nez vers la droite** ; une seule vue par coque (la vue
  du haut de la planche).
- Pour les stations et hubs : indiquer si possible les **sas** (points
  d'amarrage) sur une copie annotée, ou laisser des extrémités de modules
  dégagées pour le bras d'amarrage.

## Liste et noms de fichiers

| Dossier | Fichiers | Nombre |
|---|---|---|
| `hubs/` | `hub-<systeme>.png` (oree, lisiere, ganymede, concorde, helios, aube, sillage, meridian, ceres, nereide, janus, pallas, styx, temeraire, erebe) | 15 |
| `stations/` | `station-<systeme>.png` | 15 |
| `sites/` | `epave-<systeme>-1..3.png`, `cargaison-<systeme>-1..3.png`, `balise-<systeme>.png` | 105 |
| `fonds/` | `fond-<systeme>.png` — grande taille, **sans** astéroïdes ni planètes au premier plan (ils sont dessinés à part dans le jeu) | 15 |
| `ceintures/` | Pour chaque famille (roche, glace, gaz) : 3 à 6 variantes d'astéroïdes / blocs / nuages, `roche-<couleur>-1.png`… | ≈ 30 |
| `failles/` | `faille-<systeme>.png` (version pixel-art net) | 15 |
| `planetes/` | Planètes et soleils visibles dans les fonds, séparés : `planete-<systeme>.png` | ≈ 15 |
| `vaisseaux/` | `<constructeur>-<coque>.png` (ex. `orelith-prospecteur.png`, `novais-eclaireur.png`, `valkor-frelon.png`) | selon familles retenues |
| `icones/` *(facultatif)* | Les icônes des planches en PNG transparents 64×64 : elles sont déjà découpées dans le jeu, un export d'origine améliorerait seulement la netteté | — |

Déposer les fichiers dans `design/revamp-graphique/exports/` en respectant ces
dossiers : ils seront intégrés sur la branche `dev-grf`.
