# ORÉE — Prospecteur

Jeu de prospection/minage spatial en HTML/CSS/JavaScript (ES modules), sans étape de build.

Dépôt : https://github.com/ResmoSyssla/oree-flight (privé)

## Origine

Ce code a été récupéré le 2026-09-12 depuis le déploiement en ligne du
créateur original (`https://oree-flight.vekamelgaming.chatgpt.site`),
aucun dépôt source n'étant connu à ce moment-là. Le site étant servi
en fichiers statiques non minifiés, tout le code source a pu être
reconstitué à l'identique (HTML, CSS, modules JS, assets), puis versé
dans ce dépôt Git pour permettre une collaboration normale.

## Lancer le jeu en local

Deux raccourcis sont disponibles sur le Bureau de la machine de
développement :

- **ORÉE - Démarrer le serveur** — lance un petit serveur HTTP local
  (PowerShell, sans dépendance externe) sur `http://localhost:8080/`
  et ouvre le jeu dans le navigateur.
- **ORÉE - Arrêter le serveur** — l'arrête proprement.

Ces raccourcis pointent vers `scripts/start-server.bat` et
`scripts/stop-server.bat`. Sur une autre machine, lancez directement :

```
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\serve.ps1
```

puis ouvrez `http://localhost:8080/`. Le jeu est composé d'ES modules
(`<script type="module">`), donc il ne fonctionne pas ouvert en
`file://` — un serveur local est nécessaire.

## Interface PC et mobile

La présentation inspirée de la maquette Outer Reachs est isolée dans
`interface.js` et `interface.css`. Elle réutilise les boutons et gestionnaires
existants : Vaisseau, Contacts, Carte, Inventaire (cargaison), Menu. Le Menu
regroupe profil, équipage, brevets, stock à quai, fabrication et aide.
Le bouton circulaire Station / Actions garde son comportement contextuel.
Le niveau, la progression, le lieu et l’objectif proviennent de la partie.
Aucun service commercial ou objectif fictif n’est ajouté.

Sur PC, le radar reste visible en bas à droite ; sur mobile, Contacts
permet de retrouver les destinations sans occuper la vue avec un radar.
Le joystick, la poussée et le frein restent accessibles. Les fenêtres gardent
leurs onglets et leur contenu, avec défilement interne et bouton de fermeture.
Le format paysage court et les marges de sécurité sont pris en compte.
La police embarquée Outer Mono (DejaVu Sans Mono, licence dans `assets/ui`)
assure les mêmes glyphes sur PC/mobile : navigation inférieure 9 px, autres
commandes compactes 10 px, informations 11 px, contenu 13 px et titres 15 px.
Toutes les tailles de texte, y compris les étiquettes spatiales, ont été réduites de 1 px.
Le menu inférieur reprend le fond bleu nuit et le double contour fin des panneaux.
Un seul bouton Tchat est conservé ; le titre et le slogan centraux sont retirés.

Validation manuelle avant commit : lancer `python -m http.server 8765`,
ouvrir le jeu sur PC (1440 × 900), mobile (390 × 844 et 320 × 568) et paysage
(844 × 390). Vérifier les cinq commandes, les services de station, les onglets,
la fermeture avec Échap, le retour du focus et l’absence de chevauchement
avec les commandes tactiles. Cette validation visuelle n’a pas pu être menée
dans l’environnement de travail : le navigateur distant refuse localhost.

## Workflow de développement

- **`master`** — version stable. Ne reçoit du code que par fusion
  depuis `dev`.
- **`dev`** — branche de développement actif. C'est ici que le
  travail en cours doit se faire (directement, ou via des branches
  `feature/...` qui se rebasent/fusionnent dans `dev`).
- **Tags `vX.Y.Z`** — marquent un état stable de `master` (ex.
  `v0.1.0` = état récupéré depuis le site en ligne + outillage
  initial). Créez un nouveau tag à chaque fusion `dev → master`
  significative :

  ```
  git checkout master
  git merge dev
  git tag -a v0.2.0 -m "Résumé des changements"
  git push origin master --tags
  ```

