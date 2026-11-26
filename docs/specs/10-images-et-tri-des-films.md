# 10 : Images des films et tri par année

## Objectif

Donner à l'écran d'accueil (spec 11) ce dont la maquette Figma a besoin : une affiche pour chaque vignette, une bannière pour le film mis en avant, et les films les plus récents en premier.

## Prérequis

Specs 01 (films) et 06 (données de test).

## Images

Deux nouveaux champs sur un film, facultatifs :

| Champ         | Type  | Règles                                 | Usage                                   |
| ------------- | ----- | -------------------------------------- | --------------------------------------- |
| `posterUrl`   | texte | URL `http(s)`, 2048 caractères au plus | vignette paysage (224 × 125 dans Figma) |
| `backdropUrl` | texte | URL `http(s)`, 2048 caractères au plus | bannière de l'accueil (1280 × 560)      |

- Acceptés à la création et à la modification (`POST`, `PUT`), renvoyés dans la liste et le détail ; `null` quand il n'y en a pas.
- Une valeur qui n'est pas une URL `http` ou `https` renvoie 422 et nomme le champ fautif.
- Migration Doctrine : deux colonnes nullables, les films existants restent valides.

Données de test : chaque film reçoit une photo libre de droits de [Lorem Picsum](https://picsum.photos), tirée avec une graine propre au film : la même image à chaque chargement, et la même photo pour l'affiche (`/seed/prime-video-<n>/448/250`) et la bannière (`/seed/prime-video-<n>/1280/720`). Ce ne sont pas des visuels de films ; il suffira de remplacer les URL.

## Tri

Nouveau paramètre `GET /movies?sort=…`, qui se cumule avec les filtres et la pagination :

| `sort`           | Ordre                                                         |
| ---------------- | ------------------------------------------------------------- |
| `title` (défaut) | titre croissant, puis `id` croissant (inchangé, spec 01)      |
| `recent`         | année de sortie décroissante, puis titre, puis `id` croissant |

Toute autre valeur renvoie 422.

## Critères d'acceptation

- `POST /movies` avec `posterUrl` et `backdropUrl` les enregistre ; `GET /movies/{id}` les renvoie.
- Sans images, les deux champs valent `null`.
- `posterUrl: "pas-une-url"` ou `backdropUrl: "ftp://exemple.fr/a.jpg"` renvoie 422 et nomme le champ.
- `GET /movies?sort=recent` renvoie les films de l'année la plus récente en premier ; à année égale, par titre.
- `GET /movies?sort=recent&genre=1` cumule le tri et le filtre.
- `GET /movies?sort=popular` renvoie 422.
- Les données de test donnent une affiche et une bannière à chacun des 40 films.

## Hors périmètre

- Envoi de fichiers image (les URL pointent vers un hébergement externe), redimensionnement.
