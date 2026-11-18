# Changelog

Toutes les évolutions notables du projet sont documentées ici, dans
l'ordre chronologique inverse (les plus récentes en haut).

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
versions numérotées selon [SemVer](https://semver.org/lang/fr/)
(`majeure.mineure.corrective`).

Merci d'ajouter une entrée ici à chaque changement notable, côté
Resmo/Claude **ou** côté Imtherean/ChatGPT — voir `CONTRIBUTING.md`
pour la convention complète.

## [Non publié]

### Modifié

- Réduit toutes les tailles de texte de 1 px sur PC et mobile : HUD, fenêtres,
  menus, tchat, carte et étiquettes spatiales. Dimensions des boutons conservées.

### Corrigé

- Police monospace embarquée pour un rendu PC/mobile identique ; retire les
  familles génériques concurrentes et stabilise le grossissement automatique
  du texte mobile, sans désactiver le zoom utilisateur.
- Menu inférieur : remplace les bordures épaisses héritées par les contours
  fins et les angles arrondis des panneaux, y compris au survol/sélection.

### Modifié

- Interface PC/mobile harmonisée : famille monospace commune, tailles par
  fonction identiques sur les deux supports, libellés imbriqués cohérents.
  Supprime le raccourci Tchat dupliqué sur PC et le titre/slogan central.
  Le bouton Tchat original conserve ses non-lus et son ouverture/fermeture.

### Corrigé

- Sur mobile, les libellés Station / Actions et Inventaire restent dans leurs
  boutons : priorité typographique corrigée face aux anciens styles pixel.
  Le panneau Objectif est compacté, avec un titre court et un texte plus lisible.

### Ajouté

- **Boussole de cap.** Un anneau discret autour du vaisseau en vol porte un
  repère par destination, avec sa distance, codé par type comme le radar :
  station (vert), gisement (orange), porte (blanc, double chevron), site
  (violet), trafic (bleu), **hostiles** (rouge clignotant, les 3 plus proches à
  moins de 3 km, prêt pour les futurs PNJ agressifs) et **coéquipier** (losange
  doré). Coéquipier dans un autre système : le repère pointe la porte du plus
  court chemin (« Vekamel · HÉLIOS »), fusionné avec la cible si c'est la même
  porte. Étiquettes gardées dans l'écran et empilées sans chevauchement ; la
  flèche de bord d'écran de la cible est remplacée. Modules `compass.js`
  (testé) et `compass-art.js`.
- **« Rejoindre » à travers les portes.** Si le coéquipier est dans un autre
  système, le cap assisté vise la porte vers son système, saute
  automatiquement (8 % de carburant, délai de porte respecté) et continue
  jusqu'à lui ; arrêt avec message clair si le carburant manque.

## [0.4.0] - 2026-09-15 — Outer Reachs - v0.4 : « UI, Friends and more ! »

### Ajouté

- **Équipage : amis et groupe duo.** Nouveau bouton « Équipe » dans le rail
  (fenêtre « Équipage » à onglets Groupe / Amis / Pilotes / Demandes, badge des
  demandes en attente). Amis : recherche par pseudo exact, pilotes en ligne de la
  zone ou menu ouvert en touchant le portrait ou le pseudo d'un pilote dans le
  tchat ; demande, acceptation, refus, retrait. Groupe de 2 pilotes : invitation
  valable 10 min (bandeau non bloquant chez l'invité), rejoindre, quitter. Le
  groupe active le canal Groupe du tchat, affiche le système et la distance du
  coéquipier, et le montre dans la vue (sa coque et son pseudo en doré) et sur
  le radar (losange doré) quand vous partagez le même système — position
  publiée toutes les 4 s au plus, seulement en groupe et si le vaisseau bouge.
  Firestore : `profiles`, `friendships`, `groups` (+ `positions`), `invites`,
  règles publiées le 15/09 (vérifiées : parcours valides acceptés, amitiés
  truquées, groupe imposé, faux pseudo, invitation trop longue et position
  d'autrui refusés). Modules `social-model.js` (testé), `social.js`,
  `social-ui.js`, `social.css` ; rendu du coéquipier dans `render.js`.
- Démarquage des amis et du coéquipier : pseudo vert, liseré autour du
  portrait (vert pour un ami, doré pour le coéquipier, comme son losange radar)
  et étiquette « AMI » / « GROUPE », dans le tchat, les listes de l'Équipage et
  le menu d'un pilote. Mis à jour en direct quand une amitié ou le groupe change.
- **Amarrage vaisseau à vaisseau avec le coéquipier.** En vol, à moins de
  150 m et sous 20 m/s : « Amarrer et échanger » (onglet Groupe ou toucher le
  vaisseau du coéquipier dans la vue). L'hôte s'immobilise, le visiteur accoste
  son flanc (nez au bout du bras), bras visible des deux côtés, fenêtre
  d'échange commune ; à la fin ou à l'annulation, bras rétracté et écartement.
  Vérifié avec deux parties simulées pilotées image par image. « Rejoindre »
  engage le cap assisté vers le coéquipier (onglet Groupe, menu du coéquipier) ;
  la condition de vitesse porte sur l'écart entre les deux vaisseaux, pour
  rattraper et ravitailler un coéquipier en panne sèche qui dérive.
- **Échange direct entre pilotes, à quai.** Avec un ami ou le coéquipier amarré
  à la même station : ressources de soute, crédits, carburant et modules en
  réserve. Demande depuis l'Équipage (« À quai ici » · Échanger) ou le menu d'un
  pilote du tchat, bandeau non bloquant chez l'autre pilote, double validation
  (verrouiller puis confirmer, toute modification déverrouille), séquestre
  sauvegardé restitué à l'annulation, au départ de la station ou au
  déverrouillage, règlement appliqué une seule fois de chaque côté (registre).
  Firestore : `trades/{uidA_uidB}` et `presence.portId`, règles publiées le
  15/09 (vérifiées : présence invalide, non-ami, offre non vide à la création,
  demande au nom d'un autre, lecture globale refusés). Parcours complet validé
  avec deux parties simulées (rien créé ni perdu, deux échanges successifs,
  annulation au départ). Modules `trade-model.js` (testé), `trade.js`,
  `trade-ui.js`, `trade.css`.
- **Escadrille en temps réel.** La position du coéquipier passe désormais par
  Firebase Realtime Database (`squad-live.js`, règles `database.rules.json`) :
  ~5 envois/s au plus quand le vaisseau bouge, trajectoire prolongée et lissée
  à chaque image (fini les sauts de 4 s), position effacée à la fermeture de
  l'onglet. Connexion ouverte seulement en groupe de 2. Accès par clé
  d'escadrille secrète (`groups/{id}.squadKey`) renouvelée à chaque arrivée et
  après un départ. Remplace `groups/{id}/positions` (Firestore, règles
  retirées). Rendu déplacé de `ui()` vers `frame()` dans `app.js`.

### Modifié

- **Interface PC / mobile Outer Reachs.** Profil et progression à gauche,
  localisation et objectif réel à droite ; barre inférieure Vaisseau, Contacts,
  Carte, Inventaire et Menu. Actions contextuelles séparées, radar circulaire
  sur PC, commandes tactiles et fenêtres adaptées aux petits écrans. Panneaux
  bleu nuit, contours cyan et accents dorés inspirés de la maquette 8309.
  Aucun changement aux règles, sauvegardes ou illustrations spatiales.
  Refonte validée en live par l’utilisateur ; ajustements de texte mobile consécutifs à sa capture.

- **Amarrage animé en bout de sas.** Le vaisseau n'est plus téléporté au
  centre de la station et masqué : il s'aligne sur le sas le plus proche
  (mesuré au bout des modules de chaque station, 12 sprites), un bras
  télescopique se déploie jusqu'à son nez et se verrouille (voyants), puis la
  fenêtre Station s'ouvre. Au départ, le bras se rétracte et le vaisseau
  s'écarte en pivotant vers l'extérieur. Le cap assisté vise directement le
  sas (plus de traversée de la station) ; la pose tient compte de la longueur
  de la coque (changement de coque à quai compris) ; le coéquipier à quai est
  visible avec son bras. Anciennes sauvegardes replacées au sas. Nouveaux
  modules `docking.js` (testé) et `dock-art.js`.
- **Refonte UI « digeste », mobile d'abord** (nouvelle feuille `ui-refresh.css`
  chargée en dernier, couleurs et esprit pixel-art conservés) :
  - Boutons : plus aucune coupure au milieu d'un mot — `overflow-wrap:anywhere`
    laissait un bouton en flex rétrécir à une lettre par ligne (« VE/ND/RE ·
    0 CR » dans la station sur bureau). Désactivés restent lisibles.
  - Textes des fenêtres en 13–14 px avec un interligne de 1,45 (au lieu de
    1,75), rien sous 11 px dans la nouvelle feuille ; rail à 12 px, « Rejoindre »
    des contacts à 12 px (8 px avant), noms de la carte à 12 px.
  - Moins de défilement sur mobile (mesuré en 390×844) : fenêtres en feuilles
    pleine largeur avec en-tête collant (Fermer toujours visible). Station
    commerce, Vaisseau, Soute, Stock, Profil : sans défilement ; Équipement
    1,7 écran ; Arbre 1,4 écran (familles visibles dès l'ouverture) ;
    Fabrication 2,9 écrans au lieu de 6,1 (recette et caractéristiques repliées
    dans « Détails », sur la ligne du bouton).
  - Prix, recettes, stocks et comparaisons de modules : listes libellé / valeur
    (`ui-lists.js`) ou pastilles, au lieu de textes « à la suite ».
  - Arbre des brevets : coques en grille de cartes (2 par ligne sur mobile) ;
    les symboles ⛏ ⌁ ✦ ↔, absents de la police pixel (affichés « ↖ », « ˅ »),
    remplacés par une pastille de couleur ; statut « Acquis ».
  - Aide en deux colonnes, menu contextuel centré sur mobile.
- **Tchat compact** : chaque message devient une card sur deux lignes —
  portrait pixel à gauche, pseudo, heure courte et ⋯ sur la première ligne, texte
  sur toute la largeur de la seconde — qu'un appui déplie en entier. Le portrait
  est la photo de profil Google de l'auteur, enregistrée avec son pseudo dans le
  message et la présence (champ `avatar`). Les règles Firestore n'acceptent que
  la photo du jeton Google de l'auteur (claim `picture`) et restent compatibles
  avec les messages sans photo ; à défaut (anciens messages, photo indisponible),
  un portrait pixel 8×8 est généré depuis l'identifiant du joueur. Le panneau s'ajuste au nombre de messages (273 px pour 6 messages sur
  mobile, 388 px avant), prend toute la largeur au-dessus des commandes quand
  il est ouvert, et la présence rejoint la ligne du compteur de caractères.
  Corrige aussi le grand cadre qui entourait chaque message (balise `<header>`
  héritant du style des panneaux).

### Corrigé

- **`cockpit-polish.css` : la moitié du fichier était ignorée par le navigateur
  depuis le 13/09.** Deux parenthèses non fermées
  (`#ship-tree-dialog{width:min(720px,calc(100vw - 16px);…` puis
  `min(960px,…`) font abandonner l'analyse de toute la suite de la feuille,
  sans erreur visible : les règles ajoutées ensuite (familles de l'arbre,
  carte de brevets, sprites de l'arbre, police compacte de « Rejoindre »…)
  n'ont jamais été appliquées. Le dédoublonnage du 15/09 avait en plus gardé
  les copies situées après la cassure, faisant perdre leurs styles aux
  contacts, au cartouche, au piratage et à la légende radar. Le fichier ne
  conserve désormais que la partie réellement active (313 lignes) :
  vérifié avec le parseur CSS du navigateur, 257 règles identiques et dans le
  même ordre qu'avant le dédoublonnage. Nouveau test `tests/css-syntax.test.js`
  : la CI refuse toute feuille aux parenthèses ou accolades déséquilibrées.

### Modifié

- Portes intersystèmes : quatre variantes cyan, ambre, violet et vert du modèle
  existant, détaillées dans la DA industrielle. Couleur stable par destination,
  passage central transparent, sprites en cache. Taille de 150 unités et transit conservés.


### Modifié

- Zones à sonder : quatre archives de télémétrie et quatre épaves patrimoniales
  détaillées dans la DA industrielle cuivre/cyan, dans tous les systèmes.
  Détourage et cache des sprites, quatre teintes de capteurs conservées.
  Taille de 144 unités et mécaniques de sondage inchangées.


### Modifié

- Les 15 raffineries et 30 petites stations utilisent huit architectures détaillées
  dans la DA industrielle cuivre/cyan : quatre raffineries et quatre petites stations.
  Atlas détouré et mis en cache, rendu sans lissage ; tailles et services conservés.
  Hubs inchangés, voyants fins adaptés aux nouvelles silhouettes.


### Ajouté

- Trafic civil d’Orée : Alouette (navette), Estafette (courrier), Grappin
  (remorqueur) et Chaland (ravitaillement), avec leurs sprites détaillés.
  Les deux mineurs neutres utilisent désormais Sillon et Veine. Six PNJ
  conservés, routes et vitesses différenciées, escales et messages radio
  adaptés. Aucun minerai consommé par les PNJ ; autres systèmes inchangés.


### Ajouté

- Tchat multijoueur en temps réel (Firestore) : panneau non modal repliable
  à droite sous le radar (feuille au-dessus des commandes tactiles sur mobile),
  canaux Global, Zone (suit automatiquement le système courant) et Groupe
  (état vide en attendant les invitations). Messages modifiables, supprimables
  et déplaçables entre canaux par leur auteur, limite 280 caractères, badges de
  non-lus, état replié mémorisé. Présence légère (`presence/{uid}`, battement
  60 s) avec compteur « en ligne / dans la zone ». Réservé aux pilotes
  connectés à Google ; nouvelles règles Firestore et deux index composites à
  publier (voir README, étapes 5 et 5 bis). Modules `chat-channels.js`
  (logique pure testée), `chat.js`, `presence.js`, `chat-ui.js`, `chat.css`.
  Le schéma réserve déjà `presence.groupId` et la collection `groups/` pour
  les invitations de groupe (duo), la liste d'amis et l'échange direct à venir.

### Corrigé

- Relocalisation des sites : `Math.round` d'un tirage négatif minuscule
  pouvait donner une coordonnée `-0`, sérialisée en `0` par JSON — le test
  de rechargement (comparaison stricte) échouait donc par intermittence
  selon le tirage (vu sur la CI). Coordonnées normalisées en `0`, test
  déterministe ajouté.
- Les touches de pilotage (ZQSD/WASD, flèches, Espace, E, F) sont ignorées
  quand un champ de saisie ou un menu contextuel a le focus. La navigation
  manette atteint aussi les zones de saisie (A donne le focus, B le rend au
  vaisseau).

### Modifié

- Gamme minière S/M/L/XL intégrée au vol et aux brevets : Sillon harmonisé,
  Veine et Strate validées, nouveau Filon XL. Sprites détaillés partagés,
  détourés et recadrés sans déformation, chargement indépendant des autres familles.
  Longueurs visuelles progressives : 100, 145, 200 et 270. Strate classée L ;
  statistiques et possessions des trois coques existantes conservées.

### Ajouté

- Filon XL fabriquable à 600 XP : 220 t de soute, 6 t/s d’extraction,
  180 de puissance, 3 emplacements utilitaires et 1 propulsion. Configuration
  initiale à équilibrer : accélération 30, rotation 0,7, chauffe 24, carburant 0,35.
  Recette : 520 ferrite, 50 conducteurs, 30 circuits bruts, 60 plaques de titane,
  1 800 Cr. Fabrication, pilotage, extraction et conservation en sauvegarde testés.


### Modifié

- Ceintures d’Orée : deux silhouettes détaillées par minerai, avec inclusions
  ocre (ferrite), cuivre, bleu pâle (silice), lavande (titane) et rose-violet
  (ruthénium). La répartition existante est conservée : aucun ruthénium ajouté
  à Orée. Variantes stables, transparence en cache et état épuisé conservé.


### Modifié

- Orée : une lune cratérisée, un soleil à surface granuleuse et deux planètes
  lointaines en pixel art détaillé, plus petits que la planète principale.
  Disposition pseudo-aléatoire stable, un seul soleil et une seule lune.
  Les autres systèmes conservent leurs astres. Sprites détourés et mis en cache.


### Modifié

- Hubs : quatre architectures détaillées en acier, cuivre et cyan, inspirées
  de la station de référence. Anneaux circulaire, hexagonal et double, et hub
  cruciforme ; ouvertures transparentes et sprites mis en cache sans lissage.
  La taille des hubs et les autres catégories de ports sont conservées.

### Modifié

- Planètes : atlas détaillé inspiré de la planète d'origine, six environnements
  répartis entre les quinze systèmes et tailles distinctes sur mobile et bureau.
  Transparence et découpage mis en cache, rendu sans lissage. Lunes, soleils et
  autres sprites conservés.

### Modifié
- Intégration de la planche de sprites validée le 14 septembre 2026 : coques en vol et dans les brevets, trafic, stations, portes, astéroïdes et sites d’Orée. Découpage sans déformation, transparence calculée une fois et rendu sans lissage. Les six modèles de vaisseaux sont partagés entre les douze coques suivant leur rôle.

### Ajouté

- Sites de données et de reliques : quatre silhouettes originales et quatre
  palettes par famille, dessinées en pixel art sans interpolation.
- Après récupération, un site disparaît des contacts et du radar pendant dix
  minutes, puis revient à une position aléatoire distante d'au moins 650 m de
  la précédente et dégagée des obstacles. Les positions déjà utilisées sont
  exclues ; emplacement, apparence et historique sont conservés en sauvegarde.
- Migration des anciens sites fixes et renouvellement hors ligne à l'échéance.


### Ajouté

- Quinze ambiances visuelles et musicales : aurores vertes/bleues d'ORÉE,
  voiles colorés par système, soleils, lunes cratérisées et planètes aux teintes,
  positions et surfaces variées. Les décors sont mis en cache pour limiter le coût.
- La musique 8 bits d'ORÉE est conservée ; les autres systèmes ont leur propre
  tonalité, rythme et motif. Les transitions sonores reconnaissent les 60 ports.
- Le trafic civil varie par système en densité, orientation et décalage des
  trajets. Les contacts restent neutres, notamment dans les systèmes sécurisés.


### Ajouté

- Les 15 systèmes existants deviennent jouables via leurs 21 liaisons
  bidirectionnelles. L'arrivée se fait à la porte correspondant au système quitté.
- Chaque système possède un hub, une raffinerie, deux petites stations et quatre
  groupes miniers. Les stocks restent indépendants pour chacun des 60 ports.
- Répartition des cinq minerais selon la sécurité : pas de ruthénium en zone
  sécurisée, rare en zone hostile et abondant en zone anarchique. Les sauvegardes
  existantes conservent leurs stocks et gisements épuisés ; les nouveaux secteurs
  sont ajoutés automatiquement. Aucun PNJ agressif n'est introduit.


### Ajouté

- Trois catégories visuelles de ports : hubs de 384 m, raffineries de 256 m et
  stations de 128 m, chacune avec quatre architectures pixel art originales.
  Les hubs et stations ont des feux intermittents ; les raffineries dégagent
  de légères particules de fumée. Le hub utilise le même rendu que les autres ports.


### Ajouté

- Refroidissement actif à la manette : maintenir L1/LB triple la
  dissipation de chaleur (27 %/s au lieu de 9 %/s passif). Aide au
  panneau des commandes et glyphe dynamique Xbox/PlayStation comme
  pour les autres boutons.

### Corrigé

- Piratage des sites : abandonner pendant l'affichage de la réussite annule
  désormais sa validation différée, pour éviter qu'elle ne touche une nouvelle
  tentative. La réussite et l'abandon ne sont déclenchés qu'une seule fois.
- Piratage des sites : les clics après les 45 secondes sont refusés immédiatement,
  même avant le prochain rafraîchissement du compte à rebours. Atteindre les
  18 mouvements arrête le minuteur pour éviter un double abandon à l'expiration.
  Cinq tests de régression couvrent ces cas et la réussite normale.

- Zoom à la molette sur la vue spatiale : la ligne avait été perdue par
  inadvertance lors de la réécriture du cartouche/HUD plus tard dans la
  journée (le message de commit correspondant affirmait pourtant l'avoir
  préservée). Restaurée à l'identique (bornes 0.25–1.4, pas de 0.08).
- Le déploiement direct par ZIP (mis en place aujourd'hui pour contourner
  la restriction de contributeur Git) publiait par défaut sur la
  **production** faute de paramètre `branch`, fusionnant de fait `dev`
  et `master`. Passage à `branch=dev` : la GitHub Action publie
  désormais un aperçu de branche (`dev--oree-flight.netlify.app`),
  distinct du site principal, qui reste piloté par l'intégration Git
  native de Netlify sur `master`.
- Restaure la présentation cartographique des systèmes après le retour arrière du panneau des vaisseaux.

- Retire la carte de brevets expérimentale, dont le rendu dégradait les sprites et la lisibilité ; le panneau par familles redevient la base stable.

- Les vaisseaux de l'arbre utilisent désormais des sprites pixel art dédiés plutôt que des symboles typographiques.

### Ajouté

- Plan de brevets interactif : carte horizontale, nœuds de coques positionnés et connecteurs SVG par famille.

- Arbre des vaisseaux réorganisé par familles : Minage, Exploration, Combat et Transport, avec emblème, liaison entre coques et fiche de brevet/recette au clic.
- Neuf coques supplémentaires sont préparées pour les branches Exploration, Combat et Transport.

- Corrige la priorité CSS du bouton « Rejoindre », qui était écrasée par les styles génériques de fenêtre : 8 px sur mobile, 7 px sous 340 px de large.

### Ajouté

- Déploiement Netlify automatique sur `dev`, quel que soit qui pousse,
  et sans clic manuel. Le plan Netlify gratuit ne construit que les
  pushs du contributeur Git reconnu (le propriétaire du dépôt) — les
  commits d'Imtherean échouaient silencieusement (« Unrecognized Git
  contributor »). Une GitHub Action
  (`.github/workflows/netlify-deploy.yml`) appelle un Build Hook
  Netlify à chaque push sur `dev`, ce qui contourne cette vérification
  d'identité, puis interroge l'API Netlify jusqu'à ce que le nouveau
  déploiement soit prêt et le publie (les déploiements déclenchés par
  Build Hook ne se publient pas automatiquement sur ce site, à la
  différence des push Git classiques). Secrets `NETLIFY_BUILD_HOOK_DEV`
  et `NETLIFY_AUTH_TOKEN` configurés côté GitHub, jamais commités.
- Zoom à la molette sur la vue spatiale, en plus des boutons +/-
  existants (mêmes bornes de zoom).

### Modifié

- Contacts couvre maintenant réellement tout le viewport mobile et bloque tout
  débordement horizontal ; seule sa liste défile verticalement. Le bouton
  Rejoindre emploie une police plus petite et une largeur garantie, même à 320 px.
- Le doublon Contacts de la barre inférieure est supprimé : le bouton central
  reste dédié à Station lorsqu'aucune cible n'est sélectionnée, puis à Actions.
- La fenêtre Contacts occupe désormais tout l'espace mobile disponible au-dessus
  des commandes, et la colonne Rejoindre est élargie pour afficher son libellé
  complet sur les petits écrans. Les noms longs des lieux y sont raccourcis
  (Archive, Épave, Fonderie, Raffinerie et Porte) sans réduire le nombre de contacts.
- Toute la carte stellaire est réespacée sur une surface défilante plus grande,
  afin que les 21 liaisons restent lisibles entre les blocs des 15 systèmes.
- Contacts devient une liste locale indépendante et compacte : station, porte,
  sites, ressources proches et trafic civil avec couleur radar, distance et
  un unique bouton Rejoindre. Les anciens blocs destination/station sont masqués.
- Un clic, clic droit ou appui sur un site d'archive ou une épave ouvre désormais
  ses actions contextuelles : sélectionner, rejoindre et sonder si les conditions
  de distance, vitesse et renouvellement sont réunies.
- La carte stellaire gagne de l'espace horizontal et éloigne TÉMÉRAIRE et
  ÉRÈBE du groupe central : les liaisons des systèmes périphériques restent
  visibles entre les nœuds, y compris pendant le défilement sur mobile.
- Le cartouche pilote conserve ses dimensions mais affiche désormais le lieu
  sur deux lignes si nécessaire, sans points de suspension, avec le même cadre
  pixel-art fin que les boutons.
- Les nœuds de la carte sont élargis afin que les noms restent entiers sur une
  seule ligne : aucun système, notamment TÉMÉRAIRE ou GANYMÈDE, n'est tronqué.
- Cartouche supérieur gauche figé : portrait puis système sur une seule ligne,
  lieu tronqué proprement sans redimensionner l'interface.
- Couleur de sécurité du système préparée dans les données : ORÉE sécurisé en
  vert, LISIÈRE hostile en jaune, catégorie anarchique rouge disponible.
- Profil replacé en première position du menu latéral.
- Le bouton Carte affiche désormais les 15 systèmes connus des Marches d'Orée
  sous forme de nœuds reliés et déplaçables sur mobile ; seuls ORÉE et LISIÈRE
  sont accessibles, les stations, portes et sites restant en navigation locale.
- Manette : l'extraction passe du bouton A à R1/RB, qui devient
  dédié à l'action de vol. A devient un vrai bouton de validation de
  menu (utilisé uniquement pour valider l'élément ciblé par le
  curseur de navigation), sans double rôle avec l'extraction.

### Ajouté

- Décodeur d’accès à fabriquer et installer : les archives et épaves sont
  désormais verrouillées sans ce module utilitaire.
- Mini-jeu de piratage tactile en grille 4×4 : relier l’entrée au noyau en
  moins de 45 secondes et 18 rotations avant de pouvoir sonder un site.
- Planche pixel-art dédiée aux portes, archives et épaves, avec silhouettes
  mécaniques plus détaillées et sans interpolation.
- Code couleur radar unifié : ennemis rouges, neutres bleus, ressources
  orange, stations vertes, sites violets et portes blanches.
- Première route ORÉE ↔ LISIÈRE : portes de transit à 8 % de carburant,
  hubs et petites stations spécialisées, carte compacte accessible à gauche.
- Archives de télémétrie et épaves patrimoniales à sonder : butin physique,
  15 XP d'exploration par site, délai de renouvellement de 10 minutes.
- Branche exploration : brevet Aiguille à 45 XP, coque à fabriquer avec
  les matériaux du jeu, scanner deux fois plus rapide et sprite original.
- Minerai ruthénifère dans LISIÈRE, raffinable en alliage de capteur.
- Respawn individuel des astéroïdes épuisés après 5 minutes réelles,
  compte à rebours et persistance des délais, y compris hors ligne.
- Stocks locaux par station et prix de rachat différenciés : hub à 80 %,
  petite station à 100 %, spécialité à 125 % du tarif de référence.
- Sauvegarde v3 toutes les 15 secondes et après action, compatible v1/v2,
  conservant position, systèmes, stocks et échéances d'exploration.
- Tests automatisés et guide EXPEDITION.md. Tests de logique et rendu
  simulé exécutés ; validation visuelle mobile et Firebase à effectuer.

- Niveau de pilote dans le panneau de profil : un niveau (25 XP de
  minage par niveau) avec une barre de progression vers le niveau
  suivant, en plus du total d'XP déjà affiché.
- B ferme le panneau ou menu contextuel ouvert (comme le bouton
  fermer ou Échap au clavier), en plus de son rôle de frein en vol.
- Navigation de l'interface à la manette : croix directionnelle pour
  déplacer un curseur (contour clair, façon sélection) parmi les
  boutons visibles du panneau/menu ouvert (ou du HUD principal s'il
  n'y en a pas), navigation spatiale (chaque direction choisit
  l'élément le plus proche dans cette direction). Le bouton A valide
  l'élément survolé par le curseur — mais seulement si le vaisseau
  n'a pas de propulsion active (poussée/marche arrière/strafe en
  cours) ; sinon A garde son rôle d'extraction habituel. Si aucun
  élément n'est ciblable dans la direction demandée, le conteneur
  défile à la place (listes longues : station, arbre des vaisseaux…).
- Détection automatique manette ↔ clavier/souris : l'interface
  s'adapte à la dernière entrée utilisée (`body[data-input-mode]`).
  En mode manette, un badge flottant affiche le bouton qui validera
  l'élément ciblé par le curseur, et les boutons Extraction/Amarrage
  affichent en permanence un badge (A/Y ou ✕/△ selon le modèle
  détecté). Ces badges disparaissent dès qu'une touche ou la souris
  est utilisée.
- Icônes de boutons adaptées au modèle de manette connecté (Xbox :
  A/B/X/Y colorés ; PlayStation : ✕/○/□/△ aux couleurs
  traditionnelles), détecté depuis l'identifiant du périphérique et
  affiché dans l'aide en jeu (`gamepad-nav.js`).
- Strafe RCS complet sur le stick droit de la manette, en plus de la
  poussée/rotation existantes : axe X pour la translation latérale,
  axe Y pour l'avant/arrière. `simulation.js` applique une
  accélération réduite (0.6×) dans la direction correspondante
  (`input.strafeX`/`input.strafeY`, -1 à 1 chacun), et consomme du
  carburant comme la poussée principale.
- Effets visuels façon RCS dans `render.js`, réutilisant le même
  langage visuel que la poussée principale mais en plus petit et plus
  fin : jets près du nez pour la marche arrière/RCS arrière, jets côté
  arrière pour le RCS avant, jets sur le flanc opposé au déplacement
  pour le strafe latéral. Leur nombre suit la taille de la coque
  pilotée (2 pour Sillon, 3 pour Veine/Strate).
- Support manette (API Gamepad standard, Xbox/PlayStation en USB ou
  Bluetooth) : stick gauche pour le cap (même logique que le joystick
  tactile), gâchettes droite/gauche pour la poussée/marche arrière, A
  pour l'extraction, B pour le frein, X pour cibler le contact le plus
  proche (station ou astéroïde), Y pour l'amarrage/services. Coupe le
  cap assisté dès qu'elle est utilisée, comme le clavier et le
  tactile. Section « Manette » ajoutée à l'aide en jeu.
  Non testé avec un vrai contrôleur physique dans cette session
  (automatisation navigateur indisponible) — à valider par
  l'utilisateur.

### Corrigé

- Le vaisseau du joueur disparaît désormais de la vue spatiale et du
  radar lorsqu'il est amarré, puis réapparaît dès le désamarrage à la
  position de sortie prévue par la simulation. Le visuel propre à
  chaque coque (Sillon/Veine/Strate) est conservé.
  Vérification : syntaxe JavaScript et lecture des transitions
  d'amarrage/désamarrage ; validation visuelle en jeu à effectuer.

- Le vaisseau du joueur affichait toujours le même sprite quel que
  soit le vaisseau piloté (Sillon/Veine/Strate) : les statistiques
  changeaient bien, mais pas le visuel. `render.js` dessinait le
  vaisseau avec un index d'atlas codé en dur au lieu de dépendre de la
  coque active. Réutilise maintenant les 3 portraits déjà dessinés
  pour l'arbre des vaisseaux (`ship-tree-atlas.png`), avec une
  pré-rotation de 90° puisqu'ils sont dessinés nez-en-haut alors que
  le jeu attend un vaisseau nez-à-droite à angle 0. Vérifié hors
  navigateur que l'orientation est correcte après rotation.

### Modifié

- Radar agrandi sur navigateur bureau (souris, écran large) : 185×196
  au lieu de 132×140, avec le même cadrage qu'avant, juste mis à
  l'échelle. Le mode mobile/tactile n'est pas concerné, il était déjà
  bien proportionné.

- Icônes surchauffe et carburant redessinées : ondes de chaleur (deux
  lignes en zigzag montantes, au-dessus d'une base) au lieu d'une
  flamme trop proche visuellement de la goutte de carburant, qui
  devient une vraie goutte arrondie avec un ombrage latéral.

- Les barres d'état (structure, surchauffe, carburant) quittent
  l'encart profil pour rejoindre la barre vitesse/cargaison en bas de
  l'écran, entre la vitesse et la cargaison, sous forme de petites
  jauges avec icône (bouclier à croix, ondes de chaleur, goutte de
  carburant).
  Toujours visibles pour tous les joueurs désormais — ce sont des
  informations de vol, pas des informations de profil. La jauge de
  soute a été retirée (redondante avec l'indicateur de cargaison déjà
  présent juste à côté) au profit d'icônes plus grandes et distinctes
  pour les 3 restantes.
- Encart en haut à gauche (à côté de « ORÉE / Station Relais-9 ») :
  affiche en permanence, une fois connecté, un portrait (avatar agrandi
  + pseudo en entier, sans troncature) à gauche et 4 barres d'état
  compactes (structure, surchauffe, carburant, soute) à droite, en
  flexbox. Encadré élargi (jusqu'à 480px) pour que rien ne se
  chevauche.
- Le bouton « Profil » du menu latéral affiche une icône « buste »
  dans le même style que les autres boutons du menu, au lieu de la
  photo de profil (qui reste affichée dans l'encart en haut à gauche
  et dans le panneau de profil). Recolorée avec les deux mêmes teintes
  que les autres icônes du menu (doré clair `#E6C88F` / bronze
  `#A88156`, extraites directement des PNG existants).
- Corrige les barres d'état invisibles et le débordement à droite sur
  les fenêtres étroites : chaque barre utilise une grille (libellé
  fixe + barre) au lieu d'un flexbox ambigu, et l'encart en haut à
  gauche passe les barres sous le portrait (au lieu de déborder) s'il
  n'y a pas assez de largeur pour les deux côte à côte.
- Retire ce comportement de repli : les libellés (STRUCTURE,
  SURCHAUFFE, CARBURANT, SOUTE) s'affichent maintenant toujours en
  entier à droite du portrait, jamais tronqués ni renvoyés à la ligne
  — l'encart en haut à gauche s'adapte à la largeur du contenu au lieu
  d'une largeur fixe en pourcentage.
- Encart plus compact sur mobile/écrans tactiles : avatar, pseudo,
  libellés et barres réduits pour rester lisibles sans prendre trop de
  place. Aligné sur le même seuil responsive que le reste du jeu
  (`900px`/`pointer:coarse`) au lieu d'un point de rupture isolé.
- Corrige le fond/cadre de l'encart qui ne suivait pas la largeur du
  contenu : une règle plus ancienne dans `cockpit-polish.css`
  plafonnait le header à 220px (destinée à la petite localisation
  seule), ce qui coupait visuellement les barres alors que le contenu
  débordait par-dessus. Le plafond ne s'applique plus quand le profil
  est affiché.
- Corrige un deuxième bug d'ordre CSS (constaté sur mobile réel) : la
  règle mobile de l'encart et celle du menu latéral étaient déclarées
  *avant* les règles générales dans le fichier, qui les écrasaient donc
  malgré une largeur de fenêtre plus petite. Réordonnées pour que les
  règles mobiles s'appliquent bien en dernier.
- Menu latéral (Arbre/Soute/Stock/Craft/Profil) réduit sur mobile
  (50px au lieu de 64px, icônes et texte plus petits) : il prenait
  trop de place à l'écran sur un vrai téléphone.

- Le bouton « Profil » a quitté l'en-tête pour rejoindre le menu
  latéral (avec les autres raccourcis Arbre/Soute/Stock/Craft), sous
  la forme d'un avatar miniature encadré. La connexion et la
  déconnexion Google se font désormais depuis le panneau de profil
  lui-même (bouton « Se connecter avec Google » avec le logo Google
  quand déconnecté, « Déconnexion » quand connecté).
- Panneau de profil élargi pour laisser respirer les pseudos longs, et
  deux nouvelles barres de progression : carburant et surchauffe (en
  plus de la structure et de la soute déjà présentes), dans le même
  style pixel que le reste du jeu.

- Encart compte (en-tête) : corrige les boutons « Profil » et
  « Déconnexion » qui se coupaient lettre par lettre faute de place —
  l'identité (avatar + pseudo) et les actions sont maintenant sur des
  lignes séparées, en pleine largeur. L'avatar Google est mis en
  valeur par un cadre dans le style pixel-art du jeu (bordure dorée,
  ombre portée), repris aussi en plus grand dans le panneau de profil.

- Panneau de profil : mise en page corrigée (les libellés ne se
  coupaient plus proprement sur deux lignes), ajout de deux barres
  colorées dans le thème du jeu (structure du vaisseau, remplissage de
  la soute) à la place de simples chiffres.
- Le pseudo ne peut désormais être changé qu'une fois toutes les 72h
  (le champ se verrouille automatiquement et affiche le temps restant
  avant le prochain changement possible).

### Corrigé

- Cartouche supérieur gauche : le nom de système affiché restait figé
  sur « ORÉE » (vert, sécurisé) quel que soit le système réellement
  visité — la couleur de sécurité par système avait été préparée dans
  les données mais jamais branchée à l'affichage. Il reflète maintenant
  `w.systemId` en direct (nom + couleur de sécurité) à chaque saut.
- Léger décalage horizontal entre le cadre du cartouche et la colonne
  de boutons du menu latéral (12 px vs 8 px de marge) : les deux
  utilisent maintenant le même retrait, aussi bien en bureau qu'en
  mobile.

## [0.2.0] - 2026-09-12

### Ajouté

- Panneau « Profil du pilote », accessible une fois connecté avec
  Google : avatar du compte Google, pseudo personnalisable (distinct
  du nom Google, sauvegardé avec la partie), et récapitulatif de
  progression (vaisseau actif, crédits, XP de minage, minerai vendu au
  total, modules installés, nombre de coques débloquées sur le total).
  Le bouton « Profil » n'apparaît que pour un joueur connecté — la
  connexion Google reste la condition pour débloquer ce panneau, comme
  souhaité.

### Modifié

- Configuration Firebase réelle renseignée (`firebase-config.js`) : la
  connexion Google et la sauvegarde cloud, ajoutées en v0.1.0 mais
  inactives jusqu'ici, sont maintenant fonctionnelles. Vérifié de bout
  en bout dans un vrai navigateur : connexion, pseudo, progression et
  persistance après rechargement.

## [0.1.0] - 2026-09-12

### Ajouté

- Récupération complète du code source du jeu depuis le déploiement en
  ligne (`https://oree-flight.vekamelgaming.chatgpt.site`), aucun
  dépôt source n'étant connu jusque-là : HTML, CSS, 16 modules JS et
  tous les assets (sprites, icônes, police pixel).
- Dépôt Git local puis dépôt GitHub privé
  ([`oree-flight`](https://github.com/ResmoSyssla/oree-flight)), avec
  Imtherean invité comme collaborateur.
- Serveur de développement local (PowerShell, sans dépendance externe)
  avec raccourcis Bureau « Démarrer »/« Arrêter ».
- Script `scripts/sync-from-live.ps1` pour comparer le code local à la
  version actuellement en ligne, sans jamais écraser le travail local.
- Connexion Google et sauvegarde cloud (Firebase Authentication +
  Firestore) : identification du joueur et sauvegarde de partie dans
  le cloud, en plus de la sauvegarde locale existante. Fonctionnalité
  inactive tant que les clés du projet Firebase ne sont pas renseignées
  dans `firebase-config.js` (voir README).
- Mise en place du workflow de branches (`master` stable / `dev`
  développement actif) et de ce changelog.

