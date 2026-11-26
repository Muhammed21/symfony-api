# 0004 : Design system et Storybook

## Contexte

L'interface reprend le fichier Figma « Prime Video – visionOS » (analyse : [docs/design-system/analyse-figma.md](../design-system/analyse-figma.md)). Les valeurs du design (couleurs, typographie, espacements, effets) et les composants doivent être partagés par `apps/web` et documentés dans Storybook, sans que l'un ou l'autre ne dicte la structure de la bibliothèque.

## Décision

Clean Architecture appliquée au design system : les dépendances pointent vers les jetons, Storybook et les applications sont des détails extérieurs.

```
jetons  ←  thème CSS  ←  composants React  ←  apps/web, apps/storybook
```

| Cercle                        | Rôle                                                                                           | Dépend de                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------- |
| `packages/ui/src/tokens/`     | décisions de design en données pures (`as const`), indépendantes de toute technologie de rendu | rien                         |
| `packages/ui/src/theme/`      | adaptateur : traduit les jetons en variables CSS `--prime-*` (`theme.css`, généré)             | `tokens/`                    |
| `packages/ui/src/components/` | composants React + CSS modules, qui ne lisent les jetons qu'à travers les variables CSS        | `react`, d'autres composants |
| `apps/storybook`, `apps/web`  | consommateurs : n'importent que l'API publique `@prime/ui` et `@prime/ui/theme.css`            | `@prime/ui`                  |

- **`theme.css` est généré** (`pnpm --filter @prime/ui generate:theme`) et versionné ; un test échoue s'il ne correspond plus aux jetons, un autre si un composant utilise une variable `--prime-*` qui n'existe pas.
- **Storybook est une application à part** (`apps/storybook`), pas une dépendance de la bibliothèque : `@prime/ui` ne connaît pas Storybook, et les histoires passent par la même API publique que `apps/web`. Les `exports` du paquet interdisent les imports profonds.
- Les règles de dépendance internes à `packages/ui` sont vérifiées par la règle oxlint `prime/design-system-layers`.
- Les composants ne dépendent d'aucun routeur : `Link` rend un `<a href>`, ou confie le rendu à l'application (`render`), qui reçoit la classe et le contenu à poser sur son propre lien (`Link` de TanStack Router dans `apps/web`).
- Les composants ne dépendent d'aucune bibliothèque d'icônes : ils reçoivent le symbole en `ReactNode`. Les applications utilisent **Lucide** (`lucide-react`), les SF Symbols n'étant pas réutilisables hors des plateformes Apple.
- **Police : SF Pro**, appelée par son nom puis par la police système d'Apple (`-apple-system`). Le projet est un exercice d'école non publié ; sur une machine sans SF Pro, la police système prend le relais.
- **Thème sombre uniquement**, comme le fichier Figma.
- **Verre approximé** : chaque couleur Figma composée de couches à modes de fusion (`color-dodge`, `color-burn`…) devient une seule couleur `rgba`, avec `backdrop-filter: blur()` pour les surfaces en verre. Un flou Figma de rayon 100 vaut `blur(50px)` en CSS.
- Les états visionOS deviennent des états web : Hover → `:hover`, Pinch → `:active`, Disabled → `disabled`, Selected → apparence « prominent » (fond blanc, symbole noir). Le « Dwell » (regard prolongé) n'a pas d'équivalent.

Premier lot : jetons, thème, `ButtonSymbol`, `ButtonTextAndSymbol`, `SectionHeader`, `MovieThumb`, `PageControl`, `ActivityIndicator` ; puis `Link` ; puis `TextField` et `SearchToken` (filtres du catalogue, spec 09) ; puis `TabBar`, `LinkSymbol` et la légende de `MovieThumb` (accueil, spec 11).

Valeurs non relevées dans Figma (quota de l'offre Starter atteint) et donc estimées, à vérifier dès que possible : taille des symboles hors bouton Large, couleurs de l'état Disabled, taille des points du `PageControl`, dessin de l'`ActivityIndicator`, style de texte des boutons texte, texte et marges de `Link` (marge de 4px au lieu des 3px relevés, pour rester sur l'échelle d'espacement), marges et ombre en creux du `TextField`, hauteur (32px), marges et texte du `SearchToken`, écarts et couleur de fond de la `TabBar` et seuil (600px) de sa version compacte, durées (320 et 600 ms) et courbes d'accélération des animations (celles de Material 3, faute de valeurs dans le kit), taille et dégradé de la légende de `MovieThumb`.

Tests :

| Fichier                                     | Lancé par              | Ce qu'il vérifie                                               |
| ------------------------------------------- | ---------------------- | -------------------------------------------------------------- |
| `packages/ui/src/theme/__tests__/*.test.ts` | `pnpm test` (Node)     | la feuille de thème produite à partir des jetons, sa fraîcheur |
| `packages/ui/src/components/**/*.test.tsx`  | `pnpm test` (Chromium) | le comportement et les variantes de chaque composant           |
| `apps/storybook/src/**/*.test.ts(x)`        | `pnpm test` (Chromium) | chaque composant public a ses histoires, qui s'affichent       |

## Conséquences

- Changer une valeur de design : modifier le jeton, relancer `generate:theme` ; les composants suivent sans être touchés.
- Un composant ne peut pas utiliser une valeur en dur à la place d'un jeton sans que la revue le voie, et pas une variable inexistante sans qu'un test échoue.
- Deux applications à faire tourner en développement (`pnpm dev` lance aussi Storybook sur le port 6006).
