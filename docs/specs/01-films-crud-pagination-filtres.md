# 01 : CRUD des films, liste paginée et filtrable

## Objectif

Pouvoir gérer les **films** du catalogue (créer, lire, modifier, supprimer) et parcourir le catalogue page par page, en filtrant par titre et par année.

## Prérequis

- Supprimer le brouillon `Product` (`src/Model/Product.php`, `src/Repository/ProductRepository.php`, actions et tests associés, `http/product.http`).
- Installer Doctrine ORM (`composer require symfony/orm-pack`) et `symfony/serializer`, configurer `DATABASE_URL` sur SQLite.
- Transformer `App\Dto\PaginationQuery` en `App\Model\PaginationDTO` (mêmes règles) et ajouter la classe `App\Model\Paginator` fournie par le TP.

## Le film

| Champ | Type | Règles |
|---|---|---|
| `id` | entier | attribué par la base, jamais envoyé par le client |
| `title` | texte | obligatoire, 1 à 255 caractères |
| `synopsis` | texte ou `null` | facultatif, 2000 caractères maximum |
| `releaseYear` | entier | obligatoire, entre 1888 et l'année en cours + 5 |
| `duration` | entier (minutes) | obligatoire, strictement positif |
| `ageRating` | énumération | obligatoire, une valeur parmi `ALL`, `7+`, `13+`, `16+`, `18+` |

`ageRating` est un enum PHP (`App\Enum\AgeRating`) ; une valeur hors liste renvoie 422.

## Routes

| Méthode | Route | Rôle | Succès | Erreurs |
|---|---|---|---|---|
| `GET` | `/movies` | liste paginée et filtrée | 200 | 422 |
| `GET` | `/movies/{id}` | détail d'un film | 200 | 404 |
| `POST` | `/movies` | créer un film | 201 | 422 |
| `PUT` | `/movies/{id}` | remplacer entièrement un film | 200 | 404, 422 |
| `DELETE` | `/movies/{id}` | supprimer un film | 204 | 404 |

Pas de `PATCH` : `PUT` exige tous les champs obligatoires.

Jusqu'à la spec 03, toutes ces routes sont ouvertes à tous.

## Liste : pagination, filtres, tri

`GET /movies?title=par&year=1972&page=2&limit=3`

| Paramètre | Effet | Valeur invalide |
|---|---|---|
| `page` | numéro de page, 1 par défaut | < 1 → 422 |
| `limit` | films par page, **5 par défaut** | < 1 ou > 100 → 422 |
| `title` | le titre **contient** le texte, sans tenir compte des majuscules | (texte libre) |
| `year` | année de sortie **exacte** | non entier → 422 |

- Les filtres se **cumulent** (ET logique) ; un filtre absent ou vide est ignoré.
- Tri fixe : `title` croissant, puis `id` croissant (ordre stable d'une page à l'autre).
- Une page au-delà de la dernière renvoie `items: []` avec le bon `total`.
- Les filtres sont construits dans `MovieRepository` à partir d'un objet de filtres validé (`#[MapQueryString]`), puis passés au `Paginator`.

Réponse :

```json
{
  "total": 12,
  "lastPage": 4,
  "items": [
    { "id": 4, "title": "Le Parrain", "releaseYear": 1972, "duration": 175, "ageRating": "16+" }
  ]
}
```

La liste n'expose pas le `synopsis` (groupe de sérialisation `movie:list`) ; le détail l'expose (`movie:read`).

## Critères d'acceptation

Liste :
- Sans paramètre, `GET /movies` renvoie les 5 premiers films triés par titre, avec `total` et `lastPage`.
- `?page=2&limit=3` renvoie les films 4 à 6 de la liste triée.
- `?page=2` seul renvoie 5 films (limite par défaut).
- `?title=PAR` trouve « Le Parrain » (recherche partielle, insensible à la casse).
- `?year=1972` ne renvoie que les films de 1972.
- `?title=par&year=1974` ne renvoie que les films correspondant aux **deux** filtres.
- Un filtre qui ne correspond à rien renvoie `total: 0` et `items: []`.
- `?page=0`, `?limit=0`, `?limit=101`, `?year=abc` renvoient 422.

CRUD :
- `POST /movies` avec un corps valide renvoie 201 et le film avec son `id`.
- `POST /movies` sans `title`, avec `releaseYear: 1800`, `duration: 0` ou `ageRating: "12+"` renvoie 422 et nomme le champ fautif.
- `GET /movies/{id}` renvoie le film avec son `synopsis` ; un id inconnu renvoie 404.
- `PUT /movies/{id}` remplace tous les champs et renvoie 200 ; un champ obligatoire manquant renvoie 422.
- `DELETE /movies/{id}` renvoie 204, puis `GET /movies/{id}` renvoie 404.

## Hors périmètre

- Genres (spec 02), avis et note moyenne (spec 04), titres similaires (spec 05).
- Restriction aux administrateurs (spec 03).
- Séries, saisons et épisodes.
