# Analyse du fichier Figma « Prime Video – visionOS (Community) »

Source : `https://www.figma.com/design/P6Hg8Oir2h3bxhFW31Zx1Y` (écran de référence `2502:2850`). Lecture seule : le fichier n'a pas été modifié.

## 1. Ce que contient le fichier

| Page                         | Contenu                                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Design                       | l'écran d'accueil Prime Video (hero, rangées de vignettes, barre de navigation, barre d'onglets latérale)        |
| Components                   | le kit visionOS d'Apple (79 jeux de variantes, 15 composants seuls) + 2 composants Prime : `Logo`, `Movie Thumb` |
| Templates                    | 6 écrans d'exemple visionOS (tableau, alerte, barre d'outils…) : aucun composant propre                          |
| Colors                       | 13 nuancier « System » (rouge → gris)                                                                            |
| Materials                    | planche des matériaux verre (pas de composant)                                                                   |
| Text styles and dynamic type | planche de la typographie                                                                                        |

Conséquences :

- Le fichier est **le kit visionOS d'Apple, plus un écran Prime Video construit avec**. L'identité Prime Video tient en peu de choses : logo, vignettes de films, hero. Tout le reste est du visionOS.
- **Aucune variable Figma** : une collection vide `Collection 1` (modes Light / Dark). Les jetons sont des **styles** (couleur, texte, effet). Il n'y a ni espacements ni rayons nommés : il faut les relever sur les composants.
- **Thème sombre uniquement** : les valeurs sont celles de visionOS en sombre. Aucun mode clair à prévoir.

## 2. Couleurs (36 styles)

### Palette système

| Jeton  | Valeur    | Jeton  | Valeur    | Jeton | Valeur    |
| ------ | --------- | ------ | --------- | ----- | --------- |
| Red    | `#ff453a` | Teal   | `#6ac4dc` | Pink  | `#ff375f` |
| Orange | `#ff9f0a` | Cyan   | `#5ac8f5` | Brown | `#ac8e68` |
| Yellow | `#ffd60a` | Blue   | `#0a84ff` | Gray  | `#98989d` |
| Green  | `#32d74b` | Indigo | `#5e5ce6` | Black | `#000000` |
| Mint   | `#66d4cf` | Purple | `#bf5af2` | White | `#fefefe` |

### Couleurs sémantiques (verre)

La plupart sont **deux couches superposées avec des modes de fusion** (`COLOR_DODGE`, `COLOR_BURN`, `LUMINOSITY`, `LIGHTEN`). Rendues sur un fond flouté, elles donnent l'aspect « verre » de visionOS.

| Jeton                           | Composition Figma                                     |
| ------------------------------- | ----------------------------------------------------- |
| Text/Primary                    | `#ffffff` 96 %                                        |
| Text/Secondary                  | `#ffffff` 23 % lighten + `#545454` color-dodge        |
| Text/Tertiary                   | `#ffffff` 11 % + `#5e5e5e` 21 % color-dodge           |
| Controls/Idle                   | `#ffffff` 7 % + `#5e5e5e` 18 % color-dodge            |
| Controls/Hover                  | `#ffffff` 4 % lighten + `#5e5e5e` 6 % color-dodge     |
| Controls/Pinch (appui)          | `#ffffff` 16 % lighten + `#5e5e5e` 36 % color-dodge   |
| Controls/Selected               | `#ffffff` color-dodge                                 |
| Controls/Disabled               | `#ffffff` 4 % lighten + `#5e5e5e` 6 % color-dodge     |
| Views/Thin                      | `#ffffff` 7 % lighten + `#5e5e5e` 13 % color-dodge    |
| Views/Regular                   | `#d6d6d6` 45 % color-burn + `#000000` 8 % luminosity  |
| Views/Thicker                   | `#dadada` 92 % color-burn + `#000000` 10 % luminosity |
| Views/Recessed Material View    | `#000000` 10 % luminosity + `#d0d0d0` 50 % color-burn |
| Windows/Glass                   | `#808080` 30 % luminosity                             |
| Windows/Glass - Keyboard        | `#808080` 30 % luminosity + `#454545` 15 % darken     |
| Windows/(Stroke) Glass Specular | dégradé linéaire blanc 40 % → 0 % (41–57 %) → 10 %    |
| Separators/Separator            | `#ffffff` 7 % lighten + `#5e5e5e` 15 % color-dodge    |

Les styles `_Template/*` servent à annoter le kit ; ils ne sont pas à reprendre.

**Limite web** : CSS ne sait pas appliquer un mode de fusion **par couche de remplissage** sur un seul élément. Deux options :

1. **Approximation** (recommandée) : chaque jeton devient une seule couleur `rgba` calibrée à l'œil sur la capture, plus `backdrop-filter: blur()` pour le verre. Simple et performant.
2. **Fidélité** : empiler des pseudo-éléments avec `mix-blend-mode`. C'est coûteux, fragile sur certains navigateurs, et ne paie que sur des surfaces de verre au-dessus d'une image.

