const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/admincontroller")
const customerController = require("../controllers/admin/customerController");
const categoryController = require("../controllers/admin/categoryController");
const productController = require("..//controllers/admin/productController");
const {userAuth,adminAuth} = require("../middleware/auth");
const upload = require('../middleware/imageUpload');
const orderController = require("../controllers/admin/orderController")
const couponController = require("../controllers/admin/couponController")
const salesController = require("../controllers/admin/salesController")



router.get("/pageerror",adminController.pageerror);
router.get("/login", adminController.loadLogin);
router.post("/login", adminController.login);
router.get("/dashboard", adminAuth, adminController.loadDashboard);
router.get("/logout",adminController.logout);


// //customer management
router.get("/users",adminAuth,customerController.customerInfo);
router.get("/blockCustomer", adminAuth,customerController.customerBlocked);
router.get("/unblockCustomer", adminAuth,customerController.customerunBlocked);


//category management
router.get("/category", adminAuth,categoryController.categoryInfo);
router.post("/addCategory",adminAuth,categoryController.addCategory);
router.get('/listCategory',adminAuth,categoryController.getListCategory);
router.get('/unlistCategory',adminAuth,categoryController.getUnlistCategory);
// router.get("/editCategory",adminAuth,categoryController.loadEditCategory);
router.get("/editCategory/:id", adminAuth, categoryController.loadEditCategory);
router.post("/editCategory/:id", adminAuth, categoryController.editCategory);
router.get("/deleteCategory", adminAuth, categoryController.deleteCategory);



// //product management
router.get("/products", adminAuth, productController.getProducts);
router.get("/addProducts", adminAuth, productController.getProductAdd);
router.post("/addProducts", adminAuth, upload.any(), productController.addProduct);
router.get("/edit-product/:id", adminAuth, productController.getEditProduct);
router.post("/edit-product/:id", adminAuth, upload.any(), productController.editProduct);
router.get("/listProduct", adminAuth, productController.listProduct);
router.get("/unlistProduct", adminAuth, productController.unlistProduct);
router.get("/deleteProduct", adminAuth, productController.deleteProduct);


//order management
router.get('/orders', adminAuth, orderController.getOrderManagement);
router.get('/orderDetails', adminAuth, orderController.getOrderDetails);
router.get('/orderDetails/:id', adminAuth, orderController.getOrderDetails);
router.post('/order-status', adminAuth, orderController.updateOrderStatus);
router.get('/orderTrack/:id', adminAuth, orderController.getOrderTracking);
router.post('/approve-return/:orderId', adminAuth, orderController.approveReturns);
router.post('/cancel-return/:orderId', adminAuth, orderController.rejectReturns);

router.get('/sales', adminAuth, salesController.loadSalesReport);
router.post('/sales/filter', adminAuth, salesController.updateSales);
router.post('/generate-report', adminAuth, salesController.generateReport);


// Coupon management
router.get('/coupons', adminAuth, couponController.loadCouponManagement);
router.post('/coupons', adminAuth, couponController.addCoupon);
router.post('/coupons/update', adminAuth, couponController.updateCoupon);
router.get('/coupons/activate/:id', adminAuth, couponController.activateCoupon);
router.get('/coupons/deactivate/:id', adminAuth, couponController.deactivateCoupon);
router.get('/coupons/delete/:id', adminAuth, couponController.deleteCoupon);


module.exports = router;
