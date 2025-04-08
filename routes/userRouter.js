const express = require("express");
const router = express.Router();
const passport = require("passport");
const userController = require("../controllers/user/userController.js");
const profileController = require("../controllers/user/profileController");
const {userAuth,adminAuth} = require("../middleware/auth.js");



router.get("/pageNotFound",userController.pageNotFound);
router.get("/",userController.loadHomepage);
router.get("/shop", userAuth,userController.loadShoppingPage);



router.get("/signup",userController.loadSignup);
router.post("/signup",userController.signup);
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp",userController.resendOtp);

router.get('/auth/google' , passport.authenticate('google',{scope:['profile','email']}));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    res.redirect('/')
});

router.get("/login",userController.loadLogin);
router.post("/login",userController.login);



router.get('/', userController.loadHomepage);
router.get('/logout',userController.logout);

//profile management
router.get("/forgot-password",profileController.getForgotPassPage);
router.post("/forgot-password",profileController.forgotEmailValid);
router.post("/verify-passforgot-otp", profileController.verifyForgotPassOtp);
router.get("/reset-password",profileController.getResetPassPage);
router.post("/resend-forgot-otp", profileController.resendOtp);





module.exports = router;