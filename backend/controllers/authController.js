const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const db = await getConnection();

    // Vérifie si l'utilisateur existe déjà
    const [rows] = await db.execute('SELECT * FROM utilisateur WHERE email = ?', [email]);
    if (rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création de l'utilisateur
    await db.execute('INSERT INTO utilisateur (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);

    res.status(201).json({ message: "User created" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = await getConnection();

    // Recherche de l'utilisateur
    const [rows] = await db.execute('SELECT * FROM utilisateur WHERE email = ?', [email]);
    if (rows.length === 0) {
        return res.status(401).json({ error: "Invalid mail or password" });
    }


    const user = rows[0];

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid mail or password" });
    }

    // Création du token
    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.cookie("token", token, { httpOnly: true });
    res.json({ message: "Logged in" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.logout = (req, res) => {
    // On efface le cookie contenant le token JWT
    res.clearCookie("token", { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  
    // Réponse de succès
    res.json({ message: "Logged out" });
  };

exports.getProfile = async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.json({ loggedIn: false });

  try {
    const { email } = jwt.verify(token, process.env.JWT_SECRET);
    const db = await getConnection();

    // Vérifie si l'email actuel correspond à celui du token
    const [userRows] = await db.execute('SELECT * FROM utilisateur WHERE email = ?', [email]);
    const user = userRows[0];
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({ loggedIn: true, email: user.email, username: user.username });
  } catch {
    res.clearCookie("token");
    res.json({ loggedIn: false });
  }
};
// Route pour mettre à jour le profil
exports.updateProfile = async (req, res) => {
  const { newEmail, newUsername, oldPassword, newPassword } = req.body;
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Utilisateur non connecté' });

  try {
    const { email } = jwt.verify(token, process.env.JWT_SECRET);
    const db = await getConnection();

    // Vérifie si l'email actuel correspond à celui du token
    const [userRows] = await db.execute('SELECT * FROM utilisateur WHERE email = ?', [email]);
    const user = userRows[0];
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    // Si un mot de passe est fourni, vérifie l'ancien mot de passe
    if (oldPassword && newPassword) {
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
      
      // Si un nouveau mot de passe est fourni, hash-le
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.execute('UPDATE utilisateur SET password = ? WHERE email = ?', [hashedPassword, email]);
    }

    // Mise à jour des autres informations (email, username)
    if (newUsername) await db.execute('UPDATE utilisateur SET username = ? WHERE email = ?', [newUsername, email]);
    if (newEmail && (newEmail !== email)) await db.execute('UPDATE utilisateur SET email = ? WHERE email = ?', [newEmail, email]);

    res.json({ message: 'Profile updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Route pour supprimer le compte
exports.deleteAccount = async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Non authentifié' });

  try {
    const { email: decodedEmail } = jwt.verify(token, process.env.JWT_SECRET);
    const db = await getConnection();

    // Suppression de l'utilisateur
    await db.execute('DELETE FROM utilisateur WHERE email = ?', [decodedEmail]);

    // Effacer le cookie et envoyer la réponse
    res.clearCookie("token");
    res.json({ success: true, message: 'Compte supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
