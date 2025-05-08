const express = require("express");
const router = express.Router();
const passport = require("passport");
const userController = require("../controllers/user/userController.js");
const profileController = require("../controllers/user/profileController");
const productController = require("../controllers/user/productController.js")
const {userAuth,adminAuth} = require("../middleware/auth.js");
const cartController = require('../controllers/user/cartController');

// Home route
router.get("/",userAuth,userController.loadHomepage);
router.get("/home", userController.loadHomepage);

// Error page
router.get("/pageNotFound", userController.pageNotFound);

// Shop routes
router.get("/shop",userAuth, userController.loadShoppingPage);
router.get("/filter", userController.filterProduct);
router.get("/filterPrice", userController.filterByPrice);
router.post("/search", userController.searchProducts);

// Product routes
router.get("/productDetails",userAuth, productController.productDetails);

// Auth routes
router.get("/signup", userController.loadSignup);
router.post("/signup", userController.signup);
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);

// Google auth routes
router.get('/auth/google', passport.authenticate('google', {scope: ['profile', 'email']}));
router.get('/auth/google/callback', userController.googleFunctiion );
// passport.authenticate('google', {failureRedirect: '/signup'}), (req, res) => {
//     res.redirect('/');
// }

router.get("/login", userController.loadLogin);
router.post("/login", userController.login);
router.get('/logout', userController.logout);

// Profile management
router.get("/forgot-password", profileController.getForgotPassPage);
router.post("/forgot-password", profileController.forgotEmailValid);
router.post("/verify-passforgot-otp", profileController.verifyForgotPassOtp);
router.get("/reset-password", profileController.getResetPassPage);
router.post("/reset-password", profileController.postNewPassword);
router.post("/resend-forgot-otp", profileController.resendOtp);

// Cart routes
router.post('/add-to-cart', userAuth, cartController.addToCart);

module.exports = router;