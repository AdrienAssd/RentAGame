const express = require("express");
const router = express.Router();
const admin = require("../controllers/adminController");

router.post("/addgame", admin.addGame);
router.post("/deletegame", admin.deleteGame);
router.get("/getallusers", admin.getUsers);
router.get("/getallfeedback", admin.getFeedback);
router.get("/getallloans", admin.getLoans);
router.delete("/deleteuser/:email", admin.deleteUser);

module.exports = router;