Chaque commit et chaque nouvelle version doivent être décrits
clairement en français, avec une entrée détaillée dans
[`CHANGELOG.md`](CHANGELOG.md) — voir [`CONTRIBUTING.md`](CONTRIBUTING.md)
pour la convention complète (elle s'applique aussi au travail
d'Imtherean, avec ou sans Git de son côté).

## Collaborer avec le créateur original

Le dépôt est privé sur GitHub et le créateur original y a été invité
comme collaborateur. Deux façons de travailler ensemble :

- **S'il utilise Git** : il clone le dépôt, travaille sur `dev`
  (ou une branche `feature/...`), pousse ses commits, et on fusionne
  via des pull requests classiques.
- **S'il continue à déployer uniquement via ChatGPT** (sans Git) : sa
  seule source de vérité reste le site en ligne. Le script suivant
  retélécharge tous les fichiers connus dans `_live-snapshot/` **sans
  toucher au code local**, puis liste les fichiers qui diffèrent :

  ```
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\sync-from-live.ps1
  ```

  À faire ensuite : comparer manuellement les fichiers listés comme
  différents (`fc fichier_local fichier_snapshot`) et fusionner à la
  main ce qui doit l'être, sur `dev` — le script ne modifie
  jamais le code de travail automatiquement. Si un nouveau fichier
  apparaît côté
  site (module JS, asset), l'ajouter à la liste `$files` en haut du
  script.

  ⚠️ Le HTML servi embarque un jeton anti-bot Cloudflare qui change à
  chaque requête (`window.__CF$cv$params`) — le script l'ignore déjà
  dans sa comparaison, ce n'est pas un vrai changement de code.

## Compte Google et sauvegarde cloud

Le jeu peut identifier le joueur via un compte Google et sauvegarder sa
partie dans le cloud (Firestore), en plus de la sauvegarde locale
existante (`localStorage`). Tant que `firebase-config.js` contient ses
valeurs `REMPLACER_*` par défaut, cette fonctionnalité reste désactivée
sans rien casser : le bouton « Connexion Google » est simplement
grisé et le jeu fonctionne comme avant (sauvegarde locale uniquement).

### Créer le projet Firebase (à faire une seule fois)

1. Aller sur https://console.firebase.google.com/ et se connecter avec
   un compte Google.
2. **Ajouter un projet** → nommez-le par ex. `oree-flight` → vous
   pouvez décocher Google Analytics (pas nécessaire) → **Créer le
   projet**.
3. Dans le menu de gauche, section **Compilation** → **Authentication**
   → **Get started** → onglet **Sign-in method** → activer le
   fournisseur **Google** → renseigner un e-mail d'assistance →
   **Enregistrer**.
4. Menu de gauche → **Firestore Database** → **Créer une base de
   données** → choisir une région proche (ex. `europe-west1`) →
   démarrer en **mode production** → **Activer**.
5. Dans Firestore, onglet **Règles**, remplacer le contenu par :

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       function signedIn() { return request.auth != null; }
       function isOwner(uid) { return signedIn() && request.auth.uid == uid; }
       function validPseudo(p) { return p is string && p.size() >= 1 && p.size() <= 24; }
       function validText(t) { return t is string && t.size() >= 1 && t.size() <= 280; }
       function validSystem(s) { return s is string && s.matches('^[a-z]{2,24}$'); }
       function validChannel(c) {
         return c is string && (c == 'global'
           || c.matches('^zone:[a-z]{2,24}$')
           || c.matches('^group:[A-Za-z0-9_-]{4,40}$'));
       }
       // Les canaux de groupe exigent d'être membre du groupe.
       function canUseChannel(c) {
         return !c.matches('^group:.*$')
           || (exists(/databases/$(database)/documents/groups/$(c.split(':')[1]))
               && request.auth.uid in get(/databases/$(database)/documents/groups/$(c.split(':')[1])).data.members);
       }
       function myPresencePseudo() {
         return get(/databases/$(database)/documents/presence/$(request.auth.uid)).data.pseudo;
       }
       // Photo de profil facultative : uniquement celle du compte Google de l'auteur (claim « picture » du jeton).
       function validAvatar(data) {
         return !('avatar' in data)
           || (data.avatar is string && data.avatar.size() <= 1024
               && data.avatar == request.auth.token.get('picture', ''));
       }

       // Sauvegardes : chaque joueur ne lit/écrit que la sienne.
       match /saves/{uid} {
         allow read, write: if isOwner(uid);
       }

       // Présence (tchat) : lisible par tout pilote connecté, écrite uniquement par son propriétaire.
       match /presence/{uid} {
         allow read: if signedIn();
         allow create, update: if isOwner(uid)
           && request.resource.data.keys().hasOnly(['pseudo','systemId','groupId','portId','lastSeen','avatar'])
           && validAvatar(request.resource.data)
           && validPseudo(request.resource.data.pseudo)
           && validSystem(request.resource.data.systemId)
           // Station où le pilote est amarré (null en vol) : échanges directs à quai.
           && (!('portId' in request.resource.data) || request.resource.data.portId == null
               || (request.resource.data.portId is string && request.resource.data.portId.matches('^[a-z-]{2,24}$')))
           && (request.resource.data.groupId == null
               || (request.resource.data.groupId is string
                   && request.auth.uid in get(/databases/$(database)/documents/groups/$(request.resource.data.groupId)).data.members))
           && request.resource.data.lastSeen == request.time;
         allow delete: if isOwner(uid);
       }

       // Messages du tchat : toute requête DOIT filtrer sur channel (sinon la lecture est refusée).
       match /messages/{id} {
         allow read: if signedIn() && canUseChannel(resource.data.channel);
         allow create: if signedIn()
           && request.resource.data.keys().hasOnly(['uid','pseudo','avatar','channel','text','createdAt','editedAt'])
           && validAvatar(request.resource.data)
           && request.resource.data.uid == request.auth.uid
           && validPseudo(request.resource.data.pseudo)
           && request.resource.data.pseudo == myPresencePseudo()
           && validChannel(request.resource.data.channel)
           && canUseChannel(request.resource.data.channel)
           && validText(request.resource.data.text)
           && request.resource.data.createdAt == request.time
           && request.resource.data.editedAt == null;
         allow update: if signedIn()
           && resource.data.uid == request.auth.uid
           && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['text','channel','editedAt'])
           && validText(request.resource.data.text)
           && validChannel(request.resource.data.channel)
           && canUseChannel(request.resource.data.channel)
           && request.resource.data.editedAt == request.time;
         allow delete: if signedIn() && resource.data.uid == request.auth.uid;
       }

       // Profils publics (pseudo, photo) : noms des amis même hors ligne et recherche par pseudo.
       match /profiles/{uid} {
         allow read: if signedIn();
         allow create, update: if isOwner(uid)
           && request.resource.data.keys().hasOnly(['pseudo','pseudoKey','avatar','updatedAt'])
           && validPseudo(request.resource.data.pseudo)
           && request.resource.data.pseudoKey == request.resource.data.pseudo.trim().lower()
           && validAvatar(request.resource.data)
           && request.resource.data.updatedAt == request.time;
         allow delete: if isOwner(uid);
       }

       // Amitiés : document « uidA_uidB » (uids triés) ; seul le destinataire accepte, chacun peut supprimer.
       match /friendships/{pairId} {
         allow read: if signedIn() && request.auth.uid in resource.data.uids;
         allow create: if signedIn()
           && request.resource.data.keys().hasOnly(['uids','requestedBy','status','createdAt','updatedAt'])
           && request.resource.data.uids is list && request.resource.data.uids.size() == 2
           && request.auth.uid in request.resource.data.uids
           && request.resource.data.uids[0] < request.resource.data.uids[1]
           && pairId == request.resource.data.uids[0] + '_' + request.resource.data.uids[1]
           && request.resource.data.requestedBy == request.auth.uid
           && request.resource.data.status == 'pending'
           && request.resource.data.createdAt == request.time
           && request.resource.data.updatedAt == request.time;
         allow update: if signedIn()
           && request.auth.uid in resource.data.uids
           && resource.data.status == 'pending'
           && request.auth.uid != resource.data.requestedBy
           && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status','updatedAt'])
           && request.resource.data.status == 'accepted'
           && request.resource.data.updatedAt == request.time;
         allow delete: if signedIn() && request.auth.uid in resource.data.uids;
       }

       // Groupes duo : on crée seul, on rejoint avec une invitation valide, on quitte librement.
       match /groups/{groupId} {
         function invitation(uid) {
           return get(/databases/$(database)/documents/invites/$(groupId + '_' + uid)).data;
         }
         allow read: if signedIn() && (request.auth.uid in resource.data.members
           || exists(/databases/$(database)/documents/invites/$(groupId + '_' + request.auth.uid)));
         // Clé secrète des positions temps réel (Realtime Database /squads/{clé}), lisible par les seuls membres et l'invité.
         function validSquadKey(data) {
           return !('squadKey' in data) || (data.squadKey is string && data.squadKey.matches('^[A-Za-z0-9_-]{32,64}$'));
         }
         allow create: if signedIn()
           && request.resource.data.keys().hasOnly(['members','leader','createdAt','squadKey'])
           && validSquadKey(request.resource.data)
           && request.resource.data.members == [request.auth.uid]
           && request.resource.data.leader == request.auth.uid
           && request.resource.data.createdAt == request.time;
         allow update: if signedIn()
           && request.resource.data.members.size() <= 2
           && validSquadKey(request.resource.data)
           && (
             // Rejoindre (avec une nouvelle clé : un invité qui a refusé ne connaît pas celle du duo formé ensuite).
             (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['members','leader','squadKey'])
               && !(request.auth.uid in resource.data.members)
               && resource.data.members.size() == 1
               && request.resource.data.members == resource.data.members.concat([request.auth.uid])
               && request.resource.data.leader == resource.data.leader
               && exists(/databases/$(database)/documents/invites/$(groupId + '_' + request.auth.uid))
               && invitation(request.auth.uid).to == request.auth.uid
               && invitation(request.auth.uid).status == 'pending'
               && invitation(request.auth.uid).expiresAt > request.time)
             // Quitter.
             || (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['members','leader'])
               && request.auth.uid in resource.data.members
               && request.resource.data.members == resource.data.members.removeAll([request.auth.uid])
               && request.resource.data.leader in request.resource.data.members)
             // Poser la clé (groupe créé avant) ou la renouveler quand on reste seul après un départ.
             || (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['squadKey'])
               && request.auth.uid in resource.data.members
               && 'squadKey' in request.resource.data
               && (!('squadKey' in resource.data) || resource.data.members.size() == 1))
           );
         allow delete: if signedIn() && resource.data.members == [request.auth.uid];
       }

       // Invitations de groupe : « groupId_uidInvité », valables 10 minutes, par un membre d'un groupe non plein.
       match /invites/{inviteKey} {
         allow read: if signedIn()
           && (resource.data.to == request.auth.uid || resource.data.from == request.auth.uid);
         allow create: if signedIn()
           && request.resource.data.keys().hasOnly(['kind','groupId','from','fromPseudo','fromAvatar','to','status','createdAt','expiresAt'])
           && request.resource.data.kind == 'group'
           && request.resource.data.from == request.auth.uid
           && request.resource.data.to is string && request.resource.data.to != request.auth.uid
           && inviteKey == request.resource.data.groupId + '_' + request.resource.data.to
           && exists(/databases/$(database)/documents/groups/$(request.resource.data.groupId))
           && request.auth.uid in get(/databases/$(database)/documents/groups/$(request.resource.data.groupId)).data.members
           && get(/databases/$(database)/documents/groups/$(request.resource.data.groupId)).data.members.size() < 2
           && request.resource.data.fromPseudo == get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.pseudo
           && (!('fromAvatar' in request.resource.data)
               || request.resource.data.fromAvatar == request.auth.token.get('picture', ''))
           && request.resource.data.status == 'pending'
           && request.resource.data.createdAt == request.time
           && request.resource.data.expiresAt > request.time
           && request.resource.data.expiresAt < request.time + duration.value(15, 'm');
         allow update: if signedIn() && resource.data.to == request.auth.uid
           && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status'])
           && request.resource.data.status in ['accepted', 'declined'];
         allow delete: if signedIn()
           && (resource.data.to == request.auth.uid || resource.data.from == request.auth.uid);
       }

       // Échanges directs « uidA_uidB » : un à la fois par paire ; chacun ne touche qu'à sa part (offre, verrou,
       // confirmation, règlement). Toute modification d'offre déverrouille les deux pilotes.
       match /trades/{pairKey} {
         function me() { return request.auth.uid; }
         function after() { return request.resource.data; }
         function changed() { return after().diff(resource.data).affectedKeys(); }
         function flags(m, uids) { return m is map && m.keys().hasOnly(uids) && m.size() == 2 && m[uids[0]] is bool && m[uids[1]] is bool; }
         function allFalse(m, uids) { return flags(m, uids) && m[uids[0]] == false && m[uids[1]] == false; }
         function validOffer(o) {
           return o is map && o.keys().hasOnly(['items','credits','fuel','modules'])
             && o.items is map && o.items.size() <= 12
             && o.credits is int && o.credits >= 0 && o.credits <= 1000000000
             && o.fuel is int && o.fuel >= 0 && o.fuel <= 100
             && o.modules is list && o.modules.size() <= 10;
         }
         function emptyOffer(o) { return validOffer(o) && o.items.size() == 0 && o.credits == 0 && o.fuel == 0 && o.modules.size() == 0; }
         function presenceOf(uid) { return get(/databases/$(database)/documents/presence/$(uid)).data; }
         function areFriends(a, b) {
           let key = a < b ? a + '_' + b : b + '_' + a;
           return exists(/databases/$(database)/documents/friendships/$(key))
             && get(/databases/$(database)/documents/friendships/$(key)).data.status == 'accepted';
         }
         function inSameGroup(a, b) {
           let gid = presenceOf(a).get('groupId', null);
           return gid is string && exists(/databases/$(database)/documents/groups/$(gid))
             && a in get(/databases/$(database)/documents/groups/$(gid)).data.members
             && b in get(/databases/$(database)/documents/groups/$(gid)).data.members;
         }

         allow read: if signedIn() && me() in resource.data.uids;
         allow create: if signedIn()
           && after().keys().hasOnly(['uids','from','to','mode','systemId','portId','status','rev','offers','locked','confirmed','applied','createdAt','updatedAt','expiresAt'])
           && after().from == me() && after().to is string && after().to != me()
           && after().uids == (me() < after().to ? [me(), after().to] : [after().to, me()])
           && pairKey == after().uids[0] + '_' + after().uids[1]
           && after().status == 'pending' && after().rev == 0
           && after().offers is map && after().offers.keys().hasOnly(after().uids) && after().offers.size() == 2
           && emptyOffer(after().offers[after().uids[0]]) && emptyOffer(after().offers[after().uids[1]])
           && allFalse(after().locked, after().uids) && allFalse(after().confirmed, after().uids) && allFalse(after().applied, after().uids)
           && after().createdAt == request.time && after().updatedAt == request.time
           && after().expiresAt > request.time && after().expiresAt < request.time + duration.value(5, 'm')
           && validSystem(after().systemId)
           && presenceOf(me()).systemId == after().systemId && presenceOf(after().to).systemId == after().systemId
           && ((after().mode == 'station' && after().portId is string
                 && presenceOf(me()).get('portId', null) == after().portId
                 && presenceOf(after().to).get('portId', null) == after().portId
                 && (areFriends(me(), after().to) || inSameGroup(me(), after().to)))
               || (after().mode == 'space' && after().portId == null && inSameGroup(me(), after().to)));
         allow update: if signedIn() && me() in resource.data.uids
           && after().uids == resource.data.uids && after().updatedAt == request.time
           && (
             // Accepter une demande reçue et non expirée.
             (resource.data.status == 'pending' && resource.data.to == me() && resource.data.expiresAt > request.time
               && changed().hasOnly(['status','updatedAt']) && after().status == 'open')
             // Refuser ou annuler tant que l'échange n'est pas conclu.
             || (resource.data.status in ['pending','open'] && changed().hasOnly(['status','updatedAt']) && after().status == 'cancelled')
             // Modifier sa seule offre : verrous et confirmations retombent, révision + 1.
             || (resource.data.status == 'open' && changed().hasOnly(['offers','locked','confirmed','rev','updatedAt'])
               && after().offers.diff(resource.data.offers).affectedKeys().hasOnly([me()])
               && validOffer(after().offers[me()])
               && allFalse(after().locked, resource.data.uids) && allFalse(after().confirmed, resource.data.uids)
               && after().rev == resource.data.rev + 1)
             // Verrouiller ou déverrouiller sa part (déverrouiller annule les confirmations).
             || (resource.data.status == 'open' && changed().hasOnly(['locked','confirmed','updatedAt'])
               && flags(after().locked, resource.data.uids)
               && after().locked.diff(resource.data.locked).affectedKeys().hasOnly([me()])
               && ((after().locked[me()] == true && after().confirmed == resource.data.confirmed)
                   || (after().locked[me()] == false && allFalse(after().confirmed, resource.data.uids))))
             // Confirmer quand les deux offres sont verrouillées ; conclure si l'autre pilote a déjà confirmé.
             || (resource.data.status == 'open' && changed().hasOnly(['confirmed','status','updatedAt'])
               && resource.data.locked[resource.data.uids[0]] == true && resource.data.locked[resource.data.uids[1]] == true
               && flags(after().confirmed, resource.data.uids)
               && after().confirmed.diff(resource.data.confirmed).affectedKeys().hasOnly([me()])
               && after().confirmed[me()] == true
               && (after().status == 'open'
                   || (after().status == 'done'
                       && resource.data.confirmed[resource.data.uids[0] == me() ? resource.data.uids[1] : resource.data.uids[0]] == true)))
             // Signaler son règlement appliqué, une seule fois.
             || (resource.data.status == 'done' && changed().hasOnly(['applied','updatedAt'])
               && flags(after().applied, resource.data.uids)
               && after().applied.diff(resource.data.applied).affectedKeys().hasOnly([me()])
               && resource.data.applied[me()] == false && after().applied[me()] == true)
           );
         allow delete: if signedIn() && me() in resource.data.uids
           && (resource.data.status in ['pending','cancelled']
               || (resource.data.status == 'done'
                   && resource.data.applied[resource.data.uids[0]] == true && resource.data.applied[resource.data.uids[1]] == true));
       }
     }
   }
   ```

   puis **Publier**. Ça garantit que chaque joueur ne peut lire/écrire
   que sa propre sauvegarde, et que le tchat n'accepte que des messages
   signés par leur auteur (pseudo cohérent avec sa présence, 280
   caractères max, canal valide), modifiables/supprimables uniquement
   par lui. Les règles ne peuvent pas limiter le débit ni modérer : le
   client impose 2 s entre deux envois, rien de plus.
5 bis. Onglet **Index** → **Composite** → **Créer un index**, deux fois :
   - collection `messages` : `channel` **Croissant**, `createdAt`
     **Décroissant** (portée : collection) ;
   - collection `presence` : `systemId` **Croissant**, `lastSeen`
     **Croissant**.

   Sans le premier, le tchat affiche « index Firestore manquant » et
   l'erreur dans la console du navigateur contient le lien direct de
   création de l'index.
5 ter. Positions temps réel de l'escadrille : menu **Compilation** →
   **Realtime Database** → **Créer une base de données** → région
   `europe-west1` → **mode verrouillé**. Onglet **Règles** : coller le
   contenu de `database.rules.json` (versionné à la racine) → **Publier**.
   Copier l'URL affichée (`https://…firebasedatabase.app`) dans
   `databaseURL` de `firebase-config.js`.
