const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema");
const Order = require("../../models/orderSchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Wallet = require("../../models/walletSchema");
const Coupon = require("../../models/couponSchema");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const getCheckoutPage = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.session?.user;

    const addressDoc = await Address.findOne({ userId }).lean();
    const addresses = addressDoc?.address || [];

    const cart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        match: { isListed: { $ne: false } }, // not blocked by admin
      })
      .lean();
    const items = cart?.items?.filter((item) => item.productId !== null) || [];
    if (!items.length) {
      return res.redirect("/cart");
    }
    const subTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const delivery = 41;
    const tax = subTotal * 0.05;
    const total = subTotal + delivery + tax;

    res.render("user/checkout", {
      user: req.session?.user || req.user,
      addresses,
      items,
      total,
      coupon: req.session.coupon || null,
      discount: req.session.discount || null,
    });
  } catch (err) {
    next(err);
  }
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const applyCoupon = async (req, res) => {
  try {
    const { couponCode, subtotal } = req.body;
    const userId = req.user?._id || req.session?.user;
    const currentDate = new Date();

    if (!couponCode || !subtotal) {
      return res.json({ 
        success: false, 
        message: "Coupon code and order amount are required" 
      });
    }
  
    const coupon = await Coupon.findOne({
      code: { $regex: new RegExp(`^${couponCode}$`, 'i') },
      status: "Active",
      startDate: { $lte: currentDate },
      expiryDate: { $gte: currentDate },
    });

    if (!coupon) {
      return res.json({ 
        success: false, 
        message: "Invalid or expired coupon code" 
      });
    }

    // Check minimum order amount
    if (subtotal < coupon.minPrice) {
      return res.json({
        success: false,
        message: `Minimum order amount should be ₹${coupon.minPrice} to use this coupon`,
      });
    }

    // Enhanced single-use validation
    if (coupon.usageType === "single-use") {
      // Check if user has already used this coupon
      if (coupon.userId && coupon.userId.includes(userId)) {
        return res.json({ 
          success: false, 
          message: "This coupon can only be used once per customer. You have already used it." 
        });
      }
    }

    const discount = Math.min(coupon.offerPrice, subtotal);

 
    req.session.coupon = {
      _id: coupon._id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      offerPrice: coupon.offerPrice,
      minPrice: coupon.minPrice,
      usageType: coupon.usageType,
      expiryDate: coupon.expiryDate,
    };
    req.session.discount = discount;

  
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Error saving coupon data" });
      }
      
      res.json({ 
        success: true, 
        coupon: {
          ...coupon.toObject(),
          usageType: coupon.usageType,
          usageInfo: coupon.usageType === 'single-use' 
            ? 'One-time use per customer' 
            : 'Can be used multiple times'
        }, 
        discount,
        message: `Coupon applied successfully! You saved ₹${discount.toFixed(2)}`
      });
    });
  } catch (error) {
    console.error("Apply coupon error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error applying coupon. Please try again." 
    });
  }
};


const clearCoupon = async (req, res) => {
  try {
    req.session.coupon = null;
    req.session.discount = null;

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Error clearing coupon data" });
      }

      res.json({ success: true, message: "Coupon cleared successfully" });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error clearing coupon" });
  }
};

const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user;

    const walletCredits = await Wallet.find({ userId, entryType: "CREDIT" });
    const walletDebits = await Wallet.find({ userId, entryType: "DEBIT" });

    const totalCredits = walletCredits.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );
    const totalDebits = walletDebits.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );
    const walletBalance = totalCredits - totalDebits;

    res.json({ success: true, balance: walletBalance });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch wallet balance" });
  }
};

const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user;
    const { couponDiscount } = req.body;
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || !cart.items.length) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const subTotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const deliveryCharge = 41;
    const tax = parseFloat((subTotal * 0.05).toFixed(2));
    const discount = parseFloat(couponDiscount) || 0;
    const totalAmount = parseFloat(
      (subTotal + deliveryCharge + tax - discount).toFixed(2)
    );

    const options = {
      amount: Math.round(totalAmount * 100), // Amount in paise
      currency: "INR",
      receipt: `order_${Date.now()}`,
      notes: {
        userId: userId.toString(),
        totalAmount: totalAmount.toString(),
        discount: discount.toString(),
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create payment order" });
  }
};

const loadOrderSuccess = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user;
    const user = await User.findById(userId);

    const latestOrder = await Order.findOne({ userId })
      .sort({ createdAt: -1 })
      .populate("orderItems.product")
      .populate("address.addressDocId");

    if (!latestOrder) {
      return res.redirect("/orders?error=no-order-found");
    }

    let subtotal = 0;
    latestOrder.orderItems.forEach((item) => {
      subtotal += item.price * item.quantity;
    });

    const deliveryCharge = latestOrder.deliveryCharge;
    const tax = latestOrder.tax;
    const totalAmount = parseFloat(
      (subtotal + deliveryCharge + tax).toFixed(2)
    );

    const addressDoc = latestOrder.address.addressDocId;
    const addressDetail = addressDoc.address.id(
      latestOrder.address.addressDetailId
    );

    if (!addressDetail) {
      return res.redirect("/orders?error=address-not-found");
    }

    res.render("user/orderSuccess", {
      order: latestOrder,
      email: user.email,
      orderItems: latestOrder.orderItems,
      address: addressDetail,
      subtotal,
      deliveryCharge,
      tax,
      totalAmount,
      paymentMethod: latestOrder.paymentMethod,
      paymentStatus: latestOrder.paymentStatus,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/pageNotFound");
  }
};

