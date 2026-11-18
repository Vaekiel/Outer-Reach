# ✦ OUTER REACH ✦

### Prospecteurs des Marches d’Orée

Chaque système cache une route. Chaque astéroïde, une possibilité.

* * *

## ✧ Les Marches s’ouvrent

Aux confins de l’espace connu, les routes ne sont jamais vraiment tracées.
Les stations attendent les cargaisons, les ceintures minières abritent encore
des ressources inconnues et les anciennes portes relient des systèmes que peu
de pilotes osent explorer.

**Outer Reach** est un jeu de prospection et de minage spatial en pixel art,
jouable directement dans un navigateur. Pilote ton vaisseau, explore les
systèmes, extrais des minerais, améliore ton équipement et décide jusqu’où tu
veux pousser l’expédition.

> L’espace est vaste. Les premières coordonnées sont à toi.

## ▶ Entrer dans Outer Reach

Outer Reach fonctionne en mode solo, hors ligne et sans compte Google. La
progression est sauvegardée automatiquement dans le navigateur utilisé.

### Lancer le jeu localement

Depuis la racine du projet :

```bash
./scripts/serve-offline.sh
```

Puis ouvre [http://127.0.0.1:8080/](http://127.0.0.1:8080/).

Sous Windows, tu peux aussi lancer :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\serve.ps1
```

Le jeu utilise des modules JavaScript ES. Il doit donc être ouvert depuis un
petit serveur local, et non directement avec `file://`.

## 💾 Une progression qui reste à bord

La sauvegarde solo est conservée dans le `localStorage` du navigateur. Aucun
compte et aucune connexion Internet ne sont nécessaires pour jouer.

La sauvegarde reste liée à cet appareil et à ce navigateur. Effacer les
données du site peut effacer la progression.

## ✨ Ce qui vous attend

- **Un vaisseau à faire évoluer** — équipe la coque avec des modules adaptés
  au minage, à la propulsion, à la capacité de soute ou à l’exploration.
- **Des ceintures minières** — approche les astéroïdes, extrais leurs minerais
  et surveille la chaleur ainsi que la capacité de ta soute.
- **Des stations et des ports** — amarres-toi, vends ta cargaison, ravitaille
  ton vaisseau et prépare la prochaine rotation.
- **Des systèmes à parcourir** — utilise les portes de transit et découvre les
  quinze systèmes des Marches d’Orée.
- **Des sites à sonder** — explore les épaves, les anomalies et les lieux
  verrouillés qui demandent parfois un équipement spécifique.
- **Un trafic spatial vivant** — croise des vaisseaux civils et observe les
  activités qui animent les systèmes.
- **Une aventure à ton rythme** — aucune connexion obligatoire, aucun
  abonnement et aucun achat en argent réel.

## 🌙 Une frontière encore en construction

Outer Reach est un projet indépendant en développement. Les systèmes, les
vaisseaux, les interfaces, les missions et les activités continueront
d’évoluer au fil des versions.

Les tests automatisés du projet couvrent les systèmes de jeu, la navigation,
le minage, l’amarrage, les sauvegardes et plusieurs éléments de l’interface :

```bash
npm test
```

## 💬 Retours et développement

Une route vous semble imprécise ? Un astéroïde refuse de livrer son minerai ?
Une idée pourrait améliorer l’expédition ? Ouvre une issue dans le dépôt
[Outer Reach](https://github.com/Vaekiel/Outer-Reach) en indiquant :

- le navigateur et l’appareil utilisés ;
- les étapes pour reproduire le problème ;
- le système et la station concernés, si nécessaire ;
- les messages visibles dans la console du navigateur.

Le projet peut être joué et développé sans connexion à Google. Les fonctions
multijoueur, tchat et sauvegarde cloud ne font pas partie du mode solo hors
ligne.

## ✦ Un jeu indépendant, gratuit et en évolution

Outer Reach est développé par **Vaekiel**. Le jeu est gratuit et ne propose
aucun achat en argent réel.

Le projet est encore en développement : les illustrations, les systèmes, les
équilibrages et les fonctionnalités pourront évoluer. Les retours servent à
étendre la frontière sans perdre le plaisir de l’exploration.

## 📜 Droits et utilisation

© 2026 Vaekiel — Tous droits réservés.

Le dépôt est destiné au développement et à la consultation du projet. La
réutilisation du code, des illustrations, des sons, des polices ou des
contenus du jeu doit respecter la licence du dépôt et les droits de leurs
auteurs.

* * *

> « Au-delà de la dernière balise, chaque pilote écrit sa propre carte. »

_{✦ OUTER REACH · Prospecteurs des Marches d’Orée ✦}_
