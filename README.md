# RentAGame

RentAGame est une plateforme web permettant aux utilisateurs de louer des jeux vidéo de manière simple et responsable.
Le site respecte également des principes de base du Green IT

---

## Mockup (Figma) de notre projet 

https://www.figma.com/proto/cZEDFLafC8pKg2FJ2kzziu/Mockup-BDA?node-id=1007-4249&t=7SaRrQne8ilxYbke-1&starting-point-node-id=1007%3A4249

## 🚀 Installation et exécution du projet

### 1. Cloner le dépôt
```bash
git clone https://github.com/AdrienAssd/RentAGame.git
cd RentAGame

### 2. Installer les dépendances 
# backend (Node.js)
cd backend
npm install
#frontend (Astro)
cd ../frontend
npm install
```
### 3. Configurer les variables d'environnement
- Créez un fichier `.env` dans le dossier `backend` et ajoutez vos variables d'environnement.
- Créez un fichier `.env` dans le dossier `frontend` et ajoutez vos variables d'environnement.

### 4. Lancer le projet (en Local !)
```bash
# backend (Node.js)
cd ../backend
node server.js
# frontend (Astro)
cd ../frontend
npm run dev
```

### 5. Accéder à l'application
Ouvrez votre navigateur et allez sur le site : https://rent-a-game-lac.vercel.app/

## 🤝 Contribution

Merci de respecter les conventions suivantes :

Les noms de commit doivent être clairs et explicites :
Exemple : ajout d’un bouton de recherche, correction du bug de connexion

Quand il s'agit de grosses parties du code à revoir, il est préférable de créer des branches.

Avant de proposer une modification, ouvrez une pull request (PR) en expliquant : 

    Ce que vous avez changé

    Pourquoi

    Et en ajoutant des screenshots si nécessaire

## Structure du projet
```bash
RentAGame/
│
├── backend/                        → Serveur Node.js avec gestion des sessions et API
│   └── server.js                   → Fichier principal du serveur qui appellera les fichiers du dossier routes qui appelleront les fichiers présents dans controllers
│
├── frontend/                       → Frontend Astro (pages HTML, composants, styles)
│   ├── public/                     → Images et fichiers statiques
│   └── src/
│       ├── pages/                  → Là où se trouve toutes les pages du site
│       │   ├── index.astro         → La page d'accueil du site
│       │   └── games/              → Ce dossier permet de faire des sous pages /games
│       │       └── [slug].astro    → La page permet de générer des pages pour chaque jeu quand un utilisateur clique sur une Gamecard
│       └── components/             → GameCards.astro se trouve ici pour éviter de refaire le même code HTML constamment
│
├── README.md                       → Documentation du projet
└── .gitignore
```

## Fonctionnalités principales :

    • Authentification (inscription, connexion, déconnexion)

    • Bibliothèque de jeux à louer

    • Possibilité de voir chaque jeu avec sa description et ses avis

    • Barre de recherche et recherche par catégorie

## Historique des contributions
Les contributions du site ont été faites sans pull requests car notre groupe ce que chaque personne faisait et comment cela allait fonctionner.
On retrouve donc dans cet historique la mise en place des parties principales du site dans l'ordre décroissant (du plus vieux au plus récent).
```bash
Auteurs	                                Description
Adrien, Alexandre, Thibault	            Mise en place du frontend	
Alexandre, Julien	                    Ajout de la page des pages de connexion et enregistrement et début du backend
Adrien, Alexandre, Catherine            Finalisation du backend pour l'authentification
Adrien, Alexandre                       Déploiement du site sur Vercel (frontend) et Railway (backend)
Julien, Thibault, Catherine             Conception de la BDD, des requêtes, et du script SQL
Adrien, Alexandre, Thibault             Mise en place de la BDD sur Railway (MySQL)
Alexandre, Adrien                       Correction des problèmes après le déploiement
```