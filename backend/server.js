const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth");
const gameRoutes = require("./routes/games");
const adminRoutes = require("./routes/admin");
require("dotenv").config();


const allowedOrigins = [
  'https://rent-a-game-lac.vercel.app', // site front déployé
  'https://rent-a-game-9782yzq1d-adrienassds-projects.vercel.app',
  'https://rent-a-game-5ejlcvyj6-adrienassds-projects.vercel.app', // alias Vercel preview
];

app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origine non autorisée par CORS'));
    }
  },
  credentials: true,
}));


const compression = require('compression');
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use("/api", authRoutes);
app.use("/api", gameRoutes);
app.use("/api", adminRoutes);


app.listen(port, () => {
    console.log(`Serveur back-end en écoute sur ${port}`);
});
