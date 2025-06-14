// const Wishlist = require('../../models/wishlistSchema');
// const Cart = require('../../models/cartSchema');
// const User = require('../../models/userSchema');
// const Product = require('../../models/productSchema');

// const addToWishlist = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         const { productId, size } = req.body;
        
//         // Validate productId
//         if (!productId) {
//             return res.status(400).json({ message: 'Product ID is required' });
//         }
        
//         // Validate size for shoes
//         if (!size) {
//             return res.status(400).json({ message: 'Size selection is required' });
//         }
        
//         const product = await Product.findById(productId);
//         if (!product) {
//             return res.status(404).json({ message: 'Product not found' });
//         }
        
//         // Check if the selected size is available and in stock
//         if (product.shoeSizes && product.shoeSizes.size > 0) {
//             const sizeStock = product.shoeSizes.get(size.toString()) || 0;
//             if (sizeStock <= 0) {
//                 return res.status(400).json({ 
//                     message: 'Selected size is out of stock' 
//                 });
//             }
//         }
        
//         let wishlist = await Wishlist.findOne({ userId });
//         if (!wishlist) {
//             wishlist = new Wishlist({ userId, products: [] });
//         }
        
//         // Check if product with same size already exists in wishlist
//         const existing = wishlist.products.find(
//             i => i.productId.toString() === productId && i.size === size
//         );
        
//         if (existing) {
//             return res.status(400).json({ 
//                 message: 'Product with this size already in wishlist',
//                 totalCount: wishlist.products.length 
//             });
//         }
        
//         // Add product to wishlist with size
//         wishlist.products.push({
//             productId,
//             size: size,
//             variants: {}
//         });
        
//         await wishlist.save();
        
//         // Update user's wishlist reference
//         await User.findByIdAndUpdate(userId, {
//             $addToSet: { wishlist: wishlist._id }
//         });
        
//         return res.status(200).json({
//             message: "Product added to wishlist successfully",
//             totalCount: wishlist.products.length
//         });
        
//     } catch (err) {
//         console.error('Add to wishlist error:', err);
//         return res.status(500).json({ 
//             message: 'Server error', 
//             error: err.message 
//         });
//     }
// };

// const removeFromWishlist = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         const { productId, size } = req.body;

//         const wishlist = await Wishlist.findOne({ userId });
//         if (!wishlist) {
//             return res.status(404).json({ message: 'Wishlist not found' });
//         }

//         const productIndex = wishlist.products.findIndex(
//             p => p.productId.toString() === productId && 
//                  (size ? p.size === size : true)
//         );

//         if (productIndex === -1) {
//             return res.status(404).json({ message: 'Product not found in wishlist' });
//         }

//         wishlist.products.splice(productIndex, 1);
//         await wishlist.save();

//         return res.status(200).json({
//             message: 'Removed from wishlist',
//             totalCount: wishlist.products.length
//         });

//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ message: 'Server error', error: err.message });
//     }
// };

// const getWishlistPage = async (req, res) => {
//     try {
//         const user = await User.findById(req.session.user);
//         const userId = req.user._id;

//         const wishlist = await Wishlist
//             .findOne({ userId })
//             .populate('products.productId');

//         const products = wishlist
//             ? wishlist.products
//                 .map(item => {
//                     const p = item.productId;
//                     if (p) {
//                         // Get stock for the specific size
//                         let sizeStock = 0;
//                         if (p.shoeSizes && item.size) {
//                             sizeStock = p.shoeSizes.get(item.size.toString()) || 0;
//                         }
                        
//                         return {
//                             _id: p._id,
//                             productName: p.productName,
//                             productImage: Array.isArray(p.productImage) ? p.productImage : [],
//                             images: Array.isArray(p.images) ? p.images : [],
//                             salePrice: typeof p.salePrice === 'number' ? p.salePrice : 0,
//                             regularPrice: typeof p.regularPrice === 'number' ? p.regularPrice : 0,
//                             countInStock: p.countInStock || 0,
//                             size: item.size || null,
//                             sizeStock: sizeStock,
//                             category: p.category,
//                             shortDescription: p.shortDescription || '',
//                             shoeSizes: p.shoeSizes || new Map()
//                         };
//                     }
//                 })
//                 .filter(p => p)
//             : [];

//         let cart = await Cart
//             .findOne({ userId })
//             .populate('items.productId');

//         const items = cart?.items || [];

//         let wishlistCount = 0;

//         if (userId) {
//             const wishlist = await Wishlist.findOne({ userId });
//             wishlistCount = wishlist ? wishlist.products.length : 0;
//         }

//         return res.render('user/wishlist', { 
//             products, 
//             user, 
//             items, 
//             wishlistCount 
//         });

//     } catch (error) {
//         console.error('Error fetching wishlist page:', error);
//         return res.redirect('/pageNotFound');
//     }
// };

// const getWishlistStatus = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         const { productIds } = req.body;
        
//         if (!productIds || !Array.isArray(productIds)) {
//             return res.status(400).json({ message: 'Product IDs array is required' });
//         }
        
//         const wishlist = await Wishlist.findOne({ userId });
        
//         if (!wishlist) {
//             return res.status(200).json({ wishlistItems: [] });
//         }
        
//         // Find which products from the provided list are in the wishlist
//         const wishlistItems = wishlist.products
//             .filter(item => productIds.includes(item.productId.toString()))
//             .map(item => ({
//                 productId: item.productId.toString(),
//                 size: item.size
//             }));
        
