# Planètes — 14 septembre 2026

Asset : `assets/planet-environments.png`, atlas 1536 × 1024, six cases
512 × 512. Génération via l'outil imagegen intégré, référence `oree-atlas.png`.

Consigne de génération : créer un atlas de planètes uniquement, grille 3 × 2,
en respectant la planète en bas à droite de la référence : pixel art fin,
textures minérales détaillées, continents découpés, volume sphérique,
éclairage en haut à gauche et ombre en bas à droite. Première ligne : monde
continental turquoise/cuivre, glaciaire cyan, désertique ocre. Deuxième ligne :
océanique bleu et nuageux, volcanique sombre et fissuré, géante gazeuse aux
bandes crème/mauve/turquoise. Sans texte, étoiles, anneaux ou autres objets.

Correction finale : remplacer uniquement le damier de fond par du noir pur,
en conservant les six planètes, leurs textures, couleurs et positions.
Le moteur retire le noir connecté aux bords une fois par case, en cache.

Les quinze systèmes choisissent un environnement et un rayon fixes dans
`ambience.js`. La réduction mobile utilise un facteur commun : les différences
de taille sont préservées. Lunes, soleils et autres objets restent inchangés.
