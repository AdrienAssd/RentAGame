const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");

router.post("/register", auth.register);
router.post("/login", auth.login);
router.post("/logout", auth.logout);
router.get("/profile", auth.getProfile);
router.post("/updateProfile", auth.updateProfile);
router.delete("/deleteAccount", auth.deleteAccount);

module.exports = router;