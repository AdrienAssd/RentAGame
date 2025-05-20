const express = require("express");
const router = express.Router();
const admin = require("../controllers/adminController");


router.post("/deletegame", admin.deleteGame);
router.get("/getallusers", admin.getUsers);
router.get("/getallfeedback", admin.getFeedback);
router.get("/getallloans", admin.getLoans);
router.delete("/deleteuser/:email", admin.deleteUser);
router.delete("/deletefeedback/:id", admin.deleteFeedback);
router.delete("/deleteloan/:id", admin.deleteLoan);

module.exports = router;