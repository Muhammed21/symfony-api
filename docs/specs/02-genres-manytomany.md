# 02 : Genres (ManyToMany Film ↔ Genre)

## Objectif

Classer les films par **genre** (Action, Comédie, Thriller…). Un film a plusieurs genres, un genre regroupe plusieurs films.

## Prérequis

Spec 01 terminée.

## Le genre

| Champ  | Type   | Règles                                                                      |
| ------ | ------ | --------------------------------------------------------------------------- |
| `id`   | entier | attribué par la base                                                        |
| `name` | texte  | obligatoire, 2 à 50 caractères, **unique sans tenir compte des majuscules** |

« action » est refusé (422) si « Action » existe déjà.

## L'association

- `ManyToMany` entre `Movie` et `Genre`. `Movie` est le côté propriétaire (`Movie::$genres`) ; `Genre::$movies` est le côté inverse.
- Un film peut n'avoir **aucun** genre.
- Supprimer un genre est **autorisé** même s'il est utilisé : il disparaît simplement des films concernés (seule la ligne de jointure est supprimée, jamais le film).
- Supprimer un film supprime ses liens avec les genres, jamais les genres eux-mêmes.

## Routes des genres

| Méthode  | Route          | Rôle                                           | Succès | Erreurs  |
| -------- | -------------- | ---------------------------------------------- | ------ | -------- |
| `GET`    | `/genres`      | liste paginée (5 par défaut), triée par `name` | 200    | 422      |
| `GET`    | `/genres/{id}` | détail d'un genre                              | 200    | 404      |
| `POST`   | `/genres`      | créer un genre                                 | 201    | 422      |
| `PUT`    | `/genres/{id}` | renommer un genre                              | 200    | 404, 422 |
| `DELETE` | `/genres/{id}` | supprimer un genre                             | 204    | 404      |

Un genre n'expose pas la liste de ses films (évite les réponses énormes et les références circulaires). Pour voir les films d'un genre, on filtre la liste des films (ci-dessous).

## Changements sur les films

- `POST /movies` et `PUT /movies/{id}` acceptent un champ `genres` : liste d'**id** de genres.
  ```json
  {
    "title": "Le Parrain",
    "releaseYear": 1972,
    "duration": 175,
    "ageRating": "16+",
    "genres": [2, 5]
  }
  ```
  - `genres` absent ou `[]` : le film n'a aucun genre.
  - Avec `PUT`, la liste **remplace** les genres existants.
  - Un id de genre inconnu renvoie 422 et nomme l'id fautif.
  - Les doublons dans la liste sont ignorés.
- `GET /movies` et `GET /movies/{id}` affichent les genres sous forme `{ "id", "name" }`.
- Nouveau filtre `GET /movies?genre=3` : films ayant ce genre parmi les leurs. Il se cumule avec `title` et `year`. `genre=0` ou `genre=abc` renvoie 422 ; un id de genre inexistant renvoie une liste vide.

## Critères d'acceptation

Genres :

- `POST /genres` avec `{"name": "Action"}` renvoie 201.
- `POST /genres` avec `{"name": "action"}` alors qu'« Action » existe renvoie 422.
- `POST /genres` avec un nom d'une lettre ou de plus de 50 caractères renvoie 422.
- `GET /genres` renvoie la liste paginée triée par nom.
- `PUT /genres/{id}` renomme le genre ; renommer vers un nom déjà pris renvoie 422.
- `DELETE /genres/{id}` sur un genre utilisé renvoie 204 ; les films concernés existent toujours et n'ont plus ce genre.

Films :

- Créer un film avec `"genres": [1, 2]` puis le lire renvoie ces deux genres.
- `PUT` avec `"genres": [3]` remplace les anciens genres par le seul genre 3.
- `"genres": [999]` (inconnu) renvoie 422.
- `GET /movies?genre=1` ne renvoie que les films du genre 1, paginés.
- `GET /movies?genre=1&year=1972` cumule les deux filtres.
- La pagination compte les **films**, pas les lignes de jointure : un film à 3 genres compte une seule fois dans `total` (d'où `fetchJoinCollection: true` dans le `Paginator`).

## Hors périmètre

- Restriction aux administrateurs (spec 03).
- Sous-genres ou hiérarchie de genres.