## 3. Typographie (13 styles, police SF Pro, espacement des lettres 0)

| Style       | Graisse | Taille / interligne |
| ----------- | ------- | ------------------- |
| XLTitle1    | Bold    | 48 / 56             |
| XLTitle2    | Bold    | 38 / 46             |
| LargeTitle  | Bold    | 29 / 38             |
| Title1      | Bold    | 24 / 32             |
| Title2      | Bold    | 22 / 28             |
| Title3      | Bold    | 19 / 24             |
| Headline    | Bold    | 17 / 22             |
| Body        | Medium  | 17 / 22             |
| Callout     | Medium  | 15 / 20             |
| Subheadline | Regular | 15 / 20             |
| Footnote    | Medium  | 13 / 18             |
| Caption1    | Medium  | 12 / 16             |
| Caption2    | Medium  | 12 / 16             |

Caption1 et Caption2 sont identiques dans le fichier (sur visionOS, Caption2 vaut normalement 11 / 13).

L'écran utilise aussi un sur-titre en capitales espacées (« AMAZON ORIGINAL »), mais il est dessiné en image, pas en style de texte.

**SF Pro ne peut pas être distribuée sur le web** (licence Apple). Pile proposée : `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, …`. Elle affiche SF sur Apple et la police système ailleurs. Inter peut servir de repli auto-hébergé si on veut un rendu identique partout.

## 4. Effets (6 styles)

| Style                      | Définition                                                                                    |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| Blur                       | flou d'arrière-plan 100                                                                       |
| Blur + Shadow Small        | flou 100 + ombre `0 2 4` noir 10 %                                                            |
| Blur + Shadow Big          | flou 100 + ombres `0 40 80` noir 30 % et `0 7 10` noir 9 %                                    |
| Floating Thumbs Shadow     | ombre `0 16 52` noir 60 % (vignette survolée)                                                 |
| Recessed                   | 4 ombres internes (sombre en haut, reflet blanc en bas), deux en `overlay` : champs de saisie |
| Recessed - Highlights only | 2 ombres internes de reflet (`lighten`, `color-dodge`)                                        |

Un flou Figma de 100 correspond à peu près à `backdrop-filter: blur(50px)` en CSS : Figma compte le rayon, CSS l'écart-type. La valeur sera à ajuster sur la capture.

## 5. Mesures relevées (pas de jetons dans le fichier)

