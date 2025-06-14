const Address = require('../../models/addressSchema'); 
const Cart    = require('../../models/cartSchema');
const Order   = require('../../models/orderSchema');
const User    = require('../../models/userSchema');
const Product = require('../../models/productSchema');
const mongoose = require('mongoose');

// const getCheckoutPage = async (req, res, next) => {
//   try {
//     // const userId = req.user._id;
//      const userId = req.user?._id || req.session?.user;

//     const addressDoc = await Address.findOne({ userId }).lean();
//     const addresses  = addressDoc?.address || [];

//     const cart = await Cart
//       .findOne({ userId })
//       .populate('items.productId')
//       .lean();

//     const items = cart?.items || [];
//     if (!items.length) {
//       return res.redirect('/cart');
//     }

//     const subTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
//     const delivery = 41;
//     const tax      = subTotal * 0.05;
//     const total    = subTotal + delivery + tax;

//     res.render('user/checkout', {
//       user: req.user,
//       addresses,
//       items,
//       total
//     });
//   } catch (err) {
//     next(err);
//   }
// };

const getCheckoutPage = async (req, res, next) => {
  try {
    // const userId = req.user._id;
     const userId = req.user?._id || req.session?.user;

    const addressDoc = await Address.findOne({ userId }).lean();
    const addresses  = addressDoc?.address || [];

    const cart = await Cart
      .findOne({ userId })
      .populate({
        path: 'items.productId',
        match: { isListed: { $ne: false } } // Only show products that aren't blocked by admin
      })
      .lean();

    // Filter out null productId entries (products that were filtered out by populate match)
    const items = cart?.items?.filter(item => item.productId !== null) || [];
    
    if (!items.length) {
      return res.redirect('/cart');
    }

    const subTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const delivery = 41;
    const tax      = subTotal * 0.05;
    const total    = subTotal + delivery + tax;

    res.render('user/checkout', {
      user: req.user,
      addresses,
      items,
      total
    });
  } catch (err) {
    next(err);
  }
};

const placeOrder = async (req, res, next) => {
  console.log(req.body)
  try {
    const userId = req.user._id;
    const { paymentMethod , selectedAddress } = req.body;

    const addressDoc = await Address.findOne({ userId });
    if (!addressDoc) {
      return res.redirect('/checkout?error=address-not-found');
    }

    const addressDetail = addressDoc.address.id(selectedAddress);
    if (!addressDetail) {
      return res.redirect('/checkout?error=invalid-address-selected');
    }

    const cart = await Cart
      .findOne({ userId })
      .populate('items.productId');

    if (!cart || !cart.items.length) {
      return res.redirect('/cart?error=empty-cart');
    }

    const orderItems = cart.items.map(item => ({
      product: item.productId._id,
      quantity: item.quantity,
      basePrice: item.basePrice,
      price: item.price,
      variant: { size: item.variants.size },
      productImage: item.productImage || item.productId.images[0],
      currentStatus: 'Pending',
      statusHistory: [{ status: 'Pending', timestamp: new Date() }],
    }));

    const subTotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const deliveryCharge = 41;
    const tax = parseFloat((subTotal * 0.05).toFixed(2));
    const totalAmount = parseFloat((subTotal + deliveryCharge + tax).toFixed(2));

    await Order.create({
      orderId: '#SM' + Math.floor(Math.random() * 1e9).toString(),
      userId,
      orderItems,
      address: {
        addressDocId: addressDoc._id,
        addressDetailId: addressDetail._id
      },
      paymentMethod: 'cod',
      paymentStatus: 'Pending',
      subTotal,
      deliveryCharge,
      tax,
      totalAmount,
      status: 'Pending'
    });

    for (const item of cart.items) {
      const productId = item.productId._id;
      const size = item.variants.size.toLowerCase();
      const quantity = item.quantity;
      
      await Product.findOneAndUpdate({_id:productId},{
        $inc:{
          [`shoeSizes.${size}`] : -quantity
        }
        
      })
      const product = await Product.findById(productId);
      if (!product) continue;
    
      if (
        product.variant &&
        product.variant.size &&
        typeof product.variant.size[size] === 'number'
      ) {
        product.variant.size[size] -= quantity;
        if (product.variant.size[size] < 0) {
          product.variant.size[size] = 0;
        }
    
        const allSizesZero = Object.values(product.variant.size).every(qty => qty === 0);
        if (allSizesZero) {
          product.status = "Out of stock";
        }
    
        await product.save();
      }
    }
    
    await Cart.deleteOne({ userId });

    res.redirect('/order-success');
  } catch (err) {
    console.error('Error placing order:', err);
    next(err);
  }
};

const loadOrderSuccess = async (req, res) => {
  try {
    const userId = req.user._id;
    const user   = await User.findById(userId);

    const latestOrder = await Order.findOne({ userId })
      .sort({ createdAt: -1 })
      .populate('orderItems.product')
      .populate('address.addressDocId');

    if (!latestOrder) {
      return res.redirect('/orders?error=no-order-found');
    }

    let subtotal = 0;
    latestOrder.orderItems.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    const deliveryCharge = latestOrder.deliveryCharge;
    const tax = latestOrder.tax;
    const totalAmount = parseFloat((subtotal + deliveryCharge + tax).toFixed(2));

    const addressDoc = latestOrder.address.addressDocId;
    const addressDetail = addressDoc.address.id(latestOrder.address.addressDetailId);
    
    if (!addressDetail) {
      return res.redirect('/orders?error=address-not-found');
    }

    res.render('user/orderSuccess', {
      order: latestOrder, 
      email: user.email,
      orderItems: latestOrder.orderItems,
      address: addressDetail,
      subtotal,
      deliveryCharge,
      tax,
      totalAmount,
      paymentMethod: latestOrder.paymentMethod,
      paymentStatus: latestOrder.paymentStatus
    });

  } catch (err) {
    console.error(err);
    res.redirect('/pageNotFound');
  }
};

const loadOrderFailurePage = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    const latestOrder = await Order.findOne({ userId })
      .sort({ createdAt: -1 })
      .populate('orderItems.product')
      .populate('address.addressDocId');

    if (!latestOrder) {
      return res.redirect('/orders?error=no-order-found');
    }

    let subtotal = 0;
    latestOrder.orderItems.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    const deliveryCharge = latestOrder.deliveryCharge;
    const tax = latestOrder.tax;
    const totalAmount = parseFloat((subtotal + deliveryCharge + tax).toFixed(2));

    const addressDoc = latestOrder.address.addressDocId;
    const addressDetail = addressDoc.address.id(latestOrder.address.addressDetailId);
    
    if (!addressDetail) {
      return res.redirect('/orders?error=address-not-found');
    }

    res.render('user/orderFailure', {
      order: latestOrder,
      email: user.email,
      orderItems: latestOrder.orderItems,
      address: addressDetail,
      subtotal,
      deliveryCharge,
      tax,
      totalAmount,
      paymentMethod: latestOrder.paymentMethod,
      paymentStatus: latestOrder.paymentStatus
    });
  } catch (err) {
    console.error(err);
    res.redirect('/pageNotFound');
  }
};

module.exports = {
  getCheckoutPage,
  placeOrder,
  loadOrderSuccess,
  loadOrderFailurePage
};