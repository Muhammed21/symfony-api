# 11 : Frontend, écran d'accueil fidèle à la maquette

## Objectif

Reproduire l'écran d'accueil de la maquette Figma (`2502:2850`) : une grande bannière qui met un film en avant, puis des rangées de vignettes qui défilent à l'horizontale. La grille filtrée des specs 08 et 09 devient la page Catalogue.

## Prérequis

Specs 08, 09 et 10 (images et tri `recent`). Design system `@prime/ui` ([ADR 0004](../adr/0004-design-system.md)).

## Pages et navigation

| Adresse      | Page      | Contenu                                                    |
| ------------ | --------- | ---------------------------------------------------------- |
| `/`          | Accueil   | bannière et rangées (ci-dessous)                           |
| `/catalogue` | Catalogue | la grille filtrée et paginée des specs 08 et 09, inchangée |

- Les paramètres de la spec 09 (`page`, `title`, `year`, `genre`) passent sur `/catalogue`.
- **Barre d'onglets** verticale en verre, à gauche de la fenêtre comme dans la maquette : Accueil (maison), Catalogue (loupe). L'onglet de la page courante est sélectionné (`aria-current="page"`) ; le libellé apparaît au survol et reste lisible par les lecteurs d'écran.
- **Fenêtre** : le contenu tient dans une fenêtre aux coins arrondis, 1280 px de large au plus, centrée sur un fond gris foncé, comme la fenêtre visionOS de la maquette. En dessous de 1280 px, la fenêtre occupe toute la largeur et la barre d'onglets passe en bas de l'écran.
- **Barre de navigation** (92 px) posée sur la bannière : le logo « prime video » à gauche. L'avatar de la maquette n'est pas repris, l'application n'ayant pas encore de compte côté web.

## Accueil

### Bannière (560 px)

- Les 5 films les plus récents (`GET /movies?sort=recent&limit=5`), un à la fois.
- L'image de bannière (`backdropUrl`) remplit la bannière ; un dégradé noir couvre sa moitié basse. Sans image, un fond sombre uni.
- En bas à gauche (marge de 40 px) : un sur-titre en capitales espacées (année · genres), le titre en très grand à la place du logo du film, puis les actions.
- Actions de la maquette : bouton rond « Lecture » (64 px) suivi du texte, puis « Ajouter à ma liste » (+) et « Plus d'infos » (i), 52 px. **Il n'y a ni lecture vidéo, ni liste, ni page de détail** : ces boutons sont affichés mais désactivés, avec la mention « Bientôt disponible » au survol.
- Un `PageControl` centré en bas passe d'un film à l'autre ; pas de défilement automatique.

### Rangées

- **Nouveautés** en premier (`sort=recent`, 12 films), puis **une rangée par genre**, dans l'ordre alphabétique des genres (12 films du genre, triés par titre).
- Chaque rangée : un `SectionHeader` avec chevron qui ouvre le catalogue (`/catalogue` pour Nouveautés, `/catalogue?genre=<id>` pour un genre), puis les vignettes paysage (224 × 125, écart 16, marge 40) qui défilent à l'horizontale.
- Vignette : l'affiche (`posterUrl`) en fond, le titre du film en bas sur un léger dégradé (les photos ne portent pas le titre, contrairement aux affiches de la maquette). Au survol, elle s'agrandit (264 × 147) avec l'ombre flottante. Sans affiche, le rendu actuel (titre sur fond gris).
- Une rangée de genre vide n'apparaît pas. Pendant le chargement, une rangée de vignettes vides ; en cas d'échec, la rangée disparaît sans gêner les autres.

## Design system

- `MovieThumb` accepte une image (`imageUrl`) et affiche le titre par-dessus.
- Nouveau composant `TabBar` : barre d'onglets verticale ; comme pour `Link`, l'application fournit ses propres liens.
- La bannière n'est pas un composant du kit visionOS : elle reste dans `apps/web`, construite avec `ButtonSymbol`, `PageControl` et les jetons.

## Critères d'acceptation

- `/` affiche la bannière du film le plus récent, puis « Nouveautés » et une rangée par genre non vide.
- Le point 3 du `PageControl` affiche le 3ᵉ film le plus récent dans la bannière.
- Le chevron d'une rangée de genre ouvre `/catalogue?genre=<id>` avec le genre déjà sélectionné.
- L'onglet Catalogue ouvre `/catalogue` ; l'onglet de la page courante est signalé.
- Les boutons de la bannière sont désactivés et l'expliquent.
- Un genre sans film ne produit pas de rangée ; un échec de chargement d'une rangée n'empêche pas les autres de s'afficher.

## Hors périmètre

- Lecture vidéo, liste personnelle, page de détail, compte et avatar, défilement automatique de la bannière.