6. Retourner à la page d'accueil du projet (icône maison) → cliquer sur
   l'icône Web `</>` pour **Ajouter une application** → nom
   `oree-web` → **ne pas** cocher Firebase Hosting → **Enregistrer
   l'application**.
7. Firebase affiche un objet `firebaseConfig` avec `apiKey`,
   `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`,
   `appId`. Copiez ces valeurs dans `firebase-config.js` à la racine du
   projet, à la place des `REMPLACER_*`. Ces valeurs ne sont pas
   secrètes (la sécurité vient des règles Firestore ci-dessus), elles
   peuvent être commitées.
8. Pour que la connexion fonctionne aussi sur le site en ligne du
   créateur original : dans **Authentication → Settings → Authorized
   domains**, ajouter `oree-flight.vekamelgaming.chatgpt.site`
   (`localhost` y est déjà par défaut, donc le développement local
   fonctionne sans cette étape).

Une fois `firebase-config.js` rempli, rechargez le jeu : le bouton
« Connexion Google » s'active. À la première connexion, la sauvegarde
locale existante est automatiquement copiée dans le cloud ; aux
connexions suivantes, la sauvegarde cloud est chargée en priorité.

## Amarrage

Chaque station (hub, raffinerie, petite station × 4 variantes) a 2 à 6 sas,
placés au bout de ses modules (`DOCK_PORTS` dans `docking.js`, mesurés sur les
planches `assets/hub-stations.png` et `assets/industrial-stations.png`).
- À l'amarrage, le vaisseau rejoint le sas le plus proche : alignement (1,2 s),
  puis bras télescopique jusqu'au nez (0,8 s) et verrouillage ; la fenêtre
  Station s'ouvre ensuite. Pendant l'animation, les commandes sont suspendues.
