# 13 : Vrais films, importés de TMDB

## Objectif

Remplacer les films inventés des fixtures (titres générés, images `picsum.photos`) par de vrais films : titre, synopsis, année, durée, genres, affiche et bannière en français, venant de [The Movie Database (TMDB)](https://developer.themoviedb.org/docs/getting-started).

## Prérequis

Specs 01, 02, 05 et 10. Un compte TMDB et sa **clé d'API** (v3), créée sur `https://www.themoviedb.org/settings/api`, dans `apps/api/.env.local` (`TMDB_API_KEY`).

## Principe : un import, pas un proxy

L'API Symfony reste la seule source du front. Une commande copie les films de TMDB dans SQLite ; le reste de l'application (filtres, tri, pagination, avis, titres similaires, front) ne change pas.

- Pourquoi pas un proxy vers TMDB à chaque requête : les filtres, la pagination (`Paginator` du TP), les avis et les titres similaires reposent sur nos entités ; TMDB tomberait en panne avec nous ; le jeton ne doit jamais quitter le serveur.
- Les conditions de TMDB interdisent de garder ses données plus de **6 mois** : relancer l'import les rafraîchit (voir Conditions d'utilisation).

## Commande `app:tmdb:import`

```sh
php bin/console app:tmdb:import --pages=5
```

| Étape                 | Requête TMDB (`https://api.themoviedb.org/3`, `language=fr-FR`)                                                                                       | Devient                                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Genres                | `GET /genre/movie/list`                                                                                                                               | `Genre` (nom français), retrouvé par `tmdbId`, sinon par son nom sans tenir compte de la casse, sinon créé |
| Liste des films       | `GET /discover/movie?sort_by=popularity.desc&vote_count.gte=100&page=N` (20 films par page ; 100 votes au moins écartent les films pas encore sortis) | identifiants à importer, sans doublon                                                                      |
| Détail de chaque film | `GET /movie/{id}?append_to_response=release_dates,recommendations`                                                                                    | `Movie` (ci-dessous)                                                                                       |
| Titres similaires     | `recommendations` du détail, limités aux films importés                                                                                               | `similarMovies` (spec 05)                                                                                  |

Correspondance d'un film :

| `Movie`       | TMDB                                                                                                                                                                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tmdbId`      | `id` (nouvelle colonne, unique : un second import met à jour au lieu de dupliquer)                                                                                                                                                     |
| `title`       | `title`                                                                                                                                                                                                                                |
| `synopsis`    | `overview` (vide en français → `null`)                                                                                                                                                                                                 |
| `releaseYear` | année de `release_date` ; film sans date ignoré                                                                                                                                                                                        |
| `duration`    | `runtime` en minutes ; film sans durée ignoré                                                                                                                                                                                          |
| `ageRating`   | certification française (`FR`) de `release_dates` : `U` → `ALL`, `10` → `7+`, `12` → `13+`, `16` → `16+`, `18` → `18+` ; celle de la sortie en salle (type 3) d'abord, sinon la première connue ; sans certification française : `ALL` |
| `posterUrl`   | `https://image.tmdb.org/t/p/w500` + `poster_path`                                                                                                                                                                                      |
| `backdropUrl` | `https://image.tmdb.org/t/p/w1280` + `backdrop_path`                                                                                                                                                                                   |

- Authentification par la clé d'API v3 (paramètre `api_key`), dans `apps/api/.env.local` (`TMDB_API_KEY`), **jamais commitée** ; `.env` ne porte que la variable vide. Le jeton de lecture v4 (`Authorization: Bearer`) a été refusé par TMDB lors de l'essai.
- Client : `symfony/http-client`, dans `App\Tmdb\TmdbCatalogue` ; l'import (`TmdbImporter`) ne fait aucune requête lui-même. Les tests remplacent le client par `MockHttpClient` (`tests/Support/FakeTmdb.php`) : ni réseau ni clé en CI.
- Limite de débit : environ 40 requêtes par seconde ; un `429` est réessayé (3 fois au plus) après `Retry-After`. 5 pages = 100 films = 106 requêtes, environ 16 s.
- Tout est lu chez TMDB avant la moindre écriture : une panne (statut ≠ 2xx, réseau) arrête la commande en code 1 sans rien écrire.
- Sortie : « 3 films créés, 0 mis à jour, 1 ignoré. », précédée de la raison de chaque film ignoré.

## Données de test

- Les tests PHPUnit gardent les fixtures Faker (spec 06) : rapides, déterministes, sans réseau.
- `doctrine:fixtures:load` en développement garde pour l'instant les faux films : l'import s'ajoute par-dessus. **À valider** : ne plus charger que les utilisateurs en développement, puis lancer l'import.

## Conditions d'utilisation de TMDB

[Termes du 20 octobre 2023](https://www.themoviedb.org/documentation/api/terms-of-use) :

- Usage **non commercial** uniquement, ce qui couvre un projet d'école.
- Attribution obligatoire : le logo TMDB, moins visible que le nôtre, et la phrase exacte : « This product uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB. » Dans le front : un pied de page (spec à part ou ajout à la spec 11).
- Pas de conservation au-delà de 6 mois ; tout purger si l'accès est retiré.
- TMDB ne fournit **aucun fichier vidéo de film** : seulement des bandes-annonces hébergées sur YouTube (spec 14, qui ajoutera leur clé à l'import).

## Critères d'acceptation

- `app:tmdb:import --pages=1` crée 20 films au plus, avec titre, synopsis, affiche et bannière en français, et leurs genres TMDB.
- Le relancer ne crée aucun doublon et met à jour les films déjà présents.
- Un film sans date de sortie ou sans durée est ignoré et compté.
- Sans jeton, la commande s'arrête en code 1 avec un message clair, sans appel réseau.
- Un `429` est réessayé ; une panne de TMDB arrête la commande sans laisser de film à moitié importé.
- L'accueil et le catalogue affichent les vrais films sans changement du front.
- Le pied de page montre le logo et la mention TMDB.

## Hors périmètre

- Séries, acteurs, recherche en direct sur TMDB.
- Import automatique planifié (relance à la main).

## Ordre d'implémentation

1. Colonnes `tmdbId` (Genre, Movie), migration.
2. Port `MovieCatalogSource` et adaptateur HTTP TMDB, testés avec `MockHttpClient`.
3. Commande `app:tmdb:import` : genres, films, titres similaires.
4. Attribution TMDB dans le front.
