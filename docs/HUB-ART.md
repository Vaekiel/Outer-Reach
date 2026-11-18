# Hubs détaillés — 14 septembre 2026

Atlas : `assets/hub-stations.png` (1254 × 1254), grille 2 × 2.
Outil : imagegen intégré. Référence : station de `oree-atlas.png`.

## Prompt de génération

Create ONE production sprite atlas for Outer Reach Online: FOUR different LARGE SPACE STATION HUBS, square 2048x2048 atlas arranged in exact 2 columns by 2 rows, each equal 1024x1024 cell with one fully contained station centered and spanning about 850 pixels. Reference image: use ONLY the top-right ring station as the art direction reference. Match its extremely fine crisp pixel art, worn steel armor plates, layered machinery, copper ribs and pipes, teal glass modules, tiny cyan windows, rivets, antennae and deep mechanical relief. STRICT orthographic TOP-DOWN plan view, no perspective tilt, no 3D isometric. Four clearly DIFFERENT silhouettes: top-left large circular industrial ring with open center and four massive cardinal docking towers closely inspired by reference; top-right hexagonal segmented habitat ring with six docking arms and intricate radial spokes; bottom-left twin linked rings around a reinforced rectangular central shipyard spine with side docking bays; bottom-right massive cruciform trade hub with four wide armored arms, rectangular cargo docks, central octagonal command core. Each must look equally rich, believable and huge. Unified desaturated gunmetal gray, copper bronze and muted cyan palette; upper-left illumination. Fine pixel texture, no chunky blocks, no smooth illustration. No ships, planets, rocks, text, labels, stars or decorative frames. PERFECT PURE BLACK RGB 0,0,0 background including ALL holes, gaps and empty interior ring centers for runtime transparency. Keep ALL actual station surfaces including shadows above RGB 12; black reserved for empty space. Each silhouette separated by generous black margins, no cropping or touching grid boundaries.

## Intégration

Quatre variantes stables attribuées par les données existantes des ports.
Taille des hubs conservée (416 m). Découpage natif, transparence du noir
extérieur et des ouvertures internes, cache par variante, rendu sans lissage.
Les raffineries et petites stations conservent leur rendu de la branche dev.
