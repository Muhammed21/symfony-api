# 12 : Frontend, connexion et création de compte

## Objectif

Se connecter et créer un compte depuis l'application web, sur une vraie page pleine largeur dans le style de l'accueil (spec 11), et non une fenêtre posée au milieu de l'écran. Une fois connecté, l'avatar de la maquette apparaît dans la barre de navigation.

## Prérequis

Spec 03 (`POST /register`, `POST /login`, `GET /me`, jeton JWT valable 1 h, [ADR 0002](../adr/0002-authentification-jwt.md)) et spec 11 (coque, design system).

## Page `/compte`

Une seule page, deux modes :

| Adresse                    | Mode      | Titre (`h1`)    | Bouton             |
| -------------------------- | --------- | --------------- | ------------------ |
| `/compte`                  | connexion | Se connecter    | `Se connecter`     |
| `/compte?mode=inscription` | création  | Créer un compte | `Créer mon compte` |

- Mise en page en deux colonnes à partir de 900 px : à gauche, la bannière du film le plus récent (même requête que l'accueil, déjà en cache), nette, sur toute la hauteur, fondue vers le noir côté formulaire ; à droite (40 %, 480 px au moins), le formulaire posé directement sur le fond noir, sans panneau ni coins arrondis, 400 px de large au plus. Sans image, la colonne gauche reste noire.
- Sous 900 px : le formulaire seul, sans défilement horizontal.
- Les champs prennent un fond blanc à 12 % pour se détacher du noir.
- Bouton d'envoi blanc (`prominent`), sur toute la largeur des champs, texte centré suivi d'une flèche.
- Sous le bouton, un lien vers l'autre mode : « Pas encore de compte ? Créer un compte » ou « Déjà un compte ? Se connecter ». Changer de mode garde l'e-mail déjà saisi, vide les erreurs.
- Champs, avec libellé visible au-dessus :
  - **E-mail** : `type="email"`, `autocomplete="email"`.
  - **Mot de passe** : `type="password"`, `autocomplete="current-password"` (connexion) ou `new-password` (création), avec l'aide « 8 caractères minimum » en création. Un bouton œil affiche / masque le mot de passe (« Afficher le mot de passe » / « Masquer le mot de passe »).
- Le paramètre `redirect` (un chemin interne commençant par `/`, sinon ignoré) indique où revenir après succès ; par défaut l'accueil.
- Déjà connecté, `/compte` ramène à l'accueil.

### Validation et erreurs

Vérifiées à l'envoi, avant tout appel à l'API ; chaque erreur s'affiche sous son champ (texte rouge, `aria-invalid`, `aria-describedby`) et le premier champ fautif reçoit le focus.

| Cas                                    | Message                                                      | Où                   |
| -------------------------------------- | ------------------------------------------------------------ | -------------------- |
| E-mail vide                            | `Saisissez votre e-mail.`                                    | sous l'e-mail        |
| E-mail mal formé                       | `Cet e-mail n'est pas valide.`                               | sous l'e-mail        |
| Mot de passe vide                      | `Saisissez votre mot de passe.`                              | sous le mot de passe |
| Création, mot de passe < 8 caractères  | `Le mot de passe doit contenir au moins 8 caractères.`       | sous le mot de passe |
| Connexion refusée (401)                | `E-mail ou mot de passe incorrect.`                          | alerte du panneau    |
| E-mail déjà pris (409)                 | `Un compte existe déjà avec cet e-mail.` + lien Se connecter | sous l'e-mail        |
| Refus de l'API (422)                   | le message de l'API pour chaque champ (`violations`)         | sous le champ        |
| API injoignable, 5xx, réponse inconnue | `Le service est indisponible. Réessayez dans un instant.`    | alerte du panneau    |

- Pendant l'envoi : bouton désactivé, libellé `Connexion…` ou `Création…`.
- Création réussie : connexion automatique avec les mêmes identifiants, puis retour (`redirect`).

## Session

- Le jeton et l'e-mail sont gardés dans `localStorage` (clé `prime.session`) : la session survit au rechargement, jusqu'à l'expiration du jeton.
- Au démarrage : un jeton expiré (champ `exp` du JWT) ou illisible est oublié sans appel ; sinon l'avatar s'affiche aussitôt et `GET /me` vérifie le jeton en arrière-plan. Un 401 oublie la session ; une API injoignable la garde.
- Les requêtes du compte envoient `Accept: application/json` (sinon Symfony répond ses erreurs en HTML en développement).

## Barre de navigation

- Déconnecté : seul à droite de la barre, une icône de profil dans une pastille de verre liquide de 40 px, comme la barre d'onglets (`LinkSymbol` `glass` en taille `medium`, nommé « Se connecter »), vers `/compte?redirect=<page courante>`.
- Connecté : un avatar rond de 44 px avec l'initiale de l'e-mail en capitale. C'est un bouton (`Compte de <e-mail>`, `aria-expanded`) qui ouvre un menu de verre sous lui : l'e-mail, puis `Se déconnecter`.
- Le menu se ferme avec Échap (le focus revient à l'avatar), un clic en dehors ou un second clic sur l'avatar.
- Se déconnecter oublie la session ; la page courante reste affichée et le lien `Se connecter` revient.

## Architecture

Nouveau module `apps/web/src/modules/account` ([ADR 0003](../adr/0003-architecture-du-frontend.md)) :

| Couche           | Contenu                                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `domain`         | `Credentials`, `Session`, `AccountFailure`, validation des identifiants (fonctions pures)                               |
| `application`    | ports `AccountGateway` et `SessionStore` ; cas d'usage `logIn`, `register`, `currentSession`, `verifySession`, `logOut` |
| `infrastructure` | passerelle HTTP (`/login`, `/register`, `/me`), stockage `localStorage`                                                 |
| `presentation`   | route `/compte`, bouton de compte de la barre                                                                           |

La coque reçoit le bouton de compte de la racine de composition (`main.tsx`), sans dépendre du module. La bannière du fond vient aussi de `main.tsx`, qui lit la requête des nouveautés dans le cache partagé : le module compte ne dépend pas du catalogue. L'état de session vit dans le cache TanStack Query (clé `["session"]`).

## Design system

- `TextField` : types `email` et `password`, `autoComplete`, libellé visible (`labelVisible`), aide (`hint`), erreur (`error`), accessoire en fin de champ (bouton œil).
- `ButtonTextAndSymbol` : `type="submit"`, symbole après le texte (`symbolPlacement="trailing"`), contenu centré quand le bouton est étiré.
- Nouveau `SegmentedControl` (Segmented Control du kit), en liens fournis par l'application (la page de compte ne l'utilise plus).
- Nouveau `Avatar` : cercle à l'initiale.

## Critères d'acceptation

- `/compte` : se connecter avec `admin@prime.local` / `password` ramène à l'accueil, l'avatar « A » remplace `Se connecter`.
- Un mauvais mot de passe affiche `E-mail ou mot de passe incorrect.` sans quitter la page.
- `/compte?mode=inscription` : créer un compte connecte aussitôt ; un e-mail déjà pris affiche le message sous l'e-mail.
- Envoyer le formulaire vide affiche les deux erreurs et met le focus sur l'e-mail, sans appel à l'API.
- Après un rechargement, on est toujours connecté ; un jeton expiré déconnecte.
- Le menu de l'avatar se ferme avec Échap ; Se déconnecter fait revenir `Se connecter`.
- `/compte?redirect=/catalogue` ramène au catalogue après la connexion ; `redirect=https://ailleurs.fr` est ignoré.

## Hors périmètre

- Mot de passe oublié, confirmation d'e-mail, modification du compte (spec 03).
- Pages réservées aux connectés, actions administrateur dans l'interface.
- Renouvellement du jeton avant expiration.

## Ordre d'implémentation

1. Design system : `TextField` étendu, `ButtonTextAndSymbol` submit, `SegmentedControl`, `Avatar`.
2. Module `account` : domaine, cas d'usage, passerelle HTTP et stockage (tests unitaires et d'intégration contre l'API).
3. Page `/compte`.
4. Bouton de compte dans la barre, câblage dans `main.tsx`.
