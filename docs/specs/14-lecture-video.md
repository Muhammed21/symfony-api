# 14 : Bandes-annonces

> Décision : **les bandes-annonces seulement**. La lecture du film entier est abandonnée (voir Hors périmètre).

## Objectif

Rendre actif le bouton de lecture de la bannière (désactivé jusqu'ici, spec 11) : regarder la bande-annonce YouTube du film à la une.

## Prérequis

Spec 13 (vrais films importés de TMDB). Cette spec ajoute `trailerKey` à l'import.

## Import

- Le détail TMDB demande aussi `videos` : `append_to_response=release_dates,recommendations,videos`, `include_video_language=fr,en`.
- Parmi les vidéos YouTube de type `Trailer` (jamais un extrait ni un teaser), on garde la française d'abord, puis l'officielle, puis la première.
- Sa clé va dans `Movie.trailerKey` (colonne nullable, migration `Version20261126232203`). 98 des 100 films importés en ont une.

## API

- `trailerKey` (clé YouTube ou `null`) dans `GET /movies` et `GET /movies/{id}`.
- Lecture ouverte à tous, sans connexion.

## Front

- Bannière de l'accueil : « Bande-annonce » (lien) quand le film à la une en a une ; sinon « Lecture » reste désactivé avec « Bientôt disponible ».
- Page `/films/$movieId/bande-annonce` : bouton retour vers l'accueil, titre, lecteur `youtube-nocookie.com` en lecture automatique, en 16:9, entier dans la fenêtre quelle que soit sa taille.
- États : chargement, film inexistant (ou identifiant qui n'est pas un nombre, sans appel), film sans bande-annonce, échec avec « Réessayer ».
- Cas d'usage `getMovie(id)` (`GET /movies/{id}`, 404 → `not_found`).
- Une vraie page plutôt qu'une fenêtre par-dessus l'accueil : partageable, et le bouton retour du navigateur marche.

## Critères d'acceptation

- ✅ L'import enregistre la bande-annonce YouTube la plus adaptée de chaque film, ou rien.
- ✅ Un film avec bande-annonce l'ouvre depuis la bannière, dans le lecteur YouTube.
- ✅ Un film sans bande-annonce garde le bouton désactivé.
- ✅ Le lecteur tient entier dans la fenêtre, sur ordinateur comme sur téléphone.

## Hors périmètre

- **Lecture du film entier.** Les films de TMDB sont protégés par le droit d'auteur et TMDB ne fournit aucun fichier. La piste étudiée (films libres de la Blender Foundation, préparés en HLS par ffmpeg en trois qualités) est abandonnée.
- Reprise du service vidéo de `workshop-ia/twitch` : c'est un service de **direct** (ingest RTMP, LL-HLS en fenêtre glissante, PostgreSQL, Docker), sans rapport avec la lecture d'une bande-annonce.
- Direct, DRM, sous-titres, reprise de la lecture là où on s'était arrêté.
