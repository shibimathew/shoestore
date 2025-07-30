const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { nanoid } = require("nanoid");

const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const filter = {};
    const searchQuery = req.query.search || req.query.searchQuery;

    if (searchQuery && searchQuery.trim()) {
      const searchRegex = new RegExp(searchQuery.trim(), "i");
      filter.$or = [
        { productName: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
      ];
    }

    const products = await Product.find(filter)
      .populate("category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    res.render("admin/products", {
      products,
      currentPage: page,
      totalPages,
      totalProducts,
      searchQuery: searchQuery || "",
    });
  } catch (error) {
    console.error("Error in getProducts:", error);
    res.redirect("/admin/pageerror");
  }
};

const getProductAdd = async (req, res) => {
  try {
    const categories = await Category.find({ isListed: true });
    res.render("admin/productadd", { categories });
  } catch (error) {
    console.error("Error in getProductAdd:", error);
    res.redirect("/admin/pageerror");
  }
};

const addProduct = async (req, res) => {
  try {
    const {
      productName,
      description,
      longDescription,
      specifications,
      regularPrice,
      salePrice,
      category,
      brand,
      color,
      status,
    } = req.body;

    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    const maxFileSize = 5 * 1024 * 1024;

    if (!req.files || req.files.length === 0) {
      const categories = await Category.find({ isListed: true });
      return res.render("admin/productadd", {
        message: "Please upload at least one image",
        categories,
        formData: req.body,
      });
    }

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      if (!allowedImageTypes.includes(file.mimetype)) {
        const categories = await Category.find({ isListed: true });
        return res.render("admin/productadd", {
          message: `Invalid file type for image ${
            i + 1
          }. Only JPEG, JPG, PNG, and WebP files are allowed.`,
          categories,
          formData: req.body,
        });
      }
    }

    const images = req.files.map((file) => file.path);

    // Check for existing product
    const existingProduct = await Product.findOne({
      productName: { $regex: new RegExp(`^${productName.trim()}$`, "i") },
    });

    if (existingProduct) {
      const categories = await Category.find({ isListed: true });
      return res.render("admin/productadd", {
        message: "Product with this name already exists",
        categories,
        formData: req.body, // Pass back the form data
      });
    }

    const shoeSizes = new Map();
    for (let i = 1; i <= 10; i++) {
      const sizeKey = `shoeSize${i}`;
      shoeSizes.set(i.toString(), parseInt(req.body[sizeKey]) || 0);
    }
    const generateProductId = () => {
      return `SPR-${nanoid(10)}`;
    };

    const productId = generateProductId();
    const newProduct = new Product({
      productId,
      productName,
      description,
      longDescription,
      specifications,
      regularPrice,
      salePrice,
      category,
      brand,
      color,
      status,
      shoeSizes,
      images,
    });

    await newProduct.save();
    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error in addProduct:", error);
    res.redirect("/admin/pageerror");
  }
};
const getEditProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    const categories = await Category.find({ isListed: true });

    if (!product) {
      return res.redirect("/admin/products");
    }

    // Initialize shoeSizes if it doesn't exist
    if (!product.shoeSizes) {
      product.shoeSizes = new Map();
      for (let i = 1; i <= 10; i++) {
        product.shoeSizes.set(i.toString(), 0);
      }
    }

    res.render("admin/edit-product", { product, categories });
  } catch (error) {
    console.error("Error in getEditProduct:", error);
    res.redirect("/admin/pageerror");
  }
};

const editProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      productName,
      description,
      longDescription,
      specifications,
      regularPrice,
      salePrice,
      category,
      color,
      brand,
      status,
    } = req.body;

  
    const shoeSizes = new Map();
    for (let i = 1; i <= 10; i++) {
      const sizeKey = `shoeSize${i}`;
      shoeSizes.set(i.toString(), parseInt(req.body[sizeKey]) || 0);
    }

    const images = req.files ? req.files.map((file) => file.path) : undefined;

    const updateData = {
      productName,
      description,
      longDescription,
      specifications,
      regularPrice,
      salePrice,
      category,
      color,
      brand,
      status,
      shoeSizes,
    };

    if (images && images.length > 0) {
      updateData.images = images;
    }

    await Product.findByIdAndUpdate(productId, updateData);
    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error in editProduct:", error);
    res.redirect("/admin/pageerror");
  }
};

const listProduct = async (req, res) => {
  try {
    const productId = req.query.productId;
    await Product.findByIdAndUpdate(productId, { isListed: true });
    res.json({
      success: true,
      message: "Product unblocked successfully",
    });
  } catch (error) {
    console.error("Error in listProduct:", error);
    res.json({
      success: false,
      message: "Error listing product",
    });
  }
};

const unlistProduct = async (req, res) => {
  try {
    const productId = req.query.productId;
    await Product.findByIdAndUpdate(productId, { isListed: false });
    res.json({
      success: true,
      message: "Product blocked successfully",
    });
  } catch (error) {
    console.error("Error in unlistProduct:", error);
    res.json({
      success: false,
      message: "Error unlisting product",
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const productId = req.query.productId;
    await Product.findByIdAndDelete(productId);
    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    res.json({
      success: false,
      message: "Error deleting product",
    });
  }
};

// Add these routes to your existing product controller

const applyProductOffer = async (req, res) => {
  try {
    const { productId, discountPercentage } = req.body;

    // Validate input
    if (!productId || discountPercentage === undefined) {
      return res.json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
      return res.json({
        success: false,
        message: "Discount percentage must be between 0 and 100",
      });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.json({
        success: false,
        message: "Product not found",
      });
    }

    
    let offerPrice = null;
    if (discountPercentage > 0) {
      offerPrice =
        product.salePrice - (product.salePrice * discountPercentage) / 100;
      offerPrice = Math.round(offerPrice * 100) / 100; // Round to 2 decimal places
    }

    await Product.findByIdAndUpdate(productId, {
      productOffer: discountPercentage > 0 ? discountPercentage : 0,
      offerPrice: offerPrice,
      offerStartDate: discountPercentage > 0 ? new Date() : null,
      offerEndDate: null, 
    });

    res.json({
      success: true,
      message:
        discountPercentage > 0
          ? `Offer of ${discountPercentage}% applied successfully`
          : "Offer removed successfully",
    });
  } catch (error) {
    console.error("Error in applyProductOffer:", error);
    res.json({
      success: false,
      message: "Error applying offer",
    });
  }
};

const removeProductOffer = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.json({
        success: false,
        message: "Product ID is required",
      });
    }

   
    const product = await Product.findById(productId);
    if (!product) {
      return res.json({
        success: false,
        message: "Product not found",
      });
    }

    // Remove offer
    await Product.findByIdAndUpdate(productId, {
      productOffer: 0,
      offerPrice: null,
      offerStartDate: null,
      offerEndDate: null,
    });

    res.json({
      success: true,
      message: "Offer removed successfully",
    });
  } catch (error) {
    console.error("Error in removeProductOffer:", error);
    res.json({
      success: false,
      message: "Error removing offer",
    });
  }
};

module.exports = {
  getProducts,
  getProductAdd,
  addProduct,
  getEditProduct,
  editProduct,
  listProduct,
  unlistProduct,
  deleteProduct,

  applyProductOffer,
  removeProductOffer,
};