const loadOrderFailurePage = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user;
    const user = await User.findById(userId);

    const latestOrder = await Order.findOne({ userId })
      .sort({ createdAt: -1 })
      .populate("orderItems.product")
      .populate("address.addressDocId");

    if (!latestOrder) {
      return res.redirect("/orders?error=no-order-found");
    }

    let subtotal = 0;
    latestOrder.orderItems.forEach((item) => {
      subtotal += item.price * item.quantity;
    });

    const deliveryCharge = latestOrder.deliveryCharge;
    const tax = latestOrder.tax;
    const totalAmount = parseFloat(
      (subtotal + deliveryCharge + tax).toFixed(2)
    );

    const addressDoc = latestOrder.address.addressDocId;
    const addressDetail = addressDoc.address.id(
      latestOrder.address.addressDetailId
    );

    if (!addressDetail) {
      return res.redirect("/orders?error=address-not-found");
    }

    res.render("user/orderFailure", {
      order: latestOrder,
      email: user.email,
      orderItems: latestOrder.orderItems,
      address: addressDetail,
      subtotal,
      deliveryCharge,
      tax,
      totalAmount,
      paymentMethod: latestOrder.paymentMethod,
      paymentStatus: latestOrder.paymentStatus,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/pageNotFound");
  }
};

const getCoupon = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user;
    const currentDate = new Date();

    // Get all active coupons
    const allCoupons = await Coupon.find({
      status: "Active",
      startDate: { $lte: currentDate },
      expiryDate: { $gte: currentDate },
    });

    // Filter coupons based on usage type and user history
    const availableCoupons = allCoupons.filter(coupon => {
      // Multi-use coupons are always available
      if (coupon.usageType === "multi-use") {
        return true;
      }
      
     
      if (coupon.usageType === "single-use") {
        return !coupon.userId || !coupon.userId.includes(userId);
      }
      
      return false;
    });

    // Enhance coupon data with additional information
    const enhancedCoupons = availableCoupons.map(coupon => {
      const couponObj = coupon.toObject();
      
      // Add usage information
      couponObj.usageInfo = coupon.usageType === 'single-use' 
        ? 'One-time use per customer' 
        : 'Can be used multiple times';
      
  
      couponObj.savingsPercentage = Math.round((coupon.offerPrice / coupon.minPrice) * 100);
      
      // Add days remaining
      const daysRemaining = Math.ceil((new Date(coupon.expiryDate) - currentDate) / (1000 * 60 * 60 * 24));
      couponObj.daysRemaining = daysRemaining;
      couponObj.expiryInfo = daysRemaining <= 7 
        ? `Expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}` 
        : `Valid till ${new Date(coupon.expiryDate).toLocaleDateString()}`;
      
      return couponObj;
    });

    // Sort coupons by discount amount (highest first), then by expiry date
    enhancedCoupons.sort((a, b) => {
      if (b.offerPrice !== a.offerPrice) {
        return b.offerPrice - a.offerPrice;
      }
      return new Date(a.expiryDate) - new Date(b.expiryDate);
    });

    res.json({ 
      success: true, 
      coupons: enhancedCoupons,
      totalAvailable: enhancedCoupons.length,
      message: enhancedCoupons.length > 0 
        ? `${enhancedCoupons.length} coupon${enhancedCoupons.length !== 1 ? 's' : ''} available` 
        : 'No coupons available at the moment'
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching available coupons" 
    });
  }
};

// Stock validation function for frontend
const checkStockAvailability = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user;
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || !cart.items.length) {
      return res.json({ 
        success: true, 
        isValid: true, 
        message: "Cart is empty" 
      });
    }

    const outOfStockItems = [];
    const insufficientStockItems = [];

    for (const item of cart.items) {
      const product = item.productId;
      const requestedSize = item.variants.size.toLowerCase();
      const requestedQuantity = item.quantity;

      // Check if product exists and is available
      if (!product || product.status === "out of stock" || product.status === "Discountinued") {
        outOfStockItems.push({
          productName: product?.productName || 'Unknown Product',
          size: item.variants.size,
          reason: 'Product is out of stock or discontinued'
        });
        continue;
      }

     
      const availableStock = product.shoeSizes.get(requestedSize) || 0;
      
      if (availableStock === 0) {
        outOfStockItems.push({
          productName: product.productName,
          size: item.variants.size,
          reason: 'This size is out of stock'
        });
      } else if (availableStock < requestedQuantity) {
        insufficientStockItems.push({
          productName: product.productName,
          size: item.variants.size,
          requestedQuantity,
          availableStock,
          reason: `Only ${availableStock} items available in this size`
        });
      }
    }

    const isValid = outOfStockItems.length === 0 && insufficientStockItems.length === 0;

    res.json({
      success: true,
      isValid,
      outOfStockItems,
      insufficientStockItems,
      message: isValid 
        ? "All items are in stock" 
        : "Some items have stock issues"
    });

  } catch (error) {
    console.error("Error checking stock availability:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error checking stock availability" 
    });
  }
};

module.exports = {
  getCheckoutPage,
  loadOrderSuccess,
  loadOrderFailurePage,
  createRazorpayOrder,
  getWalletBalance,
  getCoupon,
  applyCoupon,
  clearCoupon,
  checkStockAvailability,
};