- Au départ : bras rétracté (0,6 s), puis le vaisseau s'écarte du sas en
  pivotant vers l'extérieur.
- La pose à quai (`ship.berth` : station + numéro de sas) est sauvegardée ; elle
  dépend de la longueur de la coque. Le cap assisté « Rejoindre et amarrer »
  vise la pose du sas le plus proche.
- Pour ajuster un sas après un changement de sprite : modifier sa ligne
  `[x, y, direction]` (fractions de la taille du sprite, direction en seizièmes
  de tour) ; `tests/docking.test.js` vérifie qu'aucune coque ne chevauche la
  station.

## Boussole de cap

En vol, un anneau autour du vaisseau indique la direction et la distance des
destinations (`compass.js`, dessin `compass-art.js`) :

| Repère | Couleur | Forme |
|---|---|---|
| Station | vert | chevron à base plate |
| Gisement | orange | chevron |
| Porte | blanc | double chevron |
| Site à sonder | violet | chevron + point |
| Trafic ciblé | bleu | chevron creux |
| Hostile (3 plus proches, < 3 km) | rouge, clignotant | triangle |
| Coéquipier | doré | losange |
| Porte vers le coéquipier (autre système) | doré, contour blanc | losange |

Un repère disparaît quand la destination est dans l'anneau ; les étiquettes
restent dans l'écran et s'empilent. Coéquipier dans un autre système : plus
court chemin sur la carte (`routeNextSystem`) et **Rejoindre** traverse les
portes automatiquement (8 % de carburant par saut). Les PNJ portent le drapeau
`hostile` pour apparaître en rouge (radar et boussole) ; aucun n'existe encore.

