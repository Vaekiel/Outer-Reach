# Carte du monde — règles responsive

La carte des Marches d’Orée doit rester jouable sur téléphone, tablette et ordinateur.

## Règles de rendu

- La carte se parcourt uniquement horizontalement.
- Les noms de systèmes restent toujours sur une seule ligne.
- Aucun nœud ne doit toucher les bords supérieur ou inférieur de la zone cartographique.
- Les systèmes sont distribués sur trois bandes verticales sûres : haut, milieu, bas.
- Les connexions SVG utilisent exactement les mêmes coordonnées que les nœuds.
- Sur les écrans très peu hauts, les informations secondaires sous la carte sont masquées avant de réduire la zone cartographique.
- Les futures régions définissent leurs propres dimensions, systèmes et connexions via `worldRegions`.

## Déploiement collaboratif

Le déploiement de `dev` est lancé par GitHub Actions et non directement par l’intégration Git de Netlify. Ainsi, l’auteur du push n’a pas besoin d’être membre du compte Netlify.

Le secret `NETLIFY_AUTH_TOKEN` doit toutefois être un jeton valide d’un compte ayant accès au site Netlify cible. Si le site appartient à Resmo, Resmo doit créer ou renouveler ce jeton et mettre à jour le secret GitHub une seule fois. Ensuite les pushs des deux collaborateurs peuvent être publiés par le même workflow.
