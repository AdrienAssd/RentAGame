const mysql = require('mysql2/promise');

// Connexion directe à la BDD (améliorable si tu veux plus tard)
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'BDD_GreenIT', // <-- Mets le vrai nom ici
};

async function getConnection() {
  return await mysql.createConnection(process.env.DATABASE_URL || dbConfig);
}
function getValidThumbnail(thumbnail) {
    if (!thumbnail || thumbnail === 'NA' || !thumbnail.startsWith('http')) {
      return '/images/default-thumbnail.jpg';
    }
    return thumbnail;
}
  

module.exports.getGames = async (req, res) => {
  try {
    const db = await getConnection();

    // Récupérer les paramètres de pagination et de catégorie depuis la requête
    const { page = 1, limit = 10, category = '' } = req.query;  // 'category' est le paramètre de filtrage
    const offset = (page - 1) * limit; // Calculer l'offset pour la pagination

    // Requête de base
    let query = 'SELECT id, primary_key, minplayers, maxplayers, minage, boardgamecategory, description FROM details';
    let queryParams = [];

    // Si une catégorie est spécifiée, ajouter un filtre sur la catégorie
    if (category) {
      query += ' WHERE boardgamecategory LIKE ?';
      queryParams.push(`%${category}%`);  // Utilisation de LIKE pour filtrer par catégorie
    }

    // Ajouter la pagination
    query += ' LIMIT ? OFFSET ?';
    
    // Parse les paramètres de pagination en nombres entiers
    const limitInt = parseInt(limit, 10);
    const offsetInt = parseInt(offset, 10);

    // Vérifie que les valeurs sont valides
    if (isNaN(limitInt) || isNaN(offsetInt)) {
      return res.status(400).json({ message: "Paramètres de pagination invalides." });
    }

    // Ajoute les paramètres à la requête
    queryParams.push(limitInt, offsetInt);

    // LOG des paramètres avant l'exécution de la requête
    console.log("Exécution de la requête SQL : ", query);
    console.log("Avec les paramètres : ", queryParams);

    // Exécution de la requête
    const [details] = await db.execute(query, queryParams);
    const [ratings] = await db.execute('SELECT id, thumbnail FROM ratings');

    // Traitement des jeux récupérés
    const games = details.map(detail => {
      let categories = [];
      try {
        categories = JSON.parse(detail.boardgamecategory);  // Essayer de parser comme JSON
        if (!Array.isArray(categories)) {
          categories = [categories];  // Si ce n'est pas un tableau, le mettre dans un tableau
        }
      } catch (e) {
        // Si le parsing échoue, traiter la chaîne comme avant
        categories = detail.boardgamecategory
          .replace(/[\[\]']/g, '')  // Retirer les crochets et les apostrophes
          .split(',')
          .map(cat => cat.trim());
      }

      // Trouver le rating correspondant à chaque jeu
      const rating = ratings.find(r => r.id === detail.id);

      // Retourner les jeux avec toutes les données nécessaires
      return {
        title: detail.primary_key,
        minplayers: detail.minplayers,
        maxplayers: detail.maxplayers,
        description: detail.description,
        minage: detail.minage,
        boardgamecategory: categories,
        image: rating && rating.thumbnail ? getValidThumbnail(rating.thumbnail) : '/images/default-thumbnail.jpg',
        slug: detail.primary_key.toLowerCase().replace(/\s+/g, '-'),
      };
    });

    await db.end();
    res.json(games); // Retourner les jeux filtrés
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des jeux." });
  }
};


  module.exports.getAllGames = async (req, res) => {
    try {
      const db = await getConnection();
  
      // Récupérer les paramètres de pagination depuis la requête
  
      // Récupérer les jeux en fonction de la pagination
      const [details] = await db.execute('SELECT id, primary_key, minplayers, maxplayers, minage, boardgamecategory, description FROM details');
      const [ratings] = await db.execute('SELECT id, thumbnail FROM ratings');
  
      // Vérification des données de ratings
  
      const games = details.map(detail => {
        let categories = [];
        try {
          categories = JSON.parse(detail.boardgamecategory);  // Essaie de parser la chaîne en JSON
          if (!Array.isArray(categories)) {
            categories = [categories];  // Si ce n'est pas un tableau, le mettre dans un tableau
          }
        } catch (e) {
          // Si le parsing échoue, traiter la chaîne comme avant
          categories = detail.boardgamecategory
            .replace(/[\[\]']/g, '')  // Retirer les crochets et les apostrophes
            .split(',')
            .map(cat => cat.trim());
        }
        // Trouver le rating correspondant à chaque jeu en comparant les IDs
        const rating = ratings.find(r => r.id === detail.id);
  
        // Log pour vérifier les valeurs récupérées
  
        return {
          title: detail.primary_key,
          minplayers: detail.minplayers,
          maxplayers: detail.maxplayers,
          description: detail.description,
          minage: detail.minage,
          boardgamecategory: detail.boardgamecategory,
          image: rating && rating.thumbnail ? getValidThumbnail(rating.thumbnail) : '/images/default-thumbnail.jpg',
          slug: detail.primary_key.toLowerCase().replace(/\s+/g, '-'),
        };
      });
  
      await db.end();
  
      // Log les jeux avant de les envoyer à la réponse
  
      res.json(games);  // Retourner seulement les jeux nécessaires
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la récupération des jeux." });
    }
  };


  module.exports.getAllCategories = async (req, res) => {
    try {
      const db = await getConnection();
  
      const [rows] = await db.execute('SELECT boardgamecategory FROM details');
      const categoriesSet = new Set();
  
      rows.forEach(row => {
        let cats = [];
  
        try {
          // Essayer de parser comme JSON (utile si c'est un vrai tableau JSON)
          const parsed = JSON.parse(row.boardgamecategory);
          if (Array.isArray(parsed)) {
            cats = parsed;
          } else {
            cats = [parsed];
          }
        } catch (e) {
          // Nettoyage manuel si le parsing échoue
          const cleaned = row.boardgamecategory
            .replace(/[\[\]']/g, '')  // retire [ ] et '
            .split(',')
            .map(cat => cat.trim());
          cats = cleaned;
        }
  
        cats.forEach(cat => {
          if (cat && cat !== 'NA') {
            categoriesSet.add(cat);
          }
        });
      });
  
      await db.end();
      res.json([...categoriesSet]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la récupération des catégories." });
    }
  };
  
  module.exports.getFeedbackByGameId = async (req, res) => {
    const gameId = req.params.id; // Récupérer l'ID du jeu depuis les paramètres de la requête
    try {
      const db = await getConnection();
  
      // Requête avec jointure entre feedback et users (supposons que la table des utilisateurs s'appelle `users`)
      const [feedbacks] = await db.execute(
        `SELECT feedback.*, utilisateur.username 
         FROM feedback 
         JOIN utilisateur ON feedback.user_ID = utilisateur.user_ID 
         WHERE feedback.ID = ?`,
        [gameId]
      );
  
      await db.end();
  
      res.json(feedbacks); // Retourner les feedbacks avec username
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la récupération des feedbacks." });
    }
  };
  
  // POST /api/feedback
  module.exports.addFeedback = async (req, res) => {
    const { gameId, rating, description } = req.body;
    const userId = req.session?.user?.ID; // Vérifie si l'utilisateur est connecté

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    try {
      const db = await getConnection();
      await db.execute(
        'INSERT INTO feedback (game_id, user_id, rating, description, date_fb) VALUES (?, ?, ?, ?, NOW())',
        [gameId, userId, rating, description]
      );
      await db.end();
      res.status(201).json({ message: "Feedback ajouté avec succès" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de l'ajout de l'avis" });
    }
  };

  module.exports.getGameBySlug = async (req, res) => {
  const db = await getConnection();
  const { slug } = req.params;
  
  try {
    // Recherche du jeu dans la base de données
    const [details] = await db.execute('SELECT * FROM details WHERE primary_key = ?', [slug.replace(/-/g, ' ').toUpperCase()]);
    
    // Si aucun jeu n'est trouvé
    if (details.length === 0) {
      return res.status(404).json({ message: 'Jeu non trouvé' });
    }
    
    // Récupérer les informations du jeu et les ratings associés
    const game = details[0];
    const [ratings] = await db.execute('SELECT thumbnail FROM ratings WHERE id = ?', [game.id]);
    
    // Vérification et ajout des catégories
    let categories = [];
    try {
      categories = JSON.parse(game.boardgamecategory); // Essayer de parser en JSON
      if (!Array.isArray(categories)) {
        categories = [categories]; // Si ce n'est pas un tableau, le mettre dans un tableau
      }
    } catch (e) {
      // Si le parsing échoue, traiter la chaîne comme avant
      categories = game.boardgamecategory
        .replace(/[\[\]']/g, '')  // Retirer les crochets et les apostrophes
        .split(',')
        .map(cat => cat.trim());
    }

    // Retourner les informations complètes du jeu avec son image
    const rating = ratings.length > 0 ? ratings[0] : null;
    res.json({
      title: game.primary_key,
      description: game.description,
      minplayers: game.minplayers,
      maxplayers: game.maxplayers,
      minage: game.minage,
      boardgamecategory: categories,
      image: rating ? getValidThumbnail(rating.thumbnail) : '/images/default-thumbnail.jpg',
      slug: game.primary_key.toLowerCase().replace(/\s+/g, '-'),
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération du jeu.' });
  }
};