## Tchat multijoueur

Un panneau de tchat non modal (bouton « Tchat » à droite, sous le radar ;
sur mobile, il se déplie au-dessus des commandes tactiles) permet aux
pilotes **connectés à Google** de discuter en temps réel. Il ne met jamais
le pilotage en pause : seules les touches tapées dans la zone de saisie
sont retenues, **Échap** rend les commandes au vaisseau.

- Canaux : **Global** (tous les pilotes), **Zone** (le système courant —
  l'onglet change de nom et de contenu à chaque saut) et **Groupe**
  (état vide en attendant les invitations de groupe).
- **Entrée** envoie, **Maj+Entrée** insère un saut de ligne ; 280
  caractères max, 2 s entre deux envois.
- Menu **⋯** sur ses propres messages : modifier, déplacer vers un autre
  canal, supprimer. Les modifications se propagent en direct.
- Badges de non-lus par onglet et sur le bouton replié ; l'état
  replié/déplié et l'onglet actif sont mémorisés dans le navigateur.
- Présence légère : un document `presence/{uid}` rafraîchi toutes les
  60 s ; un pilote compte « en ligne » s'il a été vu depuis moins de
  2 min. Le compteur « N ici · N en ligne » n'est interrogé que panneau
  ouvert.
- Manette : la croix directionnelle atteint le tchat, **A** donne le
  focus à la saisie, **B** le rend au vaisseau ; pas de clavier virtuel.
- Pas de modération ni d'anti-spam côté serveur à ce stade (limite des
  règles Firestore seules).

