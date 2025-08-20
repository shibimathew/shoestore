const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");



const loadShoppingPage = async (req, res) => {
  try {
    const user = req.session.user || req.user || null;

    const userData = user ? await User.findOne({ _id: user }) : null;
    const categories = await Category.find({ isListed: true });
    const categoryIds = categories.map((category) => category._id.toString());
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    // Get sort parameter from query
    const sort = req.query.sort || "newest";
    const selectedCategory = req.query.category || "";

    // Define sort options
    let sortOption = { createdAt: -1 };
    switch (sort) {
      case "price_asc":
        sortOption = { salePrice: 1 };
        break;
      case "price_desc":
        sortOption = { salePrice: -1 };
        break;
      case "name_asc":
        sortOption = { productName: 1 };
        break;
      case "name_desc":
        sortOption = { productName: -1 };
        break;
      case "newest":
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    const query = {
      isListed: true,
      category: { $in: categoryIds },
      // quantity: { $gt: 0 },
    };

    if (selectedCategory) {
      query.category = selectedCategory;
    }

    const products = await Product.find(query)
      .populate("category")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);
    const categoriesWithIds = categories.map((category) => ({
      _id: category._id,
      name: category.name,
    }));
    req.session.coupon = null;

    res.render("user/shop", {
      user: userData,
      products: products,
      category: categoriesWithIds,
      totalProducts: totalProducts,
      currentPage: page,
      totalPages: totalPages,
      currentSort: sort,
      selectedCategory: selectedCategory,
      priceRange: {
        gt: req.query.gt || "",
        lt: req.query.lt || "",
      },
    });
  } catch (error) {
    console.error("Error in loadShoppingPage:", error);
    res.redirect("/pageNotFound");
  }
};

const filterProduct = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = user ? await User.findOne({ _id: user }) : null;
    const categories = await Category.find({ isListed: true });
    const categoryIds = categories.map((category) => category._id.toString());
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    // Get sort parameter from query
    const sort = req.query.sort || "newest";

    // Define sort options
    let sortOption = {};
    switch (sort) {
      case "price_asc":
        sortOption = { salePrice: 1 };
        break;
      case "price_desc":
        sortOption = { salePrice: -1 };
        break;
      case "name_asc":
        sortOption = { productName: 1 };
        break;
      case "name_desc":
        sortOption = { productName: -1 };
        break;
      case "newest":
      default:
        sortOption = { createdOn: -1 };
        break;
    }

    const categoryId = req.query.category;
    const query = {
      isListed: true,
      category: { $in: categoryIds },
      // quantity: { $gt: 0 },
    };

    if (categoryId) {
      query.category = categoryId;
    }

    const products = await Product.find(query)
      .populate("category")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);
    const categoriesWithIds = categories.map((category) => ({
      _id: category._id,
      name: category.name,
    }));

    res.render("user/shop", {
      user: userData,
      products: products,
      category: categoriesWithIds,
      totalProducts: totalProducts,
      currentPage: page,
      totalPages: totalPages,
      currentSort: sort,
      selectedCategory: categoryId,
      priceRange: {
        gt: req.query.gt || "",
        lt: req.query.lt || "",
      },
    });
  } catch (error) {
    console.error("Error in filterProduct:", error);
    res.redirect("/pageNotFound");
  }
};

const filterByPrice = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findOne({ _id: user });
    const categories = await Category.find({ isListed: true }).lean();
    const categoryId = req.query.category;
    const sort = req.query.sort || "newest";
    const gt = req.query.gt;
    const lt = req.query.lt;

    // Build query object
    const query = {
      salePrice: { $gt: Number(gt), $lt: Number(lt) },
      isListed: true,
      // quantity: {$gt: 0}
    };

    // Add category filter if provided
    if (categoryId) {
      query.category = categoryId;
    }

    // Define sort options
    let sortOption = {};
    switch (sort) {
      case "price_asc":
        sortOption = { salePrice: 1 };
        break;
      case "price_desc":
        sortOption = { salePrice: -1 };
        break;
      case "name_asc":
        sortOption = { productName: 1 };
        break;
      case "name_desc":
        sortOption = { productName: -1 };
        break;
      case "newest":
      default:
        sortOption = { createdOn: -1 };
        break;
    }

    let findProducts = await Product.find(query)
      .populate("category")
      .sort(sortOption)
      .lean();

    let itemsPerPage = 6;
    let currentPage = parseInt(req.query.page) || 1;
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    let totalPages = Math.ceil(findProducts.length / itemsPerPage);
    const currentProduct = findProducts.slice(startIndex, endIndex);
    req.session.filteredProducts = findProducts;

    res.render("user/shop", {
      user: userData,
      products: currentProduct,
      category: categories,
      totalPages,
      currentPage,
      selectedCategory: categoryId,
      currentSort: sort,
      priceRange: {
        gt: gt,
        lt: lt,
      },
    });
  } catch (error) {
    console.log(error);
    res.redirect("/pageNotFound");
  }
};
const searchProducts = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = user ? await User.findOne({ _id: user }) : null;
    const searchQuery =
      req.body.query?.trim() || req.query.search?.trim() || "";

    // Fetch categories
    const categories = await Category.find({ isListed: true }).lean();
    const categoryIds = categories.map((category) => category._id.toString());

    // Build base query
    const query = {
      isListed: true,
      // quantity: { $gt: 0 }, // Uncomment if you want to exclude out-of-stock items
      category: { $in: categoryIds },
    };

    // Add search term if provided
    if (searchQuery) {
      query.productName = { $regex: searchQuery, $options: "i" };
    }

    // Get sort parameter
    const sort = req.query.sort || "newest";
    let sortOption = {};
    switch (sort) {
      case "price_asc":
        sortOption = { salePrice: 1 };
        break;
      case "price_desc":
        sortOption = { salePrice: -1 };
        break;
      case "name_asc":
        sortOption = { productName: 1 };
        break;
      case "name_desc":
        sortOption = { productName: -1 };
        break;
      case "newest":
      default:
        // Using createdAt from timestamps: true
        sortOption = { createdAt: -1 };
        break;
    }

    // Execute search with proper population and sorting
    const products = await Product.find(query)
      .populate("category")
      .sort(sortOption)
      .lean();

    // Pagination
    const itemsPerPage = 6;
    const currentPage = parseInt(req.query.page) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const totalPages = Math.ceil(products.length / itemsPerPage);
    const currentProducts = products.slice(startIndex, endIndex);

    // Clear any existing filtered products from session to avoid conflicts
    delete req.session.filteredProducts;

    // Render response
    res.render("user/shop", {
      user: userData,
      products: currentProducts,
      category: categories,
      totalPages,
      currentPage,
      currentSort: sort,
      searchQuery,
      selectedCategory: req.query.category || "",
      priceRange: {
        gt: req.query.gt || "",
        lt: req.query.lt || "",
      },
      count: products.length,
    });
  } catch (error) {
    console.error("Search Error:", error);
    res.redirect("/pageNotFound");
  }
};


module.exports = {
  loadShoppingPage,
  filterProduct,
  filterByPrice,
  searchProducts,
}