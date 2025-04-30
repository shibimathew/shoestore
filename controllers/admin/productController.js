const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const {nanoid} = require("nanoid")

const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const filter = {}
        const searchQuery = req.query.searchQuery;
        
        if(searchQuery){
            const searchRegex = new RegExp(searchQuery,"i")
            filter.productName = searchRegex;
        }

        const products = await Product.find(filter)
            .populate('category')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('admin/products', {
            products,
            currentPage: page,
            totalPages,
            totalProducts
        });
    } catch (error) {
        console.error('Error in getProducts:', error);
        res.redirect('/admin/pageerror');
    }
};

const getProductAdd = async (req, res) => {
    try {
        const categories = await Category.find({ isListed: true });
        res.render('admin/productadd', { categories });
    } catch (error) {
        console.error('Error in getProductAdd:', error);
        res.redirect('/admin/pageerror');
    }
};

const addProduct = async (req, res) => {
    try {
        const { productName, description, longDescription, specifications, regularPrice, salePrice, category, brand, color, status } = req.body;
        // console.log(req.body)
        // console.log(req.files)
        const images = req.files.map(file => file.path);

        // Process shoe sizes
        const shoeSizes = new Map();
        for (let i = 1; i <= 10; i++) {
            const sizeKey = `shoeSize${i}`;
            shoeSizes.set(i.toString(), parseInt(req.body[sizeKey]) || 0);
        }

           const generateProductId = () => {
                    return `SPR-${nanoid(10)}`;
                  };
        
                  const productId = generateProductId()

        console.log(req.body);
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
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error in addProduct:', error);
        res.redirect('/admin/pageerror');
    }
};

const getEditProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);
        const categories = await Category.find({ isListed: true });

        if (!product) {
            return res.redirect('/admin/products');
        }
        
        // Initialize shoeSizes if it doesn't exist
        if (!product.shoeSizes) {
            product.shoeSizes = new Map();
            for (let i = 1; i <= 10; i++) {
                product.shoeSizes.set(i.toString(), 0);
            }
        }

        res.render('admin/edit-product', { product, categories });
    } catch (error) {
        console.error('Error in getEditProduct:', error);
        res.redirect('/admin/pageerror');
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
            status
        } = req.body;

        
        
        // Process shoe sizes
        const shoeSizes = new Map();
        for (let i = 1; i <= 10; i++) {
            const sizeKey = `shoeSize${i}`;
            shoeSizes.set(i.toString(), parseInt(req.body[sizeKey]) || 0);
        }
        
        // Get image URLs from Cloudinary uploads
        const images = req.files ? req.files.map(file => file.path) : undefined;

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
            shoeSizes
        };

        if (images && images.length > 0) {
            updateData.images = images;
        }

        await Product.findByIdAndUpdate(productId, updateData);
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error in editProduct:', error);
        res.redirect('/admin/pageerror');
    }
};

const listProduct = async (req, res) => {
    console.log("byyy")
    try {
        const productId = req.query.productId;
        await Product.findByIdAndUpdate(productId, { isListed: true });
        res.json({
            success: true,
            message: "Product unblocked successfully"
        });
    } catch (error) {
        console.error('Error in listProduct:', error);
        res.json({
            success: false,
            message: "Error listing product"
        });
    }
};

const unlistProduct = async (req, res) => {
    console.log('Hyyy')
    try {
        const productId = req.query.productId;
        await Product.findByIdAndUpdate(productId, { isListed: false });
        res.json({
            success: true,
            message: "Product blocked successfully"
        });
    } catch (error) {
        console.error('Error in unlistProduct:', error);
        res.json({
            success: false,
            message: "Error unlisting product"
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const productId = req.query.productId;
        await Product.findByIdAndDelete(productId);
        res.json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (error) {
        console.error('Error in deleteProduct:', error);
        res.json({
            success: false,
            message: "Error deleting product"
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
    deleteProduct
};
 