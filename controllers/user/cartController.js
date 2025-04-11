const Cart = require('../../models/cartSchema');
const Product = require('../../models/productSchema');
const User = require('../../models/userSchema');

const addToCart = async (req, res) => {
    try {
        const { productId, selectedSize } = req.body;
        const userId = req.session.user;

        if (!userId) {
            return res.redirect('/login');
        }

        // Get the product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if the selected size has stock
        const stock = product.shoeSizes.get(selectedSize.toString());
        if (!stock || stock <= 0) {
            return res.status(400).json({ error: 'Selected size is out of stock' });
        }

        // Find or create user's cart
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Check if product already exists in cart
        const existingItem = cart.items.find(item => 
            item.productId.toString() === productId && 
            item.size === selectedSize
        );

        if (existingItem) {
            // Update quantity if product exists
            existingItem.quantity += 1;
            existingItem.totalPrice = existingItem.quantity * existingItem.price;
        } else {
            // Add new item if product doesn't exist
            cart.items.push({
                productId,
                quantity: 1,
                price: product.salePrice || product.regularPrice,
                totalPrice: product.salePrice || product.regularPrice,
                size: selectedSize
            });
        }

        await cart.save();
        res.redirect('/cart');
    } catch (error) {
        console.error('Error in addToCart:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    addToCart
}; 