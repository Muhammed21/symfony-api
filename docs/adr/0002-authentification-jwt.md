# Authentification par JWT (lexik/jwt-authentication-bundle)

L'API s'authentifie avec un jeton JWT obtenu via `POST /login` puis envoyé dans l'en-tête `Authorization: Bearer <jeton>`, grâce à `lexik/jwt-authentication-bundle`. C'est l'approche la plus courante pour une API sans état, et elle se teste simplement depuis un fichier `.http` en réutilisant le jeton de la réponse de connexion.

## Considered Options

- **Session + cookie (`json_login`)** : rejeté, car une API consommée par des clients HTTP ne devrait pas dépendre d'un cookie de session.
- **Jeton d'accès maison (`access_token`)** : rejeté, car il faudrait gérer nous-mêmes la création, le stockage et l'expiration des jetons.

## Consequences

- Une paire de clés (privée/publique) doit être générée avec `php bin/console lexik:jwt:generate-keypair` ; les clés ne sont pas versionnées et la phrase secrète va dans `.env.local`.
- Un jeton ne peut pas être révoqué avant son expiration (1 h par défaut) : pas de vraie « déconnexion » côté serveur.
