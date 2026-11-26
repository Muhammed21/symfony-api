# 09 : Frontend, filtres de la liste des films

## Objectif

Trouver un film dans le catalogue par son titre, son année ou son genre, sans quitter la liste (spec 08).

## Prérequis

Spec 08 (liste des films). Côté API, rien à faire : `GET /movies` filtre déjà par `title`, `year` et `genre` (specs 01 et 02), `GET /genres` liste les genres. Composants : design system `@prime/ui` ([ADR 0004](../adr/0004-design-system.md)).

## Comportement

Au-dessus de la liste, une barre de filtres :

| Filtre | Composant                                  | Appel à l'API                          | S'applique                                                     |
| ------ | ------------------------------------------ | -------------------------------------- | -------------------------------------------------------------- |
| Titre  | champ de recherche « Rechercher un titre » | `title=<texte>` (contient, sans casse) | pendant la frappe, 300 ms après la dernière touche             |
| Année  | champ « Année »                            | `year=<année>` (exacte)                | dès qu'elle compte 4 chiffres, 300 ms après la dernière touche |
| Genre  | une pilule par genre, plus « Tous »        | `genre=<id>`                           | au clic                                                        |

- Les filtres sont dans l'adresse avec la page : `/?page=2&title=par&year=1972&genre=3`. Un lien se partage, le bouton Retour revient au filtre précédent. Pendant la frappe, l'adresse est **remplacée** (pas une entrée d'historique par touche).
- Les filtres se cumulent. Changer un filtre ramène à la **page 1**. Les liens Précédent / Suivant et les points de pagination **gardent** les filtres.
- Un champ vidé retire son filtre ; « Tous » retire le filtre de genre. Une pilule sélectionnée est en blanc (`aria-pressed`).
- Dans l'adresse, un titre vide, une année ou un genre qui n'est pas un entier positif sont ignorés (comme une page invalide, spec 08). Les champs reprennent les valeurs de l'adresse à l'ouverture.
- Les genres viennent de `GET /genres?limit=100`, triés par nom ; s'ils ne se chargent pas, la rangée de pilules n'apparaît pas et le reste de l'écran fonctionne.
- Aucun film pour ces filtres : `Aucun film ne correspond à ces filtres.` et un lien **Effacer les filtres** qui ramène à `/`. Sans filtre, le message de la spec 08 (`Aucun film pour le moment.`) reste inchangé.
- Chaque combinaison (filtres, page) reste en cache (TanStack Query).
- Chaque champ garde son brouillon : il n'écrit dans l'adresse qu'après la pause, et ne reprend la valeur de l'adresse que lorsqu'elle change d'ailleurs (Effacer les filtres, bouton Retour). Lier le champ directement à l'adresse ferait sauter le curseur pendant la frappe.

## Design system

Deux composants du Figma rejoignent `@prime/ui` :

- `TextField` (Text Field / Search Field) : champ en creux (`Recessed`), 44 px de haut, en pilule ; variante recherche (`type="search"`) avec un symbole décoratif fourni par l'application (loupe Lucide). Nommé par son libellé (`aria-label`), le texte d'aide en `placeholder`, clavier numérique et longueur maximale en option.
- `SearchToken` (Search Tokens) : pilule de filtre, bouton à bascule (`aria-pressed`), blanche quand sélectionnée.

## Critères d'acceptation

- Taper « par » dans la recherche affiche, après une courte pause, les films dont le titre contient « par », et l'adresse devient `/?page=1&title=par`.
- Saisir `1972` dans l'année filtre sur 1972 ; `197` ne filtre pas encore.
- Cliquer « Drame » filtre sur ce genre et le sélectionne ; « Tous » le retire.
- `/?title=par&genre=6&page=2` ouvre la page 2 de ces filtres, champs et pilule déjà remplis.
- En page 3, changer un filtre ramène en page 1 ; Suivant garde les filtres.
- Filtres sans résultat : message dédié et Effacer les filtres ramène à la liste complète.
- Genres indisponibles : pas de pilules, la recherche et l'année fonctionnent.

## Hors périmètre

- Plusieurs genres à la fois (l'API n'en accepte qu'un), tri, recherche dans le synopsis.
