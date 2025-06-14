
const Cart = require('../../models/cartSchema');
const User = require('../../models/userSchema');
const Product = require('../../models/productSchema');
const Wishlist = require('../../models/wishlistSchema');


const addToCart = async (req, res) => {
  try {
    // Check if req.user exists, if not try to get userId from session
    const userId = req.user?._id || req.session?.user;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    const { productId, quantity = 1, selectedSize } = req.body;
    const variants = { size: selectedSize };
    
    const product = await Product.findOne({_id: productId});
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const normalizedSize = (variants.size || '').toLowerCase();
    const sizesObj = product.shoeSizes; 
    
    // Check if the size exists and has stock
    if (!sizesObj.has(normalizedSize) || sizesObj.get(normalizedSize) <= 0) {
      return res.status(400).json({ success: false, message: 'Please select a valid product size.' });
    }
    
    const stockAvailable = sizesObj.get(normalizedSize);
    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });

    const existing = cart.items.find(item =>
      item.productId.toString() === productId &&
      item.variants.size.toLowerCase() === normalizedSize
    );
   
    if (existing) {
      const newQty = existing.quantity + Number(quantity);
      if (newQty > stockAvailable) {
        return res.status(400).json({
          success: false,
          message: `You already have ${existing.quantity} in your cart. Only ${stockAvailable - existing.quantity} more can be added for size ${normalizedSize.toUpperCase()}.`
        });
      }
      existing.quantity = newQty;
    } else {
      if (Number(quantity) > stockAvailable) {
        return res.status(400).json({
          success: false,
          message: `Only ${stockAvailable} items available for size ${normalizedSize.toUpperCase()}.`
        });
      }
      cart.items.push({
        productId,
        name: product.productName,
        quantity: Number(quantity),
        price: product.salePrice,
        basePrice: product.regularPrice,
        productImage: product.images[0],
        variants,
        category: product.category,
      });
    }

    await cart.save();
    
    // Remove product from wishlist if it exists
    await Wishlist.findOneAndUpdate(
      { userId },
      { $pull: { products: { productId } } }
    );
    
    // Only update user if we have a valid user object
    if (req.user) {
      await User.findByIdAndUpdate(userId, { $addToSet: { cart: cart._id } });
    }

    const totalCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    return res.status(200).json({
      success: true,
      message: 'Added to cart',
      totalCount
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};


const getCartPage = async (req, res) => {
  try {
    // Check if req.user exists, if not try to get userId from session
    const userId = req.user?._id || req.session?.user;
        
    if (!userId) {
      return res.redirect('/login');
    }

    let cart = await Cart
      .findOne({ userId })
      .populate({
        path: 'items.productId',
        match: { isListed: { $ne: false } } // Only show products that aren't blocked by admin
      });

    // Filter out null productId entries (products that were filtered out by populate match)
    const items = cart?.items?.filter(item => item.productId !== null) || [];

    return res.render('user/myCart', { items, user: req.user });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server error');
  }
};


const removeFromCart = async (req, res) => {
  try {
    // Check if req.user exists, if not try to get userId from session
    const userId = req.user?._id || req.session?.user;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }
    
    const { itemId } = req.body;  
    if (!itemId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Item ID is required' 
      });
    }
    
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cart not found' 
      });
    }
    
    const itemIndex = cart.items.findIndex(item => 
      item._id.toString() === itemId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item not found in cart' 
      });
    }
    
    cart.items.splice(itemIndex, 1);
    await cart.save();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Item removed from cart successfully' 
    });
  } catch (err) {
    console.error('Error removing item from cart:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
};

const updateCart = async (req, res) => {
  try {
    // Check if req.user exists, if not try to get userId from session
    const userId = req.user?._id || req.session?.user;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const items = req.body.items; 

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items.forEach(item => {
      const itemId = item._id.toString();
      if (items[itemId]) {
        const newQuantity = parseInt(items[itemId]);
        if (newQuantity > 0) {
          item.quantity = newQuantity;
        }
      }
    });

    cart.items = cart.items.filter(item => item.quantity > 0);

    await cart.save();

    return res.redirect('/cart');
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
const updateCartItem = async (req, res) => {
  try {
    // Check authentication
    const userId = req.user?._id || req.session?.user;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    const { itemId } = req.params;
    let quantity = parseInt(req.body.quantity, 10);

    // Validate quantity
    if (isNaN(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Invalid quantity' });
    }

    // Find cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    // Find cart item
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    // Get product and check stock
    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const sizeKey = item.variants.size.toLowerCase();
    
    // Check stock based on your product schema structure
    let stockAvailable = 0;
    
    // If using shoeSizes Map (as in addToCart)
    if (product.shoeSizes && product.shoeSizes.has(sizeKey)) {
      stockAvailable = product.shoeSizes.get(sizeKey);
    }
    // If using variant.size object (as in your corrected version)
    else if (product.variant && product.variant.size && product.variant.size[sizeKey]) {
      stockAvailable = product.variant.size[sizeKey];
    }
    // If using sizes array
    else if (product.sizes) {
      const sizeObj = product.sizes.find(s => s.size.toLowerCase() === sizeKey);
      stockAvailable = sizeObj ? sizeObj.quantity : 0;
    }

    // Check if requested quantity exceeds stock
    if (quantity > stockAvailable) {
      return res.status(400).json({
        success: false,
        message: `Only ${stockAvailable} items available for size ${sizeKey.toUpperCase()}.`
      });
    }

    // Update quantity
    item.quantity = quantity;
    await cart.save();

    return res.json({ 
      success: true, 
      quantity: item.quantity,
      message: 'Cart updated successfully'
    });

  } catch (err) {
    console.error('Error updating cart item:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: err.message 
    });
  }
};


module.exports = {
  addToCart,
  getCartPage,
  removeFromCart,
  updateCart,
  updateCartItem,
};