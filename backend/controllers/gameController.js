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
  
      // Récupérer les paramètres de pagination depuis la requête
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit; // Calculer l'offset
  
      // Récupérer les jeux en fonction de la pagination
      const [details] = await db.execute('SELECT id, primary_key, minplayers, maxplayers, minage, boardgamecategory, description  FROM details LIMIT 10 OFFSET 0');
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

    const [details] = await db.execute('SELECT primary_key FROM details');
    const { slug } = req.params;
    // Recherche du jeu dans la base de données ou un fichier JSON
    const game = details.find(g => g.primary_key.toLowerCase().replace(/\s+/g, '-') === slug);
    if (!game) {
      return res.status(404).json({ message: 'Jeu non trouvé' });
    }
    res.json(game);
  };