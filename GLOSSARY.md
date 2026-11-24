# Catalogue Prime Video

Clone simplifié de Prime Video : un catalogue de films que chacun peut parcourir, géré par des administrateurs, et sur lequel les utilisateurs laissent des avis.

## Catalogue

**Film** (`Movie`) :
Une œuvre cinématographique proposée dans le catalogue.
_Avoid_ : Titre, vidéo, contenu, programme

**Genre** (`Genre`) :
Un type de film (Action, Comédie, Thriller…) ; un film peut en avoir plusieurs.
_Avoid_ : Catégorie, tag

**Titres similaires** :
Les films qu'on recommande à côté d'un autre film ; si A est similaire à B, alors B est similaire à A.
_Avoid_ : Recommandations, suggestions, films liés

**Classification d'âge** :
L'âge minimum conseillé pour regarder un film : Tous publics, 7+, 13+, 16+ ou 18+.
_Avoid_ : Rating, limite d'âge, PEGI

**Catalogue** :
L'ensemble des films, consultable par tout le monde, même sans être connecté.
_Avoid_ : Bibliothèque, collection

## Personnes

**Utilisateur** (`User`) :
Une personne qui possède un compte et peut se connecter.
_Avoid_ : Compte, membre, client, profil

**Administrateur** :
Un utilisateur autorisé à créer, modifier et supprimer les films et les genres.
_Avoid_ : Admin, modérateur, gestionnaire

## Avis

**Avis** (`Review`) :
L'appréciation d'un utilisateur sur un film, composée d'une note et d'un commentaire.
_Avoid_ : Critique, commentaire, évaluation

**Note** :
Le nombre d'étoiles, de 1 à 5, attribué à un film dans un avis.
_Avoid_ : Score, rating, étoiles

**Note moyenne** :
La moyenne des notes de tous les avis d'un film ; un film sans avis n'en a pas.
_Avoid_ : Score global, popularité
