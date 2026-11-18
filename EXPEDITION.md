# Première route intersystème

Cette itération étend le prototype solo existant. La simulation et les prix
restent locaux au client : ce n'est pas encore un marché entre joueurs.

## Jouer

1. Quitter la station. **Carte** affiche uniquement les 15 systèmes des
   Marches d'Orée, leurs liaisons et la position actuelle. La carte se déplace
   horizontalement et verticalement au doigt ; Les 15 systèmes sont accessibles par leurs 21 liaisons bidirectionnelles.
2. Toucher une porte, un site ou une station dans l'espace ou sur le radar pour
   ouvrir les contacts locaux, puis choisir **Rejoindre**.
3. À l'arrivée, toucher de nouveau le contact et choisir **Transiter**,
   **Sonder** ou **Amarrer**.
4. Un transit coûte 8 % de carburant, nécessite moins de 180 m et une vitesse
   inférieure ou égale à 20 m/s. La porte se recharge pendant 8 secondes.
5. Chaque liaison possède une porte dans chaque système ; le transit débouche
   près de la porte de retour.

ORÉE est actuellement classé sécurisé (vert) et LISIÈRE hostile (jaune). Le
rouge est réservé aux futurs systèmes anarchiques. Ces statuts sont pour le
moment informatifs ; leurs règles de jeu seront définies dans une autre étape.

## Ressources et économie

Chaque système a un hub, une raffinerie spécialisée, deux petites stations, des ceintures,
une archive de télémétrie et une épave patrimoniale.
ORÉE conserve les minerais existants. LISIÈRE remplace la ferrite par du
minerai cuivré et dispose de gisements ruthénifères rares (6 astéroïdes).
Le minerai ruthénifère se raffine en alliage de capteur, utilisé pour l'Aiguille.

Les hubs rachètent à 80 % du prix de référence (arrondi à l'entier inférieur).
Les petites stations rachètent au prix de référence, majoré de 25 % pour leur
spécialité : cuivre à ORÉE et ruthénium à LISIÈRE. Les tarifs restent fixes
pour cette première itération. Les stocks de ressources sont propres à chaque
station ; il faut retirer la marchandise en soute pour la transporter.
Les coques et modules possédés restent gérés globalement dans ce prototype.

## Exploration

L'ouverture d'un site exige un **Décodeur d'accès** installé dans un emplacement
utilitaire. Il se fabrique avec 16 t de ferrite, 6 t de conducteurs et 5 t de
circuits. Sans lui, le site reste verrouillé. L'ouverture lance une grille 4×4 :
il faut tourner les segments et relier l'entrée au noyau en moins de 45 secondes
et 18 mouvements. Une réussite déclenche ensuite le sondage de 16 secondes en
restant à moins de 180 m et sous 20 m/s. Un site rapporte 2 t de récupération
(matrices de télémétrie ou pièces patrimoniales) et 15 XP d'exploration.
Le site devient indisponible 10 minutes après la récupération.
La soute doit avoir au moins 2 t libres ; le déplacement hors de portée
interrompt le sondage sans butin ni XP.

Le radar code les contacts par fonction : bleu pour les neutres, orange pour
les ressources, rouge pour les ennemis, vert pour les stations, violet pour
les sites et blanc pour les portes. La rangée de six pixels dans son titre
rappelle cet ordre sans prendre de place sur mobile.

À 45 XP d'exploration, le brevet de l'**Aiguille** est acquis. La coque
reste à fabriquer : 60 t de ferrite, 8 t de conducteurs, 8 t de circuits,
2 t d'alliage de capteur et 280 Cr. Elle sonde en 8 secondes, avec
20 t de soute et un minage moins performant. Sa branche est distincte
du minage dans l'arbre, et son sprite procédural est original.

## Respawn et sauvegarde

Un astéroïde épuisé retrouve son stock initial après 5 minutes réelles.
Le délai est individuel, continue à quai et hors ligne, et ne remplit pas
un astéroïde encore partiellement exploité. Un compte à rebours remplace
la quantité disponible dans Contacts et le menu contextuel.

La sauvegarde v3 conserve secteurs, stocks locaux, échéances et position.
Elle reste compatible avec les parties v1/v2, et est écrite après une action
et toutes les 15 secondes, en local et dans le cloud si connecté.
Les horodatages reposent sur l'horloge du client ; une future simulation
serveur devra en devenir l'autorité.

## Vérification

`npm test` : tests de simulation, économie, exploration, migration et rendu
avec contexte Canvas simulé. La vérification visuelle mobile et la connexion
Firebase réelle doivent encore être effectuées : le navigateur de test n'a
pas pu être téléchargé dans l'environnement de développement.

Les cinq minerais restent la ferrite, le cuivre, la silice, le titane et le
ruthénium. Le ruthénium est absent des systèmes sécurisés, rare dans les
systèmes hostiles et majoritaire dans les systèmes anarchiques. Les statuts
de sécurité ne déclenchent pas de combat : les PNJ restent civils.

Les sites disparaissent pendant leurs dix minutes de renouvellement, puis
réapparaissent à une nouvelle position éloignée des structures et gisements.
Leur historique de positions et leurs variantes sont sauvegardés. Les sites de
données et de reliques ont chacun quatre silhouettes et quatre palettes pixel art.
