const express = require("express");
const router = express.Router();
const passport = require("passport");
const userController = require("../controllers/user/userController.js");
const profileController = require("../controllers/user/profileController");
const productController = require("../controllers/user/productController.js");
const { userAuth, adminAuth, blockedAuth } = require("../middleware/auth.js");
const accountController = require("../controllers/user/accountController");
const addressController = require("../controllers/user/addressController");
const checkoutController = require("../controllers/user/checkoutController");
const orderController = require("../controllers/user/orderController");
const placeorderController = require("../controllers/user/placeorderController");
const walletController = require("../controllers/user/walletController");
const wishlistController = require("../controllers/user/wishlistController");

const cartController = require("../controllers/user/cartController");
const upload = require("../middleware/imageUpload");

// Home route
router.get("/", userAuth, userController.loadHomepage);
router.get("/home", userController.loadHomepage);

// Error page
router.get("/pageNotFound", userController.pageNotFound);

// Shop routes
router.get("/shop", userAuth, userController.loadShoppingPage);
router.get("/filter", userAuth, userController.filterProduct);
router.get("/filterPrice", userAuth, userController.filterByPrice);
router.post("/search", userAuth, userController.searchProducts);

// Product routes
router.get("/productDetails", userAuth, productController.productDetails);

// Auth routes
router.get("/signup", userController.loadSignup);
router.post("/signup", userController.signup);
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);

// Google auth routes
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get("/auth/google/callback", userController.googleFunctiion);
// passport.authenticate('google', {failureRedirect: '/signup'}), (req, res) => {
//     res.redirect('/');
// }

router.get("/login", userController.loadLogin);
router.post("/login", userController.login);
router.get("/logout", userController.logout);

// Profile management
router.get("/forgot-password", profileController.getForgotPassPage);
router.post("/forgot-password", profileController.forgotEmailValid);
router.post("/verify-passforgot-otp", profileController.verifyForgotPassOtp);
router.get("/reset-password", profileController.getResetPassPage);
router.post("/reset-password", profileController.postNewPassword);
router.post("/resend-forgot-otp", profileController.resendOtp);

// Profile routes
router.get("/profileinfo", userAuth, accountController.getAccountInfoPage);
router.get("/edit-profile", userAuth, accountController.getEditAccountInfoPage);
router.put(
  "/edit-profile/:id",
  userAuth,
  upload.single("profileImage"),
  accountController.editProfileInfo
);
// OTP verification routes
router.post("/request-email-otp", userAuth, accountController.requestEmailOTP);
router.post("/resend-email-otp", userAuth, accountController.resendEmailOTP);
router.post("/verify-email-otp", userAuth, accountController.verifyEmailOTP);

//address management
router.get("/myAddresses", userAuth, addressController.getMyAddresses);
router.get("/addAddresses", userAuth, addressController.getAddMyAddressesPage);
router.post("/addAddresses", userAuth, addressController.addMyAddresses);
router.post(
  "/addresses/:addressId/default",
  userAuth,
  addressController.setDefaultAddress
);
router.delete(
  "/delete-address/:detailId",
  userAuth,
  addressController.deleteAddress
);
router.get(
  "/myAddresses/edit",
  userAuth,
  addressController.getEditMyAddressPage
);
// router.post('/myAddresses/edit/:detailId', userAuth, addressController.editMyAddresses);
router.post(
  "/save-address/:detailId",
  userAuth,
  addressController.editMyAddresses
);

//wishlist
router.get("/wishlist", userAuth, wishlistController.getWishlistPage);
router.post("/wishlist/add", userAuth, wishlistController.addToWishlist);
router.post(
"/wishlist/remove",
  userAuth,
  wishlistController.removeFromWishlist
);
router.post("/wishlist/status", userAuth, wishlistController.getWishlistStatus);

// Cart & Checkout
// router.post('/add-to-cart', userAuth, cartController.addToCart);
router.get("/cart", userAuth, cartController.getCartPage);
router.post("/cart/add", userAuth, cartController.addToCart);
router.put("/cart", userAuth, cartController.updateCart);
router.patch("/cart/:itemId", userAuth, cartController.updateCartItem);
// Remove an item from the cart
router.delete("/cart/remove", userAuth, cartController.removeFromCart);

// checout routes
router.get("/checkout", userAuth, checkoutController.getCheckoutPage);
router.post("/checkout", userAuth, placeorderController.placeOrder);
router.post(
  "/create-razorpay-order",
  userAuth,
  checkoutController.createRazorpayOrder
);
router.get("/available-coupons", userAuth, checkoutController.getCoupon);
router.post("/apply-coupon", userAuth, checkoutController.applyCoupon);
router.get("/check-stock", userAuth, checkoutController.checkStockAvailability);

router.get("/payment-failed", userAuth);

// order success & failure routes
router.get("/order-success", userAuth, checkoutController.loadOrderSuccess);
router.get("/order-failure", userAuth, checkoutController.loadOrderFailurePage);
router.get("/wallet-balance", userAuth, checkoutController.getWalletBalance);

router.get("/myOrders", userAuth, orderController.getMyOrdersPage);
router.get("/orderDetails/:id", userAuth, orderController.getOrderDetails);

router.post("/cancel-order/:id", userAuth, orderController.cancelOrder);
router.post(
  "/cancel-item/:orderId/:itemId",
  userAuth,
  orderController.cancelIndividualItem
);

router.post("/return-order/:id", userAuth, orderController.returnFullOrder);
router.post("/return-items/:id", userAuth, orderController.returnSelectedItems);

router.get("/order/invoice/:id", userAuth, orderController.generateInvoice);

//security
router.get("/security", userAuth, accountController.getSecurityPage);
router.post("/security", userAuth, accountController.updatePassword);

// Add this route for real-time coupon application

//wallet
router.get("/wallet", userAuth, walletController.getMyWalletPage);
router.get(
  "/wallet/transactions",
  userAuth,
  walletController.getWalletTransactions
);
router.post("/wallet/refund", userAuth, walletController.refundMoney);

module.exports = router;
