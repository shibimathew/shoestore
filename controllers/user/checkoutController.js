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

// Modified applyCoupon function with better session handling
const applyCoupon = async (req, res) => {
  try {
    const { couponCode, subtotal } = req.body;
    const userId = req.user?._id || req.session?.user;
    const currentDate = new Date();

    const coupon = await Coupon.findOne({
      code: couponCode,
      status: "Active",
      startDate: { $lte: currentDate },
      expiryDate: { $gte: currentDate },
    });

    if (!coupon) {
      return res.json({ success: false, message: "Invalid or expired coupon" });
    }

    if (subtotal < coupon.minPrice) {
      return res.json({
        success: false,
        message: `Minimum order amount should be ₹${coupon.minPrice}`,
      });
    }

    if (coupon.usageType === "single-use" && coupon.userId.includes(userId)) {
      return res.json({ success: false, message: "Coupon already used" });
    }

    const discount = Math.min(coupon.offerPrice, subtotal);

    // Store coupon data in session with explicit save
    req.session.coupon = {
      _id: coupon._id,
      code: coupon.code,
      offerPrice: coupon.offerPrice,
      minPrice: coupon.minPrice,
      usageType: coupon.usageType,
    };
    req.session.discount = discount;

    // Explicitly save session to ensure it persists
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Error saving coupon data" });
      }
      res.json({ success: true, coupon, discount });
    });
  } catch (error) {
    console.error("Apply coupon error:", error);
    res.status(500).json({ success: false, message: "Error applying coupon" });
  }
};

// Add a function to clear coupon from session when needed
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

// New route to create Razorpay order
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

    const coupons = await Coupon.find({
      status: "Active",
      startDate: { $lte: currentDate },
      expiryDate: { $gte: currentDate },
      $or: [
        { usageType: "multi-use" },
        { usageType: "single-use", userId: { $ne: userId } },
      ],
    });

    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching coupons" });
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
};
