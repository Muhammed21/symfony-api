# 03 : Authentification

## Objectif

Permettre aux **utilisateurs** de créer un compte et de se connecter, puis réserver la gestion du catalogue aux **administrateurs**. Voir [ADR 0002](../adr/0002-authentification-jwt.md).

## Prérequis

Specs 01 et 02 terminées. Installer `symfony/security-bundle` et `lexik/jwt-authentication-bundle`, générer la paire de clés (`php bin/console lexik:jwt:generate-keypair`), mettre la phrase secrète dans `.env.local`.

Après un clonage du dépôt, ni la phrase secrète ni les clés ne sont présentes (elles ne sont pas versionnées) :

```bash
cd apps/api
echo "JWT_PASSPHRASE=$(openssl rand -hex 32)" > .env.local
cp .env.local .env.test.local   # l'environnement de test ne lit pas .env.local
echo "APP_SECRET=$(openssl rand -hex 16)" >> .env.local
docker exec symfony-api php bin/console lexik:jwt:generate-keypair
```

Le compte administrateur (`admin@prime.local` / `password`) est créé par les données de test (spec 06) : `pnpm db:reset`.

## L'utilisateur

| Champ | Type | Règles |
|---|---|---|
| `id` | entier | attribué par la base |
| `email` | texte | obligatoire, format e-mail valide, **unique** sans tenir compte des majuscules |
| `password` | texte | obligatoire à l'inscription, 8 caractères minimum, **enregistré chiffré**, jamais renvoyé dans une réponse |
| `roles` | liste | `ROLE_USER` pour tous ; `ROLE_ADMIN` en plus pour les administrateurs |

`User` implémente `UserInterface` et `PasswordAuthenticatedUserInterface`. Le mot de passe est chiffré avec `UserPasswordHasherInterface`.

## Routes

| Méthode | Route | Accès | Rôle | Succès | Erreurs |
|---|---|---|---|---|---|
| `POST` | `/register` | public | créer un compte utilisateur | 201 | 409, 422 |
| `POST` | `/login` | public | obtenir un jeton JWT | 200 `{ "token": "…" }` | 401 |
| `GET` | `/me` | connecté | voir son propre compte | 200 | 401 |

- `/register` crée **toujours** un utilisateur simple (`ROLE_USER`). Un champ `roles` envoyé dans le corps est ignoré. Les administrateurs n'existent que via les données de test (spec 06).
- Un e-mail déjà utilisé renvoie **409**.
- `/me` renvoie `{ "id", "email", "roles" }`.

## Règles d'accès

À partir de cette spec, chaque requête protégée doit porter `Authorization: Bearer <jeton>`.

| Ressource | Lecture (`GET`) | Écriture (`POST`, `PUT`, `DELETE`) |
|---|---|---|
| Films | tout le monde | administrateur |
| Genres | tout le monde | administrateur |

- Accès déclaré avec `#[IsGranted('ROLE_ADMIN')]` sur les actions d'écriture ; les `GET` restent publics (`access_control` en `PUBLIC_ACCESS`).
- Sans jeton, ou jeton expiré/invalide, sur une route protégée : **401**.
- Avec un jeton valide mais sans le rôle requis : **403**.

## Critères d'acceptation

Inscription et connexion :
- `POST /register` avec un e-mail et un mot de passe valides renvoie 201, sans le mot de passe dans la réponse.
- `POST /register` avec un e-mail déjà pris (même en majuscules) renvoie 409.
- `POST /register` avec un e-mail invalide ou un mot de passe de moins de 8 caractères renvoie 422.
- `POST /register` avec `"roles": ["ROLE_ADMIN"]` crée un utilisateur qui n'a que `ROLE_USER`.
- `POST /login` avec les bons identifiants renvoie 200 et un `token`.
- `POST /login` avec un mauvais mot de passe renvoie 401.
- `GET /me` avec le jeton renvoie l'utilisateur ; sans jeton, 401.

Accès :
- `GET /movies` et `GET /genres` répondent 200 sans jeton.
- `POST /movies` sans jeton renvoie 401.
- `POST /movies` avec le jeton d'un utilisateur simple renvoie 403.
- `POST /movies` avec le jeton d'un administrateur renvoie 201.
- Même trio (401 / 403 / succès) pour `PUT` et `DELETE` sur films et genres.

## Hors périmètre

- Déconnexion côté serveur et révocation des jetons, jeton de rafraîchissement.
- Mot de passe oublié, confirmation d'e-mail.
- Modification ou suppression de son compte.
