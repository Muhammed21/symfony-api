# 08 : Frontend, liste des films

## Objectif

Premier écran du frontend (`apps/web`) : parcourir le catalogue page par page, sans être connecté.

## Prérequis

Spec 01 (`GET /movies`), monorepo et proxy Vite (`/api/*` → API).

## Comportement

- L'écran appelle `GET /api/movies?page=N&limit=12`, page 1 au chargement.
- Chaque film affiche : titre, année, durée lisible (`2 h 22`, `45 min`), classification d'âge (`Tous publics` pour `ALL`, sinon `13+`…) et ses genres.
- Sous la liste : `Page N sur M`, boutons **Précédent** et **Suivant**. Précédent est désactivé en page 1, Suivant sur la dernière page.
- Pendant le chargement : `Chargement des films…`.
- Catalogue vide : `Aucun film pour le moment.`, sans pagination.
- Erreur réseau, statut HTTP en erreur ou réponse au format inattendu : `Impossible de charger les films.` et un bouton **Réessayer** qui relance la même page.
- La réponse de l'API est validée par un schéma Zod avant affichage.

## Critères d'acceptation

- Les films de la page 1 s'affichent avec leurs informations.
- Suivant charge la page 2 et affiche `Page 2 sur M` ; Précédent revient à la page 1.
- Les boutons sont désactivés aux extrémités.
- Les états chargement, vide et erreur s'affichent ; Réessayer recharge la page.

## Hors périmètre

- Filtres par titre, année, genre (spec suivante).
- Détail d'un film, affiches, connexion.