**Rayons** : 8 (petit bouton texte, lien), 12 (bouton texte normal, champs rectangulaires, vignette), 16 (grand bouton texte), 32 (alerte), 34 (barre d'onglets), pilule (100 / 500 dans Figma → `9999px`).

**Espacements** : 3, 4, 6, 8, 10, 12, 16, 20, 24, 25, 40. L'échelle utile se réduit à 4 · 8 · 12 · 16 · 20 · 24 · 40.

- Le 25 (marge des grands boutons) peut devenir 24.
- Le 6 est l'écart icône/texte d'un bouton ; on le garde comme cas particulier.
- Sur l'écran, la marge latérale est de 40, l'écart entre vignettes de 16 et le titre de section est à 16 au-dessus des vignettes.

**Tailles de contrôle** :

| Contrôle              | Tailles                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| Bouton symbole (rond) | 64 (XL) · 52 (L) · 44 (Regular) · 32 (S) · Mini (non relevée)                                      |
| Boutons texte         | hauteur 52 (L) · 44 (Regular) · 32 (S)                                                             |
| Avatar                | 128 · 88 · 52 · 44                                                                                 |
| Champs                | 305 × 44                                                                                           |
| Bascule               | 56 × 32                                                                                            |
| Case à cocher         | 28                                                                                                 |
| Indicateur d'activité | 20 · 28 · 44                                                                                       |
| Barre de progression  | hauteur 4                                                                                          |
| Barre de navigation   | hauteur 92, marges 24                                                                              |
| Vignette de film      | 224 × 125 (paysage) ou 224 × 336 (portrait), agrandie à 264 × 147 au survol avec l'ombre flottante |
| Hero                  | 560 de haut, dégradé noir sur la moitié basse                                                      |

## 6. Inventaire des composants et pertinence pour l'application

**À reprendre** : ce dont l'application web a besoin.

| Composant Figma                          | Variantes                                                                            | Usage dans l'application                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------- |
| Button - Symbol                          | 5 tailles × 6 états (Idle avec ou sans fond, Hover, Hover+Dwell, Selected, Disabled) | lecture, ajouter à ma liste, infos, chevrons |
| Button - Text and Symbol                 | 2 tailles × 5 états                                                                  | « Lecture S1 E1 »                            |
| Button - Text                            | 3 tailles × 5 états × 2 formes (rectangle arrondi, capsule)                          | actions de formulaire                        |
| Link                                     | 3 états                                                                              | liens                                        |
| Section Header                           | Standard / avec sous-titre / avec sur-titre                                          | « Your Watchlist ›                           |
| Movie Thumb _(Prime)_                    | Default (paysage) / Vertical                                                         | cartes de film (remplace l'`article` actuel) |
| Logo _(Prime)_                           | Default / Mono                                                                       | barre de navigation                          |
| Navigation Bar                           | 6 styles (avatar, recherche, boutons à droite, retour…)                              | en-tête                                      |
| Tab Bar                                  | 2 à 7 onglets, onglet sélectionné, survol                                            | navigation principale (verticale)            |
| Page Control                             | 2 à 8+ points, sélection                                                             | carrousel du hero, **pagination**            |
| Icons - Avatar                           | 4 tailles                                                                            | compte                                       |
| Text Field / Secure Field / Search Field | pilule ou rectangle × états (Idle, Hover, Typing, Disabled)                          | connexion, inscription, recherche            |
| Segmented Control                        | 2 à 5 segments                                                                       | filtre par genre                             |
| Activity Indicator                       | 3 tailles                                                                            | « Chargement des films… »                    |
| Alert                                    | 0 à 3 actions, champ de saisie                                                       | erreurs, confirmations admin                 |
| Toggle, Checkbox                         | activé ou non × états                                                                | formulaires                                  |
| Progress Bar                             | 0 à 100 %                                                                            | reprise de lecture                           |
| Separator                                | —                                                                                    | listes                                       |

**À ignorer** : composants propres au système visionOS, sans équivalent dans une application web de films : Window Controls, Window Resize, Keyboard, Share Sheet, Color Picker, Notifications, System Activities, Requests, Privacy Indicator, SharePlay, App Icons et badges, Index Bar, Date/Time Pickers, Sliders (4 jeux, 255 variantes), Toolbars, Sidebars, Context Menu, Tooltip, Backgrounds.

Correspondance des états visionOS vers le web :

| État visionOS | Équivalent web                                    |
| ------------- | ------------------------------------------------- |
| Hover         | `:hover` et `:focus-visible`                      |
| Pinch         | `:active`                                         |
| Selected      | `aria-pressed`, `aria-current` ou `aria-selected` |
| Disabled      | `:disabled`                                       |

L'état « Dwell » (regard prolongé) n'a pas d'équivalent.

## 7. Proposition de paquet

Un seul paquet **`packages/ui` (`@prime/ui`)**, avec Storybook à l'intérieur :

```
packages/ui/
  src/
    tokens/          couleurs, typographie, espacements, rayons, effets, tailles : objets TypeScript `as const`
    styles/          tokens.css (variables CSS --prime-*) produit à partir de tokens/, plus un reset minimal
    components/      un dossier par composant : Composant.tsx, Composant.stories.tsx, __tests__/
  .storybook/        @storybook/react-vite, fond sombre par défaut, image de fond pour juger le verre
```

- **Source unique des jetons** : TypeScript, typé et testable. Les variables CSS en sont générées, et un test vérifie qu'elles ne dérivent pas des jetons.
- Composants en React et CSS modules, sans dépendance de style externe. Ils sont testés en Vitest navigateur comme `apps/web`, puis documentés dans Storybook, sans test visuel pour l'instant comme convenu pour le web.
- `apps/web` consomme `@prime/ui`. Les règles d'architecture (ADR 0003) restent valables : les composants n'entrent que dans `presentation/`.
- Une ADR 0004 consignera les choix ci-dessous.

Alternative : deux paquets (`@prime/tokens` et `@prime/ui`). Ce découpage n'est utile que si d'autres consommateurs que React ont besoin des jetons, ce qui n'est pas le cas aujourd'hui.

## 8. Décisions à prendre avant de coder

1. **Police** : la pile système (SF sur Apple), ou Inter auto-hébergée pour un rendu identique partout ?
2. **Verre** : approximation `rgba` + flou (recommandée), ou superposition fidèle des modes de fusion ?
3. **Périmètre du premier lot** : proposition : jetons, Button - Symbol, Button - Text and Symbol, Section Header, Movie Thumb, Page Control (pour la pagination existante), Activity Indicator. On rhabille ainsi la liste des films (spec 08).
4. **Icônes** : les symboles sont des SF Symbols, sous licence Apple et non réutilisables sur le web. Il faut un jeu libre équivalent (Lucide ou Phosphor, par exemple).
5. **Marques et images** : le logo Prime Video et les affiches du fichier sont des marques et des œuvres protégées. On les garde pour un exercice non publié, ou on les remplace par des substituts ? L'API ne fournit pas d'affiches (spec 06, hors périmètre).

## 9. Pas encore relevé

Les couleurs exactes des états **Hover / Selected / Disabled** à l'intérieur de chaque composant, et les tailles « Mini ». Ces valeurs seront lues composant par composant (`get_design_context`) au moment de les implémenter.
