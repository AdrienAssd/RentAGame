const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth");
const gameRoutes = require("./routes/games");
require("dotenv").config();


const allowedOrigins = [
  'http://localhost:3000',                     // dev local
  'https://rent-a-game-lac.vercel.app',        // prod Astro
  'https://rent-a-game-9782yzq1d-adrienassds-projects.vercel.app', // alias preview Vercel
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origine non autorisée par CORS'), false);
    }
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use("/api", authRoutes);
app.use("/api", gameRoutes);

app.listen(port, () => {
    console.log(`Serveur back-end en écoute sur ${port}`);
});
