# 08 : Frontend, liste des films

## Objectif

Premier écran du frontend (`apps/web`) : parcourir le catalogue page par page, sans être connecté.

## Prérequis

Spec 01 (`GET /movies`), monorepo et proxy Vite (`/api/*` → API). Architecture : [ADR 0003](../adr/0003-architecture-du-frontend.md).

## Comportement

- La page courante est dans l'adresse (`/?page=N`) : un lien se partage, le bouton Retour du navigateur fonctionne. Une page absente ou invalide (`0`, `-2`, `deux`, `1.5`) vaut la page 1.
- L'écran appelle `GET /api/movies?page=N&limit=12` ; chaque page lue reste en cache (TanStack Query).
- Chaque film affiche : titre, année, durée lisible (`2 h 22`, `45 min`), classification d'âge (`Tous publics` pour `ALL`, sinon `13+`…) et ses genres.
- Sous la liste : `Page N sur M`, liens **Précédent** et **Suivant**, et un point par page (`PageControl`) qui mène à cette page, la page courante signalée. Pas de lien Précédent en page 1, ni de lien Suivant sur la dernière page ; ni points ni liens quand tout tient sur une page.
- Présentation : composants du design system `@prime/ui` ([ADR 0004](../adr/0004-design-system.md)), chaque film en vignette (titre à la place de l'affiche, l'API n'en fournissant pas) suivie de ses informations.
- Pendant le chargement : `Chargement des films…`, avec un indicateur d'activité.
- Catalogue vide : `Aucun film pour le moment.`, sans pagination.
- Erreur réseau, statut HTTP en erreur ou réponse au format inattendu : `Impossible de charger les films.` et un bouton **Réessayer** qui relance la même page.
- La réponse de l'API est validée par un schéma Zod avant affichage.

## Critères d'acceptation

- Les films de la page 1 s'affichent avec leurs informations.
- `/?page=3` affiche la page 3 ; Suivant mène à la page suivante, Précédent à la précédente.
- Pas de lien Précédent en page 1, ni Suivant sur la dernière page.
- Un clic sur le point d'une page affiche cette page.
- Les états chargement, vide et erreur s'affichent ; Réessayer recharge la page.

## Hors périmètre

- Filtres par titre, année, genre (spec suivante).
- Détail d'un film, affiches, connexion.
