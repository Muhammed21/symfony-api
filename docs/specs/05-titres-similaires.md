# 05 : Titres similaires (Film ↔ Film)

## Objectif

Afficher, à côté d'un film, ses **titres similaires** (« Les clients ont aussi regardé »). C'est l'association d'une entité vers elle-même demandée par le TP.

## Prérequis

Specs 01 à 03 terminées (les routes sont réservées aux administrateurs).

## L'association

- `ManyToMany` de `Movie` vers `Movie` : `Movie::$similarMovies`, avec sa propre table de jointure (`movie_similar`).
- La relation est **symétrique** : si A est similaire à B, alors B est similaire à A. Lier ou délier met donc à jour **les deux côtés** ; c'est la méthode du domaine (`Movie::addSimilarMovie()` / `removeSimilarMovie()`) qui garantit cette symétrie, pas le contrôleur.
- Un film ne peut pas être similaire à **lui-même**.
- Supprimer un film le retire des titres similaires de tous les autres films.

## Routes

| Méthode  | Route                            | Accès          | Rôle              | Succès | Erreurs            |
| -------- | -------------------------------- | -------------- | ----------------- | ------ | ------------------ |
| `PUT`    | `/movies/{id}/similar/{otherId}` | administrateur | lier deux films   | 204    | 401, 403, 404, 422 |
| `DELETE` | `/movies/{id}/similar/{otherId}` | administrateur | délier deux films | 204    | 401, 403, 404      |

- `PUT` est **idempotent** : lier deux films déjà liés renvoie 204 sans rien changer.
- `DELETE` sur deux films qui ne sont pas liés renvoie aussi 204.
- `{id}` égal à `{otherId}` renvoie 422.
- L'un des deux films inexistant : 404.

`GET /movies/{id}` ajoute `similarMovies`, une liste de `{ "id", "title" }` triée par titre. Elle n'apparaît pas dans `GET /movies`. Les titres similaires ne sont pas imbriqués à plusieurs niveaux (le groupe de sérialisation `movie:similar` n'expose que `id` et `title`, ce qui évite les références circulaires).

## Critères d'acceptation

- Un administrateur fait `PUT /movies/1/similar/2` : 204 ; `GET /movies/1` contient le film 2 dans `similarMovies` **et** `GET /movies/2` contient le film 1.
- Refaire `PUT /movies/1/similar/2`, ou faire `PUT /movies/2/similar/1`, renvoie 204 sans créer de doublon.
- `DELETE /movies/2/similar/1` délie les **deux** côtés.
- `PUT /movies/1/similar/1` renvoie 422.
- `PUT /movies/1/similar/999` renvoie 404.
- Sans jeton : 401 ; avec le jeton d'un utilisateur simple : 403.
- Après `DELETE /movies/2`, `GET /movies/1` ne contient plus le film 2.
- `GET /movies/{id}` d'un film sans titre similaire renvoie `similarMovies: []`.

## Hors périmètre

- Calcul automatique des titres similaires (par genre ou par avis) : la liste est gérée à la main par les administrateurs.
- Suites et préquelles (relation orientée « A suit B »).