//         return res.status(200).json({ 
//             wishlistItems: wishlistItems,
//             totalCount: wishlist.products.length 
//         });
        
//     } catch (err) {
//         console.error('Get wishlist status error:', err);
//         return res.status(500).json({ 
//             message: 'Server error', 
//             error: err.message 
//         });
//     }
// };

// module.exports = {
//     getWishlistPage,
//     addToWishlist,
//     removeFromWishlist,
//     getWishlistStatus
// }   

const Wishlist = require('../../models/wishlistSchema');
const Cart = require('../../models/cartSchema');
const User = require('../../models/userSchema');
const Product = require('../../models/productSchema');

const addToWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, size } = req.body;
        
        // Validate productId
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }
        
        // Validate size for shoes
        // if (!size) {
        //     return res.status(400).json({ message: 'Size selection is required' });
        // }
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Check if the selected size is available and in stock
        // if (product.shoeSizes && product.shoeSizes.size > 0) {
        //     const sizeStock = product.shoeSizes.get(size.toString()) || 0;
        //     if (sizeStock <= 0) {
        //         return res.status(400).json({ 
        //             message: 'Selected size is out of stock' 
        //         });
        //     }
        // }
        
        let wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            wishlist = new Wishlist({ userId, products: [] });
        }
        
        // Check if product with same size already exists in wishlist
        const existing = wishlist.products.find(
            i => i.productId.toString() === productId && i.size === size
        );
        
        if (existing) {
            return res.status(400).json({ 
                message: 'Product with this size already in wishlist',
                totalCount: wishlist.products.length 
            });
        }
        
        // Add product to wishlist with size
        wishlist.products.push({
            productId
        });
        
        await wishlist.save();
        
        // Update user's wishlist reference
        await User.findByIdAndUpdate(userId, {
            $addToSet: { wishlist: wishlist._id }
        });
        
        return res.status(200).json({
            message: "Product added to wishlist successfully",
            totalCount: wishlist.products.length
        });
        
    } catch (err) {
        console.error('Add to wishlist error:', err);
        return res.status(500).json({ 
            message: 'Server error', 
            error: err.message 
        });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, size } = req.body;

        const wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }

        const productIndex = wishlist.products.findIndex(
            p => p.productId.toString() === productId && 
                 (size ? p.size === size : true)
        );

        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found in wishlist' });
        }

        wishlist.products.splice(productIndex, 1);
        await wishlist.save();

        return res.status(200).json({
            message: 'Removed from wishlist',
            totalCount: wishlist.products.length
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getWishlistPage = async (req, res) => {
    try {
        const user = await User.findById(req.session.user);
        const userId = req.user._id;

        const wishlist = await Wishlist
            .findOne({ userId })
            .populate('products.productId');

        const products = wishlist
            ? wishlist.products
                .map(item => {
                    const p = item.productId;
                    if (p) {
                        // Get stock for the specific size
                        let sizeStock = 0;
                        if (p.shoeSizes && item.size) {
                            sizeStock = p.shoeSizes.get(item.size.toString()) || 0;
                        }
                        
                        return {
                            _id: p._id,
                            productName: p.productName,
                            productImage: Array.isArray(p.productImage) ? p.productImage : [],
                            images: Array.isArray(p.images) ? p.images : [],
                            salePrice: typeof p.salePrice === 'number' ? p.salePrice : 0,
                            regularPrice: typeof p.regularPrice === 'number' ? p.regularPrice : 0,
                            countInStock: p.countInStock || 0,
                            size: item.size || null,
                            sizeStock: sizeStock,
                            category: p.category,
                            shortDescription: p.shortDescription || '',
                            shoeSizes: p.shoeSizes || new Map()
                        };
                    }
                })
                .filter(p => p)
            : [];

        let cart = await Cart
            .findOne({ userId })
            .populate('items.productId');

        const items = cart?.items || [];

        let wishlistCount = 0;

        if (userId) {
            const wishlist = await Wishlist.findOne({ userId });
            wishlistCount = wishlist ? wishlist.products.length : 0;
        }

        return res.render('user/wishlist', { 
            products, 
            user, 
            items, 
            wishlistCount 
        });
        

    } catch (error) {
        console.error('Error fetching wishlist page:', error);
        return res.redirect('/pageNotFound');
    }
};

const getWishlistStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productIds } = req.body;
        
        if (!productIds || !Array.isArray(productIds)) {
            return res.status(400).json({ message: 'Product IDs array is required' });
        }
        
        const wishlist = await Wishlist.findOne({ userId });
        
        if (!wishlist) {
            return res.status(200).json({ wishlistItems: [] });
        }
        
        // Find which products from the provided list are in the wishlist
        const wishlistItems = wishlist.products
            .filter(item => productIds.includes(item.productId.toString()))
            .map(item => ({
                productId: item.productId.toString(),
                size: item.size
            }));
            
        
        return res.status(200).json({ 
            wishlistItems: wishlistItems,
            totalCount: wishlist.products.length 
        });
        
    } catch (err) {
        console.error('Get wishlist status error:', err);
        return res.status(500).json({ 
            message: 'Server error', 
            error: err.message 
        });
    }
};

module.exports = {
    getWishlistPage,
    addToWishlist,
    removeFromWishlist,
    getWishlistStatus
}