const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const Cart = require("../../models/cartSchema");

const productDetails = async (req, res) => {
  try {
    const user = req.session.user || req.user || null;
    const userData = user ? await User.findById(user._id) : null;
    const productId = req.query.id;

    if (!productId) {
      return res.redirect("/pageNotFound");
    }

    const product = await Product.findById(productId).populate("category");

    if (!product) {
      return res.redirect("/pageNotFound");
    }

    const findCategory = product.category || {};
    const categoryId = findCategory._id;
    const categoryOffer = findCategory.categoryOffer || 0;
    const productOffer = product.productOffer || 0;

    const appliedOffer = Math.max(categoryOffer, productOffer);

    let finalPrice = product.salePrice;
    let offerType = null;

    if (appliedOffer > 0) {
      finalPrice = product.salePrice - (product.salePrice * appliedOffer) / 100;
      finalPrice = Math.round(finalPrice * 100) / 100;

      if (categoryOffer > productOffer) {
        offerType = "category";
      } else if (productOffer > categoryOffer) {
        offerType = "product";
      } else if (categoryOffer === productOffer && categoryOffer > 0) {
        offerType = "both";
      }
    }

    const sort = req.query.sort || "newest";

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

    // Get related products from same category with their offers calculated
    const relatedProducts = await Product.find({
      category: categoryId,
      _id: { $ne: productId }, // Exclude current product
      isBlocked: { $ne: true }, // Only show products that aren't blocked
    })
      .limit(4) // Limit to 4 related products
      .populate("category")
      .lean();

    // Calculate offers for related products too
    const productsWithOffers = relatedProducts.map((relProduct) => {
      const relCategoryOffer = relProduct.category?.categoryOffer || 0;
      const relProductOffer = relProduct.productOffer || 0;
      const relAppliedOffer = Math.max(relCategoryOffer, relProductOffer);

      let relFinalPrice = relProduct.salePrice;
      if (relAppliedOffer > 0) {
        relFinalPrice =
          relProduct.salePrice - (relProduct.salePrice * relAppliedOffer) / 100;
        relFinalPrice = Math.round(relFinalPrice * 100) / 100;
      }

      return {
        ...relProduct,
        appliedOffer: relAppliedOffer,
        finalPrice: relFinalPrice,
        categoryOffer: relCategoryOffer,
        productOffer: relProductOffer,
      };
    });

    res.render("user/product-details", {
      user: userData,
      product: product,
      quantity: product.quantity || 0,
      categoryOffer: categoryOffer,
      productOffer: productOffer,
      appliedOffer: appliedOffer,
      finalPrice: finalPrice,
      offerType: offerType, // 'category', 'product', 'both', or null
      category: findCategory,
      selectedCategory: categoryId,
      currentSort: sort,
      priceRange: {
        gt: req.query.gt || "",
        lt: req.query.lt || "",
      },
      products: productsWithOffers, // Related products with calculated offers
    });
  } catch (error) {
    console.error("Error fetching product details", error);
    res.redirect("/pageNotFound");
  }
};

module.exports = {
  productDetails,
};
