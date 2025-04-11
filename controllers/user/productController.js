const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");



// const productDetails = async (req,res)=>{
//     try {
//         const userId = req.session.user;
//         const userData = await User.findById(userId);
//         const productId = req.query.id;
//         const product = await Product.findById(productId).populate('category'); 
//         const findCategory = product.category;
//         const categoryOffer = findCategory && findCategory.categoryOffer ? findCategory.categoryOffer : 0;

//         const productOffer = product.productOffer || 0;
//         const totalOffer = categoryOffer + productOffer;
//         res.render("product-details",{
//             user:userData,
//             product:product,
//             quantity:product.quantity,
//             totalOffer:totalOffer,
//             category:findCategory,
//         });

//     } catch (error) {
//         console.error("Error for fetching product details",error);
//         res.redirect("/pageNotFoun")
//     }
// }

// module.exports={
//     productDetails,
// }
const productDetails = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = userId ? await User.findById(userId) : null;
        const productId = req.query.id;
        
        if (!productId) {
            return res.redirect("/pageNotFound");
        }
        
        const product = await Product.findById(productId).populate('category');
        console.log("PRODUCT",product)
        
        if (!product) {
            return res.redirect("/pageNotFound");
        }
        
        // Ensure we have valid data for all required fields
        const findCategory = product.category || {};
        const categoryOffer = findCategory.categoryOffer || 0;
        const productOffer = product.productOffer || 0;
        const totalOffer = categoryOffer + productOffer;
        
        // Initialize shoeSizes if it doesn't exist
        if (!product.shoeSizes) {
            product.shoeSizes = new Map();
            for (let i = 1; i <= 10; i++) {
                product.shoeSizes.set(i.toString(), 0);
            }
        }
        
        // Make sure we have at least one image
        if (!product.images || product.images.length === 0) {
            product.images = ["/assets/imgs/shop/product-placeholder.jpg"];
        }
        
        // Initialize longDescription and specifications if not present
        if (!product.longDescription) {
            product.longDescription = product.description || "";
        }
        
        if (!product.specifications) {
            product.specifications = "";
        }
        
        res.render("user/product-details", {
            user: userData,
            product: product,
            quantity: product.quantity || 0,
            totalOffer: totalOffer,
            category: findCategory,
        });
        
    } catch (error) {
        console.error("Error fetching product details", error);
        res.redirect("/pageNotFound");
    }
};

module.exports={
    productDetails,
}