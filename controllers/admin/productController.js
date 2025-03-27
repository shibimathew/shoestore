const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const products = await Product.find({})
            .populate('category', 'name')
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
        const { name, description, price, stock, category } = req.body;
        const images = req.files.map(file => file.filename);

        const newProduct = new Product({
            name,
            description,
            price,
            stock,
            category,
            images,
            isListed: true
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

        res.render('admin/editProduct', { product, categories });
    } catch (error) {
        console.error('Error in getEditProduct:', error);
        res.redirect('/admin/pageerror');
    }
};

const editProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { name, description, price, stock, category } = req.body;
        const images = req.files ? req.files.map(file => file.filename) : undefined;

        const updateData = {
            name,
            description,
            price,
            stock,
            category
        };

        if (images) {
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
    try {
        const productId = req.query.productId;
        await Product.findByIdAndUpdate(productId, { isListed: true });
        res.json({
            success: true,
            message: "Product listed successfully"
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
    try {
        const productId = req.query.productId;
        await Product.findByIdAndUpdate(productId, { isListed: false });
        res.json({
            success: true,
            message: "Product unlisted successfully"
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
 