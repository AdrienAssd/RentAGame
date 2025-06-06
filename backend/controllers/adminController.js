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
  const db = await getConnection();
  try {
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
  const db = await getConnection();
  try {
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
  const db = await getConnection();
  try {
    await db.query('CALL purgeLoans()');
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
  const email = decodeURIComponent(req.params.email);

  try {
    const db = await getConnection();
    await db.beginTransaction();
    // Vérifie si l'utilisateur existe
    const [existingUser] = await db.query('SELECT * FROM utilisateur WHERE email = ?', [email]);
    if (existingUser.length === 0) {
      await db.rollback();
      return res.status(404).json({ success: false, message: "Utilisateur introuvable." });
    }
    // Récupère l'ID de l'utilisateur
    const user_ID = existingUser[0].user_ID;
    // Supprime les feedbacks de l'utilisateur
    await db.query('DELETE FROM feedback WHERE user_ID = ?', [user_ID]);
    // Supprime les prêts de l'utilisateur
    await db.query('DELETE FROM loan WHERE user_ID = ?', [user_ID]);
    // Supprime l'utilisateur
    const [result] = await db.query('DELETE FROM utilisateur WHERE email = ?', [email]);
    if (result.affectedRows === 0) {
      await db.rollback();
      return res.status(404).json({ success: false, message: "Utilisateur introuvable." });
    }
    await db.commit();
    res.json({ success: true, message: 'Utilisateur supprimé avec succès.' });
  } catch (err) {
    await db.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
}

module.exports.deleteFeedback = async (req, res) => {
  const id = decodeURIComponent(req.params.id);

  try {
    const db = await getConnection();
    await db.beginTransaction();
    // Vérifie si le feedback existe
    const [existingFeedback] = await db.query('SELECT * FROM feedback WHERE feedback_ID = ?', [id]);
    if (existingFeedback.length === 0) {
      await db.rollback();
      return res.status(404).json({ success: false, message: "Feedback introuvable." });
    }
    // Supprime le feedback
    const [result] = await db.query('DELETE FROM feedback WHERE feedback_ID = ?', [id]);

    if (result.affectedRows > 0) {
      await db.commit();
      res.json({ success: true, message: 'Feedback supprimé avec succès.' });
    } else {
      await db.rollback();
      res.status(404).json({ success: false, message: "Feedback introuvable." });
    }
  } catch (err) {
    await db.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
}

module.exports.deleteLoan = async (req, res) => {
  const id = decodeURIComponent(req.params.id);

  try {
    const db = await getConnection();
    await db.beginTransaction();
    // Vérifie si le prêt existe
    const [existingLoan] = await db.query('SELECT * FROM loan WHERE id = ?', [id]);
    if (existingLoan.length === 0) {
      await db.rollback();
      return res.status(404).json({ success: false, message: "Prêt introuvable." });
    }
    // Supprime le prêt
    await db.query('CALL SupprimerLocation(?)', [id]);
    await db.commit();
    res.json({ success: true, message: 'Prêt supprimé avec succès.' });
  } catch (err) {
    await db.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
}

module.exports.getStats = async (req, res) => {
  try {
    const db = await getConnection();
    const [[{ users }]] = await db.query('SELECT get_total_users() AS users');
    const [[{ loans }]] = await db.query('SELECT get_total_loans() AS loans');
    const [[{ feedbacks }]] = await db.query('SELECT get_total_feedbacks() AS feedbacks');
    const [[{ games }]] = await db.query('SELECT get_total_games() AS games');

    res.json({ users, loans, feedbacks, games });
  } catch (err) {
    console.error('Erreur dans /api/getstats:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};