# SQLite comme base de données

Le projet tourne dans un conteneur jetable basé sur l'image `composer:2`, dont PHP ne contient que le pilote `pdo_sqlite`. On utilise donc SQLite (un fichier dans `var/`) plutôt que MySQL ou PostgreSQL, qui demanderaient un `Dockerfile` et un conteneur de base supplémentaire, ce qu'on a choisi de ne pas mettre en place pour l'instant.

## Consequences

- SQLite n'a pas de fonction `YEAR()` utilisable en DQL : l'année de sortie d'un film est stockée comme un entier (`releaseYear`) plutôt que déduite d'une date.
- La recherche par titre insensible à la casse doit passer par `LOWER()` des deux côtés ; `LIKE` de SQLite n'ignore la casse que pour l'ASCII, donc « É » et « é » ne sont pas confondus.
- Passer plus tard à MySQL/PostgreSQL reste possible via Doctrine (changer `DATABASE_URL` et régénérer les migrations), mais les migrations SQLite existantes ne seront pas réutilisables telles quelles.
