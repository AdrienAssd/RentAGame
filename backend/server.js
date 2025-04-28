const express = require('express');
const app = express();
const port = 3001;
const cors = require('cors');
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth");
const gameRoutes = require("./routes/games");
require("dotenv").config();


app.use(cors({
    origin: 'http://localhost:4321',
    credentials: true,
  }));
app.use(cookieParser());
app.use(express.json());
app.use("/api", authRoutes);
app.use("/api", gameRoutes);

app.listen(port, () => {
    console.log(`Serveur back-end en écoute sur http://localhost:${port}`);
});