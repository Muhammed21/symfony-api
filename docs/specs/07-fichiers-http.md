# 07 : Fichiers `.http` (transversal)

## Objectif

Pouvoir essayer **chaque route** de l'API à la main, depuis l'éditeur (PhpStorm, ou VS Code avec l'extension REST Client), sans outil externe. Cette spec s'applique à toutes les autres : une spec n'est terminée que si ses routes sont dans un fichier `.http`.

## Organisation

```
http/
├── http-client.env.json   ← variables par environnement (baseUrl, identifiants de test)
├── auth.http              ← inscription, connexion, /me
├── movies.http            ← CRUD, pagination, filtres, titres similaires
├── genres.http            ← CRUD des genres
└── reviews.http           ← avis d'un film, création, modification, suppression
```

`http-client.env.json` :

```json
{
  "dev": {
    "baseUrl": "http://localhost:8000",
    "adminEmail": "admin@prime.local",
    "userEmail": "user1@prime.local",
    "password": "password"
  }
}
```

Ces identifiants sont ceux des données de test (spec 06), donc sans secret réel.

## Règles d'écriture

- Chaque requête est précédée d'un titre `### …` qui dit **ce qu'elle montre et le code attendu**, par exemple `### Créer un film sans titre → 422`.
- Toutes les requêtes envoient `Accept: application/json` (erreurs en JSON plutôt qu'en page HTML) ; les requêtes avec corps envoient aussi `Content-Type: application/json`.
- Pour chaque route : **au moins** un cas qui réussit et un cas pour chaque code d'erreur listé dans sa spec (404, 422, 401, 403, 409).
- Le jeton est **récupéré automatiquement** à la connexion et réutilisé, sans copier-coller :

  ```http
  ### Connexion administrateur → 200
  # @name loginAdmin
  POST {{baseUrl}}/api/login
  Content-Type: application/json
  Accept: application/json

  { "email": "{{adminEmail}}", "password": "{{password}}" }

  ### Créer un film (administrateur) → 201
  POST {{baseUrl}}/movies
  Authorization: Bearer {{loginAdmin.response.body.token}}
  Content-Type: application/json
  Accept: application/json

  { "title": "Le Parrain", "releaseYear": 1972, "duration": 175, "ageRating": "16+", "genres": [1] }
  ```

  La syntaxe `{{loginAdmin.response.body.token}}` est celle de l'extension REST Client de VS Code ; dans PhpStorm, on enregistre le jeton avec un script de réponse (`> {% client.global.set("adminToken", response.body.token); %}`) puis on l'utilise via `{{adminToken}}`. Le fichier doit fonctionner dans l'éditeur choisi par l'équipe.
- Les ids utilisés supposent les données de test chargées (spec 06).

## Requêtes attendues

| Fichier | Requêtes minimales |
|---|---|
| `auth.http` | inscription réussie (201), e-mail déjà pris (409), mot de passe trop court (422), connexion admin et utilisateur (200), mauvais mot de passe (401), `/me` avec et sans jeton (200 / 401) |
| `movies.http` | liste par défaut, `?page=2&limit=3`, `?title=…`, `?year=…`, `?genre=…`, filtres cumulés, `?page=0` (422) ; détail (200 / 404) ; création admin (201), sans jeton (401), utilisateur simple (403), invalide (422) ; `PUT` (200 / 422) ; `DELETE` (204) ; lier et délier des titres similaires (204), film lié à lui-même (422) |
| `genres.http` | liste, détail, création (201), nom en double (422), renommage, suppression (204), et les cas 401 / 403 |
| `reviews.http` | avis d'un film, poster un avis (201), deuxième avis (409), note à 6 (422), modifier le sien (200), modifier celui d'un autre (403), supprimer en tant qu'administrateur (204) |

## Critères d'acceptation

- Avec le serveur démarré et les données de test chargées, chaque requête de chaque fichier renvoie le code annoncé dans son titre.
- Aucun jeton n'est écrit en dur dans un fichier `.http`.
- Chaque route listée dans les specs 01 à 05 apparaît dans au moins une requête.

## Hors périmètre

- Exécution automatique des fichiers `.http` en intégration continue : les tests PHPUnit (`WebTestCase`) restent la vérification automatique.
