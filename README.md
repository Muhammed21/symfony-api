# Prime Video (clone)

Monorepo [Turborepo](https://turborepo.com) + pnpm.

| Dossier | Contenu |
|---|---|
| `apps/api` | API Symfony 8.1 (PHP 8.5, Doctrine sur SQLite, JWT) |
| `apps/web` | frontend React 19 + Vite + TypeScript strict, testé avec Vitest en mode navigateur |
| `packages/` | code partagé entre applications |
| `docs/` | ADR et specs, communs à tout le projet |

PHP et Composer ne sont pas installés sur la machine : l'API tourne dans un conteneur jetable `symfony-api` (image `composer:2`).

## Démarrer

```bash
pnpm install
pnpm --filter @prime/web exec playwright install chromium   # navigateur des tests frontend
pnpm container:up      # lance le conteneur jetable de l'API
pnpm db:reset          # base + données de test (admin@prime.local / password)
pnpm dev               # API http://localhost:8000, frontend http://localhost:5173
```

Premier clonage : créer les secrets locaux de l'API, voir `docs/specs/03-authentification.md`.

## Autres commandes

```bash
pnpm test              # tests de toutes les applications
pnpm lint
pnpm typecheck
pnpm build
pnpm container:down
```