## Équipage : amis et groupe duo

Bouton **Équipe** du rail (sous Profil), réservé aux pilotes connectés :
- **Groupe** : coéquipier (portrait, pseudo, système, distance si même
  système), invitations envoyées, **Quitter le groupe**. Un groupe compte 2
  pilotes au plus ; il ouvre le canal **Groupe** du tchat et affiche le
  coéquipier **sur le radar (losange doré) et dans la vue** quand vous êtes
  dans le même système.
- **Amis** : recherche par pseudo exact (insensible à la casse), liste des amis
  en ligne d'abord, Inviter / Retirer.
- **Pilotes** : pilotes en ligne dans le système courant, Ajouter / Inviter.
- **Demandes** : invitations de groupe (Rejoindre / Refuser), demandes d'ami
  reçues (Accepter / Refuser) et envoyées (Annuler). Une invitation reçue
  s'affiche aussi dans un bandeau non bloquant ; elle expire au bout de 10 min.

Dans le tchat, toucher le portrait ou le pseudo d'un autre pilote ouvre un menu
Ajouter en ami / Inviter en groupe. Données Firestore : `profiles/{uid}` (profil
public, nécessaire pour être trouvé et nommé hors ligne — créé à la connexion),
`friendships/{uidA_uidB}`, `groups/{id}` et `invites/{groupId_uid}`. Les règles
correspondantes sont dans l'étape 5 ; aucun index composite supplémentaire
n'est nécessaire.

