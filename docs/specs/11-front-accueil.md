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
- **Navigation** horizontale et compacte (onglets de 32 px, texte Callout), à gauche dans la barre du logo, 40 px après lui : Accueil (maison) et Catalogue (loupe), avec leur libellé. L'onglet de la page courante est sélectionné (`aria-current="page"`). Sous 600 px de large, seules les icônes restent, le nom de chaque onglet restant lu par les lecteurs d'écran.
- **Pleine page** : le contenu couvre toute la largeur du navigateur, sans fenêtre ni coins arrondis (la fenêtre visionOS de la maquette n'a pas de sens dans un navigateur).
- **Barre de navigation** (92 px) posée sur la bannière : le logo « prime video » à gauche, qui ramène à l'accueil, suivi de la navigation (logo Prime Video officiel en SVG, d'une seule couleur, celle du texte). L'avatar de la maquette arrive avec le compte ([spec 12](12-front-connexion-et-compte.md)).

## Accueil

### Bannière (560 px)

- Les 5 films les plus récents (`GET /movies?sort=recent&limit=5`), un à la fois.
- L'image de bannière (`backdropUrl`) remplit la bannière ; un dégradé noir couvre sa moitié basse. Sans image, un fond sombre uni.
- En bas à gauche (marge de 40 px) : un sur-titre en capitales espacées (année · genres), le titre en très grand à la place du logo du film, puis les actions.
- Actions de la maquette : bouton rond « Lecture » (64 px) suivi du texte, puis « Ajouter à ma liste » (+) et « Plus d'infos » (i), 52 px. **Il n'y a ni lecture vidéo, ni liste, ni page de détail** : ces boutons sont affichés mais désactivés, avec la mention « Bientôt disponible » écrite dessous (un bouton désactivé ne reçoit pas le survol).
- Un `PageControl` centré en bas passe d'un film à l'autre ; pas de défilement automatique.

### Rangées

- **Nouveautés** en premier (`sort=recent`, 12 films), puis **une rangée par genre**, dans l'ordre alphabétique des genres (12 films du genre, triés par titre).
- Chaque rangée : un `SectionHeader` avec chevron qui ouvre le catalogue (`/catalogue` pour Nouveautés, `/catalogue?genre=<id>` pour un genre), puis les vignettes paysage (224 × 125, écart 16, marge 40) qui défilent à l'horizontale.
- Vignette : l'affiche (`posterUrl`) en fond, le titre du film en bas sur un léger dégradé (les photos ne portent pas le titre, contrairement aux affiches de la maquette). Au survol, elle s'agrandit (264 × 147) avec l'ombre flottante. Sans affiche, le rendu actuel (titre sur fond gris).
- Une rangée de genre vide n'apparaît pas, ni pendant son chargement ; en cas d'échec, elle disparaît sans gêner les autres.
- Tant que les nouveautés n'ont pas répondu : un indicateur d'activité « Chargement de l'accueil ». Si elles échouent : `Impossible de charger les nouveautés.` et un bouton Réessayer.

## Mouvement

- Chaque page entre en fondu, en montant de 12 px (320 ms) ; changer de filtre ou de page dans le catalogue ne rejoue pas l'entrée.
- La barre du logo reste en haut de l'écran ; dès que la page défile, elle prend un fond de verre flouté.
- Changer de film à la une fait apparaître la nouvelle bannière en fondu, avec un léger recul de l'image, et remonter son texte (600 ms).
- Les vignettes d'une rangée et les films de la grille entrent l'un après l'autre (40 ms d'écart) ; chaque image apparaît en fondu une fois chargée.
- Ouvrir le catalogue d'un genre depuis l'accueil affiche aussitôt ses films, déjà chargés pour la rangée (même cache).
- Qui préfère réduire les animations (`prefers-reduced-motion`) voit les mêmes écrans, sans mouvement.

## Design system

- `MovieThumb` affiche le titre en légende sur l'image (`captioned`), fait apparaître l'image en fondu une fois chargée, et revient au titre seul si elle ne se charge pas.
- Jetons de mouvement : durées `page` (320 ms) et `slow` (600 ms), courbes `standard` et `decelerate`.
- Nouveau composant `LinkSymbol` : un lien qui a l'allure d'un `ButtonSymbol`, pour le chevron des rangées.
- Nouveau composant `TabBar` : barre d'onglets verticale (celle de la maquette) ou horizontale (`orientation`), en taille `regular` (44 px) ou `small` (32 px), compacte sur écran étroit ; comme pour `Link`, l'application fournit ses propres liens.
- La bannière n'est pas un composant du kit visionOS : elle reste dans `apps/web`, construite avec `ButtonSymbol`, `PageControl` et les jetons.

## Critères d'acceptation

- `/` affiche la bannière du film le plus récent, puis « Nouveautés » et une rangée par genre non vide.
- Le point 3 du `PageControl` affiche le 3ᵉ film le plus récent dans la bannière.
- Le chevron d'une rangée de genre ouvre `/catalogue?genre=<id>` avec le genre déjà sélectionné.
- L'onglet Catalogue, en haut à gauche après le logo, ouvre `/catalogue` ; l'onglet de la page courante est signalé.
- La page couvre toute la largeur du navigateur, sans coins arrondis ni défilement horizontal, y compris sur téléphone.
- Les pages, la bannière et les vignettes s'animent à l'entrée, sauf avec `prefers-reduced-motion: reduce`.
- Les boutons de la bannière sont désactivés et l'expliquent.
- Un genre sans film ne produit pas de rangée ; un échec de chargement d'une rangée n'empêche pas les autres de s'afficher.

## Hors périmètre

- Lecture vidéo, liste personnelle, page de détail, compte et avatar (spec 12), défilement automatique de la bannière.
