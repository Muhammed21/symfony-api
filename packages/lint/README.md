# @prime/lint

Plugin oxlint local des règles d'architecture de l'app web ([ADR 0003](../../docs/adr/0003-architecture-du-frontend.md)), chargé par `jsPlugins` dans `.oxlintrc.json` sous le nom `prime`. Repris du plugin `dezyn`, limité à `apps/web/src/modules/` (l'API, en PHP, n'est pas lintée par oxlint).

| Règle                           | Refuse                                                                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `prime/module-boundaries`       | un import d'un module vers l'intérieur d'un autre, hors de son `contracts/`                                                                 |
| `prime/layer-dependencies`      | un import qui remonte les couches : `presentation` et `infrastructure` → `application` → `domain`, `presentation` → `contracts` → `domain`  |
| `prime/pure-domain`             | dans `domain/`, tout import de paquet ou hors des modules ; dans `contracts/`, tout paquet autre que `zod` (`vitest` toléré dans les tests) |
| `prime/ui-in-presentation`      | React, React DOM, TanStack ou du JSX ailleurs que dans `presentation/` et `main.tsx`                                                        |
| `prime/no-disable-architecture` | un commentaire `oxlint-disable` / `eslint-disable` qui vise une règle `prime/`, ou toutes                                                   |

Tests :

- `src/rules/__tests__/` : chaque règle avec `RuleTester`, et le texte de chaque message.
- `src/__tests__/config.test.ts` : chaque motif `overrides` de `.oxlintrc.json` correspond à un fichier, chaque règle est active en erreur, puis le vrai `oxlint` tourne avec la vraie configuration sur une arborescence temporaire.
- `src/__tests__/repository.test.ts` : une directive `-line` masque aussi `no-disable-architecture` sur sa propre ligne ; ce test refait donc le contrôle hors d'oxlint, sur tous les fichiers suivis par git, avec `oxc-parser`.
- `pnpm mutation` : Stryker sur les règles (2 mutants équivalents survivent dans `pure-domain.ts`).
