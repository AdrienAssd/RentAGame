const express = require("express");
const router = express.Router();
const games = require("../controllers/gameController");

router.get("/games", games.getGames);
router.get("/allgames", games.getAllGames);

module.exports = router;
