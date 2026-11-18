# Astéroïdes minéralisés — 14 septembre 2026

Asset : `assets/asteroid-ores.png` (1983 × 793), atlas de cinq colonnes et
 deux lignes. Généré avec imagegen intégré ; référence `oree-atlas.png`.

## Consigne de génération

Create ONE production asteroid sprite atlas for Outer Reach Online. Reference image is STYLE REFERENCE: match the bottom-left asteroid's rich finely detailed pixel art, pitted gray rock, deep shaded impact craters, varied mineral inclusions, rugged faceted silhouette, upper-left illumination, industrial restrained palette. Ten asteroids total in an EXACT 5 COLUMN x 2 ROW grid, landscape 2560x1024; one fully contained asteroid per equal 512x512 cell, centered with generous pure black margins, maximum 400px silhouette diameter. EACH COLUMN is a mineral, same color family across its two rows: column1 FERRITE: ochre beige and iron-gray metallic seams, #d6bd91 accents; column2 COPPER: warm copper orange metallic veins #e59970; column3 SILICA: pale icy blue-white translucent quartz inclusions #bdd9e4; column4 TITANIUM: muted lavender and silver metallic plates #b7a3dc; column5 RUTHENIUM: dusty pink-violet lustrous ore clusters #d2a0db. Both silhouettes in each column must be obviously different. Top row shapes respectively: squat cratered angular boulder; asymmetric elongated wedge; split jagged crystalline boulder; triangular blocky fragment; knobby lopsided mass. Bottom row: elongated fractured iron chunk; round lobed copper boulder; tall narrow faceted shard; broad flat irregular slab; deeply notched twin-lobed chunk. All are believable rocky asteroids with subtle embedded colored ore covering 25-35 percent of surface, not giant gemstones, no neon glow, no smooth spheres. Diverse crater sizes, tiny fractures, fine pixel textures and strong readable volume; keep details distinguishable at game scale. SOLID PERFECT BLACK RGB 0,0,0 BACKGROUND including all gaps and holes; station material shadows above RGB12 so black can be made transparent. No text, labels, grid lines, border frames, stars, ships, planets, or stations. No asteroid may touch its cell boundary.

## Intégration

Colonnes : ferrite, cuivre, silice, titane, ruthénium. Deux silhouettes par
minerai ; variante stable selon l’identifiant de l’astéroïde. Les couleurs
suivent `resources.js`. Rendu activé uniquement pour les gisements d’Orée,
sans changer leur minerai, position, taille physique, rendement ou renouvellement.
Le ruthénium est préparé dans l’atlas mais reste absent des gisements d’Orée.
