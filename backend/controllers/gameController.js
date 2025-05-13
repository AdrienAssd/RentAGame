const mysql = require('mysql2/promise');
const jwt = require("jsonwebtoken");

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
    const { page = 1, limit = 10, category = '', search = '' } = req.query;  // 'category' est le paramètre de filtrage
    const offset = (page - 1) * limit; // Calculer l'offset pour la pagination
    const limitInt  = parseInt(limit, 10);
    const offsetInt = parseInt((page - 1) * limitInt, 10);
    if (isNaN(limitInt) || isNaN(offsetInt)) {
      return res.status(400).json({ message: 'Paramètres de pagination invalides.' });
    }

    // Requête de base
    let query = 'SELECT * FROM view_game_summary'; // Utiliser la vue pour récupérer les jeux
    let queryParams = [];
    let whereClauses = [];

    // Si une catégorie est spécifiée, ajouter un filtre sur la catégorie
    if (category) {
      whereClauses.push('boardgamecategory LIKE ?');
      queryParams.push(`%${category}%`);  // Utilisation de LIKE pour filtrer par catégorie
    }
    if (search) {
      whereClauses.push('primary_key LIKE ?');
      queryParams.push(`%${search}%`);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }


    
    // Nouvelle pagination : on injecte directement les valeurs numériques
    query += ` LIMIT ${limitInt} OFFSET ${offsetInt}`;

    // LOG des paramètres avant l'exécution de la requête
    // Exécution de la requête
    const [details] = await db.execute(query, queryParams);

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

      // Retourner les jeux avec toutes les données nécessaires
      return {
        id: detail.id,
        title: detail.primary_key,
        minplayers: detail.minplayers,
        maxplayers: detail.maxplayers,
        description: detail.description,
        minage: detail.minage,
        boardgamecategory: categories,
        image: detail.thumbnail ? getValidThumbnail(detail.thumbnail) : '/images/default-thumbnail.jpg',
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
      const [details] = await db.execute('SELECT * FROM view_game_summary');

  
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
  
        // Log pour vérifier les valeurs récupérées
  
        return {
          id: detail.id,
          title: detail.primary_key,
          minplayers: detail.minplayers,
          maxplayers: detail.maxplayers,
          description: detail.description,
          minage: detail.minage,
          boardgamecategory: detail.boardgamecategory,
          image: detail.thumbnail ? getValidThumbnail(detail.thumbnail) : '/images/default-thumbnail.jpg',
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
    const { gameId } = req.params; // Récupérer l'ID du jeu depuis les paramètres de la requête
    try {
      const db = await getConnection();
  
      // Requête avec jointure entre feedback et users (supposons que la table des utilisateurs s'appelle `users`)
      const [feedbacks] = await db.execute(
        `SELECT * FROM view_feedback_user WHERE game_ID = ?`,
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
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Utilisateur non authentifié (pas de token)" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userEmail = decoded.email;

    const db = await getConnection();
    const [userRows] = await db.execute('SELECT user_ID FROM utilisateur WHERE email = ?', [userEmail]);
    if (userRows.length === 0) return res.status(404).json({ message: "Utilisateur introuvable" });

    const userId = userRows[0].user_ID;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }
    const [feedbackRows] = await db.execute(
      'SELECT * FROM feedback WHERE game_ID = ? AND user_ID = ?',
      [gameId, userId]
    );
    if (feedbackRows.length > 0) {
      return res.status(409).json({ message: "Vous avez déjà mis un avis à ce jeu" });
    }
    try {
      await db.execute(
        'INSERT INTO feedback (game_ID, user_ID, rating, description, date_fb) VALUES (?, ?, ?, ?, NOW())',
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
      id: game.id,
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

module.exports.addLoan = async (req, res) => {
  const { gameId, statut } = req.body;
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Utilisateur non authentifié (pas de token)" });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const userEmail = decoded.email;

  const db = await getConnection();

  const [userRows] = await db.execute('SELECT user_ID FROM utilisateur WHERE email = ?', [userEmail]);

  if (userRows.length === 0) return res.status(404).json({ message: "Utilisateur introuvable" });

  const userId = userRows[0].user_ID;

  if (!userId) {
    return res.status(401).json({ message: "Utilisateur non authentifié" });
  }
  if (!gameId) {
    return res.status(400).json({ message: "Paramètres manquants" });
  }
  const [loanRows] = await db.execute(
    'SELECT * FROM loan WHERE game_ID = ? AND user_ID = ? AND statut = "emprunté"',
    [gameId, userId]
  );

  if (loanRows.length > 0) {
    return res.status(409).json({ message: "Vous avez déjà emprunté ce jeu" });
  }
  // Vérification des données
  try {
    await db.execute(
      'INSERT INTO loan (game_ID, user_ID, date, date1, statut) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), ?)',
      [gameId, userId, statut]
    );
    await db.end();
    res.status(201).json({ message: "Emprunt ajouté avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de l'ajout de l'emprunt" });
  }
};

module.exports.getLoans = async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Utilisateur non authentifié (pas de token)" });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userEmail = decoded.email;

  const db = await getConnection();
  const [userRows] = await db.execute('SELECT user_ID FROM utilisateur WHERE email = ?', [userEmail]);
  if (userRows.length === 0) return res.status(404).json({ message: "Utilisateur introuvable" });

  const userId = userRows[0].user_ID;
  if (!userId) {
    return res.status(401).json({ message: "Utilisateur non authentifié" });
  }
  
  try {
    // Récupérer les emprunts de l'utilisateur
    const [loans] = await db.execute(
      `SELECT * FROM view_loan_user WHERE user_ID = ? AND statut = "emprunté"`,
      [userId]
    );

    // Traiter les emprunts récupérés
    const loansWithDetails = loans.map(loan => ({
      id: loan.ID,
      gameId: loan.game_ID,
      title: loan.primary_key,
      thumbnail: loan ? getValidThumbnail(loan.thumbnail) : '/images/default-thumbnail.jpg',
      startDate: loan.date,
      endDate: loan.date1,
      statut: loan.statut,
    }));
    console.log(loansWithDetails);

    await db.end();
    res.json(loansWithDetails); // Retourner les emprunts avec les détails du jeu
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des emprunts." });
  }
};