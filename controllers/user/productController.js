const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const Cart = require("../../models/cartSchema")

const productDetails = async (req, res) => {
    try {
        const user = req.session.user||req.user||null;
        const userData = user ? await User.findById(user._id) : null;
        const productId = req.query.id;
        
        if (!productId) {
            return res.redirect("/pageNotFound");
        }
        
        const product = await Product.findById(productId).populate('category');
        
        if (!product) {
            return res.redirect("/pageNotFound");
        }
        
        // Ensure we have valid data for all required fields
        const findCategory = product.category || {};
        const categoryId = findCategory._id;
        const categoryOffer = findCategory.categoryOffer || 0;
        const productOffer = product.productOffer || 0;
        const totalOffer = categoryOffer + productOffer;
        const sort = req.query.sort || 'newest';
        
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
        
        // Get related products from same category
        const products = await Product.find({
            category: categoryId,
            _id: { $ne: productId }, // Exclude current product
            isBlocked: { $ne: true } // Only show products that aren't blocked
        })
        .limit(4) // Limit to 4 related products
        .populate('category')
        .lean();
          
        
        // Check if product is in cart (without adding to render variables yet)
      
        res.render("user/product-details", {
            user: userData,
            product: product,
            quantity: product.quantity || 0,
            totalOffer: totalOffer,
            category: findCategory,
            selectedCategory: categoryId,
            currentSort: sort,
            priceRange: {
                gt: req.query.gt || '',
                lt: req.query.lt || ''
            },
            products: products // Changed from relatedProducts to products to match your template
            
        });
        
    } catch (error) {
        console.error("Error fetching product details", error);
        res.redirect("/pageNotFound");
    }
};

module.exports = {
    productDetails,
}



