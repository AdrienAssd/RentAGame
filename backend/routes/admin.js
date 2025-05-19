const express = require("express");
const router = express.Router();
const admin = require("../controllers/adminController");

router.post("/addgame", admin.addGame);
router.post("/deletegame", admin.deleteGame);
router.get("/getallusers", admin.getAllUsers);
router.get("/getallfeedback", admin.getAllFeedback);
router.get("/getallloans", admin.getAllLoans);

module.exports = router;