const express = require("express");
const router = express.Router();
const games = require("../controllers/gameController");
const apicache = require('apicache');
let cache = apicache.middleware;

router.get("/games", cache('5 minutes'), games.getGames);
router.get("/allgames", cache('5 minutes'), games.getAllGames);
router.get('/categories', cache('5 minutes'), games.getAllCategories);
router.get('/getfeedback/:id', games.getFeedbackByGameId);
router.post('/addfeedback', games.addFeedback);
router.get('/game/:slug', games.getGameBySlug);

module.exports = router;
