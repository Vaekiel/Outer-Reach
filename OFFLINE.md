# Jouer hors ligne

Le jeu fonctionne en mode solo sans compte Google, sans Firebase et sans connexion Internet. La progression est sauvegardée dans le `localStorage` du navigateur utilisé.

Depuis la racine du dépôt :

```bash
./scripts/serve-offline.sh
```

Puis ouvrir `http://127.0.0.1:8080/`. Le serveur local est nécessaire car le jeu utilise des modules JavaScript ES ; ouvrir directement `index.html` en `file://` peut être bloqué par le navigateur.

Le tchat, les amis, l’équipage et les échanges en ligne sont désactivés dans cette version solo hors ligne.
