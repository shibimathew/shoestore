// 
const Address = require('../../models/addressSchema'); 
const Cart    = require('../../models/cartSchema');
const Order   = require('../../models/orderSchema');
const User    = require('../../models/userSchema');
const Product = require('../../models/productSchema');
const Wallet  = require('../../models/walletSchema'); // ADD THIS LINE
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');

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

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // Add this to your .env file
  key_secret: process.env.RAZORPAY_KEY_SECRET // Add this to your .env file
});

const placeOrder = async (req, res, next) => {
  console.log(req.body);
  try {
    const userId = req.user._id;
    const { paymentMethod, selectedAddress, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    const addressDoc = await Address.findOne({ userId });
    if (!addressDoc) {
      return res.status(400).json({ success: false, message: 'Address not found' });
    }

    const addressDetail = addressDoc.address.id(selectedAddress);
    if (!addressDetail) {
      return res.status(400).json({ success: false, message: 'Invalid address selected' });
    }

    const cart = await Cart
      .findOne({ userId })
      .populate('items.productId');

    if (!cart || !cart.items.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
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

    let paymentStatus = 'Pending';
    let paymentVerified = false;
    let paymentId = null;
    let orderStatus = 'Pending';

    // Handle Razorpay payment verification
    if (paymentMethod === 'razorpay') {
      if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
        // Verify payment signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
          .update(body.toString())
          .digest("hex");

        if (expectedSignature === razorpay_signature) {
          paymentStatus = 'Paid';
          paymentVerified = true;
          paymentId = razorpay_payment_id;
          orderStatus = 'Order Placed';
          
          // Update order items status
          orderItems.forEach(item => {
            item.currentStatus = 'Order Placed';
            item.statusHistory.push({ status: 'Order Placed', timestamp: new Date() });
          });
        } else {
          paymentStatus = 'Failed';
          orderStatus = 'Payment Failed';
          
          // Update order items status
          orderItems.forEach(item => {
            item.currentStatus = 'Payment Failed';
            item.statusHistory.push({ status: 'Payment Failed', timestamp: new Date() });
          });
        }
      } else {
        return res.status(400).json({ success: false, message: 'Payment verification data missing' });
      }
    } else if (paymentMethod === 'wallet') {
      // Handle wallet payment
      try {
        // Get user's wallet balance
        const walletTransactions = await Wallet.find({ userId, entryType: 'CREDIT' });
        const walletDebits = await Wallet.find({ userId, entryType: 'DEBIT' });
        
        const totalCredits = walletTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
        const totalDebits = walletDebits.reduce((sum, transaction) => sum + transaction.amount, 0);
        const walletBalance = totalCredits - totalDebits;

        if (walletBalance < totalAmount) {
          return res.status(400).json({ 
            success: false, 
            message: `Insufficient wallet balance. Available: ₹${walletBalance.toFixed(2)}, Required: ₹${totalAmount}` 
          });
        }

        // Create order first
        const order = await Order.create({
          orderId: '#SM' + Math.floor(Math.random() * 1e9).toString(),
          userId,
          orderItems: orderItems.map(item => ({
            ...item,
            currentStatus: 'Order Placed',
            statusHistory: [
              { status: 'Pending', timestamp: new Date() },
              { status: 'Order Placed', timestamp: new Date() }
            ]
          })),
          address: {
            addressDocId: addressDoc._id,
            addressDetailId: addressDetail._id
          },
          paymentMethod,
          paymentStatus: 'Paid',
          paymentVerified: true,
          paymentId: `wallet_${Date.now()}`,
          subTotal,
          deliveryCharge,
          tax,
          totalAmount,
          status: 'Order Placed'
        });

        // Debit amount from wallet
        await Wallet.create({
          userId,
          address: {
            addressDocId: addressDoc._id,
            addressDetailId: addressDetail._id
          },
          orderId: order._id,
          transactionId: `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          payment_type: 'wallet',
          amount: totalAmount,
          status: 'completed',
          entryType: 'DEBIT',
          type: 'product_purchase'
        });

        paymentStatus = 'Paid';
        paymentVerified = true;
        paymentId = `wallet_${Date.now()}`;
        orderStatus = 'Order Placed';

        // Update inventory and clear cart
        for (const item of cart.items) {
          const productId = item.productId._id;
          const size = item.variants.size.toLowerCase();
          const quantity = item.quantity;
          
          await Product.findOneAndUpdate({_id: productId}, {
            $inc: {
              [`shoeSizes.${size}`]: -quantity
            }
          });

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
        
        // Clear cart
        await Cart.deleteOne({ userId });

        return res.json({ success: true, orderId: order.orderId });

      } catch (walletError) {
        console.error('Wallet payment error:', walletError);
        return res.status(500).json({ success: false, message: 'Wallet payment failed' });
      }
    } else if (paymentMethod === 'cod') {
      paymentStatus = 'Pending';
      orderStatus = 'Order Placed';
      
      // Update order items status for COD
      orderItems.forEach(item => {
        item.currentStatus = 'Order Placed';
        item.statusHistory.push({ status: 'Order Placed', timestamp: new Date() });
      });
    }

    // Create order for non-wallet payments
    if (paymentMethod !== 'wallet') {
      const order = await Order.create({
        orderId: '#SM' + Math.floor(Math.random() * 1e9).toString(),
        userId,
        orderItems,
        address: {
          addressDocId: addressDoc._id,
          addressDetailId: addressDetail._id
        },
        paymentMethod,
        paymentStatus,
        paymentVerified,
        paymentId,
        subTotal,
        deliveryCharge,
        tax,
        totalAmount,
        status: orderStatus
      });

      // Only update inventory if payment is successful or COD
      if (paymentStatus === 'Paid' || paymentMethod === 'cod') {
        for (const item of cart.items) {
          const productId = item.productId._id;
          const size = item.variants.size.toLowerCase();
          const quantity = item.quantity;
          
          await Product.findOneAndUpdate({_id: productId}, {
            $inc: {
              [`shoeSizes.${size}`]: -quantity
            }
          });

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
        
        // Clear cart only if payment is successful
        await Cart.deleteOne({ userId });
      }

      if (paymentStatus === 'Failed') {
        return res.status(400).json({ 
          success: false, 
          message: 'Payment verification failed',
          orderId: order.orderId
        });
      }

      res.json({ success: true, orderId: order.orderId });
    }
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// New function to get wallet balance
const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const walletCredits = await Wallet.find({ userId, entryType: 'CREDIT' });
    const walletDebits = await Wallet.find({ userId, entryType: 'DEBIT' });
    
    const totalCredits = walletCredits.reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalDebits = walletDebits.reduce((sum, transaction) => sum + transaction.amount, 0);
    const walletBalance = totalCredits - totalDebits;

    res.json({ success: true, balance: walletBalance });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch wallet balance' });
  }
};

// New route to create Razorpay order
const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const cart = await Cart
      .findOne({ userId })
      .populate('items.productId');

    if (!cart || !cart.items.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const subTotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryCharge = 41;
    const tax = parseFloat((subTotal * 0.05).toFixed(2));
    const totalAmount = parseFloat((subTotal + deliveryCharge + tax).toFixed(2));

    const options = {
      amount: Math.round(totalAmount * 100), // Amount in paise
      currency: "INR",
      receipt: `order_${Date.now()}`,
      notes: {
        userId: userId.toString(),
        totalAmount: totalAmount.toString()
      }
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
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
  loadOrderFailurePage,
  createRazorpayOrder,
  getWalletBalance
};