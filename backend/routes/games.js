const express = require("express");
const router = express.Router();
const games = require("../controllers/gameController");

router.get("/games", games.getGames);
router.get("/allgames", games.getAllGames);
router.get('/categories', games.getAllCategories);
router.get('/getfeedback/:id', games.getFeedbackByGameId);
router.post('/addfeedback', games.addFeedback);
router.get('/api/game/:slug', games.getGameBySlug);

module.exports = router;
