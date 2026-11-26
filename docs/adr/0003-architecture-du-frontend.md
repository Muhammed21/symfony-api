# 0003 : Architecture du frontend en modules et couches

## Contexte

Le frontend (`apps/web`) commence avec un seul écran, mais doit grandir (détail d'un film, connexion, avis…) sans que l'interface, les appels HTTP et les règles se mélangent.

## Décision

`apps/web` reprend l'architecture de l'app web de dezyn (hors tests visuels) :

- `src/modules/<module>/` par sous-domaine (ici `catalogue`), découpé en couches :
  - `domain/` : types du domaine, sans dépendance ;
  - `application/` : cas d'usage et port (`*-gateway.ts`) vers l'extérieur ;
  - `infrastructure/` : adaptateur HTTP, valide les réponses de l'API avec Zod ;
  - `presentation/` : routes TanStack Router et composants React, qui reçoivent les cas d'usage en paramètre ;
  - `<module>-module.ts` : fabrique qui assemble cas d'usage et adaptateur.
- `src/platform/` : outils transverses (`http.ts`, `config.ts`).
- `src/main.tsx` : racine de composition, seul endroit qui touche `window.fetch` et `import.meta.env`.
- Les erreurs attendues circulent en `Result` (`@prime/result`), jamais en exceptions.
- TanStack Query met en cache les lectures ; TanStack Router porte l'état de navigation dans l'URL.

Tests :

| Fichier                             | Lancé par                           | Ce qu'il vérifie                                                 |
| ----------------------------------- | ----------------------------------- | ---------------------------------------------------------------- |
| `__tests__/*.test.ts`               | `pnpm test` (Node)                  | un module via sa fabrique, avec un faux `fetch`                  |
| `presentation/__tests__/*.test.tsx` | `pnpm test` (Chromium)              | une route avec de faux cas d'usage                               |
| `__tests__/*.integration.test.ts`   | `pnpm test:integration`             | un module contre la vraie API (conteneur lancé, `pnpm db:reset`) |
| Stryker                             | `pnpm mutation`, `pnpm mutation:ui` | l'efficacité des tests unitaires puis navigateur                 |

## Conséquences

- Plus de fichiers par écran qu'une app React « à plat » ; en échange chaque couche se teste seule et l'interface ne dépend jamais de `fetch`.
- Les règles de dépendance entre couches ne sont pas encore vérifiées automatiquement (dezyn les impose avec un plugin oxlint maison, non repris).
