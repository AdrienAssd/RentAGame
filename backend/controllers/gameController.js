const mysql = require('mysql2/promise');

// Connexion directe à la BDD (améliorable si tu veux plus tard)
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'BDD_GreenIT', // <-- Mets le vrai nom ici
};

async function getConnection() {
  return await mysql.createConnection(dbConfig);
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
      const { page = 1, limit = 5 } = req.query;
      const offset = (page - 1) * limit; // Calculer l'offset
  
      // Récupérer les jeux en fonction de la pagination
      const [details] = await db.execute('SELECT id, primary_key, minplayers, maxplayers FROM details LIMIT ? OFFSET ?', [limit, offset]);
      const [ratings] = await db.execute('SELECT id, thumbnail FROM ratings');
  
      // Vérification des données de ratings
  
      const games = details.map(detail => {
        // Trouver le rating correspondant à chaque jeu en comparant les IDs
        const rating = ratings.find(r => r.id === detail.id);
  
        // Log pour vérifier les valeurs récupérées
  
        return {
          title: detail.primary_key,
          minPlayers: detail.minplayers,
          maxPlayers: detail.maxplayers,
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
      const [details] = await db.execute('SELECT id, primary_key, minplayers, maxplayers, description FROM details');
      const [ratings] = await db.execute('SELECT id, thumbnail FROM ratings');
  
      // Vérification des données de ratings
  
      const games = details.map(detail => {
        // Trouver le rating correspondant à chaque jeu en comparant les IDs
        const rating = ratings.find(r => r.id === detail.id);
  
        // Log pour vérifier les valeurs récupérées
  
        return {
          title: detail.primary_key,
          minPlayers: detail.minplayers,
          maxPlayers: detail.maxplayers,
          description: detail.description,
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
  
  
