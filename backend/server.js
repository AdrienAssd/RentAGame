const express = require('express');
const app = express();
const port = 3001;
const cors = require('cors');
app.use(cors());

app.use(express.json());

app.get('/api/hello', (req, res) => {
    res.json({ message: 'Salut depuis le back-end Node.js !' });
});

app.listen(port, () => {
    console.log(`Serveur back-end en écoute sur http://localhost:${port}`);
});