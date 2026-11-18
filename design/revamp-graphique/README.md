# Revamp graphique — planches de référence

Maquettes de **Vekamel et Astra** (16/09/2026) pour Outer Reachs, accompagnées
du *Cahier de conception consolidé* (`Outer_Reachs_Cahier_de_Conception_*.docx`,
gardé en local : il reprend ces images, voir `.gitignore`).

Travail d'intégration sur la branche **`dev-grf`**, publiée sur
<https://dev-grf--oree-flight.netlify.app>. Ordre retenu : **icônes → HUD →
écrans**, puis monde et vaisseaux, **tous découpés depuis ces planches**
(RVB sans transparence : détourage par la couleur et contrôle visuel ; format
d'export idéal pour plus tard dans [`EXPORTS.md`](EXPORTS.md)). Le revamp est **graphique seulement** :
coques, noms et statistiques du jeu restent inchangés pour l'instant.

## Planches

| Fichier | Contenu | Usage |
|---|---|---|
| `icones-jeu.png` | Ressources communes, rares, variantes ; constructeurs ; icônes fonctionnelles ; icônes des systèmes (planètes) ; sites ; failles | **Source de l'atlas d'icônes** (phase 1) |
| `icones-assets-et-skins.png` | Icônes des systèmes (emblèmes), logos, ressources, sites, failles, fonctions ; exemples de skins | Emblèmes des systèmes, référence skins |
| `interface-pc-mobile.png` | HUD PC et mobile, terminal de station, hangar, inventaire, carte galactique, boutique | **Référence HUD et écrans** (phases 2 et 3) |
| `fonds-espace-systemes.png` | 15 ambiances de fond | Source à découper (phase monde) |
| `ressources-ceintures-systemes.png` | 15 ceintures et leurs ressources | Source à découper (phase monde) |
| `hubs-systemes.png` | 15 hubs, un par système | Source à découper (phase monde) |
| `stations-systemes.png` | 15 stations spécialisées | Source à découper (phase monde) |
| `sites-a-sonder-systemes.png` | Épaves, cargaisons abandonnées, balises HS par système | Source à découper (phase monde) |
| `failles-anomalies.png` | 15 failles, version **pixel-art net retenue** par le cahier | Source à découper (phase monde) |
| `failles-anomalies-variante-illustree.png` | Variante plus illustrée des mêmes failles | Non retenue (archive) |
| `vaisseaux-ressources-orelith.png` | Orelith : minage (Prospecteur → Terraformeur), glace (Givre, Banquise), gaz (Zéphyr, Alizé) — **noms français retenus** | Source à découper (phase vaisseaux) |
| `vaisseaux-minage-orelith-variante-noms-anglais.png` | Variante antérieure (Prospect, Excavator…) | Non retenue (archive) |
| `vaisseaux-exploration-novais.png` | Novaïs : Éclaireur, Sondeur, Baliseur, Pionnier | Source à découper (phase vaisseaux) |
| `vaisseaux-transport-freeman.png` | Freeman Logistics : Colibri, Trafic, Périple, Mégatonne (extraite du cahier) | Direction « à confirmer » selon le cahier |
| `vaisseaux-combat-valkor.png` | Valkor : Frelon, Sentinelle, Bastion, Souverain | Source à découper (phase vaisseaux) |
| `vision-univers.png` | Affiche de synthèse de l'univers (extraite du cahier) | Référence générale |

## Points à arbitrer

- **Transport** : *Freeman Logistics* (cahier, planche transport) ou *Horizon
  Dynamics* (planches d'icônes et affiche de synthèse, avec d'autres noms de
  coques : Ravitailleur, Convoyeur, Cargo lourd, Mégacargo).
- **Combat** : noms de la planche (Frelon, Sentinelle, Bastion, Souverain) ou
  nomenclature de travail du cahier (Intercepteur, Frégate, Croiseur, Bastion).
