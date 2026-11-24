# 06 : Données de test

## Objectif

Remplir la base de données réaliste en une commande, pour pouvoir essayer l'API (et le fichier `.http`) sans tout saisir à la main.

## Prérequis

Specs 01 à 05 terminées. Installer en dépendances de développement `doctrine/doctrine-fixtures-bundle` et `fakerphp/faker`.

## Commande

```bash
docker exec symfony-api php bin/console doctrine:fixtures:load --no-interaction
```

Elle **vide la base** puis la remplit ; on peut la relancer autant de fois qu'on veut. Elle n'est disponible qu'en environnement `dev` et `test`.

## Contenu

| Donnée | Quantité | Détail |
|---|---|---|
| Administrateur | 1 | `admin@prime.local` / `password`, rôles `ROLE_USER` + `ROLE_ADMIN` |
| Utilisateurs | 5 | `user1@prime.local` … `user5@prime.local` / `password` |
| Genres | 10 | noms réels : Action, Animation, Aventure, Comédie, Documentaire, Drame, Horreur, Romance, Science-fiction, Thriller |
| Films | 40 | titre, synopsis, année, durée et classification d'âge générés par Faker ; 1 à 3 genres chacun |
| Avis | ~80 | note et commentaire aléatoires, **jamais deux avis du même utilisateur sur le même film** |
| Titres similaires | ~20 paires | jamais un film lié à lui-même |

- Faker est initialisé avec une **graine fixe** (`$faker->seed(…)`) et en français (`Faker\Factory::create('fr_FR')`) : chaque chargement produit exactement les mêmes données, ce qui rend les requêtes `.http` reproductibles.
- Les mots de passe passent par `UserPasswordHasherInterface`, comme à l'inscription.
- Les valeurs respectent les règles de validation des specs 01 à 05 (années entre 1888 et l'année en cours + 5, durée positive, note de 1 à 5…).
- Une fixture par entité (`UserFixtures`, `GenreFixtures`, `MovieFixtures`, `ReviewFixtures`), avec `DependentFixtureInterface` pour l'ordre de chargement.

## Critères d'acceptation

- Après chargement : 6 utilisateurs dont 1 administrateur, 10 genres, 40 films, environ 80 avis.
- `POST /api/login` avec `admin@prime.local` / `password` renvoie un jeton ; avec ce jeton, `POST /movies` renvoie 201.
- `POST /api/login` avec `user1@prime.local` / `password` renvoie un jeton ; avec ce jeton, `POST /movies` renvoie 403.
- Aucun couple (utilisateur, film) n'a deux avis.
- Pour toute paire de titres similaires A–B, B–A existe aussi.
- Deux chargements successifs donnent les mêmes titres de films.

## Hors périmètre

- Données de production, import depuis une vraie source de films (TMDB…).
- Affiches et bandes-annonces.
