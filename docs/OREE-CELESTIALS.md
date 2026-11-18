# Petits astres d’Orée — 14 septembre 2026

Asset : `assets/oree-celestials.png`, atlas 2 × 2. Outil imagegen intégré.
Référence : planète de `oree-atlas.png`.

## Consigne de génération

Create ONE game sprite atlas of small distant celestial bodies for the OREE solar system in Outer Reach Online. Reference image is art direction only: match the bottom-right planet's finely detailed pixel art, layered mottled surface texture, stepped spherical shading, restrained teal/copper palette, crisp tiny pixels. Output square 1536x1536, EXACT equal 2x2 grid, each 768x768 cell containing one circular sprite centered at (384,384),(1152,384),(384,1152),(1152,1152). Each globe diameter 560 pixels maximum including any corona. GENEROUS pure black margins between cells. Top-left: ONE airless gray-blue MOON with many deeply shaded impact craters of varied sizes, pitted weathered rock, bright upper-left and dark lower-right. Top-right: ONE SUN, copper-gold and warm ivory, bright textured granular photosphere, swirling convection cells and tiny restrained prominences; fully self luminous sphere with no black night side, narrow pixel-art corona, no giant rays or lens flare. Bottom-left: ONE remote muted teal and ochre rocky PLANET with tiny broken continents and subtle thin atmosphere; bottom-right: ONE remote blue-gray GAS PLANET with intricate subdued cloud bands and a small pale storm, no rings. All four read clearly at 30-70 game pixels; retain fine texture without visual noise. Orthographic spherical views, no perspective scene. Use SOLID PURE BLACK RGB(0,0,0) background, no checkerboard, no stars, text, labels, ships or UI. Non-empty sprite shadows above RGB 12. No ambient background glows beyond compact sun corona. Do not reproduce the station, asteroid or ship from the reference.

## Intégration

Orée uniquement : une lune, un soleil et deux planètes lointaines.
Rayons de décor 28, 34, 18 et 23 contre 82 pour la planète principale,
réduits par le même facteur sur petits écrans. Positions pseudo-aléatoires
reproductibles. Découpage et transparence calculés une fois par sprite.
Les autres systèmes conservent strictement leurs données d’astres.
