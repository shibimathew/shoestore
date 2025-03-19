const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/userController.js");

// router.get("/pageNotFound",userController.pageNotFound);
router.get("/",userController.loadHomepage);
router.get("/signup",userController.loadSignup);
router.post("/signup",userController.signup);
// router.get("/shop",userController.loadShopping);


module.exports = router;