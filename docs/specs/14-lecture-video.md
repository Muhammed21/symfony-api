# 14 : Lecture vidéo

> Décision : **la bande-annonce d'abord** (livrée, voir « Bande-annonce : ce qui est fait »). La lecture du film entier (préparation par ffmpeg) vient dans un second temps ; ses choix sont déjà fixés ci-dessous.

## Bande-annonce : ce qui est fait

- **Import** (spec 13) : le détail TMDB demande aussi `videos` (`append_to_response=release_dates,recommendations,videos`, `include_video_language=fr,en`). Parmi les vidéos YouTube de type `Trailer` (jamais un extrait ni un teaser), on garde la française d'abord, puis l'officielle, puis la première. Sa clé va dans `Movie.trailerKey` (colonne nullable, migration `Version20261126232203`). 98 des 100 films importés en ont une.
- **API** : `trailerKey` (clé YouTube ou `null`) dans `GET /movies` et `GET /movies/{id}`. Lecture ouverte à tous.
- **Front** :
  - bannière de l'accueil : « Bande-annonce » (lien) quand le film à la une en a une ; sinon « Lecture » reste désactivé avec « Bientôt disponible » ;
  - page `/films/$movieId/bande-annonce` : bouton retour vers l'accueil, titre, lecteur `youtube-nocookie.com` en lecture automatique, 16:9, entier dans la fenêtre quelle que soit sa taille ;
  - états : chargement, film inexistant (ou identifiant qui n'est pas un nombre, sans appel), film sans bande-annonce, échec avec « Réessayer » ;
  - nouveau cas d'usage `getMovie(id)` (`GET /movies/{id}`, 404 → `not_found`).
- Une vraie page plutôt qu'une fenêtre par-dessus l'accueil : partageable, le bouton retour du navigateur marche.

## Objectif

Rendre actif le bouton « Lecture » de la bannière (aujourd'hui désactivé, spec 11) : regarder le film en entier quand on a le droit de le diffuser, sinon sa bande-annonce.

## Prérequis

Spec 13 (vrais films). `trailerKey` est ajouté à l'import par cette spec. ffmpeg sur la machine qui prépare les vidéos.

## Faut-il reprendre le service vidéo de twitch ?

`workshop-ia/twitch/apps/video` est un service de **direct**, à la manière d'Amazon IVS :

| Ce que fait le service twitch                                                         | Ce dont Prime Video a besoin                        |
| ------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Ingest RTMP maison, clés de stream chiffrées, une session `live` par chaîne           | Aucun envoi en direct : le film existe déjà         |
| LL-HLS en fenêtre glissante : 6 segments de 2 s gardés en mémoire                     | Tout le film, du début à la fin, avec avance rapide |
| Le flux répond 404 30 s après la fin du direct                                        | Le film reste disponible                            |
| PostgreSQL et Prisma (schéma `video`), outbox, webhooks signés HMAC vers l'API NestJS | SQLite et Symfony, aucun événement à publier        |
| Process Node séparé, image Docker et service Compose                                  | Pas de Dockerfile ni de Compose dans ce projet      |

**Recommandation : ne pas reprendre le service tel quel.** Il résout un autre problème (le direct) et embarque toute son infrastructure. On garde son savoir-faire :

- HLS en fMP4 produit par ffmpeg (segment d'init `init.mp4`, segments `.m4s`) ;
- segments en `public, max-age=31536000, immutable`, playlists en `application/vnd.apple.mpegurl` ;
- erreurs en `application/problem+json`, comme ici.

Pour de la vidéo à la demande, ffmpeg fait seul le travail du segmenteur et des playlists de twitch : une playlist `VOD` complète, écrite une fois, servie en fichiers statiques.

Le service twitch redeviendrait utile pour une fonction de **direct** (Prime Video diffuse du sport en direct) : hors périmètre ici.

## Quels films peut-on diffuser en entier ?

Les films de TMDB sont protégés par le droit d'auteur, et TMDB ne fournit aucun fichier. Deux cas :

1. **Films libres** des Blender Studio, sous licence Creative Commons BY, et présents sur TMDB : _Big Buck Bunny_, _Sintel_, _Tears of Steel_, _Elephants Dream_, _Cosmos Laundromat_, _Spring_, _Charge_… Ce sont de vrais films, avec leurs vraies données TMDB, qu'on a le droit de diffuser en entier (en créditant la Blender Foundation). Identifiants TMDB à vérifier à l'import.
2. **Tous les autres** : la bande-annonce officielle YouTube (`trailerKey`, spec 13), en lecteur YouTube intégré (`youtube-nocookie.com`).

## Préparer un film : `app:video:package`

```sh
php bin/console app:video:package <movieId> chemin/vers/sintel.mp4
```

- Lance ffmpeg (`symfony/process`) : H.264 et AAC, en trois qualités (1080p, 720p, 480p) sous une playlist maître multi-débit : le lecteur choisit selon la connexion.
- Sortie HLS VOD en fMP4 (`-f hls -hls_playlist_type vod -hls_segment_type fmp4 -hls_time 6`) dans `apps/api/var/videos/<movieId>/`, **ignoré par git** (plusieurs centaines de Mo).
- Enregistre `Movie.playbackPath` une fois ffmpeg terminé avec succès ; un échec ne laisse ni dossier partiel ni chemin enregistré.
- ffmpeg n'est pas dans le conteneur `symfony-api` : la commande tourne là où ffmpeg est installé (sur l'hôte, sans toucher à l'image).

## API

- `GET /movies/{id}` ajoute `playback` :
  - `{ "kind": "film", "url": "/videos/<id>/master.m3u8" }` pour un film préparé ;
  - `{ "kind": "trailer", "youtubeKey": "…" }` pour une bande-annonce ;
  - `null` sinon.
- `GET /videos/{id}/{fichier}` sert les playlists et les segments, avec les en-têtes de cache ci-dessus ; nom de fichier hors de la liste du film → 404. Lecture ouverte à tous, sans connexion.

## Front

- Page `/films/:id/lecture` pour le film entier, sur le modèle de la page bande-annonce.
- Film : `<video>` avec [hls.js](https://github.com/video-dev/hls.js) (Chrome et Firefox ne lisent pas HLS seuls ; Safari le lit nativement).
- Bande-annonce : déjà faite (`/films/$movieId/bande-annonce`).
- Bannière de l'accueil : « Lecture » pour un film, « Bande-annonce » pour une bande-annonce, désactivé sans `playback` (« Bientôt disponible », comme aujourd'hui).
- Crédit Creative Commons sous le titre des films Blender.

## Critères d'acceptation

- `app:video:package` produit une playlist VOD lisible par ffprobe, et `GET /movies/{id}` rend `playback.kind = "film"`.
- Sur `/films/:id/lecture`, le film démarre, et l'avance rapide au milieu du film fonctionne.
- ✅ Un film sans fichier mais avec bande-annonce ouvre le lecteur YouTube.
- ✅ Un film sans rien garde le bouton désactivé.
- Les segments sont servis en `immutable`, la playlist en `application/vnd.apple.mpegurl`.

## Hors périmètre

- Direct (reprise possible du service twitch), DRM, sous-titres, reprise de la lecture là où on s'était arrêté.
- Envoi de vidéos depuis le front.

## Ordre d'implémentation

1. `Movie.playbackPath`, commande `app:video:package` (ffmpeg réel dans un test d'intégration, sur un clip de 3 s généré par `testsrc2`).
2. `playback` dans `GET /movies/{id}`, route `/videos/{id}/{fichier}`.
3. Page de lecture et bouton de la bannière.