### Escadrille en temps réel

Les positions du coéquipier passent par **Firebase Realtime Database**
(`squad-live.js`), pas par Firestore :
- connexion ouverte **seulement quand le groupe compte 2 pilotes**, fermée
  sinon (hors groupe, aucune connexion Realtime Database) ;
- envoi ~5 fois/s au plus, uniquement si le vaisseau bouge, tourne ou change
  de vitesse (battement toutes les 2 s à l'arrêt) ; horodatage serveur ;
- à l'affichage, la trajectoire est prolongée avec la vitesse (1,5 s au plus)
  puis lissée, pour un mouvement fluide à chaque image ; le coéquipier
  disparaît si sa position a plus de 5 s ou s'il est dans un autre système ;
- à la fermeture de l'onglet, la position est effacée automatiquement
  (`onDisconnect`).

Sécurité : les positions vivent sous `/squads/{clé}/{uid}`, où la clé
aléatoire de 32 caractères est stockée dans `groups/{id}.squadKey` (lisible
par les seuls membres et l'invité). Lister `/squads` est interdit, chacun
n'écrit que sa propre position (champs et types validés). La clé est
renouvelée à chaque arrivée d'un membre et par le pilote resté seul après un
départ : un ancien coéquipier ne reçoit plus rien.

Budget gratuit (offre Spark : 100 connexions simultanées, 1 Go stocké,
10 Go téléchargés/mois) : ~1 Ko/s par pilote en duo, soit ~7 Mo/h pour les
deux — de l'ordre de 1 400 h de jeu en duo par mois. Les 100 connexions ne
concernent que les pilotes groupés au même moment.

## Échange entre pilotes

Échange direct avec **un ami ou le coéquipier amarré à la même station** :
ressources de soute, crédits, carburant et modules en réserve (non installés).
- Lancement : bouton **Échanger** dans l'Équipage (onglets Groupe et Amis,
  mention « À quai ici ») ou **Proposer un échange** dans le menu d'un pilote du
  tchat. L'autre pilote reçoit un bandeau non bloquant (demande valable 2 min).
- **Double validation** : chacun compose son offre (pas à pas, « Tout »),
  **verrouille**, puis les deux **confirment**. Toute modification d'offre
  déverrouille les deux pilotes.
- **Séquestre** : ce qui est verrouillé quitte le vaisseau (sauvegardé avec la
  partie) et revient s'il y a déverrouillage, annulation, départ de la station
  ou saut. À la conclusion, chaque client applique l'échange **une seule fois**
  (registre `ship.tradeLedger`) puis le signale ; au retour d'un pilote déconnecté
  en plein échange, son séquestre est réglé ou restitué.
- **En vol avec le coéquipier** (même système, moins de 150 m, moins de
  20 m/s d'écart de vitesse) : **Amarrer et échanger** dans l'onglet Groupe, ou
  toucher son vaisseau dans la vue. Plus loin, **Rejoindre** (onglet Groupe ou
  menu du coéquipier) engage le cap assisté vers lui ; un coéquipier en panne
  sèche peut ainsi être rejoint puis ravitaillé par échange de carburant. À l'acceptation, le destinataire (hôte) s'immobilise et le
  demandeur vient placer son nez au bout d'un bras sorti du flanc de l'hôte ;
  le bras est visible chez les deux pilotes (positions de l'escadrille). Fin,
  annulation, saut ou coéquipier perdu plus de 5 s : bras rétracté, le visiteur
  s'écarte, les deux reprennent la main.
- À quai, ce qui ne tient pas en soute rejoint le stock de la station ; un
  module déjà possédé est remboursé à son prix ; le réservoir est plafonné à
  100 %.
- Données : `trades/{uidA_uidB}` (un échange à la fois par paire) et `portId`
  dans `presence/{uid}` ; règles dans l'étape 5. Limite assumée : l'économie
  reste gérée par le client (comme la sauvegarde), les règles empêchent de
  toucher à la part de l'autre pilote mais pas de mentir sur son inventaire.

## Structure

- `index.html`, `style.css`, `cockpit-polish.css` — structure et style
- `app.js` — point d'entrée, orchestre les modules
- `simulation.js` — état du monde, physique, logique de jeu
- `render.js` — rendu canvas (vue spatiale + radar)
- `ships.js`, `equipment.js`, `resources.js` — données de jeu (coques,
  modules, ressources)
- `shipyard.js`, `ship-tree.js` — arbre de progression / chantier naval
- `navigation.js`, `cockpit-logic.js`, `joystick.js` — pilotage et aide
  à la navigation
- `traffic.js` — trafic ambiant / radio
- `audio.js` — sons
- `context-menu.js`, `cockpit-windows.js`, `mobile-layout.js` — UI
- `assets/` — sprites, icônes, police pixel
- `auth.js` — compte Google et sauvegarde cloud (Firebase)
- `chat-channels.js` — logique pure du tchat (canaux, validation, tri,
  non-lus), testée en Node
- `chat.js`, `presence.js` — couche Firestore du tchat (messages en
  temps réel, présence des pilotes)
- `chat-ui.js`, `chat.css` — panneau de tchat non modal
- `social-model.js` (logique pure testée), `social.js` (Firestore),
  `social-ui.js`, `social.css` — Équipage : amis, groupe duo, coéquipier
- `trade-model.js` (offres, séquestre, règlement, testé), `trade.js`
  (Firestore), `trade-ui.js`, `trade.css` — échange direct entre pilotes
- `compass.js` (repères, plus court chemin, testé), `compass-art.js` —
  boussole de cap
- `docking.js` (sas, poses et animation, testé), `dock-art.js` (bras
  d'amarrage) — amarrage en bout de sas
- `squad-live.js`, `database.rules.json` — positions temps réel de
  l'escadrille (Realtime Database) et leurs règles
- `ui-refresh.css` — refonte de lisibilité chargée en dernier (boutons,
  typographie ≥ 12 px, fenêtres mobiles pleine hauteur) ; `ui-lists.js` —
  listes libellé / valeur (prix, recettes, stocks)
- `firebase-config.js` — clés du projet Firebase (à remplir, voir
  section dédiée ci-dessus)
- `scripts/` — serveur de dev local et script de synchronisation avec
  le site en ligne (voir sections ci-dessus)
- `CHANGELOG.md` — historique détaillé des versions, en français
- `CONTRIBUTING.md` — convention de commits/changelog, message
  d'accueil pour Imtherean/ChatGPT
