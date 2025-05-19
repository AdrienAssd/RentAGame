const mysql = require('mysql2/promise');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'BDD_GreenIT', 
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

module.exports.addGame = async (req, res) => {
  try {
    const { num, name, description, thumbnail, categories, yearspublished, minplayers, maxplayers, playingtime, minplaytime, maxplaytime, minage } = req.body;
    const db = await getConnection();

    // Vérifie si le jeu existe déjà
    const [existingGame] = await db.execute('SELECT * FROM details WHERE primary_key = ?', [name]);
    if (existingGame.length > 0) {
      return res.status(400).json({ error: "Le jeu existe déjà" });
    }

    // Ajoute le jeu
    const validThumbnail = getValidThumbnail(thumbnail);
    await db.execute('INSERT INTO details (num, primary_key, description, yearspublished, minplayers, maxplayers, playingtime, minplaytime, maxplaytime, minage, boardgamecategory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [num, name, description, yearspublished, minplayers, maxplayers, playingtime, minplaytime, maxplaytime, minage, categories]);

    // Récupère l'ID du jeu ajouté
    const [newGame] = await db.execute('SELECT * FROM jeux WHERE name = ?', [name]);
    const gameId = newGame[0].id;
    await db.execute('INSERT INTO ratings (id, thumbnail) VALUES (?, ?)', [gameId, validThumbnail]);

    res.status(201).json({ message: "Game added" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

module.exports.deleteGame = async (req, res) => {
  try {
    const { name } = req.body;
    const db = await getConnection();

    // Vérifie si le jeu existe
    const [existingGame] = await db.execute('SELECT * FROM details WHERE primary_key = ?', [name]);
    if (existingGame.length === 0) {
      return res.status(404).json({ error: "Le jeu n'existe pas" });
    }

    // Supprime le jeu
    await db.execute('DELETE FROM details WHERE primary_key = ?', [name]);
    await db.execute('DELETE FROM ratings WHERE id = ?', [existingGame[0].id]);

    res.status(200).json({ message: "Game deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

module.exports.getUsers = async (req, res) => {
  try {
    const db = await getConnection();
    const [users] = await db.execute('SELECT * FROM view_users_admin');
    if (users.length === 0) {
      return res.status(404).json({ error: "Aucun utilisateur trouvé" });
    }
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

module.exports.getFeedback = async (req, res) => {
  try {
    const db = await getConnection();
    const [feedback] = await db.execute('SELECT * FROM view_feedback_admin');
    if (feedback.length === 0) {
      return res.status(404).json({ error: "Aucun feedback trouvé" });
    }
    res.status(200).json(feedback);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

module.exports.getLoans = async (req, res) => {
  try {
    const db = await getConnection();
    const [loans] = await db.execute('SELECT * FROM view_loan_admin');
    if (loans.length === 0) {
      return res.status(404).json({ error: "Aucun prêt trouvé" });
    }
    res.status(200).json(loans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

module.exports.deleteUser = async (req, res) => {
  const email = req.params.email;

  try {
    const [result] = await db.query('DELETE FROM users WHERE email = ?', [email]);

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Utilisateur supprimé avec succès.' });
    } else {
      res.status(404).json({ success: false, message: "Utilisateur introuvable." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
}
