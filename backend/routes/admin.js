const express = require("express");
const router = express.Router();
const admin = require("../controllers/adminController");

router.post("/addgame", admin.addGame);
router.post("/deletegame", admin.deleteGame);
router.get("/getusers", admin.getUsers);
router.get("/getfeedback", admin.getFeedback);
router.get("/getloans", admin.getLoans);

module.exports = router;