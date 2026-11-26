# Prime Video (clone)

Monorepo [Turborepo](https://turborepo.com) + pnpm.

| Dossier | Contenu |
|---|---|
| `apps/api` | API Symfony 8.1 (PHP 8.5, Doctrine sur SQLite, JWT) |
| `apps/` | futur frontend |
| `packages/` | code partagé entre applications |
| `docs/` | ADR et specs, communs à tout le projet |

PHP et Composer ne sont pas installés sur la machine : l'API tourne dans un conteneur jetable `symfony-api` (image `composer:2`).

## Démarrer

```bash
pnpm install
pnpm container:up      # lance le conteneur jetable de l'API
pnpm db:reset          # base + données de test (admin@prime.local / password)
pnpm dev               # http://localhost:8000
```

Premier clonage : créer les secrets locaux de l'API, voir `docs/specs/03-authentification.md`.

## Autres commandes

```bash
pnpm test              # tests de toutes les applications
pnpm lint
pnpm container:down
```
