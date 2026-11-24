# 04 : Avis (OneToMany Utilisateur → Avis)

## Objectif

Permettre à un **utilisateur** connecté de donner son **avis** sur un film (une **note** de 1 à 5 et un commentaire), et afficher la **note moyenne** de chaque film.

## Prérequis

Specs 01 à 03 terminées.

## L'avis

| Champ | Type | Règles |
|---|---|---|
| `id` | entier | attribué par la base |
| `rating` | entier | obligatoire, de 1 à 5 |
| `comment` | texte ou `null` | facultatif, 1000 caractères maximum |
| `createdAt` | date et heure | fixée automatiquement à la création, jamais envoyée par le client |
| `author` | `User` | l'utilisateur connecté qui écrit l'avis, jamais envoyé par le client |
| `movie` | `Movie` | le film de l'URL, jamais envoyé par le client |

## Les associations

- **`User` 1 → N `Review`** (l'association OneToMany demandée par le TP) : `User::$reviews` côté inverse, `Review::$author` côté propriétaire (`ManyToOne`, non nul).
- **`Movie` 1 → N `Review`** : `Movie::$reviews` côté inverse, `Review::$movie` côté propriétaire (`ManyToOne`, non nul).
- **Un seul avis par utilisateur et par film** : contrainte d'unicité en base sur (`author`, `movie`) et vérification avant enregistrement.
- Supprimer un film supprime ses avis (`onDelete: CASCADE`).

## Routes

| Méthode | Route | Accès | Rôle | Succès | Erreurs |
|---|---|---|---|---|---|
| `GET` | `/movies/{id}/reviews` | tout le monde | avis d'un film, paginés (5 par défaut), du plus récent au plus ancien | 200 | 404, 422 |
| `POST` | `/movies/{id}/reviews` | connecté | donner son avis sur un film | 201 | 401, 404, 409, 422 |
| `PUT` | `/reviews/{id}` | l'auteur uniquement | modifier sa note et son commentaire | 200 | 401, 403, 404, 422 |
| `DELETE` | `/reviews/{id}` | l'auteur **ou** un administrateur | supprimer un avis | 204 | 401, 403, 404 |

- Un deuxième avis du même utilisateur sur le même film renvoie **409** : il doit modifier le premier.
- Un administrateur peut **supprimer** n'importe quel avis (modération) mais ne peut **modifier** que les siens.
- Les droits « auteur » et « auteur ou administrateur » sont portés par un **voter** (`ReviewVoter`, attributs `REVIEW_EDIT` et `REVIEW_DELETE`), utilisé via `#[IsGranted]`.

Un avis renvoyé :

```json
{ "id": 7, "rating": 4, "comment": "Culte.", "createdAt": "2026-11-24T10:32:00+00:00", "author": { "id": 3 }, "movie": { "id": 4 } }
```

L'auteur n'est exposé que par son `id` : l'e-mail est une donnée personnelle et ne doit pas apparaître publiquement.

## Note moyenne sur les films

`GET /movies/{id}` ajoute :
- `averageRating` : moyenne des notes, arrondie à une décimale, `null` si le film n'a aucun avis ;
- `reviewCount` : nombre d'avis.

Ces valeurs sont **calculées à la lecture** (requête d'agrégat dans `ReviewRepository`) et jamais stockées. Elles ne figurent pas dans la liste `GET /movies`. Les réponses de `POST /movies` et `PUT /movies/{id}` renvoient la même représentation que `GET /movies/{id}`, notes comprises.

## Critères d'acceptation

- `POST /movies/{id}/reviews` connecté avec `{"rating": 4, "comment": "Culte."}` renvoie 201 ; `author` est l'utilisateur connecté.
- Le même utilisateur qui poste un deuxième avis sur ce film reçoit 409.
- `rating` à 0, à 6, ou absent, renvoie 422 ; un commentaire de plus de 1000 caractères renvoie 422.
- `POST` sans jeton renvoie 401 ; sur un film inexistant, 404.
- Un `author` ou un `movie` envoyé dans le corps est ignoré.
- `GET /movies/{id}/reviews` sans jeton renvoie les avis paginés, du plus récent au plus ancien.
- `PUT /reviews/{id}` par l'auteur renvoie 200 ; par un autre utilisateur, 403 ; par un administrateur qui n'est pas l'auteur, 403.
- `DELETE /reviews/{id}` par l'auteur renvoie 204 ; par un administrateur, 204 ; par un autre utilisateur, 403.
- Avec des avis notés 4 et 5, `GET /movies/{id}` renvoie `averageRating: 4.5` et `reviewCount: 2`.
- Un film sans avis renvoie `averageRating: null` et `reviewCount: 0`.
- Après `DELETE /movies/{id}`, ses avis n'existent plus.

## Hors périmètre

- Liste des avis d'un utilisateur (`GET /users/{id}/reviews`).
- Tri de la liste des films par note moyenne.
- Signalement d'un avis, réponses aux avis, « avis utile ».
