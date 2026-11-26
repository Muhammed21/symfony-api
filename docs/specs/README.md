# Specs : clone Prime Video

Mini-TP : API Symfony d'un catalogue de films façon Prime Video. Le vocabulaire est fixé dans [`GLOSSARY.md`](../../GLOSSARY.md), les choix structurants dans [`docs/adr/`](../adr/).

## Ordre de réalisation

| #   | Spec                                                                              | Exigence du TP                                       |
| --- | --------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 01  | [CRUD des films, liste paginée et filtrable](01-films-crud-pagination-filtres.md) | CRUD + listing paginé et filtrable                   |
| 02  | [Genres (ManyToMany Film ↔ Genre)](02-genres-manytomany.md)                       | Association ManyToMany                               |
| 03  | [Authentification](03-authentification.md)                                        | Système d'authentification                           |
| 04  | [Avis (OneToMany Utilisateur → Avis)](04-avis-onetomany.md)                       | Association OneToMany                                |
| 05  | [Titres similaires (Film ↔ Film)](05-titres-similaires.md)                        | Association vers la même entité                      |
| 06  | [Données de test](06-donnees-de-test.md)                                          | Fixtures                                             |
| 07  | [Fichiers `.http`](07-fichiers-http.md)                                           | Toutes les routes testables en `.http` (transversal) |

La spec 07 s'applique à **chaque** spec : une spec n'est terminée que lorsque ses routes sont couvertes par des tests PHPUnit **et** par des requêtes `.http`.

## Décisions communes à toutes les specs

- **Stack** : Symfony 8.1, Doctrine ORM avec SQLite ([ADR 0001](../adr/0001-sqlite-comme-base-de-donnees.md)), Symfony Serializer avec groupes de sérialisation, Validator. Pas d'API Platform.
- **Liaison des données** : `#[MapRequestPayload]` pour les corps JSON, `#[MapQueryString]` pour les paramètres de requête. Pas de `json_decode()` à la main.
- **Pagination** : la classe `App\Model\Paginator` fournie par le TP, alimentée par `App\Model\PaginationDTO` (`page` ≥ 1, 1 par défaut ; `limit` entre 1 et 100, 5 par défaut). Réponse : `{ "total", "lastPage", "items" }`.
- **Erreurs** : format standard Symfony `application/problem+json`, messages de validation en français.

| Situation                                 | Code                                  |
| ----------------------------------------- | ------------------------------------- |
| Lecture réussie / modification réussie    | 200                                   |
| Création réussie                          | 201 (+ ressource créée dans le corps) |
| Suppression réussie / action sans contenu | 204                                   |
| Données ou paramètres invalides           | 422                                   |
| Ressource inexistante                     | 404                                   |
| Non connecté (jeton absent ou expiré)     | 401                                   |
| Connecté mais pas autorisé                | 403                                   |
| Conflit avec une donnée existante         | 409                                   |

- **Tests** : chaque critère d'acceptation devient un test `WebTestCase` qui envoie une vraie requête HTTP. La base de test est réinitialisée entre chaque test.
- **Ancien brouillon `Product`** : supprimé au début de la spec 01 (modèle, dépôt, contrôleur, tests, `.http`). On garde ce qu'on y a appris : objet de pagination validé, 422, tests HTTP, `.http`.
