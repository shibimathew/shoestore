const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/admincontroller")
const customerController = require("../controllers/admin/customerController");
const categoryController = require("../controllers/admin/categoryController");
const productController = require("..//controllers/admin/productController");
const {userAuth,adminAuth} = require("../middleware/auth");
const upload = require('../middleware/imageUpload');



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


module.exports = router;
