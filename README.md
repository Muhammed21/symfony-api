# Prime Video (clone)

Monorepo [Turborepo](https://turborepo.com) + pnpm.

| Dossier                      | Contenu                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api`                   | API Symfony 8.1 (PHP 8.5, Doctrine sur SQLite, JWT)                                                                             |
| `apps/web`                   | frontend React 19 + Vite + TanStack Router/Query, en modules et couches ([ADR 0003](docs/adr/0003-architecture-du-frontend.md)) |
| `packages/result`            | type `Result` partagé (erreurs attendues sans exceptions)                                                                       |
| `packages/typescript-config` | configurations TypeScript strictes partagées                                                                                    |
| `docs/`                      | ADR et specs, communs à tout le projet                                                                                          |

PHP et Composer ne sont pas installés sur la machine : l'API tourne dans un conteneur jetable `symfony-api` (image `composer:2`).

## Démarrer

```bash
pnpm install
cp .env.example .env   # configuration du frontend (VITE_API_URL)
pnpm --filter @prime/web exec playwright install chromium   # navigateur des tests frontend
pnpm container:up      # lance le conteneur jetable de l'API
pnpm db:reset          # base + données de test (admin@prime.local / password)
pnpm dev               # API http://localhost:8000, frontend http://localhost:5173
```

Premier clonage : créer les secrets locaux de l'API, voir `docs/specs/03-authentification.md`.

## Frontend → API

En dev, le frontend appelle l'API via le proxy Vite : `/api/movies` est transmis à `http://localhost:8000/movies` (le préfixe `/api` est retiré). La cible se change avec la variable `API_URL`.

## Autres commandes

```bash
pnpm test              # tests de toutes les applications
pnpm test:integration  # frontend contre la vraie API (conteneur et serveur lancés, pnpm db:reset)
pnpm lint
pnpm check-types
pnpm build
pnpm fmt               # formatage (oxfmt)
pnpm mutation          # Stryker
pnpm container:down
```
