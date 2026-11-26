# 06 : Données de test

## Objectif

Remplir la base de données réaliste en une commande, pour pouvoir essayer l'API (et le fichier `.http`) sans tout saisir à la main.

## Prérequis

Specs 01 à 05 terminées. Installer en dépendances de développement `doctrine/doctrine-fixtures-bundle` et `fakerphp/faker`.

## Commande

```bash
pnpm db:reset   # ou : docker exec symfony-api composer db:reset
```

Le script supprime toutes les tables, rejoue les migrations puis charge les fixtures (`doctrine:fixtures:load`) ; on peut le relancer autant de fois qu'on veut. Recréer les tables plutôt que les vider remet les compteurs d'ids SQLite à zéro : les films ont toujours les ids 1 à 40 et l'administrateur l'id 1, ce dont dépendent les fichiers `.http`. Les fixtures ne sont disponibles qu'en environnement `dev` et `test`.

## Contenu

| Donnée            | Quantité  | Détail                                                                                                                     |
| ----------------- | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| Administrateur    | 1         | `admin@prime.local` / `password`, rôles `ROLE_USER` + `ROLE_ADMIN`                                                         |
| Utilisateurs      | 5         | `user1@prime.local` … `user5@prime.local` / `password`                                                                     |
| Genres            | 10        | noms réels : Action, Animation, Aventure, Comédie, Documentaire, Drame, Horreur, Romance, Science-fiction, Thriller        |
| Films             | 40        | titre (`catchPhrase`), synopsis (`realText`), année, durée et classification d'âge générés par Faker ; 1 à 3 genres chacun |
| Avis              | 80        | note de 1 à 5, commentaire dans 80 % des cas, **jamais deux avis du même utilisateur sur le même film**                    |
| Titres similaires | 20 paires | jamais un film lié à lui-même                                                                                              |

- Faker est en français (`Faker\Factory::create('fr_FR')`) et reçoit une **graine fixe par film et par avis** (`$faker->seed(…)` juste avant ses tirages) : chaque chargement produit exactement les mêmes données, ce qui rend les requêtes `.http` reproductibles. Faker tire dans le générateur aléatoire global de PHP ; une graine par élément évite qu'un appel extérieur à ce générateur décale toutes les données suivantes.
- Les mots de passe passent par `UserPasswordHasherInterface`, comme à l'inscription.
- Les valeurs respectent les règles de validation des specs 01 à 05 (années entre 1888 et l'année en cours + 5, durée positive, note de 1 à 5…).
- Une fixture par entité (`UserFixtures`, `GenreFixtures`, `MovieFixtures`, `ReviewFixtures`), avec `DependentFixtureInterface` pour l'ordre de chargement.

## Critères d'acceptation

- Après chargement : 6 utilisateurs dont 1 administrateur, 10 genres, 40 films, environ 80 avis.
- `POST /login` avec `admin@prime.local` / `password` renvoie un jeton ; avec ce jeton, `POST /movies` renvoie 201.
- `POST /login` avec `user1@prime.local` / `password` renvoie un jeton ; avec ce jeton, `POST /movies` renvoie 403.
- Aucun couple (utilisateur, film) n'a deux avis.
- Pour toute paire de titres similaires A–B, B–A existe aussi.
- Deux chargements successifs donnent les mêmes titres de films.

## Hors périmètre

- Données de production, import depuis une vraie source de films (TMDB…).
- Affiches et bandes-annonces.
